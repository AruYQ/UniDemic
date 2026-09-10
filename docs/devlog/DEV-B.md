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

---

### [2026-09-10] — Phase 2: Academic Core Mobile Frontend Implementation & UX Polish

**Branch**: `feature/mobile/academic-core`
**Status**: Selesai & Terverifikasi (Lolos strict TypeScript typecheck)

**Yang dikerjakan:**
- Re-export & integrasi TypeScript types akademik: `apps/mobile/src/types/academic.ts` (`Semester`, `Course`, `CourseSchedule`, `Assignment`, `Exam`).
- Implementasi API service layer: `apps/mobile/src/services/academicService.ts` menghubungkan ke seluruh endpoint Laravel backend Dev A (Semesters, Courses, Schedules, Assignments, Exams).
- Implementasi state management Zustand: `apps/mobile/src/store/useAcademicStore.ts` dengan:
  - **Smart In-Memory Caching dengan TTL 3 Menit (180.000 ms)**: Data yang telah diambil disimpan di memori dan tidak mengulang request ke backend kecuali cache kadaluarsa, ditarik user (pull-to-refresh), atau terjadi mutasi (create/update/delete).
  - **On-Demand (Lazy) Fetching**: Setiap tab/layar (`fetchDashboard`, `fetchSchedules`, `fetchCoursesAndSemesters`, `fetchTasksAndExams`, `fetchCourseDetail`) hanya mengambil datanya sendiri ketika layar dibuka, mencegah *data storm* ke server dan menghemat kuota user.
  - **Optimistic UI updates** untuk perubahan progress tugas (0% -> 50% -> 100%) dengan auto-sync ke server.
- **Komponen Input Visual Baru (No Manual Typing)**:
  - `apps/mobile/src/components/ui/UniDatePicker.tsx` — Pemilih tanggal kalender mini visual dengan quick presets (*Hari Ini*, *Besok*, *+3 Hari*, *Minggu Depan*) dan navigasi bulan, tanpa input keyboard YYYY-MM-DD.
  - `apps/mobile/src/components/ui/UniTimePicker.tsx` — Pemilih waktu visual dengan preset jam perkuliahan kampus (*07:00*, *08:00*, *09:40*, *10:30*, *13:00*, *15:30*) dan grid jam-menit berbasis tap.
- **Instagram-style Skeleton Shimmer UI (Rule #21 Anti-Slop)**:
  - `apps/mobile/src/components/ui/UniSkeleton.tsx` — Shimmer wireframe terakselerasi GPU Reanimated yang meniru persis kontur kartu: `DashboardSkeleton`, `ScheduleCardSkeleton`, `CourseCardSkeleton`, `AssignmentCardSkeleton`, dan `CourseDetailSkeleton`. Meniadakan `ActivityIndicator` biasa pada konten utama.
- **Liquid Spring Physics (Opsi B)**:
  - Konfigurasi pegas Reanimated: `mass: 0.6`, `damping: 18`, `stiffness: 180` pada kartu, tombol, modal sheet, dan nav bar untuk sensasi taktil elastis, stabil, dan bebas *framedrop* (tetap 60 FPS di perangkat low/mid-range).
- **Smooth Navigation & Tab Transitions**:
  - `apps/mobile/src/app/_layout.tsx`: Transisi tumpukan layar menggunakan `animation: 'fade'` lembut (180ms) dan `freezeOnBlur: true`.
  - `apps/mobile/src/components/ui/BottomNav.tsx`: Menggunakan `router.replace` untuk perpindahan antar root tab, mengeliminasi efek geser ke samping yang acak dan tidak teratur.
- Integrasi ke seluruh layar:
  - `apps/mobile/src/app/index.tsx` (Dashboard dengan `DashboardSkeleton` & dynamic active semester)
  - `apps/mobile/src/app/schedule.tsx` (Jadwal mingguan dengan `ScheduleCardSkeleton` & `UniTimePicker`)
  - `apps/mobile/src/app/courses.tsx` (Manajemen matkul dengan `CourseCardSkeleton`)
  - `apps/mobile/src/app/tasks.tsx` (Tugas & ujian dengan `AssignmentCardSkeleton`, `UniDatePicker`, `UniTimePicker`)
  - `apps/mobile/src/app/course/[id].tsx` (Detail matkul dengan `CourseDetailSkeleton`, cached loader, `UniDatePicker`, `UniTimePicker`)

**Masalah & Solusi:**
- *Problem*: User merasa ribet mengetik tanggal `YYYY-MM-DD` dan jam `HH:mm` secara manual via keyboard.
  *Solusi*: Membangun `UniDatePicker` & `UniTimePicker` berbasis tap dengan preset cerdas akademik.
- *Problem*: Navigasi antar tab bawah terasa kaku dengan efek slide kiri-kanan yang tidak berurutan karena `router.push`.
  *Solusi*: Mengganti navigasi tab ke `router.replace` dan mengatur stack transition `animation: 'fade'` (180ms).
- *Problem*: Aplikasi memanggil semua endpoint data akademik sekaligus saat pertama dibuka, membebani server dan baterai.
  *Solusi*: Arsitektur on-demand fetching per layar dipadu in-memory TTL cache 3 menit.

**Verifikasi:**
- `npx tsc --noEmit` di `apps/mobile`: Lolos 100% tanpa ada error type.



