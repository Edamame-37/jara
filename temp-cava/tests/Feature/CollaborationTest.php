<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * =============================================================================
 * Test: CollaborationTest
 * Modul: SRS-03 Collaboration & Progress Tracking
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Menguji seluruh fungsionalitas kolaborasi tim dan pemantauan progres:
 * [SRS-03-01] Mengundang anggota kolaborator baru melalui email.
 * [SRS-03-02] Listing anggota dengan perannya (Owner, Editor, Viewer) dan mengeluarkan anggota.
 * [SRS-03-03] Pengujian akurasi formula kalkulasi persentase progres: (selesai / total) * 100%.
 * [SRS-03-04] Indikator visual status pencapaian target.
 * [SRS-03-05] Pencatatan dan pembacaan log feed aktivitas kolaborasi.
 * =============================================================================
 */
class CollaborationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create();
        $this->project = Project::create([
            'title' => 'Proyek Kolaborasi Tim',
            'description' => 'Uji modul SRS-03',
            'owner_id' => $this->owner->id,
        ]);
        $this->project->members()->attach($this->owner->id, ['role' => 'Owner']);
    }

    /**
     * [SRS-03-01 & SRS-03-02] Uji mengundang anggota kolaborator baru dan menampilkan daftar anggota.
     */
    public function test_can_invite_member_and_list_members(): void
    {
        $response = $this->postJson("/api/projects/{$this->project->id}/invite", [
            'name' => 'Sarah Kolaborator',
            'email' => 'sarah@example.com',
            'role' => 'Editor',
        ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['name' => 'Sarah Kolaborator', 'role' => 'Editor']);

        // Test list members
        $listRes = $this->getJson("/api/projects/{$this->project->id}/members");
        $listRes->assertStatus(200)
                ->assertJsonCount(2, 'data'); // Owner + invited editor
    }

    /**
     * [SRS-03-02] Uji mengeluarkan anggota dari proyek.
     */
    public function test_can_remove_member_from_project(): void
    {
        $member = User::factory()->create();
        $this->project->members()->attach($member->id, ['role' => 'Viewer']);

        $response = $this->deleteJson("/api/projects/{$this->project->id}/members/{$member->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('project_user', [
            'project_id' => $this->project->id,
            'user_id' => $member->id,
        ]);
    }

    /**
     * [SRS-03-03 & SRS-03-04] Uji keakuratan formula perhitungan progres otomatis.
     * Progres (%) = (Jumlah Tugas Selesai / Total Seluruh Tugas) * 100%
     */
    public function test_accurate_progress_calculation_formula(): void
    {
        // Buat 4 tugas: 3 selesai, 1 belum selesai -> Progres = (3 / 4) * 100 = 75%
        Task::create(['project_id' => $this->project->id, 'title' => 'Tugas 1', 'deadline' => '2026-09-10', 'completed' => true]);
        Task::create(['project_id' => $this->project->id, 'title' => 'Tugas 2', 'deadline' => '2026-09-12', 'completed' => true]);
        Task::create(['project_id' => $this->project->id, 'title' => 'Tugas 3', 'deadline' => '2026-09-14', 'completed' => true]);
        Task::create(['project_id' => $this->project->id, 'title' => 'Tugas 4', 'deadline' => '2026-09-16', 'completed' => false]);

        $response = $this->getJson("/api/projects/{$this->project->id}/progress");
        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'total_tasks' => 4,
                     'completed_tasks' => 3,
                     'percentage' => 75,
                     'status_label' => 'Sesuai Target / On-Track',
                 ]);
    }

    /**
     * [SRS-03-05] Uji feed log aktivitas kolaborasi terkini.
     */
    public function test_can_fetch_project_activity_logs(): void
    {
        ActivityLog::create([
            'project_id' => $this->project->id,
            'user_id' => $this->owner->id,
            'action' => 'Pemilik proyek membuat tugas baru',
            'icon' => '📌',
        ]);

        $response = $this->getJson("/api/projects/{$this->project->id}/activities");
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data')
                 ->assertJsonFragment(['text' => 'Pemilik proyek membuat tugas baru']);
    }
}
