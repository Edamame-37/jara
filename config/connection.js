/**
 * =============================================================================
 * File: config/connection.js
 * Project: JARA (Advanced Todo List & Collaboration System)
 * Role: (PM / Core) Koneksi Database / Konfigurasi Umum Sistem
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * File ini menangani arsitektur komunikasi data sistem JARA:
 * 1. Menentukan Base URL backend REST API Laravel.
 * 2. Menyediakan mapping endpoint terpusat untuk SRS-01, SRS-02, dan SRS-03.
 * 3. Menyediakan fungsi `AppConfig.request()` dengan arsitektur Dual-Mode:
 *    - Mode Online: Berkomunikasi langsung dengan REST API Laravel (http://127.0.0.1:8000/api).
 *    - Mode Fallback: Jika server backend belum aktif atau halaman diakses langsung
 *      sebagai berkas HTML statis (file://), sistem secara mulus beralih ke penyimpanan
 *      LocalStorage tersinkronisasi agar seluruh alur UI tetap dapat diuji secara fungsional.
 * =============================================================================
 */

const AppConfig = {
    // Nama aplikasi dan versi rilis
    appName: "JARA - Task & Collaboration Platform",
    version: "1.0.0",

    // Konfigurasi Environment (development / production)
    environment: "development",

    // Base URL Backend API Laravel
    apiBaseUrl: (typeof window !== "undefined" && (window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")))
        ? "http://127.0.0.1:8000/api"
        : "http://127.0.0.1:8000/api",

    // Header default untuk request HTTP fetch/JSON
    defaultHeaders: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    },

    // Endpoint mapping untuk setiap modul spesifikasi (SRS)
    endpoints: {
        // [SRS-01] Admin & User Management
        admin: {
            users: "/admin/users",
            createUser: "/admin/users",
            updateRole: (id) => `/admin/users/${id}/role`,
            updateStatus: (id) => `/admin/users/${id}/status`,
            deleteUser: (id) => `/admin/users/${id}`,
            stats: "/admin/stats"
        },
        // [SRS-02] Task & Project Management
        task: {
            projects: "/projects",
            createProject: "/projects",
            deleteProject: (id) => `/projects/${id}`,
            tasks: "/tasks",
            createTask: "/tasks",
            getTask: (id) => `/tasks/${id}`,
            updateTask: (id) => `/tasks/${id}`,
            toggleStatus: (id) => `/tasks/${id}/toggle`,
            deleteTask: (id) => `/tasks/${id}`
        },
        // [SRS-03] Collaboration & Progress Tracking
        collaboration: {
            members: (projectId) => `/projects/${projectId}/members`,
            inviteMember: (projectId) => `/projects/${projectId}/invite`,
            removeMember: (projectId, userId) => `/projects/${projectId}/members/${userId}`,
            progress: (projectId) => `/projects/${projectId}/progress`,
            activities: (projectId) => `/projects/${projectId}/activities`
        }
    },

    /**
     * [Dual-Mode Data Request Handler]
     * Menjalankan request ke REST API Laravel. Jika server offline atau gagal dijangkau,
     * secara otomatis beralih memproses transaksi ke LocalStorage fallback.
     *
     * @param {string} endpoint - Path endpoint API
     * @param {object} options - Opsi request fetch (method, body, headers, dll)
     * @returns {Promise<any>} Data JSON hasil respons
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...(options.headers || {})
            }
        };

        try {
            // Coba panggil Backend API Laravel dengan batas timeout 3 detik
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(url, { ...config, signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`[AppConfig] Server backend API offline / tidak merespons pada ${endpoint}. Mengaktifkan sinkronisasi LocalStorage Fallback.`);
            return this.handleFallbackRequest(endpoint, options);
        }
    },

    /**
     * Helper LocalStorage Data Synchronization Fallback
     */
    handleFallbackRequest(endpoint, options) {
        const method = (options.method || "GET").toUpperCase();
        const body = options.body ? JSON.parse(options.body) : null;

        // Inisialisasi mock data di localStorage jika belum tersedia
        this.initFallbackStorage();

        // 1. [SRS-01] Admin Endpoints Fallback
        if (endpoint.startsWith("/admin/users")) {
            let users = JSON.parse(localStorage.getItem("jara_users") || "[]");

            if (method === "GET") {
                const urlParams = new URLSearchParams(endpoint.split("?")[1] || "");
                const search = urlParams.get("search")?.toLowerCase();
                let filtered = users;
                if (search) {
                    filtered = users.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
                }
                return { success: true, data: filtered };
            }

            if (method === "POST") {
                const newUser = {
                    id: Date.now(),
                    name: body.name,
                    email: body.email,
                    role: body.role || "member",
                    status: "active",
                    joined: new Date().toISOString().split("T")[0]
                };
                users.unshift(newUser);
                localStorage.setItem("jara_users", JSON.stringify(users));
                return { success: true, message: `Akun ${newUser.name} berhasil dibuat.`, data: newUser };
            }

            const idMatch = endpoint.match(/\/admin\/users\/(\d+)/);
            if (idMatch) {
                const id = parseInt(idMatch[1], 10);
                const userIndex = users.findIndex(u => u.id === id);

                if (endpoint.endsWith("/role") && method === "PUT") {
                    if (userIndex !== -1) {
                        users[userIndex].role = body?.role || (users[userIndex].role === "admin" ? "member" : "admin");
                        localStorage.setItem("jara_users", JSON.stringify(users));
                        return { success: true, data: users[userIndex] };
                    }
                }

                if (endpoint.endsWith("/status") && method === "PUT") {
                    if (userIndex !== -1) {
                        users[userIndex].status = body?.status || (users[userIndex].status === "active" ? "inactive" : "active");
                        localStorage.setItem("jara_users", JSON.stringify(users));
                        return { success: true, data: users[userIndex] };
                    }
                }

                if (method === "DELETE") {
                    users = users.filter(u => u.id !== id);
                    localStorage.setItem("jara_users", JSON.stringify(users));
                    return { success: true, message: "Pengguna berhasil dihapus." };
                }
            }
        }

        if (endpoint === "/admin/stats" && method === "GET") {
            const users = JSON.parse(localStorage.getItem("jara_users") || "[]");
            return {
                success: true,
                data: {
                    total_users: users.length,
                    total_admins: users.filter(u => u.role === "admin").length,
                    total_members: users.filter(u => u.role === "member").length
                }
            };
        }

        // 2. [SRS-02] Projects Endpoints Fallback
        if (endpoint.startsWith("/projects") && !endpoint.includes("/members") && !endpoint.includes("/invite") && !endpoint.includes("/progress") && !endpoint.includes("/activities")) {
            let projects = JSON.parse(localStorage.getItem("jara_projects") || "[]");
            let tasks = JSON.parse(localStorage.getItem("jara_tasks") || "[]");

            if (endpoint === "/projects" && method === "GET") {
                const mapped = projects.map(p => {
                    const pTasks = tasks.filter(t => t.projectId === p.id);
                    const completed = pTasks.filter(t => t.completed).length;
                    const total = pTasks.length;
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return {
                        ...p,
                        total_tasks: total,
                        completed_tasks: completed,
                        progress_percentage: percentage,
                        status_label: percentage >= 75 ? "Sesuai Target / On-Track" : (percentage >= 40 ? "Sedang Berjalan / In-Progress" : "Memerlukan Akselerasi / Behind")
                    };
                });
                return { success: true, data: mapped };
            }

            if (endpoint === "/projects" && method === "POST") {
                const newProj = {
                    id: Date.now(),
                    title: body.title,
                    description: body.description || "",
                    owner: { id: 1, name: "Aufaarel Mecca", email: "aufaarel@jara.local" },
                    created_at: new Date().toISOString().split("T")[0]
                };
                projects.push(newProj);
                localStorage.setItem("jara_projects", JSON.stringify(projects));
                return { success: true, message: "Proyek berhasil dibuat.", data: newProj };
            }
        }

        // 3. [SRS-02] Tasks Endpoints Fallback
        if (endpoint.startsWith("/tasks")) {
            let tasks = JSON.parse(localStorage.getItem("jara_tasks") || "[]");

            if (endpoint.startsWith("/tasks") && method === "GET") {
                const urlParams = new URLSearchParams(endpoint.split("?")[1] || "");
                const status = urlParams.get("status") || "all";
                const sort = urlParams.get("sort") || "deadline";
                const projectId = urlParams.get("project_id");

                let filtered = tasks;
                if (projectId && projectId !== "all") {
                    filtered = filtered.filter(t => t.projectId == projectId);
                }
                if (status === "pending") filtered = filtered.filter(t => !t.completed);
                if (status === "completed") filtered = filtered.filter(t => t.completed);

                if (sort === "deadline") {
                    filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
                } else if (sort === "priority") {
                    const weight = { Urgent: 1, High: 2, Medium: 3, Low: 4 };
                    filtered.sort((a, b) => (weight[a.priority] || 5) - (weight[b.priority] || 5));
                } else {
                    filtered.sort((a, b) => b.id - a.id);
                }

                const baseTotal = projectId && projectId !== "all" ? tasks.filter(t => t.projectId == projectId) : tasks;

                return {
                    success: true,
                    data: filtered,
                    meta: {
                        count_all: baseTotal.length,
                        count_pending: baseTotal.filter(t => !t.completed).length,
                        count_completed: baseTotal.filter(t => t.completed).length
                    }
                };
            }

            if (endpoint === "/tasks" && method === "POST") {
                const newTask = {
                    id: Date.now(),
                    projectId: body.project_id || 1,
                    title: body.title,
                    description: body.description || "",
                    priority: body.priority || "Medium",
                    deadline: body.deadline,
                    completed: false
                };
                tasks.unshift(newTask);
                localStorage.setItem("jara_tasks", JSON.stringify(tasks));
                this.addFallbackActivity(newTask.projectId, `Tugas baru '${newTask.title}' ditambahkan`, "📌");
                return { success: true, message: "Tugas berhasil ditambahkan.", data: newTask };
            }

            const idMatch = endpoint.match(/\/tasks\/(\d+)/);
            if (idMatch) {
                const id = parseInt(idMatch[1], 10);
                const taskIndex = tasks.findIndex(t => t.id === id);

                if (endpoint.endsWith("/toggle") || endpoint.endsWith("/status")) {
                    if (taskIndex !== -1) {
                        tasks[taskIndex].completed = body?.completed !== undefined ? body.completed : !tasks[taskIndex].completed;
                        localStorage.setItem("jara_tasks", JSON.stringify(tasks));
                        const icon = tasks[taskIndex].completed ? "✅" : "🔄";
                        const statusMsg = tasks[taskIndex].completed ? "ditandai selesai" : "dibuka kembali";
                        this.addFallbackActivity(tasks[taskIndex].projectId, `Tugas '${tasks[taskIndex].title}' ${statusMsg}`, icon);
                        return { success: true, data: tasks[taskIndex] };
                    }
                }

                if (method === "PUT") {
                    if (taskIndex !== -1) {
                        tasks[taskIndex] = { ...tasks[taskIndex], ...body };
                        localStorage.setItem("jara_tasks", JSON.stringify(tasks));
                        this.addFallbackActivity(tasks[taskIndex].projectId, `Detail tugas '${tasks[taskIndex].title}' diperbarui`, "⏱️");
                        return { success: true, data: tasks[taskIndex] };
                    }
                }

                if (method === "DELETE") {
                    const taskToDelete = tasks.find(t => t.id === id);
                    tasks = tasks.filter(t => t.id !== id);
                    localStorage.setItem("jara_tasks", JSON.stringify(tasks));
                    if (taskToDelete) {
                        this.addFallbackActivity(taskToDelete.projectId, `Tugas '${taskToDelete.title}' dihapus dari daftar`, "🗑️");
                    }
                    return { success: true, message: "Tugas berhasil dihapus." };
                }
            }
        }

        // 4. [SRS-03] Collaboration Endpoints Fallback
        const projMatch = endpoint.match(/\/projects\/(\d+)/);
        if (projMatch) {
            const projectId = parseInt(projMatch[1], 10);
            let members = JSON.parse(localStorage.getItem(`jara_members_${projectId}`) || "[]");

            if (endpoint.endsWith("/members") && method === "GET") {
                return { success: true, data: members };
            }

            if (endpoint.endsWith("/invite") && method === "POST") {
                const newMember = {
                    id: Date.now(),
                    name: body.name || body.email.split("@")[0],
                    email: body.email,
                    role: body.role || "Editor",
                    isOwner: body.role === "Owner"
                };
                members.push(newMember);
                localStorage.setItem(`jara_members_${projectId}`, JSON.stringify(members));
                this.addFallbackActivity(projectId, `Undangan terkirim kepada ${newMember.name} sebagai ${newMember.role}`, "📨");
                return { success: true, message: "Undangan terkirim.", data: newMember };
            }

            const removeMatch = endpoint.match(/\/members\/(\d+)/);
            if (removeMatch && method === "DELETE") {
                const userId = parseInt(removeMatch[1], 10);
                const toRemove = members.find(m => m.id === userId);
                members = members.filter(m => m.id !== userId);
                localStorage.setItem(`jara_members_${projectId}`, JSON.stringify(members));
                if (toRemove) {
                    this.addFallbackActivity(projectId, `${toRemove.name} dikeluarkan dari kolaborator proyek`, "🚪");
                }
                return { success: true, message: "Anggota berhasil dihapus." };
            }

            if (endpoint.endsWith("/progress") && method === "GET") {
                const tasks = JSON.parse(localStorage.getItem("jara_tasks") || "[]").filter(t => t.projectId == projectId);
                const total = tasks.length;
                const completed = tasks.filter(t => t.completed).length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                return {
                    success: true,
                    data: {
                        project_id: projectId,
                        total_tasks: total,
                        completed_tasks: completed,
                        percentage: percentage,
                        status_label: percentage >= 75 ? "Sesuai Target / On-Track" : (percentage >= 40 ? "Sedang Berjalan / In-Progress" : "Memerlukan Akselerasi / Behind")
                    }
                };
            }

            if (endpoint.endsWith("/activities") && method === "GET") {
                const acts = JSON.parse(localStorage.getItem(`jara_activities_${projectId}`) || "[]");
                return { success: true, data: acts };
            }
        }

        return { success: true, data: [] };
    },

    /**
     * Inisialisasi data storage default jika LocalStorage masih kosong
     */
    initFallbackStorage() {
        if (!localStorage.getItem("jara_users")) {
            localStorage.setItem("jara_users", JSON.stringify([
                { id: 1, name: "Aufaarel Mecca", email: "aufaarel@jara.local", role: "admin", status: "active", joined: "2026-09-01" },
                { id: 2, name: "Rafa Azlan", email: "rafa@jara.local", role: "admin", status: "active", joined: "2026-09-02" },
                { id: 3, name: "Siti Rahmawati", email: "siti.rahma@jara.local", role: "member", status: "active", joined: "2026-09-04" },
                { id: 4, name: "Dimas Pratama", email: "dimas.p@jara.local", role: "member", status: "active", joined: "2026-09-05" }
            ]));
        }

        if (!localStorage.getItem("jara_projects")) {
            localStorage.setItem("jara_projects", JSON.stringify([
                { id: 1, title: "Pengembangan Modul JARA", description: "Implementasi 3 modul fungsional SRS untuk sistem pendaftaran praktikum", owner: { id: 1, name: "Aufaarel Mecca" } },
                { id: 2, title: "Laporan Akhir & Dokumentasi", description: "Penyusunan bab 1-5 laporan proyek rekayasa perangkat lunak", owner: { id: 1, name: "Aufaarel Mecca" } }
            ]));
        }

        if (!localStorage.getItem("jara_tasks")) {
            localStorage.setItem("jara_tasks", JSON.stringify([
                { id: 1, projectId: 1, title: "Konfigurasi skema database Laravel & migrasi", description: "Membuat tabel users, projects, tasks.", priority: "Urgent", deadline: "2026-09-10", completed: true },
                { id: 2, projectId: 1, title: "Implementasi antarmuka manajemen user (SRS-01)", description: "Menyusun tabel pengguna dan modal form.", priority: "High", deadline: "2026-09-12", completed: true },
                { id: 3, projectId: 1, title: "Membuat endpoint REST API untuk CRUD Task (SRS-02)", description: "Membangun controller task dan validasi.", priority: "Medium", deadline: "2026-09-15", completed: false },
                { id: 4, projectId: 1, title: "Kalkulasi progres otomatis & feed riwayat (SRS-03)", description: "Menghitung persentase ketercapaian target.", priority: "Urgent", deadline: "2026-09-18", completed: false },
                { id: 5, projectId: 2, title: "Penyusunan bab 2 dokumen spesifikasi kebutuhan perangkat lunak", description: "Menuliskan rincian kebutuhan.", priority: "Low", deadline: "2026-09-20", completed: false }
            ]));
        }

        if (!localStorage.getItem("jara_members_1")) {
            localStorage.setItem("jara_members_1", JSON.stringify([
                { id: 1, name: "Aufaarel Mecca", email: "aufaarel@jara.local", role: "Owner", isOwner: true },
                { id: 2, name: "Rafa Azlan", email: "rafa@jara.local", role: "Editor", isOwner: false },
                { id: 3, name: "Siti Rahmawati", email: "siti.rahma@jara.local", role: "Editor", isOwner: false },
                { id: 4, name: "Dimas Pratama", email: "dimas.p@jara.local", role: "Viewer", isOwner: false }
            ]));
        }

        if (!localStorage.getItem("jara_activities_1")) {
            localStorage.setItem("jara_activities_1", JSON.stringify([
                { id: 1, text: "Aufaarel Mecca menandai tugas 'Konfigurasi skema database Laravel & migrasi' selesai", time: "10 menit yang lalu", icon: "✅" },
                { id: 2, text: "Rafa Azlan mengundang Dimas Pratama ke proyek ini sebagai Viewer", time: "30 menit yang lalu", icon: "📨" },
                { id: 3, text: "Siti Rahmawati memperbarui deadline tugas 'Membuat endpoint REST API'", time: "1 jam yang lalu", icon: "⏱️" }
            ]));
        }
    },

    /**
     * Helper mencatat aktivitas ke fallback storage
     */
    addFallbackActivity(projectId, text, icon = "📌") {
        const key = `jara_activities_${projectId || 1}`;
        let acts = JSON.parse(localStorage.getItem(key) || "[]");
        acts.unshift({
            id: Date.now(),
            text: text,
            time: "Baru saja",
            icon: icon
        });
        localStorage.setItem(key, JSON.stringify(acts.slice(0, 15)));
    }
};

// Pasang ke window object
if (typeof window !== "undefined") {
    window.AppConfig = AppConfig;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = AppConfig;
}
