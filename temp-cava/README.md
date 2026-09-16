# JARA — Advanced Todo List & Collaboration Platform

Aplikasi web JARA (Advanced Todo List & Collaboration System) adalah platform manajemen tugas modern berbasis web yang mengadopsi arsitektur terstruktur dan didukung oleh kerangka kerja Laravel. Sistem ini dirancang untuk memfasilitasi manajemen proyek perseorangan maupun kolaboratif secara terukur, teratur, dan efisien.

---

## 1. Spesifikasi Kebutuhan Perangkat Lunak (Software Requirements Specification - SRS)

Bagian ini memuat seluruh spesifikasi sistem yang harus dibangun. Seluruh pengembangan fitur bersifat Fullstack. Tidak ada pembagian khusus antara sistem antarmuka dan sistem inti; setiap pengembangan pada fitur spesifik wajib dikembangkan secara utuh oleh satu kesatuan alur dari antarmuka hingga basis data.

### SRS-01: Admin & User Management
Tujuan: Menyediakan mekanisme kontrol penuh bagi administrator dalam mengelola identitas pengguna, hak akses, dan menjaga integritas data akun sistem.
1. SRS-01-01 (Autentikasi & Autorisasi): Sistem memverifikasi login dan membatasi akses modul manajemen hanya untuk akun dengan peran administrator.
2. SRS-01-02 (Tabel Data Pengguna): Menampilkan seluruh akun yang terdaftar dalam format tabel interaktif dilengkapi fitur pencarian berdasarkan nama dan email.
3. SRS-01-03 (Pendaftaran Akun Baru): Administrator dapat menambahkan akun baru dengan memasukkan nama lengkap, email unik, peran, serta kata sandi bawaan.
4. SRS-01-04 (Pengelolaan Peran & Status): Administrator dapat mengubah peran pengguna sewaktu-waktu dan menonaktifkan akun yang melanggar ketentuan.
5. SRS-01-05 (Penghapusan Akun): Administrator dapat menghapus akun pengguna dari sistem dengan konfirmasi dialog pengaman untuk mencegah kesalahan fatal.

### SRS-02: Task & Project Management
Tujuan: Memberikan kemampuan produktivitas personal kepada pengguna untuk mengorganisir pekerjaan, menetapkan prioritas, dan memantau tenggat waktu.
1. SRS-02-01 (Pengelompokan Daftar / Project List): Pengguna dapat membuat beberapa kategori atau daftar proyek terpisah.
2. SRS-02-02 (Penciptaan Tugas / Task Creation): Pengguna dapat menambahkan tugas ke dalam daftar yang mencakup judul, deskripsi, skala prioritas, dan tenggat waktu.
3. SRS-02-03 (Penyelesaian Tugas): Pengguna dapat menandai tugas sebagai selesai melalui kotak centang interaktif.
4. SRS-02-04 (Penyortiran & Pemfilteran): Tugas dapat disaring berdasarkan status dan diurutkan berdasarkan tanggal tenggat terdekat atau prioritas tertinggi.
5. SRS-02-05 (Pemeliharaan Tugas): Pengguna dapat memperbarui isi tugas dan menghapus tugas yang tidak lagi relevan.

### SRS-03: Collaboration & Progress Tracking
Tujuan: Memungkinkan kerja sama tim dalam menyelesaikan sekumpulan tugas dan memberikan visibilitas metrik progres ketercapaian target secara akurat.
1. SRS-03-01 (Undangan Kolaborator): Pemilik daftar dapat mengundang pengguna lain ke dalam proyeknya menggunakan alamat email terdaftar.
2. SRS-03-02 (Tingkat Hak Akses Kolaborasi):
   - Pemilik: Memiliki hak penuh mengundang atau mengeluarkan anggota dan menghapus proyek.
   - Penyunting: Dapat membuat tugas baru, mengedit, dan menyelesaikan tugas.
   - Pemantau: Hanya dapat membaca daftar tugas dan melihat perkembangan progres.
3. SRS-03-03 (Kalkulasi Progres Otomatis): Sistem menghitung persentase progres secara dinamis berdasarkan formula standar (Tugas Selesai / Total Seluruh Tugas) x 100%.
4. SRS-03-04 (Visualisasi Progres): Menampilkan status pencapaian melalui indikator progres dinamis dan status ketercapaian (Sesuai Target, Sedang Dikerjakan, Terlambat).
5. SRS-03-05 (Log Aktivitas Bersama): Menampilkan rekam jejak aktivitas terkini dari seluruh anggota proyek.

### SRS-04: Ownership, Security & Transaction Management
Tujuan: Menjamin integritas data saat modifikasi atau penghapusan proyek, serta melindungi sistem dari akses yang tidak berwenang maupun serangan injeksi basis data.
1. SRS-04-01 (Otomatisasi Kepemilikan Proyek): Sistem secara otomatis menetapkan pengguna pembuat daftar tugas sebagai Pemilik tanpa memerlukan masukan tambahan dari pengguna.
2. SRS-04-02 (Penghapusan Atomik & Bertingkat): Penghapusan daftar proyek akan memicu penghapusan seluruh tugas dan anggota terkait secara atomik dalam satu transaksi basis data. Apabila terdapat kegagalan, seluruh proses akan dibatalkan.
3. SRS-04-03 (Otorisasi Akses Ketat): Sistem menolak permintaan modifikasi dan penghapusan proyek dari pengguna selain Pemilik.
4. SRS-04-04 (Keamanan & Sanitasi Masukan): Seluruh masukan dari pengguna wajib divalidasi secara ketat dan diproses menggunakan kueri terparameterisasi guna mencegah bahaya keamanan.

---

## 2. Apa yang Harus Dilakukan Programmer Sekarang

Untuk memulai pengembangan aplikasi, seluruh Programmer diwajibkan untuk menjalankan langkah-langkah praktis di bawah ini:

1. **Inisialisasi Lingkungan Kerja (Environment Setup)**
   - Pastikan Anda telah melakukan kloning pada repositori proyek ini.
   - Eksekusi instalasi dependensi menggunakan utilitas manajemen paket standar (contoh: `composer install` dan `npm install`).
   - Gandakan berkas konfigurasi `.env.example` menjadi `.env` lalu hasilkan kunci aplikasi (contoh: melalui perintah `php artisan key:generate`).
   - Lakukan migrasi awal pada basis data lokal Anda.

2. **Perencanaan Arsitektur Implementasi**
   - Segera amati Spesifikasi Kebutuhan Perangkat Lunak (SRS) yang tercantum pada dokumen ini.
   - Sebelum menyentuh kode pemrograman, Anda **wajib** menyusun rencana implementasi secara menyeluruh (meliputi kerangka tampilan antarmuka, struktur tabel basis data, rute aplikasi, dan arsitektur validasi fungsional).
   - Pastikan Anda mendesain skema relasi antar entitas (Pengguna, Proyek, Tugas) yang diamanatkan dalam SRS-01 hingga SRS-04 secara komprehensif.

3. **Pembuatan Cabang (Branching)**
   - Buat cabang pengembangan baru di lingkungan lokal Anda berdasarkan spesifikasi SRS atau fungsionalitas utama yang disepakati untuk dikerjakan.
   - Jangan pernah melakukan penulisan dan penambahan kode (commit) secara langsung di dalam cabang utama (`main`).

4. **Eksekusi Pengembangan (Fullstack Development)**
   - Mulailah membangun kerangka inti pengendalian data, model relasional, serta berkas migrasi basis data.
   - Karena setiap pekerjaan bersifat *Fullstack*, Anda memiliki tanggung jawab penuh untuk merancang dan membangun tampilan antarmuka yang fungsional sekaligus.
   - Pastikan seluruh fungsionalitas memiliki lapisan perlindungan yang kokoh, baik dari sisi otorisasi (lapisan penengah) maupun keamanan kueri.

5. **Pengujian dan Penyelesaian Pekerjaan**
   - Setelah implementasi selesai, pastikan Anda memverifikasi ketiadaan kesalahan sintaksis atau kelalaian logika sistem.
   - Tulis komit menggunakan pesan konvensional yang menjelaskan struktur fitur.
   - Kirimkan kode Anda ke repositori asal melalui pengajuan permohonan tarik (Pull Request) guna ditinjau bersama secara tim.

---
Dikembangkan dengan dedikasi tinggi untuk penerapan standar profesional Rekayasa Perangkat Lunak.
