# 📊 UniDemic — Progress Tracker

> Auto-maintained oleh AI Agent. Update setiap checkpoint selesai.
> Format: `[ ]` belum · `[/]` sedang dikerjakan · `[x]` selesai & terverifikasi

---

## Status Proyek

| Info | Detail |
|------|--------|
| **Repo** | [AruYQ/UniDemic](https://github.com/AruYQ/UniDemic) |
| **Phase aktif** | Phase 1 — Foundation |
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
| 2 | Academic Core | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
| 3 | Academic Tracking | `[ ]` | `[ ]` | `[ ]` | `[ ]` |
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

> Akan diisi setelah Checkpoint 1 selesai.

---

## Phase 3 — Academic Tracking

> Akan diisi setelah Checkpoint 2 selesai.

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
