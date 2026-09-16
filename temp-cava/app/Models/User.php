<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * =============================================================================
 * Model: User
 * Modul: SRS-01 Admin & User Management
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * [SRS-01-01] Menyimpan data pengguna dan peran ('admin' / 'member').
 * [SRS-01-02] Menampilkan daftar pengguna, nama, email, role, dan tanggal bergabung.
 * [SRS-01-03] Pendaftaran pengguna baru dengan enkripsi password.
 * [SRS-01-04] Pengelolaan peran (role) dan status keaktifan akun (status).
 * [SRS-01-05] Menghubungkan pengguna ke relasi proyek, tugas, dan log aktivitas.
 * =============================================================================
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * Atribut yang dapat diisi secara massal (Mass Assignable).
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',   // [SRS-01-01 & SRS-01-04] 'admin' atau 'member'
        'status', // [SRS-01-04] 'active' atau 'inactive'
    ];

    /**
     * Atribut yang disembunyikan saat serialisasi (JSON/Array).
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Konversi tipe data atribut Eloquent.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * [SRS-01-01] Helper untuk mengecek apakah user memiliki hak akses Administrator.
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * [SRS-01-04] Helper untuk mengecek apakah akun dalam status aktif.
     *
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * [SRS-04-01] Relasi: Proyek yang dimiliki secara langsung oleh pengguna ini (sebagai Owner).
     *
     * @return HasMany
     */
    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'owner_id');
    }

    /**
     * [SRS-03-01 & SRS-03-02] Relasi: Proyek tempat pengguna menjadi kolaborator (Owner/Editor/Viewer).
     *
     * @return BelongsToMany
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    /**
     * [SRS-02-02] Relasi: Tugas yang ditugaskan kepada pengguna ini.
     *
     * @return HasMany
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    /**
     * [SRS-03-05] Relasi: Riwayat log aktivitas yang dicatat oleh pengguna ini.
     *
     * @return HasMany
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }
}
