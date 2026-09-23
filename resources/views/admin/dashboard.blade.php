<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Admin Dashboard - JARA</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body>
    <header class="app-header">
        <div class="container header-content">
            <a href="#" class="app-brand">JARA Admin</a>
            <nav class="app-nav">
                <a href="{{ route('admin.dashboard') }}" class="nav-link active">Users</a>
                <a href="{{ route('projects.index') }}" class="nav-link">Projects</a>
                <form action="{{ route('logout') }}" method="POST" style="display:inline;">
                    @csrf
                    <button type="submit" class="btn btn-danger" style="padding: 0.4rem 1rem;">Logout</button>
                </form>
            </nav>
        </div>
    </header>

    <main class="app-main container">
        <div class="flex justify-between items-center mb-4">
            <h2>Manajemen Pengguna</h2>
            <button class="btn btn-primary" onclick="showAddUserModal()">+ Tambah Pengguna</button>
        </div>

        <div class="glass-card">
            <div class="table-container">
                <table class="table" id="usersTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nama</th>
                            <th>Email</th>
                            <th>Peran</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Diisi via JavaScript Fetch API -->
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <script>
        const API_URL = '/api/admin/users';
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        // Fetch & render users
        async function loadUsers() {
            try {
                const response = await fetch(API_URL);
                const result = await response.json();
                if(result.success) {
                    renderUsers(result.data);
                }
            } catch (error) {
                console.error("Gagal memuat pengguna", error);
            }
        }

        function renderUsers(users) {
            const tbody = document.querySelector('#usersTable tbody');
            tbody.innerHTML = '';
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>
                        <select onchange="changeRole(${user.id}, this.value)" class="form-control" style="width:auto; padding: 0.2rem;">
                            <option value="Member" ${user.role === 'Member' ? 'selected' : ''}>Member</option>
                            <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                    <td>
                        <span class="badge ${user.status === 'Active' ? 'badge-success' : 'badge-danger'}">
                            ${user.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteUser(${user.id})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Hapus</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        async function changeRole(userId, newRole) {
            try {
                await fetch(`/api/admin/users/${userId}/role`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({ role: newRole })
                });
                loadUsers();
            } catch (e) { alert("Gagal mengubah role"); }
        }

        async function deleteUser(userId) {
            if(confirm('Yakin ingin menghapus pengguna ini?')) {
                try {
                    await fetch(`/api/admin/users/${userId}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-TOKEN': csrfToken }
                    });
                    loadUsers();
                } catch(e) { alert("Gagal menghapus pengguna"); }
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', loadUsers);
    </script>
</body>
</html>
