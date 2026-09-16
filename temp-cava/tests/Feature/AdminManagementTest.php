<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * =============================================================================
 * Test: AdminManagementTest
 * Modul: SRS-01 Admin & User Management
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Menguji seluruh spesifikasi fungsional SRS-01 secara otomatis:
 * [SRS-01-02] Listing pengguna dan filter pencarian nama/email.
 * [SRS-01-03] Pendaftaran akun baru dengan validasi kata sandi min 8 karakter dan email unik.
 * [SRS-01-04] Pengubahan peran (Role Admin <-> Member) dan status akun (Active <-> Inactive).
 * [SRS-01-05] Penghapusan akun pengguna dari sistem.
 * =============================================================================
 */
class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * [SRS-01-02] Uji menampilkan daftar pengguna dan fitur pencarian nama/email.
     */
    public function test_can_list_and_search_users(): void
    {
        User::factory()->create(['name' => 'Budi Santoso', 'email' => 'budi@example.com', 'role' => 'member']);
        User::factory()->create(['name' => 'Siti Aminah', 'email' => 'siti@example.com', 'role' => 'admin']);

        // Test list all
        $response = $this->getJson('/api/admin/users');
        $response->assertStatus(200)
                 ->assertJsonCount(2, 'data');

        // Test search by name
        $searchResponse = $this->getJson('/api/admin/users?search=Budi');
        $searchResponse->assertStatus(200)
                       ->assertJsonCount(1, 'data')
                       ->assertJsonFragment(['name' => 'Budi Santoso']);
    }

    /**
     * [SRS-01-03] Uji pendaftaran akun baru dengan validasi data.
     */
    public function test_can_create_new_user_with_validation(): void
    {
        $payload = [
            'name' => 'Ahmad Dahlan',
            'email' => 'ahmad@example.com',
            'role' => 'member',
            'password' => 'secret12345',
        ];

        $response = $this->postJson('/api/admin/users', $payload);
        $response->assertStatus(201)
                 ->assertJsonFragment(['name' => 'Ahmad Dahlan', 'email' => 'ahmad@example.com']);

        $this->assertDatabaseHas('users', [
            'email' => 'ahmad@example.com',
            'role' => 'member',
            'status' => 'active',
        ]);
    }

    /**
     * [SRS-01-03] Uji penolakan pendaftaran jika password kurang dari 8 karakter atau email duplikat.
     */
    public function test_create_user_validation_fails_on_short_password_or_duplicate_email(): void
    {
        User::factory()->create(['email' => 'exist@example.com']);

        // Password terlalu pendek
        $res1 = $this->postJson('/api/admin/users', [
            'name' => 'Invalid User',
            'email' => 'valid@example.com',
            'role' => 'member',
            'password' => '1234',
        ]);
        $res1->assertStatus(422)
             ->assertJsonValidationErrors(['password']);

        // Email duplikat
        $res2 = $this->postJson('/api/admin/users', [
            'name' => 'Duplicate User',
            'email' => 'exist@example.com',
            'role' => 'member',
            'password' => 'password123',
        ]);
        $res2->assertStatus(422)
             ->assertJsonValidationErrors(['email']);
    }

    /**
     * [SRS-01-04] Uji pengubahan peran (Role) dan status akun pengguna.
     */
    public function test_can_update_user_role_and_status(): void
    {
        $user = User::factory()->create(['role' => 'member', 'status' => 'active']);

        // Ganti role ke admin
        $roleRes = $this->putJson("/api/admin/users/{$user->id}/role", ['role' => 'admin']);
        $roleRes->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'role' => 'admin']);

        // Nonaktifkan status akun
        $statusRes = $this->putJson("/api/admin/users/{$user->id}/status", ['status' => 'inactive']);
        $statusRes->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'inactive']);
    }

    /**
     * [SRS-01-05] Uji penghapusan akun pengguna dari sistem.
     */
    public function test_can_delete_user(): void
    {
        $user = User::factory()->create();

        $response = $this->deleteJson("/api/admin/users/{$user->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }
}
