/**
 * =============================================================================
 * File: modules/task/task-script.js
 * Module: SRS-02 Task & Project Management
 * Programmer: Programmer 2
 * Branch: fix/srs01-03
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Mengelola logika interaksi UI dan komunikasi API untuk manajemen tugas:
 * [SRS-02-01] Mengambil daftar proyek dari API, berpindah antar proyek, dan menambah proyek baru.
 * [SRS-02-02] Membuat tugas baru lengkap dengan skala prioritas dan tanggal deadline.
 * [SRS-02-03] Menandai status penyelesaian tugas (toggle complete) secara interaktif.
 * [SRS-02-04] Memfilter tugas (Semua, Belum Selesai, Selesai) dan mengurutkan secara dinamis.
 * [SRS-02-05] Memperbarui isi tugas (Edit Modal) dan menghapus tugas yang tidak lagi relevan.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("[SRS-02 Task] Script initialized with full API integration.");

    // State data lokal
    let tasks = [];
    let projects = [];
    let currentProjectId = "all";
    let currentFilter = "all";
    let currentSort = "deadline";

    // Elemen DOM
    const taskContainer = document.getElementById("task-items-container");
    const formCreateTask = document.getElementById("form-create-task");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const sortSelect = document.getElementById("sort-select");
    const countAll = document.getElementById("count-all");
    const countPending = document.getElementById("count-pending");
    const countCompleted = document.getElementById("count-completed");
    const projectNav = document.getElementById("project-list-nav");
    const projectTitleElem = document.getElementById("current-project-title");
    const projectDescElem = document.getElementById("current-project-desc");

    // Elemen Modal Proyek
    const projectModal = document.getElementById("project-modal");
    const btnOpenProjectModal = document.getElementById("btn-open-project-modal");
    const btnCloseProjectModal = document.getElementById("btn-close-project-modal");
    const btnCancelProjectModal = document.getElementById("btn-cancel-project-modal");
    const formCreateProject = document.getElementById("form-create-project");

    // Elemen Modal Edit Tugas
    const editModal = document.getElementById("edit-task-modal");
    const btnCloseEditModal = document.getElementById("btn-close-edit-modal");
    const btnCancelEditModal = document.getElementById("btn-cancel-edit-modal");
    const formEditTask = document.getElementById("form-edit-task");

    // Set nilai default tenggat waktu form = Besok
    const inputDeadline = document.getElementById("task-input-deadline");
    if (inputDeadline) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        inputDeadline.value = tomorrow.toISOString().split("T")[0];
    }

    /**
     * [SRS-02-01] Memuat daftar proyek dari backend API.
     */
    async function loadProjects() {
        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.task.projects);
            if (response && response.success) {
                projects = response.data;
                renderProjectsNav();
            }
        } catch (error) {
            console.error("[SRS-02 Error] Gagal memuat daftar proyek:", error);
        }
    }

    /**
     * [SRS-02-01] Merender navigasi daftar proyek di sidebar.
     */
    function renderProjectsNav() {
        if (!projectNav) return;
        projectNav.innerHTML = `
            <a href="#" class="${currentProjectId === 'all' ? 'active' : ''}" data-project-id="all">
                <span>📁</span> Semua Project
            </a>
        `;

        projects.forEach(p => {
            const a = document.createElement("a");
            a.href = "#";
            a.className = currentProjectId == p.id ? "active" : "";
            a.setAttribute("data-project-id", p.id);
            a.innerHTML = `<span>🚀</span> ${escapeHtml(p.title)}`;
            projectNav.appendChild(a);
        });

        // Event listener klik ganti proyek
        projectNav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                currentProjectId = link.getAttribute("data-project-id");
                projectNav.querySelectorAll("a").forEach(l => l.classList.remove("active"));
                link.classList.add("active");

                // Perbarui judul halaman
                if (currentProjectId === "all") {
                    if (projectTitleElem) projectTitleElem.innerText = "Kelola Tugas & Proyek";
                    if (projectDescElem) projectDescElem.innerText = "Susun tugas, tentukan skala prioritas, dan pantau status pengerjaan.";
                } else {
                    const selProj = projects.find(p => p.id == currentProjectId);
                    if (selProj) {
                        if (projectTitleElem) projectTitleElem.innerText = `Proyek: ${selProj.title}`;
                        if (projectDescElem) projectDescElem.innerText = selProj.description || "Daftar tugas dalam proyek ini.";
                    }
                }

                loadTasks();
            });
        });
    }

    /**
     * [SRS-02-04] Memuat daftar tugas dari API dengan filter dan sorting aktif.
     */
    async function loadTasks() {
        try {
            const params = new URLSearchParams({
                project_id: currentProjectId,
                status: currentFilter,
                sort: currentSort
            });
            const endpoint = `${window.AppConfig.endpoints.task.tasks}?${params.toString()}`;
            const response = await window.AppConfig.request(endpoint);

            if (response && response.success) {
                tasks = response.data;
                if (response.meta) {
                    if (countAll) countAll.innerText = response.meta.count_all;
                    if (countPending) countPending.innerText = response.meta.count_pending;
                    if (countCompleted) countCompleted.innerText = response.meta.count_completed;
                }
                renderTasks(tasks);
            }
        } catch (error) {
            console.error("[SRS-02 Error] Gagal memuat daftar tugas:", error);
            if (window.showToast) {
                window.showToast("Gagal memuat tugas dari server.", "danger");
            }
        }
    }

    /**
     * [SRS-02-03 & SRS-02-05] Merender kartu tugas ke dalam container DOM.
     *
     * @param {Array} taskList 
     */
    function renderTasks(taskList) {
        if (!taskContainer) return;
        taskContainer.innerHTML = "";

        if (!taskList || taskList.length === 0) {
            taskContainer.innerHTML = `
                <div class="card" style="text-align: center; color: var(--color-text-muted); padding: 2.5rem;">
                    Belum ada tugas pada kategori ini.
                </div>
            `;
            return;
        }

        taskList.forEach(task => {
            const item = document.createElement("div");
            item.className = `task-item priority-${task.priority} ${task.completed ? "completed" : ""}`;

            const priorityBadge = `<span class="badge badge-priority-${task.priority}">${task.priority}</span>`;
            const projectBadge = task.projectTitle ? `<span class="badge badge-secondary" style="font-size: 0.75rem;">📁 ${escapeHtml(task.projectTitle)}</span>` : "";

            item.innerHTML = `
                <div class="task-left">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} onchange="toggleTask(${task.id})">
                    <div class="task-details">
                        <span class="task-title">${escapeHtml(task.title)}</span>
                        ${task.description ? `<p style="font-size: 0.85rem; color: var(--color-text-muted); margin: 0.2rem 0;">${escapeHtml(task.description)}</p>` : ""}
                        <div class="task-meta">
                            ${priorityBadge}
                            ${projectBadge}
                            <span class="deadline-badge">📅 Tenggat: ${task.deadline || "-"}</span>
                        </div>
                    </div>
                </div>
                <div class="task-right">
                    <button class="btn btn-secondary btn-sm" onclick="openEditTaskModal(${task.id})" title="Edit Rincian Tugas">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})" title="Hapus Tugas">🗑️</button>
                </div>
            `;
            taskContainer.appendChild(item);
        });
    }

    /**
     * [SRS-02-02] Handler submit pembuatan tugas baru.
     */
    formCreateTask?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const inputTitle = document.getElementById("task-input-title");
        const inputPriority = document.getElementById("task-input-priority");
        const inputDeadlineField = document.getElementById("task-input-deadline");

        const targetProjId = currentProjectId !== "all" ? parseInt(currentProjectId, 10) : (projects[0]?.id || 1);

        const payload = {
            project_id: targetProjId,
            title: inputTitle.value.trim(),
            priority: inputPriority.value,
            deadline: inputDeadlineField.value
        };

        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.task.createTask, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (response && response.success) {
                inputTitle.value = "";
                await loadTasks();
                if (window.showToast) {
                    window.showToast(`Tugas "${payload.title}" berhasil ditambahkan!`, "success");
                }
            }
        } catch (error) {
            console.error("[SRS-02 Error] Gagal membuat tugas:", error);
            if (window.showToast) {
                window.showToast(error.message || "Gagal membuat tugas.", "danger");
            }
        }
    });

    /**
     * [SRS-02-03] Toggle status penyelesaian tugas (selesai / buka kembali).
     *
     * @param {number} taskId 
     */
    window.toggleTask = async function(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newCompleted = !task.completed;
        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.task.toggleStatus(taskId), {
                method: "PATCH",
                body: JSON.stringify({ completed: newCompleted })
            });

            if (response && response.success) {
                await loadTasks();
                if (window.showToast) {
                    const msg = newCompleted ? `Tugas "${task.title}" ditandai selesai!` : `Tugas "${task.title}" dibuka kembali.`;
                    window.showToast(msg, newCompleted ? "success" : "info");
                }
            }
        } catch (error) {
            console.error("[SRS-02 Error] Gagal toggle tugas:", error);
            if (window.showToast) {
                window.showToast("Gagal mengubah status tugas.", "danger");
            }
        }
    };

    /**
     * [SRS-02-05] Membuka modal edit tugas dan mengisi form dengan data yang ada.
     *
     * @param {number} taskId 
     */
    window.openEditTaskModal = function(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        document.getElementById("edit-task-id").value = task.id;
        document.getElementById("edit-task-title").value = task.title;
        document.getElementById("edit-task-desc").value = task.description || "";
        document.getElementById("edit-task-priority").value = task.priority;
        document.getElementById("edit-task-deadline").value = task.deadline || "";

        editModal?.classList.add("active");
    };

    /**
     * [SRS-02-05] Handler submit pembaruan tugas.
     */
    formEditTask?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-task-id").value;
        const payload = {
            title: document.getElementById("edit-task-title").value.trim(),
            description: document.getElementById("edit-task-desc").value.trim(),
            priority: document.getElementById("edit-task-priority").value,
            deadline: document.getElementById("edit-task-deadline").value
        };

        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.task.updateTask(id), {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            if (response && response.success) {
                editModal?.classList.remove("active");
                await loadTasks();
                if (window.showToast) {
                    window.showToast("Rincian tugas berhasil diperbarui.", "success");
                }
            }
        } catch (error) {
            console.error("[SRS-02 Error] Gagal edit tugas:", error);
            if (window.showToast) {
                window.showToast("Gagal memperbarui tugas.", "danger");
            }
        }
    });

    /**
     * [SRS-02-05] Menghapus tugas dengan dialog konfirmasi pengaman.
     *
     * @param {number} taskId 
     */
    window.deleteTask = async function(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        if (confirm(`Apakah Anda yakin ingin menghapus tugas "${task.title}"?`)) {
            try {
                const response = await window.AppConfig.request(window.AppConfig.endpoints.task.deleteTask(taskId), {
                    method: "DELETE"
                });

                if (response && response.success) {
                    await loadTasks();
                    if (window.showToast) {
                        window.showToast(`Tugas "${task.title}" berhasil dihapus.`, "danger");
                    }
                }
            } catch (error) {
                console.error("[SRS-02 Error] Gagal menghapus tugas:", error);
                if (window.showToast) {
                    window.showToast("Gagal menghapus tugas.", "danger");
                }
            }
        }
    };

    /**
     * [SRS-02-01] Handler submit pembuatan proyek baru.
     */
    formCreateProject?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const titleInput = document.getElementById("project-input-title");
        const descInput = document.getElementById("project-input-desc");

        const payload = {
            title: titleInput.value.trim(),
            description: descInput.value.trim()
        };

        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.task.createProject, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (response && response.success) {
                formCreateProject.reset();
                projectModal?.classList.remove("active");
                await loadProjects();
                if (window.showToast) {
                    window.showToast(`Proyek "${payload.title}" berhasil dibuat!`, "success");
                }
            }
        } catch (error) {
            console.error("[SRS-02 Error] Gagal membuat proyek:", error);
            if (window.showToast) {
                window.showToast(error.message || "Gagal membuat proyek.", "danger");
            }
        }
    });

    // Kontrol Navigasi Filter Status
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            loadTasks();
        });
    });

    // Kontrol Sorting Dropdown
    sortSelect?.addEventListener("change", (e) => {
        currentSort = e.target.value;
        loadTasks();
    });

    // Kontrol Modal Proyek & Edit
    btnOpenProjectModal?.addEventListener("click", () => projectModal?.classList.add("active"));
    btnCloseProjectModal?.addEventListener("click", () => projectModal?.classList.remove("active"));
    btnCancelProjectModal?.addEventListener("click", () => projectModal?.classList.remove("active"));

    btnCloseEditModal?.addEventListener("click", () => editModal?.classList.remove("active"));
    btnCancelEditModal?.addEventListener("click", () => editModal?.classList.remove("active"));

    // Helper sanitasi teks
    function escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.innerText = text;
        return div.innerHTML;
    }

    // Inisialisasi awal
    loadProjects();
    loadTasks();
});
