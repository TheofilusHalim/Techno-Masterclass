# PANDUAN PENGUJIAN & EKSEKUSI APLIKASI TITIPIN (v2.0)
**Proyek:** Titipin — Smart Digital Locker Ecosystem  
**Platform:** React 19 + TypeScript + Vite + Tailwind CSS + Capacitor (Android APK) + Supabase Realtime + ESP32-S3 IoT  
**Target Lokasi:** Surabaya (UK Petra, Stasiun Gubeng, Tunjungan Plaza, Petra Library Hub)

---

## 1. Ringkasan Perubahan Arsitektur (Hardware Alignment v2.0)

Berdasarkan kesepakatan blueprint perangkat keras terbaru:
1. **Arah Pemindaian QR (HP Scan Layar Loker):**
   - Unit fisik loker dilengkapi layar **LCD TFT 2.4"** yang menampilkan status loker, nama penyewa, dan **QR Code unik** (`TITIPIN:UK_PETRA:M-07`).
   - Aplikasi di HP pengguna bertindak sebagai **pemindai (QR Scanner kamera aktif)** menggunakan library `html5-qrcode`. Pengguna membuka menu *Scan* dan mengarahkan kamera ke layar LCD loker.
2. **Tanpa Keypad Angka:**
   - Unit fisik **tidak menggunakan keypad PIN fisik**.
   - Metode akses cadangan (*fallback*) adalah:
     - **Modul RFID Reader RC522** (menempelkan kartu/tag RFID terdaftar).
     - **Remote Unlock** langsung dari tombol di aplikasi HP.
     - **Customer Support Override** via Live Chat.
3. **Kendali IoT Realtime di Supabase:**
   - Kolom `lockers.door_command`: bernilai `'UNLOCK'` saat dibuka, lalu otomatis kembali ke `'LOCKED'` setelah 5 detik.
   - Kolom `lockers.is_door_open`: boolean status fisik solenoid door lock (NC 12V).
   - Tabel audit `locker_logs`: mencatat setiap riwayat pembukaan dengan metode `QR_SCAN`, `REMOTE_APP`, `RFID_TAP`, atau `CS_OVERRIDE`.

---

## 2. Cara Menjalankan Aplikasi (Mode Development & Demo)

### A. Menjalankan Web & Simulator
Buka terminal di direktori `titipin-app`:
```bash
cd titipin-app
npm run dev
```
Buka browser di `http://localhost:5173`.
* Pada tampilan layar desktop, di sebelah kanan otomatis muncul **ESP32-S3 Hardware Locker Simulator**:
  * Menampilkan **Layar LCD TFT Virtual** dengan QR Code aktif.
  * Menampilkan animasi pintu 3D dan status **Solenoid NC 12V**.
  * Dilengkapi tombol simulasi **Tap Kartu RFID** dan **Simulasi Remote Unlock**.
  * Terhubung secara live via **Supabase Realtime WebSocket**.

---

## 3. Langkah Menjalankan SQL Patch di Supabase

Untuk memastikan kolom IoT dan tabel log aktif di Supabase:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) proyek Anda.
2. Buka menu **SQL Editor**.
3. Buka file `titipin-app/supabase_patch_v2_hardware_and_logs.sql`, copy seluruh isinya, dan klik **Run**.
4. Script ini akan menambahkan:
   * Kolom `door_command` dan `is_occupied` pada tabel `lockers`.
   * Tabel `locker_logs` beserta Row-Level Security (RLS) untuk publik/demo.
   * Trigger sinkronisasi otomatis `is_occupied`.

---

## 4. Skenario Pengujian / Demo Presentasi

### Skenario 1: Alur Pemesanan Loker (Booking Flow)
1. Di halaman **Home**, pilih hub **Petra Christian University** atau klik **Nearby Lockers**.
2. Pilih ukuran loker:
   * **S (Small)**: Rp2.000/jam (tas ransel/laptop).
   * **M (Medium)**: Rp3.000/jam (koper kabin/tas belanja).
   * **L (Large)**: Rp5.000/jam (koper 60L).
3. Pilih durasi sewa (contoh: 2 jam) dan metode bayar (**QRIS** / E-wallet).
4. Klik **Pay Now** $\rightarrow$ Halaman konfirmasi sukses muncul dan langsung mengarahkan ke loker aktif **M-07**.

### Skenario 2: Membuka Loker dengan Scan QR Kamera HP
1. Klik tombol **Scan** (ikon QR di tengah Bottom Nav) atau tombol **Scan Locker QR** di My Locker.
2. Kamera HP akan aktif dengan viewfinder laser scan modern.
3. Arahkan kamera HP ke layar **LCD TFT** di simulator laptop.
   *(Catatan: Jika menguji di satu laptop yang sama tanpa kamera kedua, cukup klik tombol cepat **Simulasi Scan QR LCD (M-07)** yang tersedia).*
4. Aplikasi memvalidasi payload `TITIPIN:UK_PETRA:M-07` dengan sesi aktif:
   * Pintu loker terbuka (**Solenoid UNLOCKED** selama 5 detik).
   * Log tercatat di Supabase dengan metode `QR_SCAN`.

### Skenario 3: Akses Cadangan via Remote Unlock & RFID
1. Di halaman Scan QR atau My Locker, klik tombol **Buka Kunci Jarak Jauh (Remote Unlock)**. Pintu loker terbuka seketika via internet tanpa perlu memindai QR.
2. Di panel simulator, klik tombol **Simulasi Tap Kartu RFID (A3:F2:9C:11)**. Pintu loker terbuka dengan audit log `RFID_TAP`.

### Skenario 4: Bantuan Darurat Customer Support Override
1. Masuk ke menu **Account** $\rightarrow$ **Live Chat** $\rightarrow$ pilih topik **Locker problem**.
2. Ketik keluhan (contoh: *"Halo, loker saya tidak bisa terbuka"*).
3. Bot / CS otomatis merespons dan mengirim sinyal `CS_OVERRIDE` yang langsung memicu pembukaan pintu loker di Supabase.

---

## 5. Cara Build File Android `.apk` (Capacitor)

Proyek ini telah dikonfigurasi penuh dengan **Capacitor Android**:
- App ID: `com.titipin.app`
- App Name: `Titipin`
- Izin Kamera (`android.permission.CAMERA`) sudah ditambahkan di `AndroidManifest.xml`.

### Langkah Build APK Debug:
1. Pastikan aset web telah di-build dan di-sync:
   ```bash
   cd titipin-app
   npm run cap:build
   ```
2. Buka proyek native di Android Studio:
   ```bash
   npm run cap:android
   ```
   *Atau buka folder `titipin-app/android` langsung dari Android Studio.*
3. Di Android Studio, klik menu **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**.
4. File `app-debug.apk` akan dihasilkan di:
   `titipin-app/android/app/build/outputs/apk/debug/app-debug.apk`
5. Kirim file `.apk` tersebut ke smartphone Android tim untuk demo live!
