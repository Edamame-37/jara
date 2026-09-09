# JARA — Advanced Todo List & Collaboration Platform

[![Laravel](https://img.shields.io/badge/Laravel-11%2F12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Modular%20Tokens-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

Aplikasi web **JARA (Advanced Todo List & Collaboration System)** adalah platform manajemen tugas modern berbasis web yang mengadopsi arsitektur modular terstruktur dan didukung oleh backend framework **Laravel**. Sistem ini dirancang untuk memfasilitasi manajemen proyek perseorangan maupun kolaboratif secara terukur, teratur, dan efisien.

---

## 1. Struktur Folder Repositori (Tree Architecture)

Repositori mengadopsi struktur modular terisolasi untuk memastikan pembagian kerja tim yang rapi, menghindari konflik merge (*merge conflicts*), dan mempermudah pemeliharaan sistem. 

Berikut adalah diagram tree arsitektur repositori yang diimplementasikan pada proyek:

```plaintext
practical-registration-system/
├── README.md                           # Dokumentasi utama proyek, SRS, dan SOP tim
├── temp-cava/                          # Direktori root aplikasi (Laravel & Frontend Modular)
│   ├── .gitignore
│   ├── README.md
│   ├── composer.json
│   ├── package.json
│   │
│   ├── config/
│   │   ├── app.php                     # Konfigurasi aplikasi Laravel
│   │   ├── database.php                # Konfigurasi database relasional
│   │   └── connection.js               # [PM] Koneksi database / konfigurasi umum & API endpoint
│   │
│   ├── public/                         # [PM] Aset global UI & Halaman Utama Portal
│   │   ├── css/
│   │   │   └── global.css              # Style dasar (header, sidebar, tema warna, token CSS)
│   │   ├── js/
│   │   │   └── app.js                  # Script utama (lifecycle app, state global, toast alert)
│   │   └── index.html                  # Landing page / Halaman Utama integrasi modul
│   │
│   └── modules/                        # Modul Fungsional Spesifikasi Kebutuhan (SRS)
│       ├── admin/                      # 🟢 [SRS-01] Programmer 1 (feature/srs-01-admin-user)
│       │   ├── admin-view.html         # UI Manajemen User & Admin
│       │   ├── admin.css               # Styling khusus halaman panel admin
│       │   └── admin-script.js         # Logika interaksi CRUD user & hak akses admin
│       │
│       ├── task/                       # 🔵 [SRS-02] Programmer 2 (feature/srs-02-task-management)
│       │   ├── task-view.html          # UI List Tugas, Priority & Deadline
│       │   ├── task.css                # Styling khusus kartu tugas & badge prioritas
│       │   └── task-script.js          # Logika interaksi CRUD Task, Priority, Status selesai
│       │
│       └── collaboration/              # 🟡 [SRS-03] Programmer 3 (feature/srs-03-collaboration)
│           ├── collab-view.html        # UI Kelola Anggota, Undangan & Progress Bar
│           ├── collab.css              # Styling khusus antarmuka kolaborasi & timeline
│           └── collab-script.js        # Logika Invite member, perizinan & kalkulasi progress
```

---

## 2. Spesifikasi Kebutuhan Perangkat Lunak (Software Requirements Specification - SRS)

### 2.1 Ringkasan Modul & Alokasi Tim

Tabel berikut merangkum pemetaan modul fungsional (*SRS breakdown*), nama fitur, deskripsi operasional, alokasi branch Git, dan tanggung jawab anggota tim:

| Kode SRS | Nama Fitur | Deskripsi Kebutuhan Detail | Nama Branch | Penanggung Jawab |
| :--- | :--- | :--- | :--- | :--- |
| **SRS-01** | **Admin & User Management** | Memungkinkan Admin untuk membuat/menambah akun baru, mengelola peran, dan menghapus akun pengguna dari sistem. | `feature/srs-01-admin-user` | 🟢 **Programmer 1** |
| **SRS-02** | **Task & Project Management** | Pengguna dapat membuat daftar (*project/list*), membuat tugas, mengatur skala prioritas, menetapkan tenggat waktu (*deadline*), dan menandai tugas selesai. | `feature/srs-02-task-management` | 🔵 **Programmer 2** |
| **SRS-03** | **Collaboration & Progress** | Pemilik daftar (*owner*) dapat mengundang/menambah anggota ke daftar tugasnya serta memantau persentase/progres penyelesaian secara real-time. | `feature/srs-03-collaboration` | 🟡 **Programmer 3** |

---

### 2.2 Rincian Spesifikasi Kebutuhan Fungsional

#### 🛡️ SRS-01: Admin & User Management
* **Tujuan**: Menyediakan mekanisme kontrol penuh bagi administrator dalam mengelola identitas pengguna, hak akses, dan menjaga integritas data akun sistem.
* **Aktor Utama**: Administrator Sistem.
* **Kebutuhan Fungsional Detail**:
  1. **SRS-01-01 (Autentikasi & Autorisasi)**: Sistem memverifikasi login admin dan membatasi akses modul manajemen hanya untuk akun dengan peran `admin`.
  2. **SRS-01-02 (Tabel Data Pengguna)**: Menampilkan seluruh akun yang terdaftar dalam format tabel interaktif dilengkapi fitur pencarian berdasarkan nama dan email.
  3. **SRS-01-03 (Pendaftaran Akun Baru)**: Admin dapat menambahkan akun baru dengan memasukkan nama lengkap, email unik, peran (`admin` / `member`), serta kata sandi default.
  4. **SRS-01-04 (Pengelolaan Peran & Status)**: Admin dapat mengubah peran pengguna sewaktu-waktu dan menonaktifkan akun yang melanggar ketentuan.
  5. **SRS-01-05 (Penghapusan Akun)**: Admin dapat menghapus akun pengguna dari sistem dengan konfirmasi dialog pengaman untuk mencegah ketidaksengajaan.

---

#### 📋 SRS-02: Task & Project Management
* **Tujuan**: Memberikan kemampuan produktivitas personal kepada pengguna untuk mengorganisir pekerjaan, menetapkan prioritas, dan memantau tenggat waktu.
* **Aktor Utama**: Pengguna Terdaftar (*Registered User*).
* **Kebutuhan Fungsional Detail**:
  1. **SRS-02-01 (Pengelompokan Daftar / Project List)**: Pengguna dapat membuat beberapa kategori atau daftar proyek terpisah (misal: "Kuliah", "Tugas Akhir", "Pribadi").
  2. **SRS-02-02 (Penciptaan Tugas / Task Creation)**: Pengguna dapat menambahkan tugas ke dalam daftar yang mencakup:
     - Judul tugas
     - Deskripsi rincian
     - Skala prioritas (`Urgent`, `High`, `Medium`, `Low`)
     - Tenggat waktu (*deadline date*)
  3. **SRS-02-03 (Penyelesaian Tugas / Status Toggle)**: Pengguna dapat menandai tugas sebagai selesai (*completed*) melalui checkbox interaktif atau membukanya kembali jika diperlukan.
  4. **SRS-02-04 (Penyortiran & Pemfilteran)**: Tugas dapat disaring berdasarkan status (`Semua`, `Belum Selesai`, `Selesai`) dan diurutkan berdasarkan tanggal deadline terdekat atau prioritas tertinggi.
  5. **SRS-02-05 (Pemeliharaan Tugas)**: Pengguna dapat memperbarui isi tugas dan menghapus tugas yang tidak lagi relevan.

---

#### 🤝 SRS-03: Collaboration & Progress Tracking
* **Tujuan**: Memungkinkan kerja sama tim dalam menyelesaikan sekumpulan tugas dan memberikan visibilitas metrik progres ketercapaian target secara akurat.
* **Aktor Utama**: Pemilik Proyek (*Project Owner*) dan Anggota Kolaborator (*Collaborator*).
* **Kebutuhan Fungsional Detail**:
  1. **SRS-03-01 (Undangan Kolaborator)**: Pemilik daftar dapat mengundang pengguna lain ke dalam proyeknya menggunakan alamat email terdaftar.
  2. **SRS-03-02 (Tingkat Hak Akses Kolaborasi)**:
     - `Owner`: Pemilik utama, hak penuh mengundang/mengeluarkan anggota dan menghapus proyek.
     - `Editor`: Dapat membuat tugas baru, mengedit, dan mencentang tugas yang selesai.
     - `Viewer`: Hanya dapat membaca daftar tugas dan melihat perkembangan progres.
  3. **SRS-03-03 (Kalkulasi Progres Otomatis)**: Sistem menghitung persentase progres secara dinamis menggunakan rumus:
     $$\text{Progres (\%)} = \left( \frac{\text{Jumlah Tugas Selesai}}{\text{Total Seluruh Tugas}} \right) \times 100\%$$
  4. **SRS-03-04 (Visualisasi Progres)**: Menampilkan status pencapaian melalui Progress Bar dinamis dan indikator status ketercapaian target (*On-Track*, *In-Progress*, *Behind*).
  5. **SRS-03-05 (Log Aktivitas Bersama)**: Menampilkan rekam jejak aktivitas terkini (siapa yang mencentang tugas selesai, siapa yang baru bergabung, dll).

---

## 3. Improvisasi & Pembagian Tugas Tim (3 Programmer)

Untuk memaksimalkan produktivitas dan kepemilikan kode (*code ownership*), beban kerja dibagi secara seimbang berdasarkan lapisan fungsional arsitektur:

```
                  ┌─────────────────────────────────────┐
                  │          PROJECT MANAGER            │
                  │   - config/connection.js            │
                  │   - public/css/global.css           │
                  │   - public/index.html               │
                  └──────────────────┬──────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
┌─────────▼───────────┐    ┌─────────▼───────────┐    ┌─────────▼───────────┐
│    PROGRAMMER 1     │    │    PROGRAMMER 2     │    │    PROGRAMMER 3     │
│       SRS-01        │    │       SRS-02        │    │       SRS-03        │
│ Admin & User Mgmt   │    │ Task & Project Mgmt │    │ Collab & Progress   │
│ feature/srs-01-...  │    │ feature/srs-02-...  │    │ feature/srs-03-...  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

### 🟢 Programmer 1: Lead Backend, Autentikasi & Admin System
* **Fokus Modul**: `SRS-01: Admin & User Management`
* **Git Branch**: `feature/srs-01-admin-user`
* **Area File Tanggung Jawab**:
  - `temp-cava/modules/admin/admin-view.html`
  - `temp-cava/modules/admin/admin.css`
  - `temp-cava/modules/admin/admin-script.js`
  - Backend Laravel: `app/Http/Controllers/UserController.php`, `database/migrations/*_create_users_table.php`, Middleware Autentikasi/Role.
* **Deliverable & Rincian Tugas**:
  1. Merancang skema tabel `users` dengan atribut peran (`role`: `admin` atau `member`).
  2. Membangun endpoint REST API:
     - `GET /api/admin/users`: Mendapatkan daftar semua pengguna.
     - `POST /api/admin/users/create`: Mendaftarkan pengguna baru dengan enkripsi password (Bcrypt/Argon2).
     - `DELETE /api/admin/users/{id}`: Menghapus akun pengguna.
     - `PUT /api/admin/users/{id}/role`: Mengubah role pengguna.
  3. Memastikan validasi data ketat (format email valid, password minimal 8 karakter, pencegahan duplikasi email).
  4. Menyempurnakan UI tabel admin dengan fitur filter pencarian instan dan kartu statistik ringkasan akun.

---

### 🔵 Programmer 2: Core Task Engine & Lifecycle Management
* **Fokus Modul**: `SRS-02: Task & Project Management`
* **Git Branch**: `feature/srs-02-task-management`
* **Area File Tanggung Jawab**:
  - `temp-cava/modules/task/task-view.html`
  - `temp-cava/modules/task/task.css`
  - `temp-cava/modules/task/task-script.js`
  - Backend Laravel: `app/Models/Task.php`, `app/Models/Project.php`, `app/Http/Controllers/TaskController.php`, tabel migrasi `tasks` dan `projects`.
* **Deliverable & Rincian Tugas**:
  1. Merancang skema database tabel `projects` dan `tasks` (relasi *One-to-Many*).
  2. Membangun endpoint REST API:
     - `GET /api/projects`: Mengambil daftar folder/kategori pengguna.
     - `GET /api/tasks`: Mengambil daftar tugas dengan opsi query status dan urutan deadline.
     - `POST /api/tasks`: Menyimpan tugas baru lengkap dengan judul, deskripsi, prioritas, dan tanggal jatuh tempo.
     - `PATCH /api/tasks/{id}/toggle`: Mengubah status pengerjaan (selesai / belum selesai).
     - `DELETE /api/tasks/{id}`: Menghapus tugas dari sistem.
  3. Mengembangkan komponen antarmuka interaktif: pemilih tanggal deadline, badge warna prioritas dinamis, dan tab filter (`Semua`, `Belum Selesai`, `Selesai`).
  4. Menambahkan logika sorting berbasis tanggal (deadline terdekat) dan bobot prioritas (`Urgent` > `High` > `Medium` > `Low`).

---

### 🟡 Programmer 3: Team Collaboration & Metric Tracking
* **Fokus Modul**: `SRS-03: Collaboration & Progress Tracking`
* **Git Branch**: `feature/srs-03-collaboration`
* **Area File Tanggung Jawab**:
  - `temp-cava/modules/collaboration/collab-view.html`
  - `temp-cava/modules/collaboration/collab.css`
  - `temp-cava/modules/collaboration/collab-script.js`
  - Backend Laravel: `app/Http/Controllers/CollaborationController.php`, tabel pivot migrasi `project_user` (relasi *Many-to-Many*), Model `ActivityLog`.
* **Deliverable & Rincian Tugas**:
  1. Merancang tabel pivot `project_user` (`project_id`, `user_id`, `role`: `owner`/`editor`/`viewer`).
  2. Membangun endpoint REST API:
     - `GET /api/projects/{id}/members`: Menampilkan seluruh kolaborator dalam proyek.
     - `POST /api/projects/{id}/invite`: Mengirim undangan/menambahkan anggota berdasarkan email.
     - `DELETE /api/projects/{id}/members/{userId}`: Mengeluarkan anggota dari proyek kolaborasi.
     - `GET /api/projects/{id}/progress`: Mengembalikan metrik kalkulasi persentase dan rekap tugas.
  3. Mengimplementasikan algoritma penghitungan persentase progres secara otomatis setiap kali status tugas di-update oleh Programmer 2.
  4. Mengembangkan UI komponen Progress Bar modern, grid kartu anggota kolaborator, dan timeline riwayat aktivitas (*activity feed*).

---

## 4. Panduan Alur Kerja Tim (Git Workflow & SOP)

Untuk menjamin kelancaran kolaborasi antar 3 programmer, seluruh anggota wajib mematuhi panduan Git berikut:

### 4.1 Alur Branching
1. Branch `main` merupakan branch produksi yang dilindungi. Tidak diperkenankan melakukan *direct commit* ke `main`.
2. Setiap programmer bekerja pada branch fiturnya masing-masing:
   ```bash
   # Programmer 1
   git checkout -b feature/srs-01-admin-user

   # Programmer 2
   git checkout -b feature/srs-02-task-management

   # Programmer 3
   git checkout -b feature/srs-03-collaboration
   ```

### 4.2 Standar Pesan Commit (Conventional Commits)
Setiap commit wajib menyertakan tag tipe perubahan yang jelas:
* `feat(...)`: Menambah fitur fungsional baru (contoh: `feat(task): add priority sorting filter`)
* `fix(...)`: Memperbaiki bug atau kesalahan logika (contoh: `fix(auth): handle expired token error`)
* `docs(...)`: Memperbarui dokumentasi atau file panduan
* `style(...)`: Penyesuaian tampilan CSS tanpa merubah logika kode
* `refactor(...)`: Restrukturisasi kode tanpa merubah fungsionalitas

### 4.3 Integrasi & Pull Request (PR)
1. Lakukan *pull* terbaru dari `main` sebelum membuka PR:
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/srs-xx-nama-fitur
   git merge main
   ```
2. Buka Pull Request (PR) ke branch `main`.
3. Minimal 1 anggota tim lainnya wajib melakukan Code Review sebelum PR di-*merge*.

---

## 5. Petunjuk Menjalankan Proyek

### Prasyarat Sistem
* PHP >= 8.2
* Composer >= 2.x
* Web Browser modern (Chrome / Firefox / Edge)

### Langkah Instalasi
```bash
# 1. Masuk ke direktori aplikasi
cd temp-cava

# 2. Install dependensi PHP
composer install

# 3. Salin file environment dan buat application key
cp .env.example .env
php artisan key:generate

# 4. Jalankan migrasi database
php artisan migrate

# 5. Jalankan server lokal Laravel
php artisan serve
```

Akses portal aplikasi utama melalui browser pada URL:  
👉 **`http://127.0.0.1:8000`** atau buka langsung file **`temp-cava/public/index.html`**.

---
*Dikembangkan dengan dedikasi untuk Tim Praktikum Sistem Registrasi & Rekayasa Perangkat Lunak (JARA Project).*
