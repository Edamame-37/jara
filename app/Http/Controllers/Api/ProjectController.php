<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * =============================================================================
 * Controller: ProjectController
 * Modul: SRS-02 Task & Project Management, SRS-04 Ownership & Transactions
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * [SRS-02-01] Mengelola kategori atau pengelompokan daftar tugas (Project List).
 * [SRS-04-01] Otomatisasi penetapan kepemilikan proyek kepada pembuat (Owner).
 * [SRS-04-02] Penghapusan atomik berbasis transaksi basis data (DB::transaction)
 *             untuk menjamin integritas data relasi.
 * =============================================================================
 */
class ProjectController extends Controller
{
    /**
     * [SRS-02-01] Menampilkan seluruh daftar kategori/proyek.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $projects = Project::with(['owner:id,name,email'])->withCount('tasks')->get()->map(function (Project $p) {
            $metrics = $p->getProgressMetrics();
            return [
                'id' => $p->id,
                'title' => $p->title,
                'description' => $p->description,
                'owner' => $p->owner,
                'total_tasks' => $metrics['total_tasks'],
                'completed_tasks' => $metrics['completed_tasks'],
                'progress_percentage' => $metrics['percentage'],
                'status_label' => $metrics['status_label'],
                'created_at' => $p->created_at->format('Y-m-d'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $projects,
        ]);
    }

    /**
     * [SRS-02-01 & SRS-04-01] Membuat kategori proyek baru dengan kepemilikan otomatis.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'owner_id' => ['nullable', 'exists:users,id'],
        ]);

        // Default owner: ID 1 atau user pertama jika tidak dikirimkan
        $ownerId = $validated['owner_id'] ?? User::first()->id ?? 1;

        $project = DB::transaction(function () use ($validated, $ownerId) {
            $proj = Project::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'owner_id' => $ownerId,
            ]);

            // Tambahkan pemilik ke tabel pivot project_user sebagai 'Owner'
            $proj->members()->attach($ownerId, ['role' => 'Owner']);

            // Catat log aktivitas awal
            ActivityLog::create([
                'project_id' => $proj->id,
                'user_id' => $ownerId,
                'action' => "Proyek '{$proj->title}' berhasil dibuat",
                'icon' => '🚀',
            ]);

            return $proj;
        });

        return response()->json([
            'success' => true,
            'message' => "Proyek '{$project->title}' berhasil dibuat.",
            'data' => [
                'id' => $project->id,
                'title' => $project->title,
                'description' => $project->description,
                'owner_id' => $project->owner_id,
            ],
        ], 201);
    }

    /**
     * Menampilkan detail sebuah proyek beserta metrik progres dan relasinya.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $project = Project::with(['owner', 'members', 'tasks'])->findOrFail($id);
        $metrics = $project->getProgressMetrics();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $project->id,
                'title' => $project->title,
                'description' => $project->description,
                'owner' => $project->owner,
                'members' => $project->members,
                'tasks' => $project->tasks,
                'metrics' => $metrics,
            ],
        ]);
    }

    /**
     * [SRS-04-02] Penghapusan proyek secara atomik menggunakan transaksi basis data.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $project = Project::findOrFail($id);
        $projectTitle = $project->title;

        DB::transaction(function () use ($project) {
            $project->delete();
        });

        return response()->json([
            'success' => true,
            'message' => "Proyek '{$projectTitle}' beserta seluruh data tugas terkait berhasil dihapus.",
        ]);
    }
}
