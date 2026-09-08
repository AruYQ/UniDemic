# 📓 Dev B — Frontend Devlog (AruYQ)

> Log perjalanan pengerjaan frontend/mobile UniDemic.
> **Format wajib** diisi setiap kali menyelesaikan task atau menghadapi masalah signifikan.
> Diisi oleh AruYQ dan/atau AI Agent Frontend.

---

## Cara Mengisi Log

Setiap entry menggunakan format ini:

```markdown
### [YYYY-MM-DD] — [Judul singkat task]

**Branch**: feature/mobile/[nama]
**Status**: Selesai / Sedang dikerjakan / Blocked

**Yang dikerjakan:**
- [deskripsi task]

**Keputusan desain/teknis:**
- [keputusan & alasannya]

**Masalah yang ditemukan:**
- [masalah] → [solusi]

**Screenshot/Preview:**
- [path gambar atau link]

**Referensi:**
- [link PR / commit / dokumentasi]
```

---

## Log Entries

### [2026-09-08] — Project Initialization & Planning

**Branch**: `main` / `develop`
**Status**: Selesai (setup repo & planning)

**Yang dikerjakan:**
- Analisis Read.md — memahami seluruh fitur UniDemic yang akan dibangun
- Dibuat implementation plan 9 phase dengan verifikasi checkpoint per fitur
- Setup GitHub repo: [AruYQ/UniDemic](https://github.com/AruYQ/UniDemic)
- Ditambahkan rekis-0103 sebagai collaborator (Dev A / Backend)
- Dibuat AI skill `unidemic-ui-ux` untuk standar UI/UX semua screen
- Dibuat sistem dokumentasi (devlog, progress tracker, decisions)

**Keputusan teknis (Frontend):**
- Framework: **React Native + Expo** (cross-platform Android & iOS)
- Navigation: **Expo Router** (file-based routing, mirip Next.js)
- Server state: **TanStack Query** (caching, background sync, optimistic updates)
- Client state: **Zustand** (auth store, UI state)
- Validasi: **Zod + React Hook Form**
- HTTP: **Axios** dengan interceptor untuk attach token
- Token storage: **expo-secure-store** (encrypted, keychain/keystore)

**Keputusan desain (UI/UX):**
- Dark mode first dengan palette indigo-slate (`#0F1117` base)
- Font: Syne Bold (display) + Space Grotesk (body) + JetBrains Mono (kode/angka)
- Icons: Phosphor Icons Duotone (bukan Lucide/Heroicons default)
- Animasi: react-native-reanimated v3 (bukan Animated API bawaan)
- Loading: Skeleton/Shimmer dengan `moti` (bukan ActivityIndicator)
- List: FlashList (bukan ScrollView atau FlatList untuk list panjang)
- 30 Anti-Slop Rules diterapkan ketat (lihat UI-UX_Guides.md)

**Tools dokumentasi yang dibuat:**
- [`docs/PROGRESS.md`](../PROGRESS.md) — Progress tracker semua phase & checkpoint
- [`docs/devlog/DEV-A.md`](DEV-A.md) — Dev log backend
- [`docs/devlog/DEV-B.md`](DEV-B.md) — Dev log frontend (ini)
- [`docs/decisions/`](../decisions/) — Architecture Decision Records
- [`.agents/skills/unidemic-ui-ux/SKILL.md`](../../.agents/skills/unidemic-ui-ux/SKILL.md) — AI UI/UX skill
- [`.agents/skills/unidemic-devlog/SKILL.md`](../../.agents/skills/unidemic-devlog/SKILL.md) — AI documentation skill
- [`.agents/rules/documentation.md`](../../.agents/rules/documentation.md) — Aturan wajib dokumentasi

**Referensi:**
- [Read.md](../../Read.md) — Spesifikasi lengkap proyek
- [Implementation Plan](../../implementation_plan.md) — Roadmap 9 phase
- [UI-UX Guides](../../UI-UX_Guides.md) — Panduan desain original
- Commit: `48d3011` — docs: add project documentation
- Commit: `9095486` — feat: add unidemic-ui-ux AI agent skill

---

> ⬇️ Entry selanjutnya ditambahkan di bawah ini oleh Dev B / AI Agent Frontend

### [2026-09-08] — Phase 1 Mobile Foundation & Authentication Setup

**Branch**: `feature/mobile/auth-foundation`
**Status**: Selesai

**Yang dikerjakan:**
- Setup Expo SDK 57 project dengan TypeScript dan Expo Router di `apps/mobile/`.
- Instalasi dependensi: Zustand, Axios, Zod, TanStack Query, Expo Secure Store, Phosphor Icons (`phosphor-react-native`), `@shopify/flash-list`, serta font `@expo-google-fonts/syne`, `@expo-google-fonts/space-grotesk`, dan `@expo-google-fonts/jetbrains-mono`.
- Implementasi Design System Tokens (`apps/mobile/src/constants/tokens.ts` & `theme.ts`) mengadopsi ketat warna `#0F1117`, `#171B26`, `#6B7FD7`, `#4ECDC4`, `#F7B731`, radius variatif, dan offset shadows.
- Pembuatan Secure Storage wrapper (`apps/mobile/src/utils/secureStore.ts`) dengan `expo-secure-store` dan fallback web storage.
- Pembuatan API client Axios (`apps/mobile/src/lib/api.ts`) dengan auto Bearer token injection dan 401 handling.
- Pembuatan Auth Store Zustand (`apps/mobile/src/store/useAuthStore.ts`) mengelola login, register, profile refresh, dan token persistence.
- Pembuatan komponen reusable Vibe Coding: `UniButton` (dengan spring press-down `withSpring(0.97)`), `UniInput` (dengan password toggle dan border subtle), dan `UniBadge` (status geometris).
- Pembuatan layar Autentikasi: `apps/mobile/src/app/(auth)/_layout.tsx`, `login.tsx`, dan `register.tsx` lengkap dengan validasi Zod dan handling error.
- Pembuatan Dashboard autentikasi di `apps/mobile/src/app/index.tsx` (Bento layout, hero upcoming class, IPK/SKS metrics).
- Integrasi dan pengujian live ke backend Docker Laravel Sanctum API: sukses mendaftar dan login.

**Screen/komponen yang dibuat/diubah:**
- `apps/mobile/src/constants/tokens.ts` — Design system tokens
- `apps/mobile/src/constants/theme.ts` — Theme adapter & exports
- `apps/mobile/src/utils/secureStore.ts` — Secure token storage wrapper
- `apps/mobile/src/lib/api.ts` — Axios instance & interceptors
- `apps/mobile/src/store/useAuthStore.ts` — Auth state management
- `apps/mobile/src/hooks/useUniDemicFonts.ts` — Custom font loader hook
- `apps/mobile/src/components/ui/UniButton.tsx` — Vibe button with spring animation
- `apps/mobile/src/components/ui/UniInput.tsx` — Secure input field
- `apps/mobile/src/components/ui/UniBadge.tsx` — Geometric status badge
- `apps/mobile/src/app/_layout.tsx` — Root layout with font loader and auth guard
- `apps/mobile/src/app/(auth)/_layout.tsx` — Auth stack layout
- `apps/mobile/src/app/(auth)/login.tsx` — Premium Login screen
- `apps/mobile/src/app/(auth)/register.tsx` — Student Onboarding Register screen
- `apps/mobile/src/app/index.tsx` — Bento Academic Dashboard

**Vibe Check hasil:**
- Layout: Asymmetric Bento grid, thumb-zone optimized touch targets (height 52px).
- Animasi: Reanimated v3 FadeInDown entry with cubic easing, subtle spring 0.97 press-down.
- Anti-slop: Tanpa `#000000`/`#FFFFFF`, tipografi Syne + Space Grotesk + JetBrains Mono, Phosphor Duotone icons, tidak ada emoji sebagai status.

**API yang diintegrasikan:**
- `POST /api/auth/register` → Register payload, issue token, update auth store
- `POST /api/auth/login` → Credential check, issue token, update auth store
- `GET /api/profile` → Session initialization dari SecureStore token

**Keputusan desain/teknis:**
- Menggunakan `phpredis` pada container backend API menggantikan `predis` yang tidak terinstall, menyamakan konfigurasi Dockerfile dengan `.env`.
- Mengarahkan `DB_HOST` ke hostname container `db` di dalam `.env` container backend.

**Masalah yang ditemukan:**
- `Predis\Client not found` pada backend → solved dengan mengubah `REDIS_CLIENT=phpredis` di `.env` dan `docker-compose.yml`.
- `DB_HOST=127.0.0.1` pada backend container menolak koneksi Postgres → solved dengan mengubah `DB_HOST=db` dan `DB_PASSWORD=secret_password`.

**Referensi:**
- Branch: `feature/mobile/auth-foundation`
- Commit: `bf50d41`
- PR URL: https://github.com/AruYQ/UniDemic/pull/new/feature/mobile/auth-foundation

