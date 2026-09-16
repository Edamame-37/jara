<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * =============================================================================
 * Seeder: DatabaseSeeder
 * Modul: SRS-01, SRS-02, SRS-03 Initial Data Seeding
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Menginisialisasi basis data awal dengan data realistis:
 * [SRS-01] Akun Administrator dan Member terdaftar dengan password terenkripsi.
 * [SRS-02] Kategori proyek & daftar tugas dengan variasi prioritas dan deadline.
 * [SRS-03] Anggota kolaborator dengan hak akses (Owner, Editor, Viewer) serta
 *          log aktivitas kolaboratif terkini.
 * =============================================================================
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed basis data aplikasi.
     */
    public function run(): void
    {
        // ---------------------------------------------------------------------
        // 1. [SRS-01] Inisialisasi Akun Pengguna (Admin & Member)
        // ---------------------------------------------------------------------
        $admin1 = User::create([
            'name' => 'Aufaarel Mecca',
            'email' => 'aufaarel@jara.local',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $admin2 = User::create([
            'name' => 'Rafa Azlan',
            'email' => 'rafa@jara.local',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $member1 = User::create([
            'name' => 'Siti Rahmawati',
            'email' => 'siti.rahma@jara.local',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
        ]);

        $member2 = User::create([
            'name' => 'Dimas Pratama',
            'email' => 'dimas.p@jara.local',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
        ]);

        // ---------------------------------------------------------------------
        // 2. [SRS-02] Inisialisasi Kategori Proyek
        // ---------------------------------------------------------------------
        $project1 = Project::create([
            'title' => 'Pengembangan Modul JARA',
            'description' => 'Implementasi 3 modul fungsional SRS untuk sistem pendaftaran praktikum',
            'owner_id' => $admin1->id,
        ]);

        $project2 = Project::create([
            'title' => 'Laporan Akhir & Dokumentasi',
            'description' => 'Penyusunan bab 1-5 laporan proyek rekayasa perangkat lunak',
            'owner_id' => $admin1->id,
        ]);

        // ---------------------------------------------------------------------
        // 3. [SRS-03] Inisialisasi Kolaborator Proyek (project_user)
        // ---------------------------------------------------------------------
        $project1->members()->attach([
            $admin1->id => ['role' => 'Owner'],
            $admin2->id => ['role' => 'Editor'],
            $member1->id => ['role' => 'Editor'],
            $member2->id => ['role' => 'Viewer'],
        ]);

        $project2->members()->attach([
            $admin1->id => ['role' => 'Owner'],
            $member1->id => ['role' => 'Editor'],
        ]);

        // ---------------------------------------------------------------------
        // 4. [SRS-02] Inisialisasi Tugas (Tasks)
        // ---------------------------------------------------------------------
        Task::create([
            'project_id' => $project1->id,
            'title' => 'Konfigurasi skema database Laravel & migrasi',
            'description' => 'Membuat tabel users, projects, tasks, project_user, dan activity_logs.',
            'priority' => 'Urgent',
            'deadline' => '2026-09-10',
            'completed' => true,
            'assigned_to' => $admin1->id,
        ]);

        Task::create([
            'project_id' => $project1->id,
            'title' => 'Implementasi antarmuka manajemen user (SRS-01)',
            'description' => 'Menyusun tabel pengguna, form modal, dan filter pencarian.',
            'priority' => 'High',
            'deadline' => '2026-09-12',
            'completed' => true,
            'assigned_to' => $admin2->id,
        ]);

        Task::create([
            'project_id' => $project1->id,
            'title' => 'Membuat endpoint REST API untuk CRUD Task (SRS-02)',
            'description' => 'Membangun controller task, validasi request, dan sorting query.',
            'priority' => 'Medium',
            'deadline' => '2026-09-15',
            'completed' => false,
            'assigned_to' => $member1->id,
        ]);

        Task::create([
            'project_id' => $project1->id,
            'title' => 'Kalkulasi progres otomatis & real-time activity feed (SRS-03)',
            'description' => 'Menghitung persentase ketercapaian dan menampilkan log aktivitas.',
            'priority' => 'Urgent',
            'deadline' => '2026-09-18',
            'completed' => false,
            'assigned_to' => $member2->id,
        ]);

        Task::create([
            'project_id' => $project2->id,
            'title' => 'Penyusunan bab 2 dokumen spesifikasi kebutuhan perangkat lunak',
            'description' => 'Menuliskan rincian kebutuhan fungsional dan non-fungsional.',
            'priority' => 'Low',
            'deadline' => '2026-09-20',
            'completed' => false,
            'assigned_to' => $member1->id,
        ]);

        // ---------------------------------------------------------------------
        // 5. [SRS-03-05] Inisialisasi Log Aktivitas Kolaborasi
        // ---------------------------------------------------------------------
        ActivityLog::create([
            'project_id' => $project1->id,
            'user_id' => $admin1->id,
            'action' => 'Aufaarel Mecca menandai tugas "Konfigurasi skema database Laravel & migrasi" selesai',
            'icon' => '✅',
        ]);

        ActivityLog::create([
            'project_id' => $project1->id,
            'user_id' => $admin2->id,
            'action' => 'Rafa Azlan mengundang Dimas Pratama ke proyek ini sebagai Viewer',
            'icon' => '📨',
        ]);

        ActivityLog::create([
            'project_id' => $project1->id,
            'user_id' => $member1->id,
            'action' => 'Siti Rahmawati memperbarui deadline tugas "Membuat endpoint REST API"',
            'icon' => '⏱️',
        ]);
    }
}
