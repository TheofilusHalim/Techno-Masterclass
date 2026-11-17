# Dokumentasi Progres Proyek: Titipin (Smart Digital Locker Ecosystem)

Dokumen ini merangkum seluruh perkembangan rekayasa perangkat lunak, tumpukan teknologi (*tech stack*), arsitektur sistem, serta seluruh fitur yang telah berhasil diimplementasikan pada ekosistem **Titipin**.

---

## 1. Tumpukan Teknologi (Tech Stack) & Alat yang Digunakan

| Komponen | Teknologi | Keterangan & Peran |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** + **TypeScript** | Arsitektur komponen modern berbasis tipe data ketat dan performa rendering tinggi. |
| **Build Tool & Bundler** | **Vite 6** | Menyediakan proses kompilasi kode dan *Hot Module Replacement (HMR)* super cepat. |
| **Styling & Desain** | **Tailwind CSS v4** | Desain antarmuka *mobile-first*, adaptif, responsif, dan ringan. |
| **Ikonografi & Aset** | **Lucide React** | Ikon visual modern yang konsisten di seluruh layar aplikasi. |
| **State Management** | **Zustand** | Manajemen *state* terpusat (otentikasi, data sewa aktif, preferensi hub) dengan sinkronisasi ke penyimpanan lokal (*local persistence*). |
| **Peta Interaktif** | **Leaflet** & **OpenStreetMap** | Rendering peta interaktif tanpa lisensi berbayar (Rp 0), tracking GPS real-time, dan penanda lokasi hub loker di Surabaya. |
| **Scanner QR Code** | **html5-qrcode** | Integrasi kamera perangkat untuk membaca QR Code pada loker fisik secara langsung. |
| **Backend & Database** | **Supabase (PostgreSQL)** | Manajemen database relasional cloud, Supabase Auth, Row Level Security (RLS), Trigger SQL otomatis, dan *Realtime Data Streaming* (WebSockets). |
| **Mobile Runtime** | **Capacitor 7 (Android)** | Bridge native yang mengemas aplikasi web ke aplikasi Android native APK. |
| **Android Toolchain** | **Android SDK 36 (Android 16)**, **Build-Tools 35.0.0**, **Gradle 8.14.3**, **JDK 21** | Lingkungan kompilasi native Android CLI yang menghasilkan file instalasi APK mandiri. |
| **Version Control** | **Git** & **GitHub** | Manajemen kode terdistribusi dengan alur cabang fitur dan integrasi ke remote `origin/dev`. |

---

## 2. Fitur-Fitur yang Telah Diimplementasikan

### A. Sistem Otentikasi & Manajemen Akun Pengguna
1. **Pendaftaran Akun Baru dengan Validasi Email Nyata:**
   * Pengguna mendaftar dengan email dan password melalui antarmuka pendaftaran.
   * Dilengkapi sistem gerbang verifikasi email: pengguna baru **wajib** melakukan konfirmasi melalui tautan yang dikirimkan Supabase ke kotak masuk email mereka sebelum dapat login.
   * Mencegah akun palsu atau tidak terverifikasi langsung masuk ke halaman utama.
2. **Login & Logout Aman:**
   * Sesi pengguna dikelola oleh token aman Supabase Auth.
   * Fitur Logout membersihkan seluruh sesi lokal dan mengembalikan antarmuka ke status tamu (*guest state*).
3. **Pemisahan Data Pengguna (Zero Session Leakage):**
   * Setiap akun baru yang berhasil login dimulai dengan data yang bersih (tidak ada kebocoran data sewa dari pengguna lain).
   * Data sewa aktif selalu difilter secara ketat berdasarkan `user_id` yang terautentikasi.

---

### B. Eksplorasi Lokasi & Peta Interaktif (Live Hub Map)
1. **Peta Interaktif Surabaya:**
   * Menampilkan titik-titik lokasi Hub Loker Pintar (contoh: *Petra Christian University Gedung P*, *Stasiun Surabaya Gubeng*, *Tunjungan Plaza*, dll) dengan koordinat geografis presisi.
2. **GPS Lokasi Pengguna:**
   * Mendeteksi posisi fisik pengguna secara *real-time* dan menampilkannya sebagai titik biru (*blue pulsing dot*) di peta.
3. **Indikator Ketersediaan Loker Real-time:**
   * Setiap pin hub loker di peta menampilkan jumlah loker yang sedang kosong/tersedia.
4. **Pilih Hub & Navigasi Cepat:**
   * Mengetuk pin hub pada peta atau kartu daftar hub akan langsung mengarahkan pengguna ke halaman rincian hub terkait.

---

### C. Sistem Penyewaan Loker (Multi-Locker Concurrent Rental)
1. **Dukungan Multi-Loker Bersamaan:**
   * Satu pengguna dapat menyewa **lebih dari 1 loker sekaligus** (misalnya menyewa loker Size S untuk laptop dan Size M untuk helm secara bersamaan).
2. **Pilihan Ukuran & Durasi Fleksibel:**
   * Tersedia ukuran **Small (S)**, **Medium (M)**, dan **Large (L)** dengan spesifikasi dimensi dan tarif per jam yang transparan.
   * Pengguna dapat memilih durasi sewa fleksibel dalam hitungan jam.
3. **Alokasi Unit Loker Otomatis:**
   * Sistem secara cerdas mencari dan memesan unit loker yang kosong di hub yang dipilih pada level database Supabase dengan integritas data tinggi.

---

### D. Sistem Langganan Member VIP (Member Pass Subscription)
1. **Paket Langganan Bulanan (Rp 125.000/bln):**
   * Memberikan status keanggotaan VIP yang tersimpan pada level profil pengguna di database.
2. **Aturan Kuota Loker Bersamaan (Maksimal 3 Loker):**
   * Pengguna langganan berhak menyewa loker ukuran **S dan M secara gratis (Rp 0)** hingga maksimal **3 unit loker yang aktif bersamaan**.
   * Jika pengguna sudah memiliki 3 loker aktif di bawah skema langganan dan ingin menyewa loker ke-4 atau seterusnya, sistem otomatis mengunci kuota gratis dan mengalihkan metode sewa ke tarif per jam normal.
3. **Pencegahan Langganan Ganda:**
   * Akun yang sudah aktif berlangganan dicegah untuk melakukan pembelian langganan ganda.

---

### E. Manajemen Loker Aktif Pengguna (Halaman "Loker Saya")
1. **Navigasi Multi-Loker (Horizontal Pill Switcher):**
   * Jika pengguna menyewa lebih dari satu loker, layar menampilkan tombol tab horizontal untuk beralih antar unit loker dengan 1 sentuhan.
2. **Penghitung Waktu Mundur Independen (Countdown Timer):**
   * Setiap unit loker memiliki timer sisa waktu sewa mandiri yang berdetak setiap detik.
3. **Buka Pintu Digital (Digital Door Unlock):**
   * Menekan tombol "Buka Loker" langsung mengirimkan perintah digital `door_command = 'OPEN'` ke cloud Supabase secara instan.
4. **Perpanjang Waktu & Selesaikan Sewa:**
   * Pengguna dapat menambah durasi sewa loker atau mengakhiri sewa saat pengambilan barang selesai.
5. **Tampilan Bersih Saat Kosong (Clean Empty State):**
   * Jika pengguna tidak memiliki loker aktif, halaman menampilkan ilustrasi profesional dan tombol langsung menuju pencarian loker.

---

### F. Pemindai Kamera QR Code (My QR)
1. **Integrasi Kamera HP Native:**
   * Menggunakan pustaka kamera web/native dengan izin akses Android (`android.permission.CAMERA`).
2. **Validasi Unit di Lokasi:**
   * Memungkinkan pengguna memindai QR code stiker fisik yang tertempel di loker untuk membuka loker secara instan di tempat.

---

### G. Desain Antarmuka Mobile-First & Navigasi
1. **Bilah Navigasi Bawah Permanen (5 Tombol):**
   * Tersedia 5 menu utama yang selalu terlihat dan mudah diakses:
     1. **Beranda (`Home`)** — Ringkasan loker aktif, hub terdekat, dan banner promosi.
     2. **Hub Loker (`Hubs`)** — Pencarian dan daftar lokasi loker di seluruh area.
     3. **Scan QR (`My QR`)** — Kamera pemindai kode fisik loker.
     4. **Loker Saya (`My Locker`)** — Kontrol pintu, timer, dan status unit yang sedang disewa.
     5. **Akun (`Account`)** — Informasi profil, status membership, riwayat transaksi, dan tombol keluar.
2. **Format Tampilan Konsisten:**
   * Kontainer aplikasi dioptimalkan untuk rasio layar ponsel pintar (*mobile screen ratio*).

---

### H. Integritas Database & Jembatan IoT Hardware (Supabase)
1. **Foreign Key Integrity:**
   * Kolom `lockers.current_booking_id` terhubung langsung dengan tabel `bookings.id` dengan aturan `ON DELETE SET NULL`.
2. **Trigger Sinkronisasi Status Otomatis:**
   * Trigger PostgreSQL `trg_sync_booking_locker_status` otomatis mengubah status loker menjadi `occupied` saat booking aktif, dan meresetnya menjadi `available` (`is_occupied = false`, `current_booking_id = null`) saat sewa selesai atau dibatalkan.
3. **Jembatan IoT Siap Pakai:**
   * Kolom `door_command` dan tabel `locker_logs` siap dipantau oleh perangkat mikrokontroler (ESP32-S3) via Supabase Realtime WebSocket tanpa perlu perubahan kode di aplikasi mobile.

---

### I. Aplikasi Android Native (APK)
1. **Kompilasi Standalone:**
   * Aplikasi telah berhasil dikompilasi menjadi paket instalasi Android: `titipin-app-debug.apk` (ukuran ~4.54 MB).
2. **Kompatibilitas Luas:**
   * Mendukung sistem operasi mulai dari Android 7.0 (Nougat / API 24) hingga Android 14/15/16 (API 36).
3. **Terhubung Penuh ke Cloud:**
   * Begitu APK diinstal di smartphone, seluruh fitur langsung berkomunikasi dua arah dengan database cloud Supabase secara *online*.

---

*Dokumentasi ini mencerminkan kondisi kode dan arsitektur aktif pada branch `dev` proyek Titipin.*
