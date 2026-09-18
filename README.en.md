# 🎓 UniDemic

**Your university life, organized.**

> 🌐 **Language**: [English](README.en.md) | [Bahasa Indonesia](README.md)

UniDemic is an open-source academic productivity and collaboration platform designed to help university students manage their entire campus lifecycle in one unified, modern, and intuitive application.

[![Backend CI](https://github.com/AruYQ/UniDemic/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/AruYQ/UniDemic/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel)](https://laravel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🗺️ Roadmap & Development Status](#️-roadmap--development-status)
- [🚀 Tech Stack](#-tech-stack)
- [💻 Quick Start Guide](#-quick-start-guide)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [📖 Documentation Index](#-documentation-index)
- [🤝 Contributing & Policies](#-contributing--policies)
- [👥 Development Team](#-development-team)

---

## ✨ Key Features

- 🔐 **Authentication & Campus Profile**: Secure mobile session management via Laravel Sanctum, student academic profile, study preferences, and multi-device token revocation.
- 📚 **Academic Core**: Multi-semester management, courses, weekly lecture schedule, assignment tracking with interactive progress bars, and exam countdowns.
- 📊 **Academic Tracking**: Attendance logging with automatic swipe-to-delete confirmation & threshold warning alerts, weighted grade components, course GPAs, cumulative GPA calculation, and interactive target GPA simulator.
- 🎨 **Dynamic Theme System**: Full support for Dark Mode, Light Mode, and system-adaptive modes with consistent color token palettes.
- ⏱️ **Productivity & Focus**: Priority tasks & subtasks with reactive auto-progress, focus timer sessions (Pomodoro, Custom, Stopwatch) with daily/weekly analytics summary, milestone goals, and smart study planner algorithm with class schedule conflict detection.
- 📖 **Self-Directed Learning (Learning Module)**: Course materials repository, markdown notes with bi-directional linking network, spaced repetition flashcards powered by the *SuperMemo SM-2* algorithm with 3D flip card animations, and interactive practice quizzes with dynamic *Fisher-Yates* session randomization.
- 🤖 **AI Academic Intelligence** *(Planned)*: Automated lecture notes summarization powered by Google Gemini, smart quiz generator, and academic research assistant.

---

## 🗺️ Roadmap & Development Status

For detailed task tracking and commit history, visit [docs/PROGRESS.md](docs/PROGRESS.md).

| Phase | Module & Features | Overall Status | Backend | Mobile |
| :---: | :--- | :---: | :---: | :---: |
| **1** | **Foundation** (Sanctum Auth, Base Setup, CI/CD, Navigation) | ✅ Completed | ✅ Completed | ✅ Completed |
| **2** | **Academic Core** (Semesters, Courses, Schedules, Tasks, Exams) | ✅ Completed | ✅ Completed | ✅ Completed |
| **3** | **Academic Tracking** (Attendance, Grades, GPA/CGPA, Simulator) | ✅ Completed | ✅ Completed | ✅ Completed |
| **4** | **Productivity** (Tasks, Goals, Study Sessions, Study Planner) | ✅ Completed | ✅ Completed | ✅ Completed |
| **5** | **Learning** (Materials, Notes, Flashcards, Quiz) | ✅ Completed | ✅ Completed | ✅ Completed |
| **6** | **Communication** (Chat, Direct Messages, Course Discussion) | ⏳ Scheduled | ⏳ Scheduled | ⏳ Scheduled |
| **7** | **Collaboration** (Study Groups, Projects, Kanban Board) | ⏳ Scheduled | ⏳ Scheduled | ⏳ Scheduled |
| **8** | **Intelligence (AI)** (AI Assistant, RAG Summarization, Quiz Gen) | ⏳ Scheduled | ⏳ Scheduled | ⏳ Scheduled |
| **9** | **Web Companion** (Next.js Desktop/Tablet Dashboard) | ⏳ Scheduled | ⏳ Scheduled | ⏳ Scheduled |

---

## 🚀 Tech Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Mobile App** | React Native, Expo SDK 57, TypeScript, Expo Router |
| **State & Data Fetching** | Zustand, TanStack React Query, Axios |
| **Backend API** | Laravel 11 / PHP 8.3+, Laravel Sanctum |
| **Database** | PostgreSQL 16 |
| **Cache & Queues** | Redis 7 |
| **Object Storage** | MinIO (Local S3-compatible) / AWS S3 |
| **Shared Types** | TypeScript Monorepo Package (`packages/types`) |
| **CI/CD** | GitHub Actions (Matrix Test PHP 8.3 & 8.4) |

---

## 💻 Quick Start Guide

### 1. Prerequisites
- **Docker & Docker Compose**
- **PHP 8.3+** and **Composer 2.x**
- **Node.js 20+** and **npm**
- **Expo Go** mobile app (on Android/iOS device) or emulator

### 2. Clone Repository
```bash
git clone https://github.com/AruYQ/UniDemic.git
cd UniDemic
git checkout develop
```

### 3. Start Infrastructure Services (Docker)
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```
*Runs PostgreSQL (port 5432), Redis (port 6379), and MinIO (ports 9000 & 9001).*

### 4. Run Backend API (`apps/api`)
```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
*API is accessible at `http://localhost:8000` (or `http://10.0.2.2:8000` on Android Emulator).*

### 5. Run Mobile App (`apps/mobile`)
```bash
cd ../mobile
npm install
npx expo start
```
*Scan the QR code with **Expo Go** on your smartphone or press `a` to open the Android Emulator.*

---

## 🧪 Testing & Quality Assurance

All automated test suites must pass before integration:

- **Backend Feature & Unit Tests**:
  ```bash
  cd apps/api
  php artisan test
  ```
  *(92 tests passing, 334 assertions across Auth, Academic Core, Academic Tracking, and Productivity modules).*

- **Mobile TypeScript Verification**:
  ```bash
  cd apps/mobile
  npx tsc --noEmit
  ```
  *(0 errors).*

- **Academic Tracking Integration Suite**:
  ```bash
  cd apps/mobile
  npx tsx scripts/verify-tracking.ts
  ```

---

## 📖 Documentation Index

| Document | Description |
| :--- | :--- |
| [Read.md](Read.md) | Complete system functional specifications |
| [implementation_plan.md](implementation_plan.md) | Step-by-step roadmap across all 9 phases |
| [UI-UX_Guides.md](UI-UX_Guides.md) | Design standards, typography tokens, and Vibe Coding principles |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Progress tracker, verification checkpoints, and active milestones |
| [docs/devlog/DEV-A.md](docs/devlog/DEV-A.md) | Backend engineering journal (rekis-0103) |
| [docs/devlog/DEV-B.md](docs/devlog/DEV-B.md) | Mobile frontend engineering journal (AruYQ) |
| [docs/decisions/ADR.md](docs/decisions/ADR.md) | Architecture Decision Records (ADR) |

---

## 🤝 Contributing & Policies

We welcome community contributions! Please review our policies before submitting code:

- 📖 [Contributing Guide (CONTRIBUTING.en.md)](CONTRIBUTING.en.md) | [Versi Bahasa Indonesia](CONTRIBUTING.md)
- 📜 [Code of Conduct (CODE_OF_CONDUCT.en.md)](CODE_OF_CONDUCT.en.md) | [Versi Bahasa Indonesia](CODE_OF_CONDUCT.md)
- 🛡️ [Security Policy (SECURITY.en.md)](SECURITY.en.md) | [Versi Bahasa Indonesia](SECURITY.md)
- ⚖️ [License (LICENSE)](LICENSE) — Released under the **MIT License**.

---

## 👥 Development Team

| Developer | Role | GitHub Profile |
| :--- | :--- | :--- |
| **AruYQ** | Dev B — Frontend & Mobile Lead | [@AruYQ](https://github.com/AruYQ) |
| **rekis-0103** | Dev A — Backend & API Lead | [@rekis-0103](https://github.com/rekis-0103) |

---

<p align="center">
  Built with ❤️ for university students worldwide.<br>
  <b>UniDemic — One platform for your academic life.</b>
</p>
