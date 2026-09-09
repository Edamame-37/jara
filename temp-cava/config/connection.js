/**
 * =============================================================================
 * File: config/connection.js
 * Project: JARA (Advanced Todo List & Collaboration System)
 * Role: (PM) Koneksi Database / Konfigurasi Umum Sistem
 * -----------------------------------------------------------------------------
 * Deskripsi:
 * File ini menangani konfigurasi koneksi umum, endpoint API backend (Laravel),
 * base URL sistem, dan utility helper komunikasi data untuk seluruh modul frontend.
 * =============================================================================
 */

const AppConfig = {
    // Nama aplikasi dan versi rilis
    appName: "JARA - Task & Collaboration Platform",
    version: "1.0.0",

    // Konfigurasi Environment (development / production)
    environment: "development",

    // Base URL Backend API Laravel
    apiBaseUrl: window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
        ? "http://127.0.0.1:8000/api"
        : "/api",

    // Header default untuk request HTTP fetch/JSON
    defaultHeaders: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    },

    // Endpoint mapping untuk setiap modul spesifikasi (SRS)
    endpoints: {
        // SRS-01: Admin & User Management
        admin: {
            users: "/admin/users",
            createUser: "/admin/users/create",
            deleteUser: (id) => `/admin/users/${id}`,
            updateRole: (id) => `/admin/users/${id}/role`
        },
        // SRS-02: Task & Project Management
        task: {
            projects: "/projects",
            tasks: "/tasks",
            updateStatus: (id) => `/tasks/${id}/status`,
            updatePriority: (id) => `/tasks/${id}/priority`,
            deleteTask: (id) => `/tasks/${id}`
        },
        // SRS-03: Collaboration & Progress Tracking
        collaboration: {
            members: (projectId) => `/projects/${projectId}/members`,
            inviteMember: (projectId) => `/projects/${projectId}/invite`,
            removeMember: (projectId, userId) => `/projects/${projectId}/members/${userId}`,
            progress: (projectId) => `/projects/${projectId}/progress`
        }
    },

    /**
     * Helper fetch wrapper dengan error handling standar
     * @param {string} endpoint - Path endpoint API
     * @param {object} options - Opsi request fetch (method, body, headers, dll)
     * @returns {Promise<any>} Response JSON data
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
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`[AppConfig Error] Request ke ${endpoint} gagal:`, error);
            throw error;
        }
    }
};

// Export untuk module environment atau pasang ke window object
if (typeof module !== "undefined" && module.exports) {
    module.exports = AppConfig;
} else {
    window.AppConfig = AppConfig;
}
