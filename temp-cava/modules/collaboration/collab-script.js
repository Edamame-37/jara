/**
 * =============================================================================
 * File: modules/collaboration/collab-script.js
 * Module: SRS-03 Collaboration & Progress Tracking
 * Programmer: Programmer 3
 * Branch: feature/srs-03-collaboration
 * -----------------------------------------------------------------------------
 * Deskripsi:
 * Mengelola logika interaksi UI untuk kolaborasi tim dan tracking progres:
 * - Menghitung dan memperbarui persentase progres penyelesaian tugas
 * - Menampilkan daftar anggota proyek dengan perannya
 * - Mengundang anggota baru melalui formulir modal
 * - Menghapus anggota dari proyek kolaborasi
 * - Menampilkan log aktivitas real-time kolaborasi
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("[SRS-03 Collab] Script initialized.");

    // Data Anggota Awal
    let members = [
        { id: 1, name: "Aufaarel Mecca", email: "aufaarel@jara.local", role: "Owner", isOwner: true },
        { id: 2, name: "Rafa Azlan", email: "rafa@jara.local", role: "Editor", isOwner: false },
        { id: 3, name: "Siti Rahmawati", email: "siti.rahma@jara.local", role: "Editor", isOwner: false },
        { id: 4, name: "Dimas Pratama", email: "dimas.p@jara.local", role: "Viewer", isOwner: false }
    ];

    // Data Progres Statistik
    let progressStats = {
        totalTasks: 12,
        completedTasks: 9
    };

    // Data Log Aktivitas
    let activities = [
        { id: 1, text: "Aufaarel Mecca menandai 'Konfigurasi skema database Laravel' selesai", time: "10 menit yang lalu", icon: "✅" },
        { id: 2, text: "Rafa Azlan mengundang Dimas Pratama ke proyek ini", time: "30 menit yang lalu", icon: "📨" },
        { id: 3, text: "Siti Rahmawati memperbarui deadline tugas 'Implementasi UI'", time: "1 jam yang lalu", icon: "⏱️" }
    ];

    // Elemen DOM
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
     * Hitung dan render metrik progres proyek
     */
    function updateProgressUI() {
        const percentage = progressStats.totalTasks > 0 
            ? Math.round((progressStats.completedTasks / progressStats.totalTasks) * 100) 
            : 0;

        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (percentageText) percentageText.innerText = `${percentage}%`;
        if (metricTasks) metricTasks.innerText = `${progressStats.completedTasks} dari ${progressStats.totalTasks} tugas selesai`;
        if (metricStatus) {
            metricStatus.innerText = percentage >= 75 
                ? "Status: Sangat Baik / On-Track" 
                : (percentage >= 40 ? "Status: Sedang Berjalan" : "Status: Memerlukan Akselerasi");
        }
    }

    /**
     * Render daftar anggota kolaborasi
     */
    function renderMembers() {
        if (!membersContainer) return;
        membersContainer.innerHTML = "";

        members.forEach(member => {
            const card = document.createElement("div");
            card.className = "member-card";

            const initials = member.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
            const roleBadge = member.isOwner 
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
                    ${!member.isOwner ? `<button class="btn btn-secondary btn-sm" onclick="removeMember(${member.id})">✕</button>` : ""}
                </div>
            `;
            membersContainer.appendChild(card);
        });
    }

    /**
     * Render daftar log aktivitas
     */
    function renderActivities() {
        if (!activityContainer) return;
        activityContainer.innerHTML = "";

        activities.forEach(act => {
            const item = document.createElement("div");
            item.className = "activity-item";
            item.innerHTML = `
                <span class="activity-icon">${act.icon}</span>
                <div style="flex: 1;">
                    <div>${escapeHtml(act.text)}</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-light); margin-top: 0.2rem;">${act.time}</div>
                </div>
            `;
            activityContainer.appendChild(item);
        });
    }

    /**
     * Submit formulir undang anggota
     */
    formInviteMember?.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputName = document.getElementById("invite-input-name");
        const inputEmail = document.getElementById("invite-input-email");
        const inputRole = document.getElementById("invite-input-role");

        const newMember = {
            id: Date.now(),
            name: inputName.value.trim(),
            email: inputEmail.value.trim(),
            role: inputRole.value,
            isOwner: false
        };

        members.push(newMember);
        renderMembers();

        // Tambahkan ke log aktivitas
        activities.unshift({
            id: Date.now(),
            text: `Undangan terkirim kepada ${newMember.name} sebagai ${newMember.role}`,
            time: "Baru saja",
            icon: "📨"
        });
        renderActivities();

        formInviteMember.reset();
        closeModal();

        if (window.showToast) {
            window.showToast(`Undangan berhasil dikirim ke ${newMember.email}!`, "success");
        }
    });

    /**
     * Hapus anggota dari proyek
     * @param {number} memberId 
     */
    window.removeMember = function(memberId) {
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        if (confirm(`Keluarkan ${member.name} dari proyek ini?`)) {
            members = members.filter(m => m.id !== memberId);
            renderMembers();

            activities.unshift({
                id: Date.now(),
                text: `${member.name} dikeluarkan dari kolaborator proyek`,
                time: "Baru saja",
                icon: "🚪"
            });
            renderActivities();

            if (window.showToast) {
                window.showToast(`${member.name} telah dikeluarkan dari proyek.`, "warning");
            }
        }
    };

    // Kontrol Modal
    function openModal() { inviteModal.style.display = "flex"; }
    function closeModal() { inviteModal.style.display = "none"; }

    btnOpenInviteModal?.addEventListener("click", openModal);
    btnCloseInviteModal?.addEventListener("click", closeModal);
    btnCancelInviteModal?.addEventListener("click", closeModal);

    // Escape HTML helper
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.innerText = text;
        return div.innerHTML;
    }

    // Inisialisasi tampilan
    updateProgressUI();
    renderMembers();
    renderActivities();
});
