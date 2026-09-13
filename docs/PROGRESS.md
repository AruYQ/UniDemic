# 📊 UniDemic — Progress Tracker

> Auto-maintained oleh AI Agent. Update setiap checkpoint selesai.
> Format: `[ ]` belum · `[/]` sedang dikerjakan · `[x]` selesai & terverifikasi

---

## Status Proyek

| Info | Detail |
|------|--------|
| **Repo** | [AruYQ/UniDemic](https://github.com/AruYQ/UniDemic) |
| **Phase aktif** | Phase 3 — Academic Tracking (Completed) |
| **Dev A (Backend)** | rekis-0103 |
| **Dev B (Frontend)** | AruYQ |
| **Mulai** | 2026-09-08 |
| **Stack** | React Native + Expo + Laravel + PostgreSQL + Redis |
| **AI Model** | Gemini Flash 2.5 |

---

## Phase Overview

| Phase | Nama | Status | Dev A | Dev B | Checkpoint |
|-------|------|--------|-------|-------|------------|
| 1 | Foundation | `[x]` | `[x]` | `[x]` | `[x]` |
| 2 | Academic Core | `[x]` | `[x]` | `[x]` | `[x]` |
| 3 | Academic Tracking | `[x]` | `[x]` | `[x]` | `[x]` |
| 4 | Productivity | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| 5 | Learning | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| 6 | Communication | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| 7 | Collaboration | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| 8 | Intelligence (AI) | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| 9 | Web Companion | `[ ]` | `[ ]` | `[ ]` | `[ ]` |

---

## Phase 1 — Foundation

### Dev A (Backend / rekis-0103)

| Task | Status | Catatan |
|------|--------|---------|
| Setup Laravel project | `[x]` | Struktur apps/api, Laravel 11/12, PHP 8.3/8.5 |
| Docker Compose (api, db, redis, minio) | `[x]` | infrastructure/docker-compose.yml & prod config |
| Database migrations (users) | `[x]` | Users (academic fields), tokens, sessions, cache |
| Laravel Sanctum auth | `[x]` | HasApiTokens, auth:sanctum middleware, rate limiting |
| `POST /auth/register` | `[x]` | RegisterRequest validation, issue token (201) |
| `POST /auth/login` | `[x]` | LoginRequest, credential check, issue token (200) |
| `POST /auth/logout` | `[x]` | Revoke currentAccessToken, revoke specific tokens |
| `GET/PUT /profile` | `[x]` | UserResource, update profile & password |
| GitHub Actions CI | `[x]` | .github/workflows/backend-ci.yml matrix test |

### Dev B (Frontend / AruYQ)

| Task | Status | Catatan |
|------|--------|---------|
| Setup Expo project (TypeScript) | `[x]` | Expo SDK 57 + TypeScript + Expo Router initialized |
| Install dependencies | `[x]` | Zustand, Axios, Zod, TanStack Query, Reanimated, Phosphor, Fonts |
| Folder structure | `[x]` | Clean architecture with design system tokens in src/ |
| Expo Router setup | `[x]` | Group routing `(auth)` + stack navigation & auth guard |
| Auth screens (Login, Register) | `[x]` | Vibe Coding compliant: Syne typography, dark mode, Zod validation |
| API client (`lib/api.ts`) | `[x]` | Axios with Bearer token interceptor & error handling |
| Auth store (Zustand) | `[x]` | useAuthStore managing credentials, user session & auto profile fetch |
| Secure token storage | `[x]` | expo-secure-store wrapper with web localStorage fallback |

### ✅ Checkpoint 1 Verification

| Item | Status | Verified by | Tanggal |
|------|--------|-------------|---------|
| API register/login/logout bekerja | `[x]` | Dev A & B (AI Agent) | 2026-09-08 |
| Token tersimpan di mobile | `[x]` | Dev B (AI Agent) | 2026-09-08 |
| Login screen tampil benar | `[x]` | Dev B (AI Agent) | 2026-09-08 |
| Register screen tampil benar | `[x]` | Dev B (AI Agent) | 2026-09-08 |
| Navigasi auth bekerja | `[x]` | Dev B (AI Agent) | 2026-09-08 |
| Docker compose jalan lokal | `[x]` | Dev A & B (AI Agent) | 2026-09-08 |
| CI pipeline hijau | `[x]` | Dev A (AI Agent) | 2026-09-08 |

---

## Phase 2 — Academic Core

### Dev A (Backend / rekis-0103)

| Task | Status | Catatan |
|------|--------|---------|
| Shared TypeScript types (`packages/types`) | `[x]` | Semester, Course, CourseSchedule, Assignment, Exam |
| Database migrations | `[x]` | Semesters, courses, course_schedules, assignments, exams |
| Eloquent Models & Relations | `[x]` | Semester, Course, CourseSchedule, Assignment, Exam, User |
| API Resources & FormRequests | `[x]` | Data transformation & strict validation rules |
| Semester endpoints (`/api/semesters`) | `[x]` | CRUD + `/active` + `/{id}/activate` |
| Course endpoints (`/api/courses`) | `[x]` | CRUD + filter `semester_id` + user isolation |
| Course Schedule endpoints (`/api/courses/{id}/schedules`) | `[x]` | CRUD schedule per mata kuliah |
| Assignment endpoints (`/api/assignments`) | `[x]` | CRUD + filter + auto-complete status (progress 100) |
| Exam endpoints (`/api/exams`) | `[x]` | CRUD + filter + date & time validation |
| Feature Test Suite (Academic) | `[x]` | 51 tests passed, 168 assertions |

### Dev B (Frontend / AruYQ)

| Task | Status | Catatan |
|------|--------|---------|
| Academic navigation & screens | `[x]` | 5 screens (Beranda, Jadwal, Kuliah, Detail Kuliah, Tugas/Ujian) + BottomNav |
| Zustand stores & hooks | `[x]` | On-demand fetching, 3-min TTL cache, optimistic updates |
| Forms & interactive components | `[x]` | UniDatePicker, UniTimePicker, UniSkeleton, AcademicModal, Cards |

### ✅ Checkpoint 2 Verification

| Item | Status | Verified by | Tanggal |
|------|--------|-------------|---------|
| API Semester CRUD & Activate | `[x]` | Dev A & B (Automated & Store) | 2026-09-10 |
| API Courses & Schedules CRUD | `[x]` | Dev A & B (Automated & Store) | 2026-09-10 |
| API Assignments & Exams CRUD | `[x]` | Dev A & B (Automated & Store) | 2026-09-10 |
| Bottom navigation bar & Liquid spring physics | `[x]` | Dev B (React Native Reanimated) | 2026-09-10 |
| Visual Tap Date/Time Pickers (No manual text) | `[x]` | Dev B (UniDatePicker & UniTimePicker) | 2026-09-10 |
| Shimmer Skeleton loading (Anti-slop #21) | `[x]` | Dev B (UniSkeleton suite) | 2026-09-10 |
| On-Demand Fetching & 3-Min TTL In-Memory Cache | `[x]` | Dev B (useAcademicStore) | 2026-09-10 |
---

## Phase 3 — Academic Tracking

### Dev A (Backend / rekis-0103)

| Task | Status | Catatan |
|------|--------|---------|
| Shared TypeScript types (`packages/types`) | `[x]` | Attendance, Grade, GradeComponent, GPA types |
| Database migrations | `[x]` | attendances, grade_components, grades |
| Eloquent Models & Relations | `[x]` | Attendance, GradeComponent, Grade models & Course relations |
| API Resources & FormRequests | `[x]` | Data transformation & strict input validation |
| Attendance endpoints (`/attendances`) | `[x]` | CRUD + course attendance summary + auto warnings |
| Grade Component endpoints (`/grade-components`) | `[x]` | Configurable grade components with weight percentage |
| Grade endpoints (`/grades`) | `[x]` | CRUD grades per component/custom weight |
| GPA & Simulator endpoints (`/gpa`, `/gpa-simulator`) | `[x]` | Course final score, semester IPS, cumulative IPK, simulation |
| Feature Test Suite (Tracking) | `[x]` | 19 tests passed, 59 assertions (70 tests total passed) |

### Dev B (Frontend / AruYQ)

| Task | Status | Catatan |
|------|--------|---------|
| Attendance UI & warning alerts | `[x]` | Attendance log & summary card per mata kuliah |
| Grade input & components UI | `[x]` | Komponen bobot & input nilai per mata kuliah |
| GPA tracker & simulator screens | `[x]` | Layar gpa.tsx dengan simulator proyeksi interaktif |

### ✅ Checkpoint 3 Verification

| Item | Status | Verified by | Tanggal |
|------|--------|-------------|---------|
| Attendance tercatat dan persentase terhitung | `[x]` | Dev A & B (API + UI) | 2026-09-13 |
| Warning muncul jika absensi mendekati batas | `[x]` | Dev A & B (API + UI) | 2026-09-13 |
| Nilai per komponen ter-input dan GPA terhitung benar | `[x]` | Dev A & B (API + UI) | 2026-09-13 |
| GPA simulator berfungsi dengan input nilai hipotetis | `[x]` | Dev A & B (API + UI) | 2026-09-13 |
| UI & Layar Mobile Tracking Terintegrasi | `[x]` | Dev B (AI Agent) | 2026-09-13 |

---

## Phase 4 — Productivity

> Akan diisi setelah Checkpoint 3 selesai.

---

## Phase 5 — Learning

> Akan diisi setelah Checkpoint 4 selesai.

---

## Phase 6 — Communication

> Akan diisi setelah Checkpoint 5 selesai.

---

## Phase 7 — Collaboration

> Akan diisi setelah Checkpoint 6 selesai.

---

## Phase 8 — Intelligence (AI)

> Akan diisi setelah Checkpoint 7 selesai.

---

## Phase 9 — Web Companion

> Akan diisi setelah Checkpoint 8 selesai.

---

*Terakhir diupdate: 2026-09-08 | Updated by: AI Agent (Antigravity)*
