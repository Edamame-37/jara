<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * =============================================================================
 * Model: Project
 * Modul: SRS-02 Task & Project Management, SRS-03 Collaboration & Progress
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * [SRS-02-01] Mengelola kategori atau pengelompokan daftar tugas pengguna.
 * [SRS-03-01 & SRS-03-02] Mengelola kolaborator anggota tim dengan pivot role.
 * [SRS-03-03] Menghitung kalkulasi persentase progres secara dinamis:
 *             (Tugas Selesai / Total Tugas) * 100%.
 * [SRS-03-04] Mengkategorikan status pencapaian target (Sesuai Target, Sedang Dikerjakan, Terlambat).
 * =============================================================================
 */
class Project extends Model
{
    use HasFactory;

    /**
     * Atribut yang dapat diisi secara massal.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',       // [SRS-02-01] Nama kategori / proyek
        'description', // Deskripsi rincian proyek
        'owner_id',    // [SRS-04-01] ID Pengguna pembuat / pemilik
    ];

    /**
     * [SRS-04-01] Relasi: Pemilik utama proyek.
     *
     * @return BelongsTo
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * [SRS-02-02] Relasi: Seluruh daftar tugas dalam proyek ini.
     *
     * @return HasMany
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'project_id');
    }

    /**
     * [SRS-03-01 & SRS-03-02] Relasi: Anggota kolaborator proyek (termasuk peran: Owner/Editor/Viewer).
     *
     * @return BelongsToMany
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    /**
     * [SRS-03-05] Relasi: Rekam jejak log aktivitas kolaborasi proyek.
     *
     * @return HasMany
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'project_id')->latest();
    }

    /**
     * [SRS-03-03 & SRS-03-04] Helper: Menghitung persentase progres dan metrik status pencapaian.
     * Formula: (Jumlah Tugas Selesai / Total Seluruh Tugas) * 100%
     *
     * @return array{total_tasks: int, completed_tasks: int, percentage: int, status_label: string}
     */
    public function getProgressMetrics(): array
    {
        $total = $this->tasks()->count();
        $completed = $this->tasks()->where('completed', true)->count();
        $percentage = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

        // [SRS-03-04] Indikator status pencapaian
        $statusLabel = 'Sesuai Target / On-Track';
        if ($percentage < 40) {
            $statusLabel = 'Memerlukan Akselerasi / Behind';
        } elseif ($percentage < 75) {
            $statusLabel = 'Sedang Berjalan / In-Progress';
        }

        return [
            'total_tasks' => $total,
            'completed_tasks' => $completed,
            'percentage' => $percentage,
            'status_label' => $statusLabel,
        ];
    }
}
