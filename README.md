# 🎓 UniDemic

**Your university life, organized.**

UniDemic adalah platform produktivitas akademik dan kolaborasi open-source yang membantu mahasiswa mengelola seluruh kehidupan kampus dalam satu tempat.

[![Status](https://img.shields.io/badge/status-early%20development-orange)](https://github.com/AruYQ/UniDemic)
[![License](https://img.shields.io/badge/license-TBD-lightgrey)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue)](https://github.com/AruYQ/UniDemic)

---

## 📖 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [Read.md](Read.md) | Spesifikasi lengkap fitur UniDemic |
| [Implementation Plan](implementation_plan.md) | Roadmap 9 phase pengerjaan |
| [UI/UX Guides](UI-UX_Guides.md) | Panduan desain & Vibe Coding |
| [Progress Tracker](docs/PROGRESS.md) | Status pengerjaan per phase & checkpoint |
| [Dev A Log](docs/devlog/DEV-A.md) | Jurnal backend (rekis-0103) |
| [Dev B Log](docs/devlog/DEV-B.md) | Jurnal frontend (AruYQ) |
| [Architecture Decisions](docs/decisions/ADR.md) | Keputusan arsitektur teknis |

---

## 🚀 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Mobile | React Native + Expo + TypeScript |
| Navigation | Expo Router |
| State | TanStack Query + Zustand |
| Backend | Laravel 11 |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | S3-compatible |
| AI | Gemini Flash 2.5 (rate-limited + BYOK) |
| Web (Phase 9) | Next.js |

---

## 👥 Tim

| Peran | GitHub |
|-------|--------|
| Dev B — Frontend/Mobile | [@AruYQ](https://github.com/AruYQ) |
| Dev A — Backend | [@rekis-0103](https://github.com/rekis-0103) |

---

## 🗺️ Roadmap

| Phase | Fitur | Status |
|-------|-------|--------|
| 1 | Foundation (Auth, Setup) | 🔄 In Progress |
| 2 | Academic Core (Courses, Schedule, Assignments) | ⏳ |
| 3 | Academic Tracking (Attendance, Grades, GPA) | ⏳ |
| 4 | Productivity (Tasks, Study Planner, Focus Timer) | ⏳ |
| 5 | Learning (Materials, Notes, Flashcards, Quiz) | ⏳ |
| 6 | Communication (Chat, DM, Course Discussion) | ⏳ |
| 7 | Collaboration (Study Groups, Projects, Kanban) | ⏳ |
| 8 | Intelligence (AI Assistant, RAG, Quiz Gen) | ⏳ |
| 9 | Web Companion (Next.js Dashboard) | ⏳ |

---

## 🤖 AI Agent System

Proyek ini menggunakan AI agent untuk membantu development dengan skill yang tersedia di `.agents/`:

- **`unidemic-ui-ux`** — Design system & Vibe Coding standards untuk semua UI
- **`unidemic-devlog`** — Panduan dokumentasi wajib per task
- **`security.md`** — (Rule Global) Aturan Cybersecurity & Privasi Data (OWASP, JWT, Secret Management)

---

## 📌 Status

> 🚧 **Early Development** — API, struktur database, dan fitur dapat berubah signifikan sebelum rilis stabil pertama.

---

*UniDemic — One platform for your academic life.*
