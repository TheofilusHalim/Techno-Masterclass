# 📦 Titipin — Smart Digital Locker & IoT Mobile Ecosystem

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20PWA%20%7C%20Web-15803d?style=for-the-badge&logo=android" alt="Platform" />
  <img src="https://img.shields.io/badge/Framework-React%2019%20%7C%20Vite%20%7C%20TypeScript-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Backend-Supabase%20PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI%20Agent-Google%20Gemini-4285f4?style=for-the-badge&logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Hardware-ESP32--S3%20IoT-e7352c?style=for-the-badge&logo=espressif" alt="ESP32" />
</p>

---

## 🌟 Tentang Proyek (Overview)

**Titipin** adalah ekosistem loker pintar digital (*Smart Digital Locker*) terintegrasi berbasis **Internet of Things (IoT)** dan aplikasi mobile-first. Dirancang untuk menjawab kebutuhan mahasiswa, pekerja komuter, dan pengunjung area publik yang membutuhkan fasilitas penitipan barang yang aman, fleksibel, terjangkau, dan 100% mandiri (*self-service*) tanpa kunci fisik konvensional.

Proyek ini dikembangkan sebagai bagian dari mata kuliah **Technopreneurship** di **Program Studi Sistem Informasi Bisnis (EIS), Universitas Kristen Petra**, dengan lokasi pilot project utama di **Hub Petra Christian University (Siwalankerto, Surabaya)**.

---

## ✨ Fitur-Fitur Utama (Key Features)

### 🗺️ 1. Interactive Live Map & Geolocation GPS
- Integrasi peta interaktif berbasis OpenStreetMap & Leaflet untuk menemukan titik loker Titipin terdekat secara *real-time*.
- Izin GPS native Android (`@capacitor/geolocation`) dengan visualisasi pin status ketersediaan loker secara akurat.

### 📦 2. Sewa Fleksibel & Paket Langganan VIP
- **Sewa Per Jam (*Pay-as-you-go*)**: Tersedia ukuran **Small (Rp4.000/jam)**, **Medium (Rp6.000/jam)**, dan **Large (Rp8.000/jam)**.
- **Paket Member VIP Bulanan (Rp125.000/30 Hari)**: Akses gratis sewa loker ukuran S & M sepuasnya (hingga 3 loker bersamaan).
- **Pembayaran Terintegrasi**: Simulasi checkout digital otomatis via QRIS dan E-Wallet (GoPay, OVO, Dana).

### 📲 3. Kontrol Akses Loker Tanpa Kunci Fisik (IoT)
- **Dynamic QR Scanner**: Pengguna mendapatkan kode QR berbatas waktu (*time-expiring security QR*) di layar HP untuk dipindai pada kamera fisik loker Titipin.
- **Remote Emergency Unlock**: Opsi pembukaan pintu darurat langsung dari aplikasi melalui sinkronisasi sinyal *real-time* ke mikrokontroler **ESP32-S3**.

### 🤖 4. 24/7 AI Customer Support ("Titi")
- Asisten layanan pelanggan cerdas ditenagai **Google Gemini API (`gemini-3.5-flash-lite`)**.
- Menguasai *knowledge base* lengkap ekosistem Titipin, mengenali nama pengguna serta status sewa aktif, dan memberikan panduan kendala 24 jam sehari.
- Arsitektur aman: Kunci API tersimpan di database cloud Supabase, bebas risiko terekspos di sisi klien.

### 🔔 5. Notifikasi Sistem Native Android
- Didukung plugin native `@capacitor/local-notifications`.
- Notifikasi *heads-up* melayang di status bar HP lengkap dengan getaran (*vibration*) dan suara saat:
  - Pembayaran berhasil diverifikasi.
  - Peringatan hitung mundur waktu sewa sisa 10 menit (*time-expiry warning*).
  - Pintu loker terbuka atau ditutup.
- Dilengkapi panel simulator pengujian notifikasi langsung di dalam aplikasi.

### 🚀 6. Pembaruan Aplikasi Otomatis (*In-App OTA Update*)
- Sistem pengecekan versi otomatis dari Supabase (`app_versions`).
- Pengguna mendapatkan jendela pop-up pemberitahuan rilis fitur baru (*release notes*) dan dapat mengunduh serta memasang update APK langsung dengan sekali ketuk (*one-tap install*).

### 🌐 7. Multi-Bahasa Reaktif (i18n)
- Penggantian bahasa instan (*real-time reactive*) antara **Bahasa Indonesia (ID)** dan **English (US)** di seluruh layar antarmuka.

---

## 🛠️ Tech Stack & Arsitektur

| Layer | Teknologi | Deskripsi / Fungsi |
|---|---|---|
| **Frontend Framework** | **React 19**, **TypeScript** | Arsitektur UI modular, *type-safe*, dan performa tinggi |
| **Build & Tooling** | **Vite 8**, **Oxlint** | Build bundler ultra-cepat dengan optimasi modern ESM |
| **Mobile Runtime** | **Capacitor 8** | Native cross-platform bridge ke sistem operasi Android |
| **Styling & UI** | **Tailwind CSS v4**, **Lucide React** | Desain mobile-first responsif dengan ikon modern |
| **State Management** | **Zustand 5** | Manajemen state aplikasi ringan, reaktif, dan terisolasi |
| **Database & Auth** | **Supabase (PostgreSQL 15)** | Realtime sync, RLS security policies, dan cloud authentication |
| **Peta & Lokasi** | **Leaflet**, **React-Leaflet**, **OSM** | Render peta interaktif vektor dan deteksi koordinat GPS |
| **AI LLM Engine** | **Google Gemini 3.5 Flash Lite** | Pemrosesan bahasa alami untuk CS Live Chat 24/7 |
| **Hardware / IoT** | **ESP32-S3**, Solenoid Lock, Sensor Pintu, QR Cam | Kontrol mekanik loker fisik dan pembacaan sensor |

---

## 📂 Struktur Direktori Proyek

```text
Techno-Masterclass/
├── titipin-app/                     # Kode Sumber Frontend & Mobile App
│   ├── android/                     # Proyek Native Android (Gradle, SDK 36, Java 21)
│   │   └── app/build/outputs/apk/   # Output kompilasi file APK
│   ├── src/
│   │   ├── components/              # Komponen modular (BottomNav, AppShell, AppUpdateModal, LiveMap)
│   │   ├── lib/                     # Service layer (supabase, lockerService, geminiChatService, notificationService)
│   │   ├── pages/                   # Halaman aplikasi (Home, MyLocker, Payment, ChatSupport, Account, dll.)
│   │   ├── store/                   # State management global (Zustand useStore)
│   │   └── utils/                   # Sistem translasi multi-bahasa (i18n)
│   ├── .env                         # Konfigurasi Supabase URL & Anon Key (Client)
│   ├── package.json                 # Dependensi & script eksekusi
│   └── titipin-app-debug.apk        # File installer APK Android siap pakai
└── README.md                        # Dokumentasi utama proyek
```

---

## 🚀 Panduan Menjalankan Proyek (Getting Started)

### 1. Kloning Repositori
```bash
git clone https://github.com/TheofilusHalim/Techno-Masterclass.git
cd Techno-Masterclass/titipin-app
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Jalankan Server Pengembangan (Web)
```bash
npm run dev
```
Buka browser di alamat: `http://localhost:5173/`

### 4. Kompilasi & Jalankan di Android (APK)
Pastikan Anda telah memasang **Android SDK** dan **Java JDK 21**:
```bash
# Build web assets & sinkronisasi ke proyek native Android
npm run build
npx cap sync

# Kompilasi file APK Android Debug
cd android
./gradlew assembleDebug
```
File APK siap instal akan berada di:  
`titipin-app/android/app/build/outputs/apk/debug/app-debug.apk`


<p align="center">
  <i>Titipin — Solusi Penitipan Barang Pintar, Aman, dan Nyaman di Era Digital.</i>
</p>
