# 🎓 UniDemic

**Your university life, organized.**

UniDemic adalah platform produktivitas akademik dan kolaborasi open-source yang dirancang untuk membantu mahasiswa mengelola seluruh ekosistem kehidupan perkuliahan dalam satu aplikasi modern, terintegrasi, dan intuitif.

[![Backend CI](https://github.com/AruYQ/UniDemic/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/AruYQ/UniDemic/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel)](https://laravel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 📑 Daftar Isi

- [✨ Fitur Utama](#-fitur-utama)
- [🗺️ Roadmap & Status Pengembangan](#️-roadmap--status-pengembangan)
- [🚀 Tech Stack](#-tech-stack)
- [💻 Panduan Instalasi Cepat (Quick Start)](#-panduan-instalasi-cepat-quick-start)
- [🧪 Pengujian & Quality Assurance](#-pengujian--quality-assurance)
- [📖 Indeks Dokumentasi](#-indeks-dokumentasi)
- [🤝 Kontribusi & Kebijakan](#-kontribusi--kebijakan)
- [👥 Tim Pengembang](#-tim-pengembang)

---

## ✨ Fitur Utama

- 🔐 **Autentikasi & Profil Kampus**: Manajemen sesi mobile yang aman via Laravel Sanctum, biodata akademik mahasiswa, preferensi belajar, dan manajemen multi-device token.
- 📚 **Academic Core**: Manajemen multi-semester, mata kuliah, jadwal perkuliahan mingguan, tugas (*assignments*) dengan progress tracking interaktif, dan jadwal ujian (*exams*).
- 📊 **Academic Tracking**: Pencatatan presensi dengan notifikasi batas absensi, kalkulasi nilai komponen berbobot, Indeks Prestasi Semester (IPS), Indeks Prestasi Kumulatif (IPK), dan simulator target IPK.
- ⏱️ **Productivity & Focus** *(Planned)*: Study planner harian, matriks prioritas tugas, dan timer fokus Pomodoro.
- 🤖 **AI Academic Intelligence** *(Planned)*: Ringkasan materi bertenaga Google Gemini, generator kuis otomatis, dan asisten riset materi kuliah.

---

## 🗺️ Roadmap & Status Pengembangan

Status pengerjaan detail dan histori commit dapat dilihat di [docs/PROGRESS.md](docs/PROGRESS.md).

| Phase | Modul & Fitur | Status | Backend | Mobile |
| :---: | :--- | :---: | :---: | :---: |
| **1** | **Foundation** (Auth Sanctum, Base Setup, CI/CD, Navigation) | ✅ Selesai | ✅ Selesai | ✅ Selesai |
| **2** | **Academic Core** (Semesters, Courses, Schedules, Tasks, Exams) | ✅ Selesai | ✅ Selesai | ✅ Selesai |
| **3** | **Academic Tracking** (Attendance, Grades, IPS/IPK, Simulator) | 🔄 Sedang Berjalan | ✅ Selesai | ⏳ Dalam Antrean |
| **4** | **Productivity** (Tasks, Study Planner, Focus Timer) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |
| **5** | **Learning** (Materials, Notes, Flashcards, Quiz) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |
| **6** | **Communication** (Chat, DM, Course Discussion) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |
| **7** | **Collaboration** (Study Groups, Projects, Kanban) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |
| **8** | **Intelligence (AI)** (AI Assistant, RAG, Quiz Gen) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |
| **9** | **Web Companion** (Next.js Desktop/Tablet Dashboard) | ⏳ Terjadwal | ⏳ Terjadwal | ⏳ Terjadwal |

---

## 🚀 Tech Stack

| Layer | Komponen & Library |
| :--- | :--- |
| **Mobile App** | React Native, Expo SDK 57, TypeScript, Expo Router |
| **State & Fetching** | Zustand, TanStack React Query, Axios |
| **Backend API** | Laravel 11 / PHP 8.3+, Laravel Sanctum |
| **Database** | PostgreSQL 16 |
| **Cache & Queue** | Redis 7 |
| **Object Storage** | MinIO (Local S3-compatible) / AWS S3 |
| **Shared Types** | TypeScript Monorepo Package (`packages/types`) |
| **CI/CD** | GitHub Actions (Matrix Test PHP 8.3 & 8.4) |

---

## 💻 Panduan Instalasi Cepat (Quick Start)

### 1. Prasyarat Sistem
- **Docker & Docker Compose**
- **PHP 8.3+** dan **Composer 2.x**
- **Node.js 20+** dan **npm**
- Aplikasi **Expo Go** (pada perangkat Android/iOS) atau Emulator

### 2. Kloning Repositori
```bash
git clone https://github.com/AruYQ/UniDemic.git
cd UniDemic
git checkout develop
```

### 3. Menjalankan Infrastruktur Database & Cache (Docker)
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```
*Layanan PostgreSQL (port 5432), Redis (port 6379), dan MinIO (port 9000 & 9001) akan berjalan di latar belakang.*

### 4. Menjalankan Backend API (`apps/api`)
```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
*API siap menerima request di: `http://localhost:8000` (atau `http://10.0.2.2:8000` untuk Android Emulator).*

### 5. Menjalankan Aplikasi Mobile (`apps/mobile`)
```bash
cd ../mobile
npm install
npx expo start
```
*Scan QR code menggunakan aplikasi **Expo Go** di ponsel Anda atau tekan `a` untuk membuka Android Emulator.*

---

## 🧪 Pengujian & Quality Assurance

Sebelum melakukan integrasi fitur baru, seluruh test suite wajib lulus pengujian:

- **Backend Unit & Feature Test**:
  ```bash
  cd apps/api
  php artisan test
  ```
- **Mobile TypeScript Verification**:
  ```bash
  cd apps/mobile
  npx tsc --noEmit
  ```

---

## 📖 Indeks Dokumentasi

| Dokumen | Deskripsi |
| :--- | :--- |
| [Read.md](Read.md) | Spesifikasi lengkap kebutuhan dan fitur sistem UniDemic |
| [implementation_plan.md](implementation_plan.md) | Panduan langkah per langkah implementasi 9 phase |
| [UI-UX_Guides.md](UI-UX_Guides.md) | Standar desain, token tipografi Syne & Inter, dan prinsip Vibe Coding |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Tracker status tugas, checkpoint verifikasi, dan checklist phase |
| [docs/devlog/DEV-A.md](docs/devlog/DEV-A.md) | Log teknis pengerjaan Backend (rekis-0103) |
| [docs/devlog/DEV-B.md](docs/devlog/DEV-B.md) | Log teknis pengerjaan Frontend Mobile (AruYQ) |
| [docs/decisions/ADR.md](docs/decisions/ADR.md) | Architecture Decision Records (ADR) |

---

## 🤝 Kontribusi & Kebijakan

Kami mengundang kontribusi komunitas! Sebelum berkontribusi, harap membaca panduan berikut:

- 📖 [Panduan Kontribusi (CONTRIBUTING.md)](CONTRIBUTING.md) — Alur Git branch, format pesan commit, dan proses review PR.
- 📜 [Kode Etik (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md) — Standar norma komunikasi komunitas berbasis Contributor Covenant v2.1.
- 🛡️ [Kebijakan Keamanan (SECURITY.md)](SECURITY.md) — Tata cara pelaporan kerentanan keamanan secara bertanggung jawab.
- ⚖️ [Lisensi Open-Source (LICENSE)](LICENSE) — Dirilis di bawah lisensi resmi **MIT License**.

---

## 👥 Tim Pengembang

| Pengembang | Peran | GitHub |
| :--- | :--- | :--- |
| **AruYQ** | Dev B — Frontend & Mobile Lead | [@AruYQ](https://github.com/AruYQ) |
| **rekis-0103** | Dev A — Backend & API Lead | [@rekis-0103](https://github.com/rekis-0103) |

---

<p align="center">
  Dibuat dengan ❤️ untuk seluruh mahasiswa Indonesia & dunia.<br>
  <b>UniDemic — One platform for your academic life.</b>
</p>
