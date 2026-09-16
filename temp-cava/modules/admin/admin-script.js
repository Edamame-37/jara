/**
 * =============================================================================
 * File: modules/admin/admin-script.js
 * Module: SRS-01 Admin & User Management
 * Programmer: Programmer 1
 * Branch: fix/srs01-03
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Mengendalikan antarmuka dan alur interaksi pengelolaan pengguna sistem:
 * [SRS-01-01] Memastikan identitas sesi Administrator aktif.
 * [SRS-01-02] Mengambil dan merender tabel pengguna dari API Laravel (dengan pencarian).
 * [SRS-01-03] Mendaftarkan pengguna baru via form modal dengan validasi ketat.
 * [SRS-01-04] Mengubah peran (Role Admin <-> Member) dan status akun (Aktif <-> Nonaktif).
 * [SRS-01-05] Menghapus akun pengguna dari sistem dengan konfirmasi dialog pengaman.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("[SRS-01 Admin] Script initialized with full API integration.");

    // State data lokal
    let users = [];

    // Elemen DOM Tabel & Statistik
    const userTableBody = document.getElementById("user-table-body");
    const statTotalUsers = document.getElementById("stat-total-users");
    const statTotalAdmins = document.getElementById("stat-total-admins");
    const statTotalMembers = document.getElementById("stat-total-members");
    const searchInput = document.getElementById("user-search");
    
    // Elemen DOM Modal Form
    const userModal = document.getElementById("user-modal");
    const btnOpenModal = document.getElementById("btn-open-modal");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const btnCancelModal = document.getElementById("btn-cancel-modal");
    const formCreateUser = document.getElementById("form-create-user");

    /**
     * [SRS-01-02] Memuat daftar pengguna dari backend REST API Laravel.
     *
     * @param {string} search - Query kata kunci pencarian nama atau email
     */
    async function loadUsers(search = "") {
        try {
            const queryParam = search ? `?search=${encodeURIComponent(search)}` : "";
            const endpoint = `${window.AppConfig.endpoints.admin.users}${queryParam}`;
            const response = await window.AppConfig.request(endpoint);

            if (response && response.success) {
                users = response.data;
                renderUsers(users);
                loadStats();
            }
        } catch (error) {
            console.error("[SRS-01 Error] Gagal memuat data pengguna:", error);
            if (window.showToast) {
                window.showToast("Gagal memuat data pengguna dari server.", "danger");
            }
        }
    }

    /**
     * Memuat ringkasan statistik akun pengguna dari server.
     */
    async function loadStats() {
        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.admin.stats);
            if (response && response.success && response.data) {
                if (statTotalUsers) statTotalUsers.innerText = response.data.total_users;
                if (statTotalAdmins) statTotalAdmins.innerText = response.data.total_admins;
                if (statTotalMembers) statTotalMembers.innerText = response.data.total_members;
            }
        } catch (error) {
            // Fallback kalkulasi manual dari array lokal
            if (statTotalUsers) statTotalUsers.innerText = users.length;
            if (statTotalAdmins) statTotalAdmins.innerText = users.filter(u => u.role === "admin").length;
            if (statTotalMembers) statTotalMembers.innerText = users.filter(u => u.role === "member").length;
        }
    }

    /**
     * [SRS-01-02] Merender baris tabel pengguna ke dalam DOM.
     *
     * @param {Array} userList - Daftar objek pengguna
     */
    function renderUsers(userList) {
        if (!userTableBody) return;
        userTableBody.innerHTML = "";

        if (!userList || userList.length === 0) {
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
            const initials = user.name ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "U";
            const roleBadge = user.role === "admin" 
                ? `<span class="badge badge-success">Administrator</span>` 
                : `<span class="badge badge-info">Member</span>`;
            
            const isActive = user.status === "active";
            const statusBadge = isActive
                ? `<span class="badge badge-success">Aktif</span>`
                : `<span class="badge badge-danger">Nonaktif</span>`;

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
                <td>${statusBadge}</td>
                <td>${user.joined || "-"}</td>
                <td style="text-align: right;">
                    <div class="action-buttons" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-sm" onclick="toggleRole(${user.id})" title="Ganti Role (Admin/Member)">
                            🔄 Role
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="toggleStatus(${user.id})" title="Aktifkan/Nonaktifkan Akun">
                            ${isActive ? "⛔ Nonaktifkan" : "✅ Aktifkan"}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})" title="Hapus Akun Pengguna">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            userTableBody.appendChild(tr);
        });
    }

    /**
     * [SRS-01-03] Handler submit formulir penambahan akun pengguna baru.
     */
    formCreateUser?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("input-name");
        const emailInput = document.getElementById("input-email");
        const roleInput = document.getElementById("input-role");
        const passwordInput = document.getElementById("input-password");

        const payload = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            role: roleInput.value,
            password: passwordInput.value
        };

        // Validasi kata sandi minimal 8 karakter
        if (payload.password.length < 8) {
            if (window.showToast) {
                window.showToast("Kata sandi harus minimal 8 karakter!", "danger");
            }
            return;
        }

        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.admin.createUser, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (response && response.success) {
                formCreateUser.reset();
                closeModal();
                await loadUsers();
                if (window.showToast) {
                    window.showToast(response.message || `Akun ${payload.name} berhasil dibuat!`, "success");
                }
            }
        } catch (error) {
            console.error("[SRS-01 Error] Gagal membuat pengguna:", error);
            if (window.showToast) {
                window.showToast(error.message || "Gagal membuat akun pengguna.", "danger");
            }
        }
    });

    /**
     * [SRS-01-04] Mengubah peran pengguna secara instan (Admin <-> Member).
     *
     * @param {number} userId - ID Pengguna
     */
    window.toggleRole = async function(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const newRole = user.role === "admin" ? "member" : "admin";
        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.admin.updateRole(userId), {
                method: "PUT",
                body: JSON.stringify({ role: newRole })
            });

            if (response && response.success) {
                await loadUsers(searchInput?.value.trim() || "");
                if (window.showToast) {
                    window.showToast(`Peran ${user.name} berhasil diubah menjadi ${newRole}.`, "info");
                }
            }
        } catch (error) {
            console.error("[SRS-01 Error] Gagal mengubah peran:", error);
            if (window.showToast) {
                window.showToast("Gagal mengubah peran akun.", "danger");
            }
        }
    };

    /**
     * [SRS-01-04] Mengubah status keaktifan akun (Active <-> Inactive).
     *
     * @param {number} userId - ID Pengguna
     */
    window.toggleStatus = async function(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const newStatus = user.status === "active" ? "inactive" : "active";
        try {
            const response = await window.AppConfig.request(window.AppConfig.endpoints.admin.updateStatus(userId), {
                method: "PUT",
                body: JSON.stringify({ status: newStatus })
            });

            if (response && response.success) {
                await loadUsers(searchInput?.value.trim() || "");
                if (window.showToast) {
                    window.showToast(`Status akun ${user.name} diubah menjadi ${newStatus}.`, "warning");
                }
            }
        } catch (error) {
            console.error("[SRS-01 Error] Gagal mengubah status akun:", error);
            if (window.showToast) {
                window.showToast("Gagal mengubah status akun.", "danger");
            }
        }
    };

    /**
     * [SRS-01-05] Menghapus akun pengguna dari sistem dengan dialog konfirmasi.
     *
     * @param {number} userId - ID Pengguna
     */
    window.deleteUser = async function(userId) {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;

        if (confirm(`Apakah Anda yakin ingin menghapus akun ${userToDelete.name} (${userToDelete.email})?`)) {
            try {
                const response = await window.AppConfig.request(window.AppConfig.endpoints.admin.deleteUser(userId), {
                    method: "DELETE"
                });

                if (response && response.success) {
                    await loadUsers(searchInput?.value.trim() || "");
                    if (window.showToast) {
                        window.showToast(`Akun ${userToDelete.name} telah dihapus dari sistem.`, "danger");
                    }
                }
            } catch (error) {
                console.error("[SRS-01 Error] Gagal menghapus pengguna:", error);
                if (window.showToast) {
                    window.showToast("Gagal menghapus pengguna.", "danger");
                }
            }
        }
    };

    /**
     * [SRS-01-02] Fitur pencarian instan nama dan email
     */
    let searchDebounce = null;
    searchInput?.addEventListener("input", (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            loadUsers(e.target.value.trim());
        }, 250);
    });

    // Kontrol Tampilan Modal
    function openModal() { userModal?.classList.add("active"); }
    function closeModal() { userModal?.classList.remove("active"); }

    btnOpenModal?.addEventListener("click", openModal);
    btnCloseModal?.addEventListener("click", closeModal);
    btnCancelModal?.addEventListener("click", closeModal);

    // Helper sanitasi teks untuk mencegah injeksi HTML
    function escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.innerText = text;
        return div.innerHTML;
    }

    // Inisialisasi awal pemuatan data
    loadUsers();
});
