<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * =============================================================================
 * Migrasi: Tabel activity_logs
 * Modul: SRS-03 Collaboration & Progress Tracking
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * [SRS-03-05] Menyimpan rekam jejak riwayat aktivitas kolaboratif secara real-time
 *             (contoh: tugas diselesaikan, anggota baru bergabung/diundang,
 *             deadline diperbarui).
 * =============================================================================
 */
return new class extends Migration
{
    /**
     * Jalankan migrasi tabel activity_logs.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action'); // [SRS-03-05] Deskripsi teks aktivitas yang dilakukan
            $table->string('icon')->default('📌'); // Ikon visual aktivitas (✅, 📨, ⏱️, 🗑️, 🚪)
            $table->timestamps();
        });
    }

    /**
     * Batalkan migrasi tabel activity_logs.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
