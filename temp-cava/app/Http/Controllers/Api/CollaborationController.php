<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * =============================================================================
 * Controller: CollaborationController
 * Modul: SRS-03 Collaboration & Progress Tracking
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Mengendalikan operasional kolaborasi tim dan pemantauan metrik ketercapaian:
 * [SRS-03-01] Mengundang/menambah anggota baru ke dalam proyek melalui alamat email.
 * [SRS-03-02] Mengatur tingkatan hak akses kolaborator ('Owner', 'Editor', 'Viewer')
 *             serta mengeluarkan anggota dari tim proyek.
 * [SRS-03-03] Menghitung persentase progres secara dinamis dan akurat:
 *             Formula: (Jumlah Tugas Selesai / Total Seluruh Tugas) * 100%
 * [SRS-03-04] Menampilkan visualisasi status pencapaian target (Sesuai Target, Sedang Dikerjakan, dll.)
 * [SRS-03-05] Menyajikan rekam jejak riwayat aktivitas kolaboratif terkini (Activity Feed).
 * =============================================================================
 */
class CollaborationController extends Controller
{
    /**
     * [SRS-03-01 & SRS-03-02] Menampilkan seluruh kolaborator dalam proyek tertentu.
     *
     * @param int $projectId
     * @return JsonResponse
     */
    public function members(int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        $members = $project->members()->get()->map(function (User $user) {
            $role = $user->pivot->role ?? 'Editor';
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role,
                'isOwner' => $role === 'Owner',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $members,
        ]);
    }

    /**
     * [SRS-03-01] Mengundang anggota kolaborator baru menggunakan alamat email.
     *
     * @param Request $request
     * @param int $projectId
     * @return JsonResponse
     */
    public function invite(Request $request, int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'name' => ['nullable', 'string', 'max:255'],
            'role' => ['required', Rule::in(['Owner', 'Editor', 'Viewer'])],
        ]);

        // Cari user yang sudah ada berdasarkan email atau buat akun baru otomatis
        $user = User::firstOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'] ?? explode('@', $validated['email'])[0],
                'password' => Hash::make('password123'),
                'role' => 'member',
                'status' => 'active',
            ]
        );

        // Periksa apakah user sudah menjadi anggota proyek
        if ($project->members()->where('user_id', $user->id)->exists()) {
            // Perbarui peran jika sudah terdaftar
            $project->members()->updateExistingPivot($user->id, ['role' => $validated['role']]);
        } else {
            // Pasang relasi baru di tabel pivot project_user
            $project->members()->attach($user->id, ['role' => $validated['role']]);
        }

        // [SRS-03-05] Catat aksi undangan ke ActivityLog
        ActivityLog::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'action' => "Undangan terkirim kepada {$user->name} ({$user->email}) sebagai {$validated['role']}",
            'icon' => '📨',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Undangan berhasil dikirimkan kepada {$user->email}.",
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $validated['role'],
                'isOwner' => $validated['role'] === 'Owner',
            ],
        ], 201);
    }

    /**
     * [SRS-03-02] Mengeluarkan anggota dari proyek kolaborasi.
     *
     * @param int $projectId
     * @param int $userId
     * @return JsonResponse
     */
    public function removeMember(int $projectId, int $userId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $user = User::findOrFail($userId);

        // Lepaskan relasi pada tabel pivot
        $project->members()->detach($userId);

        // [SRS-03-05] Catat aksi pengeluaran anggota ke ActivityLog
        ActivityLog::create([
            'project_id' => $project->id,
            'action' => "{$user->name} telah dikeluarkan dari tim proyek",
            'icon' => '🚪',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Anggota {$user->name} berhasil dikeluarkan dari proyek.",
        ]);
    }

    /**
     * [SRS-03-03 & SRS-03-04] Mengembalikan metrik kalkulasi progres penyelesaian tugas proyek.
     * Formula: (Jumlah Tugas Selesai / Total Seluruh Tugas) * 100%
     *
     * @param int $projectId
     * @return JsonResponse
     */
    public function progress(int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $metrics = $project->getProgressMetrics();

        return response()->json([
            'success' => true,
            'data' => [
                'project_id' => $project->id,
                'project_title' => $project->title,
                'total_tasks' => $metrics['total_tasks'],
                'completed_tasks' => $metrics['completed_tasks'],
                'percentage' => $metrics['percentage'],
                'status_label' => $metrics['status_label'],
            ],
        ]);
    }

    /**
     * [SRS-03-05] Menampilkan riwayat feed aktivitas kolaborasi terkini.
     *
     * @param int $projectId
     * @return JsonResponse
     */
    public function activities(int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        $activities = $project->activityLogs()->take(15)->get()->map(function (ActivityLog $log) {
            return [
                'id' => $log->id,
                'text' => $log->action,
                'icon' => $log->icon,
                'time' => $log->created_at ? $log->created_at->diffForHumans() : 'Baru saja',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }
}
