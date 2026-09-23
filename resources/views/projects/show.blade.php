<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Detail Proyek - JARA</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <style>
        .task-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .task-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            border-bottom: 1px solid var(--glass-border);
            transition: var(--transition);
        }
        .task-item:hover {
            background: rgba(255,255,255,0.02);
        }
        .task-item.completed h4 {
            text-decoration: line-through;
            color: var(--text-secondary);
        }
        .checkbox-custom {
            width: 20px;
            height: 20px;
            cursor: pointer;
            border-radius: 4px;
        }
        .sidebar {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        .member-list {
            list-style: none;
            padding: 0;
        }
        .member-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--glass-border);
        }
    </style>
</head>
<body>
    <header class="app-header">
        <div class="container header-content">
            <a href="{{ route('projects.index') }}" class="app-brand">JARA</a>
            <nav class="app-nav">
                <a href="{{ route('projects.index') }}" class="nav-link">&larr; Kembali</a>
            </nav>
        </div>
    </header>

    <main class="app-main container">
        <div class="grid" style="grid-template-columns: 2fr 1fr; align-items: start;">
            
            <!-- Area Kiri: Task Management -->
            <div>
                <div class="flex justify-between items-center mb-4">
                    <h2 id="projectTitle">Memuat...</h2>
                    <button class="btn btn-primary" onclick="showTaskModal()">+ Tugas Baru</button>
                </div>
                <p id="projectDesc" style="color:var(--text-secondary); margin-bottom: 2rem;"></p>

                <div class="glass-card" style="padding: 0;">
                    <ul class="task-list" id="taskList">
                        <li style="padding: 1rem; color: var(--text-secondary);">Memuat tugas...</li>
                    </ul>
                </div>
            </div>

            <!-- Area Kanan: Progress & Kolaborator -->
            <div class="sidebar">
                <div class="glass-card">
                    <h3>Progres Target</h3>
                    <div style="margin-top:1.5rem;">
                        <div class="flex justify-between items-center" style="font-size:0.875rem; color:var(--text-secondary)">
                            <span id="progressLabel">0%</span>
                            <span id="progressStats">0/0</span>
                        </div>
                        <div class="progress-bar-bg" style="background: rgba(255,255,255,0.1); border-radius: 9999px; height: 8px; width: 100%; margin-top: 1rem; overflow: hidden;">
                            <div id="progressFill" style="background: var(--accent-primary); height: 100%; border-radius: 9999px; transition: width 0.5s ease; width: 0%;"></div>
                        </div>
                    </div>
                </div>

                <div class="glass-card">
                    <div class="flex justify-between items-center mb-4">
                        <h3>Anggota Tim</h3>
                        <button class="btn" style="padding: 0.2rem 0.5rem; font-size:0.8rem; background: var(--accent-primary); color:white;" onclick="inviteMember()">Undang</button>
                    </div>
                    <ul class="member-list" id="memberList">
                        <!-- Dimuat via JS -->
                    </ul>
                </div>
                
                <div class="glass-card" style="border-color: rgba(239, 68, 68, 0.3);">
                    <h3 style="color: var(--danger);">Danger Zone</h3>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">Menghapus proyek bersifat permanen dan atomik.</p>
                    <button class="btn btn-danger btn-block" onclick="deleteProject()">Hapus Proyek Ini</button>
                </div>
            </div>
        </div>
    </main>

    <script>
        const projectId = {{ $id }};
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        async function loadProject() {
            try {
                const res = await fetch(`/api/projects/${projectId}`);
                const result = await res.json();
                if(result.success) {
                    renderProject(result.data);
                }
            } catch (e) {
                console.error("Gagal memuat proyek", e);
            }
        }

        function renderProject(data) {
            document.getElementById('projectTitle').innerText = data.title;
            document.getElementById('projectDesc').innerText = data.description || 'Tidak ada deskripsi.';
            
            // Render Tasks
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '';
            if(data.tasks.length === 0) {
                taskList.innerHTML = '<li style="padding: 1rem; color: var(--text-secondary);">Belum ada tugas.</li>';
            } else {
                data.tasks.forEach(t => {
                    const li = document.createElement('li');
                    li.className = `task-item ${t.status === 'completed' || t.is_completed ? 'completed' : ''}`;
                    li.innerHTML = `
                        <div class="flex items-center gap-2">
                            <input type="checkbox" class="checkbox-custom" ${t.status === 'completed' || t.is_completed ? 'checked' : ''} onchange="toggleTask(${t.id})">
                            <div>
                                <h4 style="margin:0">${t.title}</h4>
                                <span class="badge ${t.priority === 'High' ? 'badge-danger' : 'badge-primary'}" style="font-size: 0.65rem;">${t.priority}</span>
                            </div>
                        </div>
                        <button class="btn btn-danger" style="padding: 0.2rem 0.5rem; font-size:0.8rem;" onclick="deleteTask(${t.id})">Hapus</button>
                    `;
                    taskList.appendChild(li);
                });
            }

            // Render Metrics
            const metrics = data.metrics;
            document.getElementById('progressLabel').innerText = `${metrics.percentage}%`;
            document.getElementById('progressStats').innerText = `${metrics.completed_tasks}/${metrics.total_tasks}`;
            document.getElementById('progressFill').style.width = `${metrics.percentage}%`;
            if(metrics.percentage === 100) {
                document.getElementById('progressFill').style.background = 'var(--success)';
            }

            // Render Members
            const memberList = document.getElementById('memberList');
            memberList.innerHTML = '';
            data.members.forEach(m => {
                const li = document.createElement('li');
                li.className = 'member-item';
                li.innerHTML = `
                    <div>
                        <div style="font-weight:500;">${m.name}</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary);">${m.pivot.role}</div>
                    </div>
                `;
                memberList.appendChild(li);
            });
        }

        async function toggleTask(taskId) {
            try {
                await fetch(`/api/tasks/${taskId}/toggle`, {
                    method: 'PATCH',
                    headers: { 'X-CSRF-TOKEN': csrfToken }
                });
                loadProject();
            } catch (e) { alert("Gagal memperbarui status"); }
        }

        async function deleteTask(taskId) {
            if(confirm("Hapus tugas ini?")) {
                try {
                    await fetch(`/api/tasks/${taskId}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-TOKEN': csrfToken }
                    });
                    loadProject();
                } catch(e) {}
            }
        }
        
        async function deleteProject() {
            if(confirm("PERINGATAN: Hapus proyek ini dan seluruh tugas di dalamnya secara permanen?")) {
                try {
                    const res = await fetch(`/api/projects/${projectId}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-TOKEN': csrfToken }
                    });
                    if(res.ok) {
                        window.location.href = '/projects';
                    } else {
                        const err = await res.json();
                        alert(err.message || "Unauthorized");
                    }
                } catch (e) { alert("Gagal menghapus"); }
            }
        }

        function inviteMember() {
            alert("Fitur invite sedang dalam pengembangan.");
        }

        function showTaskModal() {
            const title = prompt("Masukkan Judul Tugas:");
            if (title) {
                fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        title: title,
                        priority: 'Medium'
                    })
                }).then(res => res.json()).then(() => loadProject());
            }
        }

        document.addEventListener('DOMContentLoaded', loadProject);
    </script>
</body>
</html>
