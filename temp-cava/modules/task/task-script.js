/**
 * =============================================================================
 * File: modules/task/task-script.js
 * Module: SRS-02 Task & Project Management
 * Programmer: Programmer 2
 * Branch: feature/srs-02-task-management
 * -----------------------------------------------------------------------------
 * Deskripsi:
 * Mengelola logika interaksi UI untuk manajemen tugas:
 * - Menampilkan daftar tugas dengan badge prioritas dan tenggat waktu
 * - Membuat tugas baru dan menambahkannya ke daftar
 * - Menandai status penyelesaian tugas (toggle complete)
 * - Menghapus tugas dari daftar
 * - Memfilter tugas berdasarkan status (Semua, Belum Selesai, Selesai)
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("[SRS-02 Task] Script initialized.");

    // Initial default task dataset
    let tasks = [
        { id: 1, title: "Konfigurasi skema database Laravel & migrasi", priority: "Urgent", deadline: "2026-09-10", completed: true, projectId: 1 },
        { id: 2, title: "Implementasi antarmuka manajemen user (SRS-01)", priority: "High", deadline: "2026-09-12", completed: false, projectId: 1 },
        { id: 3, title: "Membuat endpoint REST API untuk CRUD Task", priority: "Medium", deadline: "2026-09-15", completed: false, projectId: 1 },
        { id: 4, title: "Penyusunan bab 2 dokumen spesifikasi kebutuhan perangkat lunak", priority: "Low", deadline: "2026-09-20", completed: false, projectId: 2 }
    ];

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

    // Default tanggal deadline form = Besok
    const inputDeadline = document.getElementById("task-input-deadline");
    if (inputDeadline) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        inputDeadline.value = tomorrow.toISOString().split("T")[0];
    }

    /**
     * Render daftar tugas ke dalam DOM
     */
    function renderTasks() {
        if (!taskContainer) return;
        taskContainer.innerHTML = "";

        // Hitung statistik counter
        const allTotal = tasks.length;
        const pendingTotal = tasks.filter(t => !t.completed).length;
        const completedTotal = tasks.filter(t => t.completed).length;

        if (countAll) countAll.innerText = allTotal;
        if (countPending) countPending.innerText = pendingTotal;
        if (countCompleted) countCompleted.innerText = completedTotal;

        // Terapkan filter
        let filtered = tasks.filter(t => {
            if (currentFilter === "pending") return !t.completed;
            if (currentFilter === "completed") return t.completed;
            return true;
        });

        // Terapkan sorting
        filtered.sort((a, b) => {
            if (currentSort === "deadline") {
                return new Date(a.deadline) - new Date(b.deadline);
            } else if (currentSort === "priority") {
                const weight = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
                return weight[b.priority] - weight[a.priority];
            } else {
                return b.id - a.id;
            }
        });

        if (filtered.length === 0) {
            taskContainer.innerHTML = `
                <div class="card" style="text-align: center; color: var(--color-text-muted); padding: 2.5rem;">
                    Belum ada tugas pada kategori ini.
                </div>
            `;
            return;
        }

        filtered.forEach(task => {
            const item = document.createElement("div");
            item.className = `task-item priority-${task.priority} ${task.completed ? "completed" : ""}`;

            const priorityBadge = `<span class="badge badge-priority-${task.priority}">${task.priority}</span>`;
            
            item.innerHTML = `
                <div class="task-left">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} onchange="toggleTask(${task.id})">
                    <div class="task-details">
                        <span class="task-title">${escapeHtml(task.title)}</span>
                        <div class="task-meta">
                            ${priorityBadge}
                            <span class="deadline-badge">📅 Tenggat: ${task.deadline}</span>
                        </div>
                    </div>
                </div>
                <div class="task-right">
                    <button class="btn btn-secondary btn-sm" onclick="deleteTask(${task.id})">🗑️</button>
                </div>
            `;
            taskContainer.appendChild(item);
        });
    }

    /**
     * Toggle status penyelesaian tugas
     * @param {number} taskId 
     */
    window.toggleTask = function(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        task.completed = !task.completed;
        renderTasks();

        if (window.showToast) {
            const msg = task.completed ? `Tugas "${task.title}" ditandai selesai!` : `Tugas "${task.title}" dibuka kembali.`;
            window.showToast(msg, task.completed ? "success" : "info");
        }
    };

    /**
     * Hapus tugas berdasarkan ID
     * @param {number} taskId 
     */
    window.deleteTask = function(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        if (confirm(`Hapus tugas "${task.title}"?`)) {
            tasks = tasks.filter(t => t.id !== taskId);
            renderTasks();
            if (window.showToast) {
                window.showToast("Tugas berhasil dihapus.", "danger");
            }
        }
    };

    /**
     * Submit pembuatan tugas baru
     */
    formCreateTask?.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputTitle = document.getElementById("task-input-title");
        const inputPriority = document.getElementById("task-input-priority");
        const inputDeadline = document.getElementById("task-input-deadline");

        const newTask = {
            id: Date.now(),
            title: inputTitle.value.trim(),
            priority: inputPriority.value,
            deadline: inputDeadline.value,
            completed: false,
            projectId: 1
        };

        tasks.unshift(newTask);
        renderTasks();
        inputTitle.value = "";

        if (window.showToast) {
            window.showToast(`Tugas "${newTask.title}" berhasil dibuat!`, "success");
        }
    });

    /**
     * Handler navigasi filter tab
     */
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            renderTasks();
        });
    });

    /**
     * Handler sortir
     */
    sortSelect?.addEventListener("change", (e) => {
        currentSort = e.target.value;
        renderTasks();
    });

    // Escape HTML helper
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.innerText = text;
        return div.innerHTML;
    }

    // Initial render
    renderTasks();
});
