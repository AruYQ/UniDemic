# 📓 Dev A — Backend Devlog (rekis-0103)

> Log perjalanan pengerjaan backend UniDemic.
> **Format wajib** diisi setiap kali menyelesaikan task atau menghadapi masalah signifikan.
> Diisi oleh rekis-0103 dan/atau AI Agent Backend.

---

## Cara Mengisi Log

Setiap entry menggunakan format ini:

```markdown
### [YYYY-MM-DD] — [Judul singkat task]

**Branch**: feature/backend/[nama]
**Status**: Selesai / Sedang dikerjakan / Blocked

**Yang dikerjakan:**
- [deskripsi task]

**Keputusan teknis:**
- [keputusan & alasannya]

**Masalah yang ditemukan:**
- [masalah] → [solusi]

**Referensi:**
- [link PR / commit / dokumentasi]
```

---

## Log Entries

### [2026-09-08] — Project Initialization & Planning

**Branch**: `main` / `develop`
**Status**: Selesai (setup repo & planning)

**Yang dikerjakan:**
- Analisis Read.md (project documentation lengkap UniDemic)
- Dibuat implementation plan 9 phase dengan checkpoint verifikasi
- Setup GitHub repo: [AruYQ/UniDemic](https://github.com/AruYQ/UniDemic)
- rekis-0103 ditambahkan sebagai collaborator dengan permission `write`
- Branch `develop` dibuat sebagai integration branch
- AI skill `unidemic-ui-ux` dibuat untuk standar UI/UX

**Keputusan teknis:**
- Stack backend: **Laravel 11 + PostgreSQL + Redis + S3-compatible storage**
- Auth: **Laravel Sanctum** (token-based, cocok untuk mobile)
- Real-time: arsitektur replaceable (Pusher/Reverb, hindari vendor lock-in)
- AI layer: rate-limited, semantic cached via Redis
- Database AI: pgvector di masa depan (Phase 8)

**Referensi:**
- [Read.md](../Read.md) — Spesifikasi lengkap proyek
- [Implementation Plan](../implementation_plan.md) — Roadmap 9 phase
- Commit: `48d3011` — docs: add project documentation

---

### [2026-09-08] — Phase 1: Foundation Implementation

**Branch**: `feature/backend/phase-1-foundation`
**Status**: Selesai

**Yang dikerjakan:**
- Setup project Laravel di `apps/api/` dengan Laravel Sanctum
- Migrasi database awal:
  - `users` (academic & profile fields: `university`, `major`, `student_id`, `avatar_url`, `bio`, `phone`, `preferences`)
  - `personal_access_tokens` (Sanctum)
  - `password_reset_tokens`, `sessions`, `jobs`, `cache`
- Implementasi API endpoints otentikasi & user profile:
  - `POST /api/auth/register` & `POST /api/v1/auth/register` (201 Created, issue token)
  - `POST /api/auth/login` & `POST /api/v1/auth/login` (200 OK, token issued)
  - `POST /api/auth/logout` & `POST /api/v1/auth/logout` (revoke current token)
  - `GET /api/auth/tokens` & `DELETE /api/auth/tokens/{id}` (device session management)
  - `GET /api/profile` & `GET /api/v1/profile` (user profile resource)
  - `PUT /api/profile` & `PUT /api/v1/profile` (update profile data)
  - `PUT /api/profile/password` (secure password change)
  - `GET /api/health` (health check)
- Security:
  - Input validation via Laravel `FormRequest` (`RegisterRequest`, `LoginRequest`, `UpdateProfileRequest`, `UpdatePasswordRequest`)
  - Rate limiting (throttling: 10 req/min) di auth routes untuk mitigasi brute force
  - Password di-hash menggunakan default Bcrypt/Argon2
  - Password, remember token disembunyikan dari serialization model
- Setup Docker & Infrastruktur:
  - `apps/api/Dockerfile` (PHP 8.3-cli-alpine dengan PostgreSQL, Redis, Bcmath, Intl, Zip)
  - `apps/api/.docker/entrypoint.sh` (auto key generate, db ready check, auto migrate)
  - `infrastructure/docker-compose.yml` (services: api, db PostgreSQL 16, redis 7, minio S3 local + createbuckets init)
  - `infrastructure/docker-compose.prod.yml` (production-ready deployment config)
- CI/CD & Testing:
  - `.github/workflows/backend-ci.yml` (Matrix PHP 8.3 & 8.4, PostgreSQL 16, Redis 7, automated migrations & tests)
  - Feature & Unit test suite: 25 tests, 88 assertions (100% pass)
  - Live HTTP curl / PowerShell verification for all 6 endpoints: 100% pass
- Monorepo package:
  - `packages/types/` (TypeScript interfaces: `User`, `AuthResponseData`, `RegisterPayload`, dll untuk konsumsi frontend)

**Keputusan teknis:**
- Memperluas tabel `users` sejak awal dengan field esensial mahasiswa (`university`, `major`, `student_id`) agar frontend Dev B tidak perlu migrasi ulang di Phase 2.
- Menyediakan endpoint ganda tanpa prefix dan dengan prefix `/v1` agar fleksibel untuk integrasi mobile client.
- Mengaktifkan `throttle:10,1` pada rute publik sesuai ADR-0006 dan standar cybersecurity.

**Masalah yang ditemukan:**
- Download paralel composer di Windows mengalami kendala permission/file lock pada file temporer zip → Diatasi dengan membatasi proses, membersihkan cache, dan menjalankan instalasi dengan `--no-dev` terlebih dahulu sebelum memasang dev tools.
- CI pipeline PHP 8.3 gagal karena dependensi Symfony 8.1 / Laravel 13 membutuhkan PHP >= 8.4.1 → Diatasi dengan menyelaraskan versi PHP ke 8.4 pada `composer.json`, `Dockerfile`, dan GitHub Actions CI matrix (`backend-ci.yml`), CI kini 100% hijau.

**Referensi:**
- [ADR-0001 — Tech Stack Selection](../decisions/ADR.md#adr-0001--tech-stack-selection)
- [ADR-0002 — Authentication Strategy](../decisions/ADR.md#adr-0002--authentication-strategy)
- [ADR-0006 — Cybersecurity & Data Privacy Standards](../decisions/ADR.md#adr-0006--cybersecurity--data-privacy-standards)
- [Implementation Plan](../implementation_plan.md) — Phase 1 Foundation

---

> ⬇️ Entry selanjutnya ditambahkan di bawah ini oleh Dev A / AI Agent Backend


