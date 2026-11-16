# REQUEST FOR QUOTATION (RFQ) & TECHNICAL SPECIFICATION (REVISED v2.0)
**Nama Proyek:** Titipin — Smart Digital Locker Ecosystem (Android APK/PWA & ESP32-S3 IoT)  
**Tim Pengembang (Kelompok 2 - Kelas A2):** Jerremy Christopher Wijaya, Rikco Fresel Tan, Theo, Kevin William Yuwono  
**Target Eksekusi Development:** Google Antigravity IDE  
**Lokasi Operasional Awal (SOM):** Surabaya (UK Petra, Stasiun Gubeng, Tunjungan Plaza)

---

## 1. RINGKASAN PROYEK & PENYELARASAN HARDWARE (REVISI v2.0)
**Titipin** adalah platform penyewaan loker cerdas berbasis *Internet of Things* (IoT) yang menghubungkan aplikasi seluler pengguna dengan unit loker fisik berbasiskan mikrokontroler **ESP32-S3**.

### Perubahan Arsitektur Utama (Sinkronisasi dengan Blueprint Hardware):
1. **Arah Pemindaian QR (HP Scan Loker):** Layar **LCD TFT** pada unit loker fisik menampilkan identitas/QR Code unik loker beserta status ketersediaan (`kosong` / `terisi`), nama penyewa, dan lokasi. Pengguna membuka kamera pemindai (*QR Scanner*) di aplikasi HP untuk memindai QR di pintu loker agar kunci terbuka.
2. **Akses Cadangan via RFID & Remote Unlock:** Karena unit fisik tidak menggunakan *keypad* angka, metode akses cadangan (*fallback*) menggunakan **Modul Pembaca RFID** pada pintu loker serta tombol **Open Locker (Remote Unlock)** di aplikasi HP.
3. **Unit Purwarupa Fisik ($20 \times 20 \times 20\text{ cm}$):** Menggunakan **ESP32-S3**, **Solenoid Door Lock (Normally Closed / NC)**, **LCD TFT**, **RFID Reader**, dan **LED Indikator**.

---

## 2. REKOMENDASI TECH STACK & TRANSPARANSI BIAYA
Seluruh komponen perangkat lunak di bawah ini dipilih agar **bebas biaya (Rp 0)** selama fase pengembangan, pengujian, maupun demo presentasi di HP Android.

| Layer | Teknologi | Biaya & Catatan Transparansi |
| :--- | :--- | :--- |
| **Frontend & Mobile App** | **React 19 + TypeScript + Vite + Tailwind CSS** | **Rp 0 (Gratis).** Menggunakan library `html5-qrcode` untuk fitur kamera *scanner* QR di HP. |
| **Pembungkus Android (.APK)** | **Capacitor (`@capacitor/android`)** + Android Studio | **Rp 0 (Gratis).** Menghasilkan file `app-debug.apk` yang bisa langsung dikirim ke HP Android dan di-install tanpa perlu membayar akun Google Play Store ($25 hanya jika rilis ke publik di Play Store). |
| **Backend & Realtime DB** | **Supabase (PostgreSQL + Realtime)** | **Rp 0 (Free Tier).** *Catatan: Proyek free tier akan otomatis di-pause jika tidak ada aktivitas query selama 7 hari berturut-turut; pastikan membuka aplikasi 1 hari sebelum demo.* |
| **Hosting Web / PWA** | **Vercel** | **Rp 0 (Hobby Plan).** Menyediakan HTTPS otomatis (wajib agar izin kamera HP berfungsi jika dijalankan lewat browser). |
| **Firmware IoT** | **Arduino IDE / PlatformIO (C++) pada ESP32-S3** | **Rp 0 (Gratis).** Menggunakan library `WiFi.h`, `HTTPClient.h`, dan `ArduinoJson.h`. |

---

## 3. ENTITY RELATIONSHIP DIAGRAM (ERD) & SKEMA DATABASE
Database menggunakan **PostgreSQL (Supabase)** dengan 5 tabel utama yang saling berelasi untuk mendukung transaksi sewa, pelacakan *real-time* pintu loker, dan riwayat log pembukaan kunci.

### Diagram Relasi Entitas (ERD)
```
+-------------------+       +-------------------+       +-------------------+
|       users       |       |     bookings      |       |   transactions    |
+-------------------+       +-------------------+       +-------------------+
| PK id (uuid)      |---┐   | PK id (uuid)      |---┐   | PK id (uuid)      |
|    full_name      |   └──<| FK user_id        |   └──<| FK booking_id     |
|    email          |       | FK locker_id      |---┐   | FK user_id        |
|    rfid_uid       |       |    plan_type      |   |   |    amount         |
|    has_monthly_sub|       |    duration_hours |   |   |    payment_method |
|    sub_expires_at |       |    start_time     |   |   |    status         |
|    created_at     |       |    end_time       |   |   |    created_at     |
+-------------------+       |    status         |   |   +-------------------+
                            |    created_at     |   |
                            +-------------------+   |
                                                    |
+-------------------+       +-------------------+   |   +-------------------+
|       hubs        |       |      lockers      |   |   |    locker_logs    |
+-------------------+       +-------------------+   |   +-------------------+
| PK id (uuid)      |---┐   | PK id (uuid)      |<--┘   | PK id (uuid)      |
|    name           |   └──<| FK hub_id         |------<| FK locker_id      |
|    address        |       |    locker_code    |       | FK booking_id     |
|    category       |       |    size           |       |    access_method  |
|    latitude       |       |    hourly_rate    |       |    action         |
|    longitude      |       |    is_occupied    |       |    created_at     |
|    distance_label |       |    door_command   |       +-------------------+
+-------------------+       |    qr_payload     |
                            |    updated_at     |
                            +-------------------+
```

### Kamus Data (Data Dictionary)

1. **`users` (Data Pengguna)**
   * `id` (`uuid`, PK): ID unik pengguna.
   * `full_name` (`varchar`): Nama lengkap (contoh: `Kevin`).
   * `email` (`varchar`, Unique): Alamat email login.
   * `rfid_uid` (`varchar`, Nullable): Kode unik kartu RFID milik pengguna untuk akses cadangan di loker.
   * `has_monthly_sub` (`boolean`, Default `false`): Status apakah pengguna memiliki paket *Monthly Plan* (Rp125.000/bulan).
   * `sub_expires_at` (`timestamptz`, Nullable): Tanggal berakhirnya paket langganan bulanan.

2. **`hubs` (Lokasi Stasiun Loker)**
   * `id` (`uuid`, PK): ID unik lokasi.
   * `name` (`varchar`): Nama lokasi (contoh: `Petra Christian University`, `Petra Library Hub`, `Gubeng Station`, `Tunjungan Plaza`).
   * `address` (`varchar`): Detail letak (contoh: `Gedung P lobby, ground floor`).
   * `category` (`varchar`): Kategori lokasi (`Campus`, `Station`, `Mall`).
   * `distance_label` (`varchar`): Informasi jarak & estimasi waktu jalan kaki.

3. **`lockers` (Unit Loker Fisik — Terhubung ke ESP32-S3)**
   * `id` (`uuid`, PK): ID unik unit loker.
   * `hub_id` (`uuid`, FK $\rightarrow$ `hubs.id`): Lokasi tempat loker berada.
   * `locker_code` (`varchar`, Unique): Kode unit yang tampil di UI dan layar LCD (contoh: `M-07`).
   * `size` (`varchar`): Ukuran loker (`S`, `M`, `L`).
   * `hourly_rate` (`integer`): Tarif sewa per jam dalam Rupiah (`2000` untuk S, `3000` untuk M, `5000` untuk L).
   * `is_occupied` (`boolean`, Default `false`): Status apakah loker sedang disewa (`false` = kosong, `true` = terisi).
   * `door_command` (`varchar`, Default `'LOCKED'`): **Kolom kendali IoT.** Bernilai `'LOCKED'` atau `'UNLOCK'`. ESP32-S3 memantau kolom ini; saat berubah menjadi `'UNLOCK'`, solenoid terbuka selama 5 detik lalu ESP32-S3 meresetnya kembali ke `'LOCKED'`.
   * `qr_payload` (`varchar`, Unique): String kode yang dirender menjadi QR Code pada layar LCD TFT loker (contoh: `TITIPIN:UK_PETRA:M-07`).

4. **`bookings` (Sesi Penyewaan Loker)**
   * `id` (`uuid`, PK): ID sesi sewa.
   * `user_id` (`uuid`, FK $\rightarrow$ `users.id`): Penyewa loker.
   * `locker_id` (`uuid`, FK $\rightarrow$ `lockers.id`): Loker yang disewa.
   * `plan_type` (`varchar`): Jenis paket (`'per_hour'` atau `'subscription'`).
   * `duration_hours` (`integer`): Durasi sewa dalam jam.
   * `start_time` (`timestamptz`): Waktu mulai sewa.
   * `end_time` (`timestamptz`): Waktu berakhirnya sewa (acuan *live countdown timer*).
   * `status` (`varchar`): Status sewa (`'active'`, `'finished'`, `'overdue'`).

5. **`transactions` (Riwayat Pembayaran)**
   * `id` (`uuid`, PK): ID transaksi.
   * `booking_id` (`uuid`, FK $\rightarrow$ `bookings.id`, Nullable): Referensi sesi sewa (null jika transaksi pembelian *Monthly Plan*).
   * `user_id` (`uuid`, FK $\rightarrow$ `users.id`): Pembayar.
   * `amount` (`integer`): Nominal pembayaran (contoh: `6000` atau `125000`).
   * `payment_method` (`varchar`): Metode bayar (`'QRIS'`, `'E-wallet'`, `'Virtual account'`, `'Subscription'`).
   * `status` (`varchar`): Status transaksi (`'Success'`, `'Plan'`).

6. **`locker_logs` (Log Aktivitas Pintu & Audit IoT)**
   * `id` (`uuid`, PK): ID log.
   * `locker_id` (`uuid`, FK $\rightarrow$ `lockers.id`): Unit loker terkait.
   * `booking_id` (`uuid`, FK $\rightarrow$ `bookings.id`): Sesi sewa terkait.
   * `access_method` (`varchar`): Metode pembukaan pintu (`'QR_SCAN'`, `'REMOTE_APP'`, `'RFID_TAP'`, `'CS_OVERRIDE'`).
   * `action` (`varchar`): Aksi yang dilakukan (`'DOOR_UNLOCKED'`, `'EXTENDED_1HR'`).

---

## 4. ALUR INTEGRASI END-TO-END (HP ANDROID $\leftrightarrow$ SUPABASE $\leftrightarrow$ ESP32-S3)

1. **Tampilan Awal Layar LCD TFT Loker:**
   * Saat `is_occupied = false`, layar LCD TFT di pintu loker menampilkan teks: `Status loker: kosong`, lokasi hub, serta gambar **QR Code** berisi `qr_payload` (`TITIPIN:UK_PETRA:M-07`).
2. **Proses Booking di HP Android:**
   * Pengguna memilih `Petra Christian University` $\rightarrow$ memilih ukuran `M` $\rightarrow$ memilih durasi `2 hr` (Rp6.000) $\rightarrow$ bayar via `QRIS`.
   * Aplikasi menyimpan data ke tabel `bookings` dan `transactions`, serta mengubah `lockers.is_occupied = true`. Layar LCD TFT di loker otomatis memperbarui tampilan menjadi `Status loker: terisi` dan menampilkan `Nama: Kevin`.
3. **Proses Membuka Loker (Scan QR dari HP):**
   * Pengguna menekan tombol tengah **QR** di aplikasi HP $\rightarrow$ kamera HP terbuka $\rightarrow$ diarahkan ke QR Code pada layar LCD TFT loker.
   * Aplikasi mencocokkan hasil scan (`TITIPIN:UK_PETRA:M-07`) dengan sesi `bookings` milik pengguna yang berstatus `'active'`.
   * Jika cocok dan `end_time > waktu_sekarang`, aplikasi mengirim perintah ke Supabase: `UPDATE lockers SET door_command = 'UNLOCK' WHERE locker_code = 'M-07'` dan mencatatnya di `locker_logs`.
4. **Eksekusi Hardware ESP32-S3:**
   * ESP32-S3 mendeteksi perubahan `door_command == 'UNLOCK'`, menyalakan **LED Indikator**, memutus arus **Solenoid (NC)** selama 5 detik sehingga pintu loker terbuka, lalu mengirim permintaan `UPDATE lockers SET door_command = 'LOCKED'`.

---

## 5. RENCANA ANGGARAN & BILL OF MATERIALS (RFQ QUOTATION)

### A. Biaya Perangkat Lunak & Deployment (Software CapEx)
| Item Pekerjaan | Spesifikasi | Estimasi Biaya Pasar | Biaya Aktual Tim |
| :--- | :--- | :--- | :--- |
| **Aplikasi Web & Android APK** | React + TypeScript + Tailwind + Capacitor APK | Rp 6.000.000 | **Rp 0** (Dikerjakan via Antigravity) |
| **Backend Database & Realtime API** | Supabase PostgreSQL (Free Tier 500MB) | Rp 2.500.000 | **Rp 0** (Gratis) |
| **Hosting Web / PWA HTTPS** | Vercel Hobby Plan | Rp 1.500.000 | **Rp 0** (Gratis) |
| **Total Software** | | **Rp 10.000.000** | **Rp 0** |

### B. Biaya Perangkat Keras Loker Fisik (Hardware CapEx)
*Catatan: Mengacu pada blueprint komponen ESP32-S3 yang dirancang tim.*

| Komponen Hardware | Spesifikasi Teknis | Estimasi Biaya Demo (1 Unit Maket $20\times20\times20\text{ cm}$) |
| :--- | :--- | :--- |
| **Mikrokontroler** | ESP32-S3 DevKitC (Wi-Fi + Bluetooth) | Rp 95.000 |
| **Layar Tampilan Pintu** | LCD TFT SPI (2.4" / 2.8" ILI9341) | Rp 85.000 |
| **Modul RFID** | RFID Reader RC522 + Kartu/Tag RFID | Rp 25.000 |
| **Kunci Elektrik & Relay** | Solenoid Door Lock 12V (NC) + Relay 1 Channel | Rp 75.000 |
| **Catu Daya & Indikator** | Adaptor 12V + Step-down 5V + LED Indikator + Kabel | Rp 45.000 |
| **Box Purwarupa** | Rangka Box $20 \times 20 \times 20\text{ cm}$ (Akrilik/3D Print/Plywood) | Rp 75.000 |
| **Total Hardware Demo** | | **Rp 400.000 / unit purwarupa** |

---

## 6. MASTER PROMPT UNTUK GOOGLE ANTIGRAVITY (DATABASE-FIRST)
Gunakan *prompt* berikut di Google Antigravity setelah kamu membuat proyek gratis di Supabase dan menyiapkan kredensialnya:

> **Prompt untuk Google Antigravity:**
> "Read `@dokumen_rfq_dan_spesifikasi_teknis_titipin.md` and `@AI-Design-Prototipe_A2_Kel2.pdf`.
> 
> We are refactoring and building the **Titipin** mobile-first web application (React + TypeScript + Vite + Tailwind CSS) with a **Database-First approach** connected to **Supabase (PostgreSQL)** and aligned with our **ESP32-S3 Smart Locker hardware blueprint**:
> 1. **Database Setup:** Generate the complete SQL migration script (`supabase_schema.sql`) based on Section 3 (ERD) for `users`, `hubs`, `lockers`, `bookings`, `transactions`, and `locker_logs`, including seed data for our 4 Surabaya hubs (`Petra Christian University` with active/available `Locker M-07`, `Petra Library Hub`, `Gubeng Station`, `Tunjungan Plaza`).
> 2. **Hardware-Aligned QR Flow:** Replace the static QR display on screen `07` with a real **Camera QR Code Scanner** (`html5-qrcode`) so the user's phone scans the QR code displayed on the locker's TFT LCD (`TITIPIN:UK_PETRA:M-07`). When scanned or when 'Open locker' is clicked, validate the active booking in Supabase and update `lockers.door_command` to `'UNLOCK'`.
> 3. **UI Parity & Android Readiness:** Maintain the exact emerald-green (`#15803d`) mobile UI from the PDF across all screens, remove PIN keypad references (replace fallback instructions with RFID Card Tap / Remote Unlock), and configure **Capacitor** (`@capacitor/core`, `@capacitor/android`) so we can build an Android `.apk` for live demo."