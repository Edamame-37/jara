/**
 * =============================================================================
 * File: public/js/app.js
 * Project: JARA (Advanced Todo List & Collaboration System)
 * Role: (PM) Script Utama Aplikasi
 * -----------------------------------------------------------------------------
 * Deskripsi:
 * File ini bertindak sebagai entry point JavaScript untuk menginisialisasi
 * seluruh modul aplikasi (Admin, Task, Collaboration), mengelola status global,
 * sistem notifikasi toast, serta navigasi tab/halaman secara dinamis.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("%c[JARA App] Initialized successfully!", "color: #4f46e5; font-weight: bold; font-size: 14px;");

    // Inisialisasi state aplikasi global
    const AppState = {
        activeTab: "overview",
        currentUser: {
            id: 1,
            name: "Administrator",
            email: "admin@jara.local",
            role: "admin"
        },
        activeProject: {
            id: 101,
            title: "Pengembangan Modul JARA",
            description: "Implementasi 3 modul fungsional SRS untuk sistem pendaftaran praktikum"
        }
    };

    // Pasang AppState ke window agar bisa diakses oleh sub-modul
    window.AppState = AppState;

    /**
     * Helper Notifikasi Toast Global
     * @param {string} message - Pesan yang ingin ditampilkan
     * @param {'info'|'success'|'warning'|'danger'} type - Tipe alert
     */
    window.showToast = function(message, type = "info") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.style.position = "fixed";
            container.style.bottom = "20px";
            container.style.right = "20px";
            container.style.zIndex = "9999";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "10px";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `badge badge-${type}`;
        toast.style.padding = "10px 16px";
        toast.style.fontSize = "0.9rem";
        toast.style.borderRadius = "8px";
        toast.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)";
        toast.style.transition = "opacity 0.3s ease";
        toast.innerText = message;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Setup Tab Switching pada Dashboard Utama
    const navLinks = document.querySelectorAll("[data-nav-target]");
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const target = link.getAttribute("data-nav-target");
            if (target && !link.getAttribute("href")?.startsWith("http")) {
                e.preventDefault();
                switchTab(target);
            }
        });
    });

    /**
     * Berpindah tab tampilan di dashboard
     * @param {string} tabName 
     */
    function switchTab(tabName) {
        AppState.activeTab = tabName;
        document.querySelectorAll("[data-tab-content]").forEach(section => {
            if (section.getAttribute("data-tab-content") === tabName) {
                section.style.display = "block";
            } else {
                section.style.display = "none";
            }
        });

        navLinks.forEach(link => {
            if (link.getAttribute("data-nav-target") === tabName) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    // Default tab check
    switchTab("overview");
});
