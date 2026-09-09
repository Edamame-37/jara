/**
 * =============================================================================
 * File: modules/admin/admin-script.js
 * Module: SRS-01 Admin & User Management
 * Programmer: Programmer 1
 * Branch: feature/srs-01-admin-user
 * -----------------------------------------------------------------------------
 * Deskripsi:
 * Mengelola logika interaksi UI dan komunikasi API untuk manajemen pengguna:
 * - Mengambil dan menampilkan data pengguna dari backend/mock data
 * - Menangani form submit untuk menambah pengguna baru
 * - Menangani penghapusan pengguna dengan konfirmasi
 * - Menghitung dan memperbarui indikator statistik pengguna
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("[SRS-01 Admin] Script initialized.");

    // Data in-memory mock untuk interaktivitas instan (dapat dihubungkan ke backend Laravel via AppConfig)
    let users = [
        { id: 1, name: "Aufaarel Mecca", email: "aufaarel@jara.local", role: "admin", status: "Active", joined: "2026-09-01" },
        { id: 2, name: "Rafa Azlan", email: "rafa@jara.local", role: "admin", status: "Active", joined: "2026-09-02" },
        { id: 3, name: "Siti Rahmawati", email: "siti.rahma@jara.local", role: "member", status: "Active", joined: "2026-09-04" },
        { id: 4, name: "Dimas Pratama", email: "dimas.p@jara.local", role: "member", status: "Active", joined: "2026-09-05" }
    ];

    // Elemen DOM
    const userTableBody = document.getElementById("user-table-body");
    const statTotalUsers = document.getElementById("stat-total-users");
    const statTotalAdmins = document.getElementById("stat-total-admins");
    const statTotalMembers = document.getElementById("stat-total-members");
    const searchInput = document.getElementById("user-search");
    
    // Elemen Modal
    const userModal = document.getElementById("user-modal");
    const btnOpenModal = document.getElementById("btn-open-modal");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const btnCancelModal = document.getElementById("btn-cancel-modal");
    const formCreateUser = document.getElementById("form-create-user");

    /**
     * Memuat dan merender tabel pengguna
     * @param {Array} userList 
     */
    function renderUsers(userList) {
        if (!userTableBody) return;
        userTableBody.innerHTML = "";

        if (userList.length === 0) {
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">
                        Tidak ada pengguna ditemukan.
                    </td>
                </tr>
            `;
            return;
        }

        userList.forEach(user => {
            const tr = document.createElement("tr");
            const initials = user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
            const roleBadge = user.role === "admin" 
                ? `<span class="badge badge-success">Administrator</span>` 
                : `<span class="badge badge-info">Member</span>`;

            tr.innerHTML = `
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${initials}</div>
                        <div>
                            <div class="user-info-name">${escapeHtml(user.name)}</div>
                            <div class="user-info-email">${escapeHtml(user.email)}</div>
                        </div>
                    </div>
                </td>
                <td>${roleBadge}</td>
                <td><span class="badge badge-success">Aktif</span></td>
                <td>${user.joined}</td>
                <td style="text-align: right;">
                    <div class="action-buttons" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-sm" onclick="toggleRole(${user.id})">Ganti Role</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Hapus</button>
                    </div>
                </td>
            `;
            userTableBody.appendChild(tr);
        });

        updateStats();
    }

    /**
     * Memperbarui indikator statistik pengguna
     */
    function updateStats() {
        if (statTotalUsers) statTotalUsers.innerText = users.length;
        if (statTotalAdmins) statTotalAdmins.innerText = users.filter(u => u.role === "admin").length;
        if (statTotalMembers) statTotalMembers.innerText = users.filter(u => u.role === "member").length;
    }

    /**
     * Handler submit penambahan pengguna
     */
    formCreateUser?.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("input-name");
        const emailInput = document.getElementById("input-email");
        const roleInput = document.getElementById("input-role");

        const newUser = {
            id: Date.now(),
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            role: roleInput.value,
            status: "Active",
            joined: new Date().toISOString().split("T")[0]
        };

        users.push(newUser);
        renderUsers(users);
        formCreateUser.reset();
        closeModal();

        if (window.showToast) {
            window.showToast(`Akun ${newUser.name} berhasil dibuat!`, "success");
        }
    });

    /**
     * Hapus Pengguna berdasarkan ID
     * @param {number} userId 
     */
    window.deleteUser = function(userId) {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;

        if (confirm(`Apakah Anda yakin ingin menghapus akun ${userToDelete.name}?`)) {
            users = users.filter(u => u.id !== userId);
            renderUsers(users);
            if (window.showToast) {
                window.showToast(`Akun ${userToDelete.name} telah dihapus dari sistem.`, "danger");
            }
        }
    };

    /**
     * Ubah role pengguna secara instan
     * @param {number} userId 
     */
    window.toggleRole = function(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        user.role = user.role === "admin" ? "member" : "admin";
        renderUsers(users);
        if (window.showToast) {
            window.showToast(`Peran ${user.name} diubah menjadi ${user.role}.`, "info");
        }
    };

    /**
     * Pencarian interaktif
     */
    searchInput?.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = users.filter(u => 
            u.name.toLowerCase().includes(query) || 
            u.email.toLowerCase().includes(query)
        );
        renderUsers(filtered);
    });

    // Kontrol Modal
    function openModal() { userModal?.classList.add("active"); }
    function closeModal() { userModal?.classList.remove("active"); }

    btnOpenModal?.addEventListener("click", openModal);
    btnCloseModal?.addEventListener("click", closeModal);
    btnCancelModal?.addEventListener("click", closeModal);

    // Escape HTML helper
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.innerText = text;
        return div.innerHTML;
    }

    // Initial render
    renderUsers(users);
});
