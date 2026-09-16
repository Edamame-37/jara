<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * =============================================================================
 * Controller: TaskController
 * Modul: SRS-02 Task & Project Management
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Mengendalikan operasional penuh pengelolaan tugas:
 * [SRS-02-02] Pembuatan tugas dengan rincian, skala prioritas, dan tanggal deadline.
 * [SRS-02-03] Toggle status penyelesaian (completed) via checkbox interaktif.
 * [SRS-02-04] Pemfilteran tugas (Semua, Belum Selesai, Selesai) dan penyortiran
 *             berdasarkan deadline terdekat, bobot prioritas, atau tanggal penambahan.
 * [SRS-02-05] Pembaruan isi detail tugas dan penghapusan tugas dari daftar.
 * [SRS-03-05] Mencatat setiap perubahan penting ke dalam feed riwayat aktivitas proyek.
 * =============================================================================
 */
class TaskController extends Controller
{
    /**
     * [SRS-02-04] Menampilkan daftar tugas dengan dukungan filter status & sorting.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['project:id,title', 'assignee:id,name']);

        // Filter per proyek
        if ($projectId = $request->query('project_id')) {
            if ($projectId !== 'all') {
                $query->where('project_id', $projectId);
            }
        }

        // [SRS-02-04] Filter status (all / pending / completed)
        $status = $request->query('status', 'all');
        $query->filterStatus($status);

        // [SRS-02-04] Sorting (deadline / priority / newest)
        $sort = $request->query('sort', 'deadline');
        $query->applySorting($sort);

        $tasks = $query->get()->map(function (Task $t) {
            return [
                'id' => $t->id,
                'projectId' => $t->project_id,
                'projectTitle' => $t->project ? $t->project->title : 'Umum',
                'title' => $t->title,
                'description' => $t->description,
                'priority' => $t->priority,
                'deadline' => $t->deadline ? $t->deadline->format('Y-m-d') : null,
                'completed' => (bool) $t->completed,
                'assignedTo' => $t->assignee ? $t->assignee->name : null,
            ];
        });

        // Hitung total counter untuk tab indikator
        $baseQuery = Task::query();
        if ($projectId = $request->query('project_id')) {
            if ($projectId !== 'all') {
                $baseQuery->where('project_id', $projectId);
            }
        }
        $countAll = (clone $baseQuery)->count();
        $countPending = (clone $baseQuery)->where('completed', false)->count();
        $countCompleted = (clone $baseQuery)->where('completed', true)->count();

        return response()->json([
            'success' => true,
            'data' => $tasks,
            'meta' => [
                'count_all' => $countAll,
                'count_pending' => $countPending,
                'count_completed' => $countCompleted,
            ],
        ]);
    }

    /**
     * [SRS-02-02] Membuat tugas baru dalam daftar proyek.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => ['nullable', 'exists:projects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', Rule::in(['Low', 'Medium', 'High', 'Urgent'])],
            'deadline' => ['required', 'date'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        // Jika project_id tidak disertakan, gunakan project pertama
        $projectId = $validated['project_id'] ?? Project::first()->id ?? 1;

        $task = Task::create([
            'project_id' => $projectId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'deadline' => $validated['deadline'],
            'completed' => false,
            'assigned_to' => $validated['assigned_to'] ?? null,
        ]);

        // [SRS-03-05] Catat log aktivitas pembuatan tugas
        ActivityLog::create([
            'project_id' => $task->project_id,
            'user_id' => $task->assigned_to,
            'action' => "Tugas baru '{$task->title}' ditambahkan (Prioritas: {$task->priority})",
            'icon' => '📌',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tugas '{$task->title}' berhasil dibuat.",
            'data' => [
                'id' => $task->id,
                'projectId' => $task->project_id,
                'title' => $task->title,
                'description' => $task->description,
                'priority' => $task->priority,
                'deadline' => $task->deadline->format('Y-m-d'),
                'completed' => false,
            ],
        ], 201);
    }

    /**
     * Menampilkan detail satu tugas.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $task = Task::with('project')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $task->id,
                'projectId' => $task->project_id,
                'title' => $task->title,
                'description' => $task->description,
                'priority' => $task->priority,
                'deadline' => $task->deadline ? $task->deadline->format('Y-m-d') : null,
                'completed' => (bool) $task->completed,
            ],
        ]);
    }

    /**
     * [SRS-02-05] Memperbarui isi dan atribut tugas yang sudah ada.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['sometimes', 'required', Rule::in(['Low', 'Medium', 'High', 'Urgent'])],
            'deadline' => ['sometimes', 'required', 'date'],
            'project_id' => ['nullable', 'exists:projects,id'],
        ]);

        $task->update($validated);

        // [SRS-03-05] Catat log aktivitas pembaruan tugas
        ActivityLog::create([
            'project_id' => $task->project_id,
            'action' => "Detail tugas '{$task->title}' berhasil diperbarui",
            'icon' => '⏱️',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tugas '{$task->title}' berhasil diperbarui.",
            'data' => [
                'id' => $task->id,
                'projectId' => $task->project_id,
                'title' => $task->title,
                'description' => $task->description,
                'priority' => $task->priority,
                'deadline' => $task->deadline->format('Y-m-d'),
                'completed' => (bool) $task->completed,
            ],
        ]);
    }

    /**
     * [SRS-02-03] Mengubah status pengerjaan tugas (toggle complete / pending).
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        if ($request->has('completed')) {
            $task->completed = (bool) $request->input('completed');
        } else {
            $task->completed = !$task->completed;
        }

        $task->save();

        // [SRS-03-05] Catat log aktivitas status tugas
        $actionText = $task->completed
            ? "Tugas '{$task->title}' ditandai selesai"
            : "Tugas '{$task->title}' dibuka kembali (Belum Selesai)";

        ActivityLog::create([
            'project_id' => $task->project_id,
            'action' => $actionText,
            'icon' => $task->completed ? '✅' : '🔄',
        ]);

        return response()->json([
            'success' => true,
            'message' => $actionText,
            'data' => [
                'id' => $task->id,
                'completed' => (bool) $task->completed,
            ],
        ]);
    }

    /**
     * [SRS-02-05] Menghapus tugas dari sistem.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $task = Task::findOrFail($id);
        $taskTitle = $task->title;
        $projectId = $task->project_id;

        $task->delete();

        // [SRS-03-05] Catat log aktivitas penghapusan
        ActivityLog::create([
            'project_id' => $projectId,
            'action' => "Tugas '{$taskTitle}' dihapus dari daftar",
            'icon' => '🗑️',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tugas '{$taskTitle}' berhasil dihapus.",
        ]);
    }
}
