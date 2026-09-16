<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * =============================================================================
 * Controller: UserController
 * Modul: SRS-01 Admin & User Management
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Mengendalikan endpoint API untuk pengelolaan pengguna sistem:
 * [SRS-01-01] Validasi otentikasi peran administrator.
 * [SRS-01-02] Menampilkan daftar pengguna dengan filter pencarian instan nama/email.
 * [SRS-01-03] Mendaftarkan pengguna baru dengan enkripsi kata sandi (Bcrypt).
 * [SRS-01-04] Mengubah peran (role) dan status keaktifan akun (Active/Inactive).
 * [SRS-01-05] Menghapus akun pengguna secara permanen dari sistem.
 * =============================================================================
 */
class UserController extends Controller
{
    /**
     * [SRS-01-02] Menampilkan daftar seluruh pengguna dengan filter pencarian nama & email.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // Fitur pencarian interaktif
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->latest('id')->get()->map(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'joined' => $user->created_at ? $user->created_at->format('Y-m-d') : date('Y-m-d'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * [SRS-01-03] Pendaftaran akun baru oleh Administrator.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['admin', 'member'])],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'status' => 'active',
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Akun pengguna {$user->name} berhasil didaftarkan.",
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'joined' => $user->created_at->format('Y-m-d'),
            ],
        ], 201);
    }

    /**
     * [SRS-01-04] Mengubah peran pengguna (admin <-> member).
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($request->has('role')) {
            $validated = $request->validate([
                'role' => ['required', Rule::in(['admin', 'member'])],
            ]);
            $user->role = $validated['role'];
        } else {
            // Toggle otomatis jika tidak disertakan parameter role eksplisit
            $user->role = $user->role === 'admin' ? 'member' : 'admin';
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Peran akun {$user->name} berhasil diperbarui menjadi {$user->role}.",
            'data' => [
                'id' => $user->id,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * [SRS-01-04] Mengubah status keaktifan akun (active <-> inactive).
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($request->has('status')) {
            $validated = $request->validate([
                'status' => ['required', Rule::in(['active', 'inactive'])],
            ]);
            $user->status = $validated['status'];
        } else {
            // Toggle otomatis status keaktifan
            $user->status = $user->status === 'active' ? 'inactive' : 'active';
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Status akun {$user->name} berhasil diubah menjadi {$user->status}.",
            'data' => [
                'id' => $user->id,
                'status' => $user->status,
            ],
        ]);
    }

    /**
     * [SRS-01-05] Menghapus akun pengguna dari sistem.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $userName = $user->name;
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => "Akun {$userName} berhasil dihapus dari sistem.",
        ]);
    }

    /**
     * Ringkasan statistik akun pengguna untuk dashboard admin.
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        $totalUsers = User::count();
        $totalAdmins = User::where('role', 'admin')->count();
        $totalMembers = User::where('role', 'member')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_admins' => $totalAdmins,
                'total_members' => $totalMembers,
            ],
        ]);
    }
}
