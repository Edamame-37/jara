<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Daftar Proyek - JARA</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <style>
        .project-card {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            cursor: pointer;
        }
        .project-card:hover {
            transform: translateY(-4px);
            border-color: var(--accent-primary);
        }
        .progress-bar-bg {
            background: rgba(255,255,255,0.1);
            border-radius: var(--radius-full);
            height: 8px;
            width: 100%;
            margin-top: 1rem;
            overflow: hidden;
        }
        .progress-bar-fill {
            background: var(--accent-primary);
            height: 100%;
            border-radius: var(--radius-full);
            transition: width 0.5s ease;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(4px);
            z-index: 100;
            align-items: center;
            justify-content: center;
        }
        .modal.active { display: flex; }
    </style>
</head>
<body>
    <header class="app-header">
        <div class="container header-content">
            <a href="#" class="app-brand">JARA</a>
            <nav class="app-nav">
                @if(Auth::user()->role === 'Admin')
                <a href="{{ route('admin.dashboard') }}" class="nav-link">Users</a>
                @endif
                <a href="{{ route('projects.index') }}" class="nav-link active">Projects</a>
                <span class="nav-link" style="color:var(--text-secondary)">Hai, {{ Auth::user()->name }}</span>
                <form action="{{ route('logout') }}" method="POST" style="display:inline;">
                    @csrf
                    <button type="submit" class="btn btn-danger" style="padding: 0.4rem 1rem;">Logout</button>
                </form>
            </nav>
        </div>
    </header>

    <main class="app-main container">
        <div class="flex justify-between items-center mb-4">
            <h2>Proyek Anda</h2>
            <button class="btn btn-primary" onclick="openModal()">+ Buat Proyek Baru</button>
        </div>

        <div class="grid grid-cols-3" id="projectsGrid">
            <!-- Proyek dimuat via JS -->
        </div>
    </main>

    <!-- Modal Buat Proyek -->
    <div class="modal" id="createProjectModal">
        <div class="glass-card" style="width: 100%; max-width: 500px;">
            <h3>Buat Proyek Baru</h3>
            <form id="createProjectForm" onsubmit="createProject(event)" class="mt-4">
                <div class="form-group">
                    <label class="form-label">Nama Proyek</label>
                    <input type="text" id="projectTitle" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Deskripsi</label>
                    <textarea id="projectDesc" class="form-control" rows="3"></textarea>
                </div>
                <div class="flex gap-2" style="justify-content: flex-end;">
                    <button type="button" class="btn" style="background:transparent; border:1px solid var(--text-secondary); color:white;" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan Proyek</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const API_URL = '/api/projects';
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        async function loadProjects() {
            try {
                const res = await fetch(API_URL);
                const result = await res.json();
                renderProjects(result.data);
            } catch(e) { console.error('Error load projects:', e); }
        }

        function renderProjects(projects) {
            const grid = document.getElementById('projectsGrid');
            grid.innerHTML = '';
            
            if (projects.length === 0) {
                grid.innerHTML = `<p style="color:var(--text-secondary); grid-column: 1/-1;">Belum ada proyek. Silakan buat baru!</p>`;
                return;
            }

            projects.forEach(p => {
                const card = document.createElement('div');
                card.className = 'glass-card project-card';
                card.onclick = () => window.location.href = `/projects/${p.id}`;
                
                const progressColor = p.progress_percentage === 100 ? 'var(--success)' : 'var(--accent-primary)';
                
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <span class="badge ${p.status_label === 'Sesuai Target' ? 'badge-success' : 'badge-primary'}">${p.status_label}</span>
                            <small style="color:var(--text-secondary)">${p.created_at}</small>
                        </div>
                        <h4 style="margin-bottom:0.5rem">${p.title}</h4>
                        <p style="color:var(--text-secondary); font-size:0.875rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.description || 'Tidak ada deskripsi.'}</p>
                    </div>
                    <div style="margin-top:1.5rem;">
                        <div class="flex justify-between items-center" style="font-size:0.875rem; color:var(--text-secondary)">
                            <span>Progres</span>
                            <span>${p.progress_percentage}% (${p.completed_tasks}/${p.total_tasks})</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${p.progress_percentage}%; background-color: ${progressColor}"></div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        async function createProject(e) {
            e.preventDefault();
            const title = document.getElementById('projectTitle').value;
            const desc = document.getElementById('projectDesc').value;

            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({ title, description: desc })
                });
                if(res.ok) {
                    closeModal();
                    loadProjects();
                } else {
                    alert('Gagal membuat proyek');
                }
            } catch (err) {
                alert('Gagal membuat proyek');
            }
        }

        function openModal() {
            document.getElementById('createProjectModal').classList.add('active');
        }
        function closeModal() {
            document.getElementById('createProjectModal').classList.remove('active');
            document.getElementById('createProjectForm').reset();
        }

        document.addEventListener('DOMContentLoaded', loadProjects);
    </script>
</body>
</html>
