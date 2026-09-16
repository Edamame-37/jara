<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * =============================================================================
 * Migrasi: Tabel tasks
 * Modul: SRS-02 Task & Project Management
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * [SRS-02-02] Menyimpan item tugas lengkap dengan judul, deskripsi, prioritas,
 *             dan tanggal tenggat waktu (deadline).
 * [SRS-02-03] Kolom `completed` (boolean) menandai status pengerjaan tugas.
 * [SRS-02-04] Mendukung pengurutan berdasarkan deadline dan level prioritas.
 * [SRS-02-05] Mendukung pembaruan data dan penghapusan tugas.
 * =============================================================================
 */
return new class extends Migration
{
    /**
     * Jalankan migrasi tabel tasks.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade'); // [SRS-02-01] Relasi ke project
            $table->string('title'); // [SRS-02-02] Judul ringkas tugas
            $table->text('description')->nullable(); // [SRS-02-02] Penjelasan rincian tugas
            $table->enum('priority', ['Low', 'Medium', 'High', 'Urgent'])->default('Medium'); // [SRS-02-02] Skala prioritas
            $table->date('deadline'); // [SRS-02-02] Tenggat waktu jatuh tempo
            $table->boolean('completed')->default(false); // [SRS-02-03] Status selesai / belum selesai
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null'); // Penugasan opsional
            $table->timestamps();
        });
    }

    /**
     * Batalkan migrasi tabel tasks.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
