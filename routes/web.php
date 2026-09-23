<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Redirect home ke login atau dashboard
Route::get('/', function () {
    return redirect('/login');
});

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Protected Web Routes
Route::middleware('auth')->group(function () {
    
    // Admin Dashboard
    Route::middleware('can:admin-access')->group(function () {
        Route::get('/admin/dashboard', function () {
            return view('admin.dashboard');
        })->name('admin.dashboard');
    });

    // Project & Tasks Management
    Route::get('/projects', function () {
        return view('projects.index');
    })->name('projects.index');
    
    Route::get('/projects/{id}', function ($id) {
        return view('projects.show', ['id' => $id]);
    })->name('projects.show');
});
