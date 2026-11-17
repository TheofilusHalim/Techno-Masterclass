# Product Requirement Document (PRD) — Titipin (Smart Digital Locker)
**Version:** 2.0 (Agile MVP)  
**Author:** @Project_Manager (Product Owner & Scrum Master)  
**Target Platform:** Mobile-First Web App (PWA) + Android APK via Capacitor  
**Core Target Users:** Mahasiswa Kampus (UK Petra), Traveller (Persona Melina - Tas Carrier Besar), Pekerja Dinas  

---

## 1. Executive Summary & Business Goals
Titipin adalah ekosistem loker penyimpanan digital pintar berbasis IoT yang memfasilitasi penitipan barang aman, fleksibel, dan mandiri tanpa kunci fisik di titik-titik mobilitas tinggi Surabaya (Kampus UK Petra, Stasiun Gubeng, Tunjungan Plaza).

### Key Metrics & Success Criteria
1. **Time-to-Locker:** Pemesanan hingga mendapatkan akses loker selesai dalam < 3 klik (< 60 detik).
2. **Zero Physical Keys:** 100% pembukaan berbasis digital (Dynamic QR Scan kamera HP + Fallback RFID & Remote Unlock).
3. **Hardware Solenoid Feedback:** Respon pembukaan solenoid ≤ 1 detik via Supabase Realtime WebSocket.
4. **Anti-Fine Extension:** Pengguna menerima notifikasi proaktif 10 menit sebelum sewa habis dan dapat memperpanjang durasi (+1 jam) langsung dari aplikasi.

---

## 2. User Personas & Core User Stories

### Persona 1: Melina (Traveller / Backpacker)
- **Pain Point:** Membawa tas *carrier* ukuran 60L setelah tiba di Surabaya, belum bisa check-in hotel, kesulitan mencari penitipan barang berukuran besar.
- **Goal:** Menemukan loker ukuran L yang kosong di sekitar stasiun/mall, sewa hitungan jam, dan membuka pintu dengan scan QR via HP.

### Persona 2: Kevin / Theo (Mahasiswa Kampus UK Petra)
- **Pain Point:** Membawa laptop dan perlengkapan studio yang berat di kampus, butuh penitipan praktis saat beraktivitas antar gedung P dan Perpustakaan.
- **Goal:** Melihat ketersediaan loker secara live di Gedung P / Library, sewa cepat dengan QRIS / langganan bulanan.

---

## 3. Product Backlog & Acceptance Criteria (Epic Breakdown)

### Epic 1: Real-Time Availability & Map
- **US-1.1:** Pengguna dapat melihat peta interaktif (Leaflet OSM) dengan pin lokasi hub dan jumlah loker kosong realtime.
  - *Acceptance Criteria (AC):*
    - Koordinat pin akurat di Surabaya (UK Petra: `-7.3395, 112.7375`, Library: `-7.3398, 112.7369`, Gubeng: `-7.2653, 112.7522`, TP: `-7.2628, 112.7392`).
    - Menampilkan indikator GPS posisi pengguna (titik biru pulsing).
    - Status ketersediaan otomatis sinkron via Realtime WebSocket tanpa refresh halaman.

### Epic 2: Multi-Size Locker Selection & Smart Booking
- **US-2.1:** Pengguna dapat memilih ukuran loker (S, M, L) dengan transparansi dimensi dan harga.
  - *AC:*
    - S (Rp 2.000/jam): Tas selempang, helm, barang kecil.
    - M (Rp 3.000/jam): Ransel kuliah, laptop 15 inch.
    - L (Rp 5.000/jam): Koper kabin, tas carrier 60L.
    - Jika slot ukuran tertentu habis (0 free), tombol tidak dapat dipilih dan ditandai disable.

### Epic 3: Flexible Pricing & Digital Payment Simulation
- **US-3.1:** Pengguna dapat memilih durasi sewa (per jam) atau opsi Monthly Subscription (Rp 125.000/bln).
- **US-3.2:** Pengguna dapat menyelesaikan transaksi simulasi pembayaran digital (QRIS, E-Wallet GoPay/OVO/ShopeePay, Virtual Account BCA/Mandiri).
  - *AC:*
    - Transaksi tercatat di tabel `transactions` dan mengaktifkan record di `bookings`.
    - Loker yang dibooking otomatis berubah status menjadi `occupied` (`is_occupied = true`) untuk mencegah *double-booking*.

### Epic 4: Dual Digital Key & IoT Hardware Simulator
- **US-4.1:** Pengguna dapat membuka pintu loker dengan memindai Dynamic QR di layar TFT LCD loker menggunakan kamera HP.
- **US-4.2:** Terdapat tombol *fallback* "Open Locker" (Remote Unlock) di aplikasi dan simulasi Tap Kartu RFID.
  - *AC:*
    - Perintah unlock mengubah kolom `door_command = 'UNLOCK'` di Supabase.
    - Panel Simulator Hardware ESP32-S3 mendeteksi perubahan realtime: status solenoid berubah menjadi *UNLOCKED (NO)* selama 5 detik, pintu terbuka 3D, lalu otomatis kembali ke *LOCKED (NC)*.
    - Setiap aktivitas pembukaan pintu dicatat di tabel audit `locker_logs`.

### Epic 5: Active Booking & Anti-Fine Extension
- **US-5.1:** Pengguna memiliki halaman *My Locker* yang menampilkan live countdown timer durasi sewa aktif.
- **US-5.2:** Notifikasi pengingat muncul ketika durasi sewa tersisa ≤ 10 menit.
- **US-5.3:** Pengguna dapat menekan tombol **Extend +1 hr** untuk menambah masa aktif sewa secara instan.
  - *AC:*
    - `end_time` / `expires_at` bertambah 3.600 detik (1 jam).
    - Log penambahan waktu tersimpan dan status timer diperbarui tanpa lag.

---

## 4. Sprint Breakdown (Agile Scrum 3-Sprint Roadmap)

| Sprint | Fokus Utama | Target Deliverables |
| :--- | :--- | :--- |
| **Sprint 1: Core Foundation & Data Architecture** | Setup Arsitektur, Supabase DB, RLS, Autentikasi, & Mockup Simulator | - Skema SQL & Relasi Supabase (`hubs`, `lockers`, `bookings`, `transactions`, `locker_logs`)<br>- Realtime WebSocket channel setup<br>- UI Framework (React 19 + Tailwind CSS mobile viewport `max-w-md` + Desktop Simulator layout) |
| **Sprint 2: Discovery, Booking & IoT Solenoid Flow** | Live Map, Pemilihan Loker S/M/L, Checkout Payment, & Hardware Unlock | - Komponen `LiveMap` (Leaflet OSM) akurat Surabaya<br>- Halaman `NearbyLockers`, `HubDetail`, dan alur pembayaran QRIS/VA<br>- Kamera pemindai QR (`html5-qrcode`)<br>- Panel `SimulatorPanel` (animasi solenoid 5 detik + door command sync) |
| **Sprint 3: Active Lifecycle, Extension, APK & Hardening** | Countdown Timer, Extend +1 hr, Audit Log, E2E Testing, & Capacitor APK | - Halaman `MyLocker` dengan timer & tombol perpanjangan (+1 hr)<br>- Halaman riwayat `Transactions` & notifikasi anti-denda<br>- E2E Walkthrough & QA Audit<br>- Build Capacitor Android APK (`app-debug.apk`) |

---

## 5. Definition of Done (DoD)
Sebuah *user story* dinyatakan selesai (*Done*) jika memenuhi kriteria:
1. **Code Quality:** Bebas dari TypeScript error (`tsc -b` lulus tanpa error) dan console error saat runtime.
2. **Realtime Integrity:** Perubahan status loker & perintah pintu tersinkronisasi dua arah via Supabase Realtime < 1 detik.
3. **Responsive UI:** Tampilan mobile-first presisi pada lebar maksimal `430px` (desktop menampilkan frame HP di kiri dan IoT Simulator di kanan).
4. **Data Consistency:** Tidak ada kondisi *race condition* atau *double-booking* pada slot loker yang sama.
5. **Traceability:** Setiap event pembukaan pintu wajib tercatat di tabel `locker_logs`.
