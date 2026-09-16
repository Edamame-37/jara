<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * =============================================================================
 * Model: ActivityLog
 * Modul: SRS-03 Collaboration & Progress Tracking
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * [SRS-03-05] Menyimpan data log aktivitas kolaboratif secara real-time.
 *             Mencatat aksi penambahan/penyelesaian tugas, undangan anggota baru,
 *             dan modifikasi hak akses.
 * =============================================================================
 */
class ActivityLog extends Model
{
    use HasFactory;

    /**
     * Atribut yang dapat diisi secara massal.
     *
     * @var list<string>
     */
    protected $fillable = [
        'project_id', // [SRS-03-05] ID Proyek terkait
        'user_id',    // ID Pengguna yang memicu aksi
        'action',     // [SRS-03-05] Deskripsi teks aktivitas
        'icon',       // Simbol visual (✅, 📨, ⏱️, 🗑️, 🚪, dll.)
    ];

    /**
     * Relasi: Proyek tempat aktivitas ini terjadi.
     *
     * @return BelongsTo
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /**
     * Relasi: Pengguna yang melakukan aktivitas.
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Helper: Format waktu relatif bahasa Indonesia (contoh: "10 menit yang lalu").
     *
     * @return string
     */
    public function getTimeAgoAttribute(): string
    {
        return $this->created_at ? $this->created_at->diffForHumans() : 'Baru saja';
    }
}
