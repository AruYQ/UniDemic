# 🎓 UniDemic

**Your university life, organized.**

> 🌐 **Bahasa**: [Bahasa Indonesia](README.md) | [English](README.en.md)

UniDemic adalah platform produktivitas akademik dan kolaborasi open-source yang dirancang untuk membantu mahasiswa mengelola seluruh ekosistem kehidupan perkuliahan dalam satu aplikasi modern, terintegrasi, dan intuitif.

[![Backend CI](https://github.com/AruYQ/UniDemic/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/AruYQ/UniDemic/actions)
[![Lisensi: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel)](https://laravel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 📑 Daftar Isi

- [✨ Fitur Utama](#-fitur-utama)
- [🗺️ Peta Jalan & Status Pengembangan](#️-peta-jalan--status-pengembangan)
- [🚀 Tumpukan Teknologi](#-tumpukan-teknologi)
- [💻 Panduan Instalasi Cepat](#-panduan-instalasi-cepat)
- [🧪 Pengujian & Penjaminan Kualitas](#-pengujian--penjaminan-kualitas)
- [📖 Indeks Dokumentasi](#-indeks-dokumentasi)
- [🤝 Kontribusi & Kebijakan](#-kontribusi--kebijakan)
- [👥 Tim Pengembang](#-tim-pengembang)

---

## ✨ Fitur Utama

- 🔐 **Autentikasi & Profil Kampus**: Manajemen sesi mobile yang aman via Laravel Sanctum, biodata akademik mahasiswa, preferensi belajar, dan pencabutan token multi-perangkat.
- 📚 **Inti Akademik (Academic Core)**: Manajemen multi-semester, mata kuliah, jadwal perkuliahan mingguan, pelacakan tugas dengan progress bar interaktif, dan hitung mundur jadwal ujian.
- 📊 **Pelacakan Akademik (Academic Tracking)**: Pencatatan presensi dengan gestur geser-hapus otomatis & peringatan batas toleransi alpa, kalkulasi komponen nilai berbobot, nilai akhir mata kuliah, Indeks Prestasi Kumulatif (IPK), dan simulator target IPK interaktif.
- 🎨 **Sistem Tema Dinamis**: Dukungan penuh Mode Gelap (Dark Mode), Mode Terang (Light Mode), dan mode otomatis mengikuti sistem operasi dengan palet warna terstandarisasi.
- ⏱️ **Produktivitas & Fokus**: Manajemen tugas berprioritas & sub-tugas dengan kalkulasi progres otomatis, sesi fokus belajar (Pomodoro, Kustom, Stopwatch) dengan rekap analitik harian/mingguan, target capaian belajar (Goals), dan algoritma perencana jadwal belajar cerdas yang bebas bentrok jadwal kuliah.
- 🤖 **Kecerdasan Akademik AI** *(Direncanakan)*: Ringkasan materi bertenaga Google Gemini, pembuat kuis otomatis, dan asisten riset akademik.

---

## 🗺️ Peta Jalan & Status Pengembangan

Status pengerjaan detail dan riwayat pengerjaan dapat dilihat di [docs/PROGRESS.md](docs/PROGRESS.md).

| Fase | Modul & Fitur | Status Keseluruhan | Backend | Mobile |
| :---: | :--- | :---: | :---: | :---: |
| **1** | **Fondasi** (Autentikasi Sanctum, Penyiapan Dasar, CI/CD, Navigasi) | ✅ Selesai | ✅ Selesai | ✅ Selesai |
| **2** | **Inti Akademik** (Semester, Mata Kuliah, Jadwal, Tugas, Ujian) | ✅ Selesai | ✅ Selesai | ✅ Selesai |
| **3** | **Pelacakan Akademik** (Presensi, Komponen Nilai, IPS/IPK, Simulator) | ✅ Selesai | ✅ Selesai | ✅ Selesai |
| **4** | **Produktivitas** (Tugas, Sasaran Belajar, Sesi Fokus, Perencana Cerdas) | 🔄 Sedang Berjalan | ✅ Selesai (`develop`) | ⏳ Siap Dikerjakan |
| **5** | **Pembelajaran** (Materi, Catatan, Kartu Flash, Kuis) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |
| **6** | **Komunikasi** (Obrolan, Pesan Langsung, Diskusi Kuliah) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |
| **7** | **Kolaborasi** (Kelompok Belajar, Proyek Tim, Papan Kanban) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |
| **8** | **Kecerdasan AI** (Asisten AI, RAG Ringkasan, Generator Kuis) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |
| **9** | **Aplikasi Web** (Dasbor Desktop/Tablet Next.js) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |

---

## 🚀 Tumpukan Teknologi

| Lapisan | Komponen & Pustaka |
| :--- | :--- |
| **Aplikasi Mobile** | React Native, Expo SDK 57, TypeScript, Expo Router |
| **Status & Pengambilan Data** | Zustand, TanStack React Query, Axios |
| **Backend API** | Laravel 11 / PHP 8.3+, Laravel Sanctum |
| **Basis Data** | PostgreSQL 16 |
| **Cache & Antrean** | Redis 7 |
| **Penyimpanan Objek** | MinIO (Kompatibel S3 Lokal) / AWS S3 |
| **Tipe Bersama** | Paket TypeScript Monorepo (`packages/types`) |
| **CI/CD** | GitHub Actions (Pengujian Matriks PHP 8.3 & 8.4) |

---

## 💻 Panduan Instalasi Cepat

### 1. Prasyarat Sistem
- **Docker & Docker Compose**
- **PHP 8.3+** dan **Composer 2.x**
- **Node.js 20+** dan **npm**
- Aplikasi ponsel **Expo Go** (di perangkat fisik Android/iOS) atau Emulator

### 2. Kloning Repositori
```bash
git clone https://github.com/AruYQ/UniDemic.git
cd UniDemic
git checkout develop
```

### 3. Menjalankan Layanan Infrastruktur (Docker)
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```
*Menjalankan PostgreSQL (port 5432), Redis (port 6379), dan MinIO (port 9000 & konsol 9001).*

### 4. Menjalankan Backend API (`apps/api`)
```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
*API siap menerima permintaan di: `http://localhost:8000` (atau `http://10.0.2.2:8000` untuk Emulator Android).*

### 5. Menjalankan Aplikasi Mobile (`apps/mobile`)
```bash
cd ../mobile
npm install
npx expo start
```
*Pindai kode QR menggunakan aplikasi **Expo Go** di ponsel Anda atau tekan tombol `a` untuk membuka Emulator Android.*

---

## 🧪 Pengujian & Penjaminan Kualitas

Sebelum mengajukan integrasi fitur baru, seluruh rangkaian pengujian wajib lulus:

- **Pengujian Unit & Fitur Backend**:
  ```bash
  cd apps/api
  php artisan test
  ```
  *(92 pengujian lulus, 334 asersi mencakup modul Autentikasi, Inti Akademik, Pelacakan Nilai, dan Produktivitas).*

- **Pemeriksaan Tipe Statis Mobile**:
  ```bash
  cd apps/mobile
  npx tsc --noEmit
  ```
  *(0 kesalahan).*

- **Pengujian Integrasi Pelacakan Akademik**:
  ```bash
  cd apps/mobile
  npx tsx scripts/verify-tracking.ts
  ```

---

## 📖 Indeks Dokumentasi

| Dokumen | Deskripsi |
| :--- | :--- |
| [Read.md](Read.md) | Spesifikasi lengkap kebutuhan fungsional dan fitur UniDemic |
| [implementation_plan.md](implementation_plan.md) | Panduan terperinci pelaksanaan 9 fase pengembangan |
| [UI-UX_Guides.md](UI-UX_Guides.md) | Panduan standar desain antarmuka, tipografi, dan prinsip Vibe Coding |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Pelacak progres tugas, gerbang verifikasi, dan pos pemeriksaan |
| [docs/devlog/DEV-A.md](docs/devlog/DEV-A.md) | Jurnal rekayasa teknis backend (rekis-0103) |
| [docs/devlog/DEV-B.md](docs/devlog/DEV-B.md) | Jurnal rekayasa teknis mobile (AruYQ) |
| [docs/decisions/ADR.md](docs/decisions/ADR.md) | Catatan Keputusan Arsitektur (*Architecture Decision Records*) |

---

## 🤝 Kontribusi & Kebijakan

Kami menyambut kontribusi dari komunitas! Sebelum berkontribusi, silakan pelajari dokumen kebijakan berikut:

- 📖 **Panduan Kontribusi**: [Bahasa Indonesia (CONTRIBUTING.md)](CONTRIBUTING.md) | [English (CONTRIBUTING.en.md)](CONTRIBUTING.en.md)
- 📜 **Pedoman Perilaku**: [Bahasa Indonesia (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md) | [English (CODE_OF_CONDUCT.en.md)](CODE_OF_CONDUCT.en.md)
- 🛡️ **Kebijakan Keamanan**: [Bahasa Indonesia (SECURITY.md)](SECURITY.md) | [English (SECURITY.en.md)](SECURITY.en.md)
- ⚖️ **Lisensi Open-Source**: [Lisensi MIT (LICENSE)](LICENSE)

---

## 👥 Tim Pengembang

| Pengembang | Peran | Profil GitHub |
| :--- | :--- | :--- |
| **AruYQ** | Dev B — Ketua Frontend & Mobile | [@AruYQ](https://github.com/AruYQ) |
| **rekis-0103** | Dev A — Ketua Backend & API | [@rekis-0103](https://github.com/rekis-0103) |

---

<p align="center">
  Dibuat dengan ❤️ untuk seluruh mahasiswa Indonesia & dunia.<br>
  <b>UniDemic — Seluruh kehidupan perkuliahan Anda, tertata rapi.</b>
</p>
