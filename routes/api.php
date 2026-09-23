<?php

use App\Http\Controllers\Api\CollaborationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/**
 * =============================================================================
 * File: routes/api.php
 * Project: JARA (Advanced Todo List & Collaboration System)
 * -----------------------------------------------------------------------------
 * Deskripsi:
 * Mendefinisikan seluruh endpoint RESTful API backend untuk modul:
 * - SRS-01: Admin & User Management
 * - SRS-02: Task & Project Management
 * - SRS-03: Collaboration & Progress Tracking
 * =============================================================================
 */

// =============================================================================
// [SRS-01] Admin & User Management Endpoints
// =============================================================================
Route::middleware('auth')->group(function () {

    Route::prefix('admin')->group(function () {
    // [SRS-01-02] Menampilkan daftar pengguna terdaftar (dengan fitur pencarian)
    Route::get('/users', [UserController::class, 'index']);

    // [SRS-01-03] Pendaftaran akun baru oleh administrator
    Route::post('/users', [UserController::class, 'store']);
    Route::post('/users/create', [UserController::class, 'store']); // Kompatibilitas endpoint

    // [SRS-01-04] Pengelolaan role pengguna (admin <-> member)
    Route::put('/users/{id}/role', [UserController::class, 'updateRole']);

    // [SRS-01-04] Pengelolaan status keaktifan akun (active <-> inactive)
    Route::put('/users/{id}/status', [UserController::class, 'updateStatus']);

    // [SRS-01-05] Penghapusan akun pengguna dari sistem
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Ringkasan statistik akun pengguna
    Route::get('/stats', [UserController::class, 'stats']);
});

// =============================================================================
// [SRS-02] Task & Project Management Endpoints
// =============================================================================
// [SRS-02-01] Manajemen kategori daftar / project
Route::get('/projects', [ProjectController::class, 'index']);
Route::post('/projects', [ProjectController::class, 'store']);
Route::get('/projects/{id}', [ProjectController::class, 'show']);
Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

// [SRS-02-02 s/d SRS-02-05] Manajemen tugas (Tasks)
Route::get('/tasks', [TaskController::class, 'index']);
Route::post('/tasks', [TaskController::class, 'store']);
Route::get('/tasks/{id}', [TaskController::class, 'show']);
Route::put('/tasks/{id}', [TaskController::class, 'update']);
Route::patch('/tasks/{id}/toggle', [TaskController::class, 'toggleStatus']);
Route::patch('/tasks/{id}/status', [TaskController::class, 'toggleStatus']); // Kompatibilitas endpoint
Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);

// =============================================================================
// [SRS-03] Collaboration & Progress Tracking Endpoints
// =============================================================================
Route::prefix('projects/{projectId}')->group(function () {
    // [SRS-03-01 & SRS-03-02] Daftar anggota kolaborator proyek
    Route::get('/members', [CollaborationController::class, 'members']);

    // [SRS-03-01] Mengundang / menambah anggota baru ke proyek
    Route::post('/invite', [CollaborationController::class, 'invite']);

    // [SRS-03-02] Mengeluarkan anggota dari proyek
    Route::delete('/members/{userId}', [CollaborationController::class, 'removeMember']);

    // [SRS-03-03 & SRS-03-04] Kalkulasi persentase progres dan metrik pencapaian
    Route::get('/progress', [CollaborationController::class, 'progress']);

    // [SRS-03-05] Feed rekam jejak log aktivitas kolaborasi terkini
    Route::get('/activities', [CollaborationController::class, 'activities']);
});

});
