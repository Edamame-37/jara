<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * =============================================================================
 * Migrasi: Tabel pivot project_user
 * Modul: SRS-03 Collaboration & Progress Tracking
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * [SRS-03-01] Menghubungkan pengguna yang diundang ke dalam sebuah proyek (Many-to-Many).
 * [SRS-03-02] Menentukan tingkat hak akses kolaborator:
 *             - 'Owner'  : Pemilik utama proyek
 *             - 'Editor' : Dapat menambah, mengedit, dan menyelesaikan tugas
 *             - 'Viewer' : Hanya dapat melihat daftar dan progres
 * =============================================================================
 */
return new class extends Migration
{
    /**
     * Jalankan migrasi tabel pivot project_user.
     */
    public function up(): void
    {
        Schema::create('project_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['Owner', 'Editor', 'Viewer'])->default('Editor'); // [SRS-03-02]
            $table->timestamps();

            // Mencegah duplikasi keanggotaan pengguna pada proyek yang sama
            $table->unique(['project_id', 'user_id']);
        });
    }

    /**
     * Batalkan migrasi tabel pivot project_user.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_user');
    }
};
