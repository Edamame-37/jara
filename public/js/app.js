/**
 * =============================================================================
 * File: public/js/app.js
 * Project: JARA (Advanced Todo List & Collaboration System)
 * Role: (PM / Core) Script Utama Aplikasi
 * -----------------------------------------------------------------------------
 * Deskripsi & Cara Kerja:
 * Entry point JavaScript global untuk inisialisasi state lintas modul:
 * - Menyimpan state global aplikasi (user aktif, project aktif).
 * - Menyediakan sistem notifikasi toast mengambang (Toast Alerts).
 * - Menghubungkan ringkasan progres proyek di Dashboard Utama ke backend API.
 * - Menyediakan helper utilitas DOM dan dialog modal.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", async () => {
    console.log("%c[JARA App] Initialized successfully!", "color: #4f46e5; font-weight: bold; font-size: 14px;");

    // Inisialisasi state aplikasi global yang dibagikan ke seluruh sub-modul
    const AppState = {
        activeTab: "overview",
        currentUser: {
            id: 1,
            name: "Aufaarel Mecca",
            email: "aufaarel@jara.local",
            role: "admin"
        },
        activeProject: {
            id: 1,
            title: "Pengembangan Modul JARA",
            description: "Implementasi 3 modul fungsional SRS untuk sistem pendaftaran praktikum"
        }
    };

    window.AppState = AppState;

    /**
     * [Global Toast Notification Helper]
     * Menampilkan pemberitahuan pop-up toast yang elegan di pojok kanan bawah.
     *
     * @param {string} message - Pesan yang ingin disampaikan
     * @param {'info'|'success'|'warning'|'danger'} type - Jenis alert
     */
    window.showToast = function(message, type = "info") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.style.position = "fixed";
            container.style.bottom = "24px";
            container.style.right = "24px";
            container.style.zIndex = "99999";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "10px";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `badge badge-${type}`;
        toast.style.padding = "12px 20px";
        toast.style.fontSize = "0.9rem";
        toast.style.fontWeight = "600";
        toast.style.borderRadius = "10px";
        toast.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.15)";
        toast.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        toast.style.transform = "translateY(10px)";
        toast.style.opacity = "0";
        toast.innerText = message;

        container.appendChild(toast);

        // Animasi masuk
        requestAnimationFrame(() => {
            toast.style.transform = "translateY(0)";
            toast.style.opacity = "1";
        });

        // Animasi keluar setelah 3 detik
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    /**
     * [Dashboard Overview Synchronizer]
     * Mengambil metrik progres nyata dari backend API untuk ditampilkan pada index.html
     */
    async function syncDashboardProgress() {
        const progressFill = document.querySelector(".progress-bar-fill");
        const progressText = document.getElementById("overall-progress-text");
        if (!progressFill || !progressText) return;

        try {
            if (window.AppConfig) {
                const res = await window.AppConfig.request(window.AppConfig.endpoints.collaboration.progress(1));
                if (res && res.success && res.data) {
                    const pct = res.data.percentage;
                    progressFill.style.width = `${pct}%`;
                    progressText.innerText = `Progres: ${pct}% (${res.data.status_label})`;
                }
            }
        } catch (err) {
            console.warn("[Dashboard Sync Error]", err);
        }
    }

    // Jalankan sinkronisasi progres dashboard
    syncDashboardProgress();
});
