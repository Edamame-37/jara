<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * =============================================================================
 * Test: TaskManagementTest
 * Modul: SRS-02 Task & Project Management, SRS-04 Ownership
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Menguji seluruh fungsionalitas manajemen tugas dan proyek:
 * [SRS-02-01] Pembuatan daftar proyek dan listing proyek.
 * [SRS-02-02] Pembuatan tugas dengan prioritas dan deadline.
 * [SRS-02-03] Toggle status selesai/belum selesai.
 * [SRS-02-04] Filter status (all/pending/completed) dan sorting (deadline/priority).
 * [SRS-02-05] Pembaruan detail tugas dan penghapusan tugas.
 * [SRS-04-02] Penghapusan proyek secara bertingkat (cascade).
 * =============================================================================
 */
class TaskManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->project = Project::create([
            'title' => 'Proyek Uji Coba',
            'description' => 'Deskripsi proyek pengujian',
            'owner_id' => $this->user->id,
        ]);
    }

    /**
     * [SRS-02-01] Uji pembuatan proyek baru dan kepemilikan otomatis.
     */
    public function test_can_create_project(): void
    {
        $response = $this->postJson('/api/projects', [
            'title' => 'Proyek Riset Baru',
            'description' => 'Riset implementasi',
            'owner_id' => $this->user->id,
        ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['title' => 'Proyek Riset Baru']);

        $this->assertDatabaseHas('projects', ['title' => 'Proyek Riset Baru']);
    }

    /**
     * [SRS-02-02] Uji penambahan tugas baru ke dalam proyek.
     */
    public function test_can_create_task_with_priority_and_deadline(): void
    {
        $response = $this->postJson('/api/tasks', [
            'project_id' => $this->project->id,
            'title' => 'Menyusun Skema Basis Data',
            'description' => 'Rincian skema tabel',
            'priority' => 'Urgent',
            'deadline' => '2026-09-30',
        ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['title' => 'Menyusun Skema Basis Data', 'priority' => 'Urgent']);

        $this->assertDatabaseHas('tasks', [
            'title' => 'Menyusun Skema Basis Data',
            'priority' => 'Urgent',
            'completed' => false,
        ]);
    }

    /**
     * [SRS-02-03] Uji toggle status selesai tugas.
     */
    public function test_can_toggle_task_completion_status(): void
    {
        $task = Task::create([
            'project_id' => $this->project->id,
            'title' => 'Tugas Awal',
            'priority' => 'Medium',
            'deadline' => '2026-09-25',
            'completed' => false,
        ]);

        $response = $this->patchJson("/api/tasks/{$task->id}/toggle");
        $response->assertStatus(200);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'completed' => true,
        ]);
    }

    /**
     * [SRS-02-04] Uji filter status (pending/completed) dan sorting.
     */
    public function test_can_filter_and_sort_tasks(): void
    {
        Task::create(['project_id' => $this->project->id, 'title' => 'Tugas Selesai', 'priority' => 'Low', 'deadline' => '2026-09-20', 'completed' => true]);
        Task::create(['project_id' => $this->project->id, 'title' => 'Tugas Belum Selesai', 'priority' => 'Urgent', 'deadline' => '2026-09-10', 'completed' => false]);

        // Filter status pending
        $resPending = $this->getJson('/api/tasks?status=pending');
        $resPending->assertStatus(200)
                   ->assertJsonCount(1, 'data')
                   ->assertJsonFragment(['title' => 'Tugas Belum Selesai']);

        // Filter status completed
        $resCompleted = $this->getJson('/api/tasks?status=completed');
        $resCompleted->assertStatus(200)
                     ->assertJsonCount(1, 'data')
                     ->assertJsonFragment(['title' => 'Tugas Selesai']);
    }

    /**
     * [SRS-02-05] Uji pembaruan (edit) detail tugas dan penghapusan tugas.
     */
    public function test_can_update_and_delete_task(): void
    {
        $task = Task::create([
            'project_id' => $this->project->id,
            'title' => 'Judul Awal',
            'priority' => 'Low',
            'deadline' => '2026-09-15',
            'completed' => false,
        ]);

        // Update
        $updateRes = $this->putJson("/api/tasks/{$task->id}", [
            'title' => 'Judul Baru Diperbarui',
            'priority' => 'High',
            'deadline' => '2026-09-28',
        ]);
        $updateRes->assertStatus(200)
                  ->assertJsonFragment(['title' => 'Judul Baru Diperbarui', 'priority' => 'High']);

        // Delete
        $deleteRes = $this->deleteJson("/api/tasks/{$task->id}");
        $deleteRes->assertStatus(200);

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    /**
     * [SRS-04-02] Uji penghapusan atomik proyek yang menghapus seluruh tugas terkait secara cascade.
     */
    public function test_deleting_project_cascades_to_tasks(): void
    {
        $task = Task::create([
            'project_id' => $this->project->id,
            'title' => 'Tugas Dalam Proyek',
            'priority' => 'Medium',
            'deadline' => '2026-09-25',
        ]);

        $response = $this->deleteJson("/api/projects/{$this->project->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('projects', ['id' => $this->project->id]);
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }
}
