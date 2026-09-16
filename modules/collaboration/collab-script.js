/**
 * =============================================================================
 * File: modules/collaboration/collab-script.js
 * Module: SRS-03 Collaboration & Progress Tracking
 * Programmer: Programmer 3
 * Branch: fix/srs01-03
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Mengelola logika interaksi UI untuk kolaborasi tim dan pemantauan metrik progres:
 * [SRS-03-01] Mengundang anggota kolaborator baru via formulir modal.
 * [SRS-03-02] Menampilkan daftar anggota, hak akses (Owner, Editor, Viewer), serta mengeluarkan anggota.
 * [SRS-03-03] Menghitung persentase progres secara otomatis berdasarkan formula:
 *             Progres (%) = (Jumlah Tugas Selesai / Total Seluruh Tugas) * 100%
 * [SRS-03-04] Menampilkan visualisasi status pencapaian target (Sesuai Target, Sedang Dikerjakan, dll.)
 * [SRS-03-05] Menyajikan feed rekam jejak log aktivitas kolaborasi terkini.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("[SRS-03 Collab] Script initialized with dynamic progress calculation.");

    // State Lokal Modul
    let currentProjectId = 1;
    let projects = [];
    let members = [];
    let activities = [];

    // Elemen DOM
    const projectNav = document.getElementById("collab-project-nav");
    const projectTitle = document.getElementById("collab-project-title");
    const projectDesc = document.getElementById("collab-project-desc");
    const membersContainer = document.getElementById("members-list-container");
    const activityContainer = document.getElementById("activity-timeline-container");
    const progressFill = document.getElementById("collab-progress-fill");
    const percentageText = document.getElementById("collab-percentage-text");
    const metricTasks = document.getElementById("collab-metric-tasks");
    const metricStatus = document.getElementById("collab-metric-status");

    // Elemen Modal Undangan
    const inviteModal = document.getElementById("invite-modal");
    const btnOpenInviteModal = document.getElementById("btn-open-invite-modal");
    const btnCloseInviteModal = document.getElementById("btn-close-invite-modal");
    const btnCancelInviteModal = document.getElementById("btn-cancel-invite-modal");
    const formInviteMember = document.getElementById("form-invite-member");

    /**
     * Memuat seluruh proyek untuk navigasi sidebar modul kolaborasi
     */
    async function loadProjects() {
        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.task.projects);
            if (response && response.success && response.data.length > 0) {
                projects = response.data;
                currentProjectId = projects[0].id;
                renderProjectNav();
                await loadProjectData(currentProjectId);
            }
        } catch (error) {
            console.error("[SRS-03 Error] Gagal memuat daftar proyek:", error);
        }
    }

    /**
     * Merender navigasi proyek di sidebar
     */
    function renderProjectNav() {
        if (!projectNav) return;
        projectNav.innerHTML = "";

        projects.forEach(p => {
            const a = document.createElement("a");
            a.href = "#";
            a.className = currentProjectId === p.id ? "active" : "";
            a.setAttribute("data-id", p.id);
            a.innerHTML = `<span>📁</span> ${escapeHtml(p.title)}`;
            a.addEventListener("click", (e) => {
                e.preventDefault();
                currentProjectId = p.id;
                projectNav.querySelectorAll("a").forEach(l => l.classList.remove("active"));
                a.classList.add("active");
                loadProjectData(currentProjectId);
            });
            projectNav.appendChild(a);
        });
    }

    /**
     * Memuat seluruh data terkait proyek yang dipilih (Progres, Anggota, Aktivitas)
     *
     * @param {number} projectId 
     */
    async function loadProjectData(projectId) {
        const curProj = projects.find(p => p.id === projectId);
        if (curProj) {
            if (projectTitle) projectTitle.innerText = `Progres Proyek: ${curProj.title}`;
            if (projectDesc) projectDesc.innerText = curProj.description || "Pemantauan persentase penyelesaian tugas secara real-time.";
        }

        await Promise.all([
            loadProgress(projectId),
            loadMembers(projectId),
            loadActivities(projectId)
        ]);
    }

    /**
     * [SRS-03-03 & SRS-03-04] Mengambil dan merender metrik kalkulasi progres penyelesaian proyek.
     * Rumus: (Tugas Selesai / Total Tugas) * 100%
     *
     * @param {number} projectId 
     */
    async function loadProgress(projectId) {
        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.collaboration.progress(projectId));
            if (response && response.success && response.data) {
                const data = response.data;
                const percentage = data.percentage || 0;

                if (progressFill) progressFill.style.width = `${percentage}%`;
                if (percentageText) percentageText.innerText = `${percentage}%`;
                if (metricTasks) metricTasks.innerText = `${data.completed_tasks} dari ${data.total_tasks} tugas selesai`;
                if (metricStatus) metricStatus.innerText = `Status: ${data.status_label}`;
            }
        } catch (error) {
            console.error("[SRS-03 Error] Gagal memuat data progres:", error);
        }
    }

    /**
     * [SRS-03-01 & SRS-03-02] Mengambil dan merender daftar anggota kolaborator proyek.
     *
     * @param {number} projectId 
     */
    async function loadMembers(projectId) {
        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.collaboration.members(projectId));
            if (response && response.success) {
                members = response.data;
                renderMembers(members);
            }
        } catch (error) {
            console.error("[SRS-03 Error] Gagal memuat anggota:", error);
        }
    }

    /**
     * [SRS-03-02] Merender kartu anggota kolaborator ke dalam grid.
     *
     * @param {Array} memberList 
     */
    function renderMembers(memberList) {
        if (!membersContainer) return;
        membersContainer.innerHTML = "";

        if (!memberList || memberList.length === 0) {
            membersContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--color-text-muted); padding: 2rem;">
                    Belum ada anggota kolaborator terdaftar pada proyek ini.
                </div>
            `;
            return;
        }

        memberList.forEach(member => {
            const card = document.createElement("div");
            card.className = "member-card";

            const initials = member.name ? member.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "U";
            const roleBadge = member.isOwner || member.role === "Owner"
                ? `<span class="badge badge-warning">Owner</span>`
                : (member.role === "Editor" ? `<span class="badge badge-info">Editor</span>` : `<span class="badge badge-secondary">Viewer</span>`);

            card.innerHTML = `
                <div class="member-meta">
                    <div class="member-avatar ${member.isOwner ? "owner" : ""}">${initials}</div>
                    <div>
                        <div class="member-name">${escapeHtml(member.name)}</div>
                        <div class="member-role">${escapeHtml(member.email)}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${roleBadge}
                    ${!member.isOwner ? `<button class="btn btn-secondary btn-sm" onclick="removeMember(${member.id})" title="Keluarkan Anggota">✕</button>` : ""}
                </div>
            `;
            membersContainer.appendChild(card);
        });
    }

    /**
     * [SRS-03-05] Mengambil dan merender feed log riwayat aktivitas kolaboratif.
     *
     * @param {number} projectId 
     */
    async function loadActivities(projectId) {
        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.collaboration.activities(projectId));
            if (response && response.success) {
                activities = response.data;
                renderActivities(activities);
            }
        } catch (error) {
            console.error("[SRS-03 Error] Gagal memuat aktivitas:", error);
        }
    }

    /**
     * Merender item aktivitas ke timeline container
     *
     * @param {Array} activityList 
     */
    function renderActivities(activityList) {
        if (!activityContainer) return;
        activityContainer.innerHTML = "";

        if (!activityList || activityList.length === 0) {
            activityContainer.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: 1.5rem;">
                    Belum ada riwayat aktivitas tercatat.
                </div>
            `;
            return;
        }

        activityList.forEach(act => {
            const item = document.createElement("div");
            item.className = "activity-item";
            item.innerHTML = `
                <span class="activity-icon">${act.icon || "📌"}</span>
                <div style="flex: 1;">
                    <div>${escapeHtml(act.text)}</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-light); margin-top: 0.2rem;">${act.time}</div>
                </div>
            `;
            activityContainer.appendChild(item);
        });
    }

    /**
     * [SRS-03-01] Handler submit formulir undang anggota kolaborator baru.
     */
    formInviteMember?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const inputName = document.getElementById("invite-input-name");
        const inputEmail = document.getElementById("invite-input-email");
        const inputRole = document.getElementById("invite-input-role");

        const payload = {
            name: inputName.value.trim(),
            email: inputEmail.value.trim(),
            role: inputRole.value
        };

        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.collaboration.inviteMember(currentProjectId), {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (response && response.success) {
                formInviteMember.reset();
                inviteModal?.classList.remove("active");
                await loadMembers(currentProjectId);
                await loadActivities(currentProjectId);
                if (window.showToast) {
                    window.showToast(`Undangan berhasil dikirim ke ${payload.email}!`, "success");
                }
            }
        } catch (error) {
            console.error("[SRS-03 Error] Gagal undang anggota:", error);
            if (window.showToast) {
                window.showToast(error.message || "Gagal mengundang anggota.", "danger");
            }
        }
    });

    /**
     * [SRS-03-02] Mengeluarkan anggota dari tim proyek kolaborasi.
     *
     * @param {number} memberId 
     */
    window.removeMember = async function(memberId) {
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        if (confirm(`Apakah Anda yakin ingin mengeluarkan ${member.name} dari proyek ini?`)) {
            try {
                const response = await window.AppConfig.request(window.AppConfig.endpoints.collaboration.removeMember(currentProjectId, memberId), {
                    method: "DELETE"
                });

                if (response && response.success) {
                    await loadMembers(currentProjectId);
                    await loadActivities(currentProjectId);
                    if (window.showToast) {
                        window.showToast(`${member.name} telah dikeluarkan dari tim proyek.`, "warning");
                    }
                }
            } catch (error) {
                console.error("[SRS-03 Error] Gagal mengeluarkan anggota:", error);
                if (window.showToast) {
                    window.showToast("Gagal mengeluarkan anggota.", "danger");
                }
            }
        }
    };

    // Kontrol Modal Undangan
    btnOpenInviteModal?.addEventListener("click", () => inviteModal?.classList.add("active"));
    btnCloseInviteModal?.addEventListener("click", () => inviteModal?.classList.remove("active"));
    btnCancelInviteModal?.addEventListener("click", () => inviteModal?.classList.remove("active"));

    // Helper sanitasi teks
    function escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.innerText = text;
        return div.innerHTML;
    }

    // Inisialisasi awal
    loadProjects();
});
