<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * =============================================================================
 * Migrasi: Tabel projects
 * Modul: SRS-02 Task & Project Management, SRS-04 Ownership & Transaction
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * [SRS-02-01] Menyimpan daftar pengelompokan proyek/kategori tugas pengguna.
 * [SRS-04-01] Mengaitkan proyek secara otomatis ke pemilik (owner_id) via relasi users.
 * [SRS-04-02] Menggunakan cascade on delete sehingga penghapusan proyek secara otomatis
 *             menghapus seluruh relasi anak (tasks, members, activity logs).
 * =============================================================================
 */
return new class extends Migration
{
    /**
     * Jalankan migrasi tabel projects.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // [SRS-02-01] Nama/judul kategori proyek
            $table->text('description')->nullable(); // Deskripsi detail proyek
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade'); // [SRS-04-01] Pemilik proyek
            $table->timestamps();
        });
    }

    /**
     * Batalkan migrasi tabel projects.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
