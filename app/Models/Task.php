<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * =============================================================================
 * Model: Task
 * Modul: SRS-02 Task & Project Management
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * [SRS-02-02] Menyimpan entitas tugas: judul, deskripsi, prioritas, tenggat waktu.
 * [SRS-02-03] Mengelola status penyelesaian tugas (completed = true/false).
 * [SRS-02-04] Scope filter berdasarkan status (all, pending, completed) dan
 *             sorting (deadline terdekat, prioritas tertinggi, terbaru).
 * [SRS-02-05] Pembaruan dan penghapusan tugas.
 * =============================================================================
 */
class Task extends Model
{
    use HasFactory;

    /**
     * Atribut yang dapat diisi secara massal.
     *
     * @var list<string>
     */
    protected $fillable = [
        'project_id',  // [SRS-02-01] Relasi ke project
        'title',       // [SRS-02-02] Judul tugas
        'description', // [SRS-02-02] Rincian tugas
        'priority',    // [SRS-02-02] 'Low', 'Medium', 'High', 'Urgent'
        'deadline',    // [SRS-02-02] Tanggal jatuh tempo (YYYY-MM-DD)
        'completed',   // [SRS-02-03] boolean: true (selesai) / false (belum)
        'assigned_to', // ID Pengguna yang ditugaskan (opsional)
    ];

    /**
     * Konversi tipe data atribut Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
            'deadline' => 'date:Y-m-d',
        ];
    }

    /**
     * [SRS-02-01] Relasi: Proyek tempat tugas ini bernaung.
     *
     * @return BelongsTo
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /**
     * Relasi: Pengguna yang ditugaskan mengerjakan tugas ini.
     *
     * @return BelongsTo
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * [SRS-02-04] Query Scope: Filter berdasarkan status pengerjaan.
     *
     * @param Builder $query
     * @param string $status 'all' | 'pending' | 'completed'
     * @return Builder
     */
    public function scopeFilterStatus(Builder $query, string $status): Builder
    {
        return match ($status) {
            'pending' => $query->where('completed', false),
            'completed' => $query->where('completed', true),
            default => $query,
        };
    }

    /**
     * [SRS-02-04] Query Scope: Pengurutan daftar tugas.
     *
     * @param Builder $query
     * @param string $sort 'deadline' | 'priority' | 'newest'
     * @return Builder
     */
    public function scopeApplySorting(Builder $query, string $sort): Builder
    {
        return match ($sort) {
            'deadline' => $query->orderBy('deadline', 'asc'),
            'priority' => $query->orderByRaw("
                CASE priority
                    WHEN 'Urgent' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                    ELSE 5
                END ASC
            "),
            default => $query->latest('id'),
        };
    }
}
