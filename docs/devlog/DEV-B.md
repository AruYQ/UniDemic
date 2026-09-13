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

---

### [2026-09-13] — Phase 3: Academic Tracking Mobile Frontend & Interactive GPA Simulator

**Branch**: `feature/mobile/academic-tracking`
**Status**: Selesai & Terverifikasi (Lolos strict TypeScript typecheck 0 error)

**Yang dikerjakan:**
- **Types & Service Layer**:
  - Menambahkan tipe data pelacakan akademik di `apps/mobile/src/types/tracking.ts` (`Attendance`, `AttendanceStatus`, `AttendanceSummary`, `GradeComponent`, `Grade`, `CourseGpa`, `SemesterGpa`, `CumulativeGpa`, `GpaSimulationItem`, `GpaSimulationPayload`, `GpaSimulationResult`).
  - Membangun API service layer di `apps/mobile/src/services/trackingService.ts` untuk presensi, komponen penilaian berbobot, nilai asesmen, serta kalkulasi dan simulasi IPK.
- **State Management (Zustand)**:
  - Membangun `apps/mobile/src/store/useTrackingStore.ts` dengan in-memory cache TTL 3 menit (`CACHE_TTL_MS`), penanganan loading state per course, optimistic updates, dan pengelolaan hasil proyeksi simulasi IPK.
- **Attendance Tracking UI Suite**:
  - `AttendanceSummaryCard.tsx`: Kartu statistik kehadiran interaktif dengan bar progress visual, grid 4 pilar presensi (Hadir, Izin, Sakit, Alpa), serta peringatan kritis batas alpa (threshold warning jika kehadiran < 75% atau toleransi aman alpa habis).
  - `AttendanceItemCard.tsx`: Kartu riwayat pertemuan dengan aksen garis warna status vertikal, tanggal terformat bahasa Indonesia, catatan, dan tombol hapus.
  - `MarkAttendanceModal.tsx`: Dialog pencatatan presensi visual tap dengan pemilih status geometris berikon, pemilih kalender mini `UniDatePicker` (tanpa input teks manual), dan catatan pertemuan opsional.
- **Grade & Assessment Management UI Suite**:
  - `GradeComponentModal.tsx`: Dialog pengelolaan bobot penilaian (UTS, UAS, Tugas, Kuis, Praktikum) dengan bar akumulasi persentase hingga 100% dan validasi kelebihan alokasi bobot.
  - `GradeItemCard.tsx`: Kartu nilai asesmen dengan tag komponen, persentase bobot teralokasi, skor numerik 0-100, dan color coding semantik.
  - `AddGradeModal.tsx`: Dialog input nilai baru dengan pemilih chip komponen penilaian atau mode custom bobot mandiri.
- **Layar Detail Kuliah Terintegrasi (`apps/mobile/src/app/course/[id].tsx`)**:
  - Memperluas tab navigasi menjadi 5 segmen: **Jadwal**, **Tugas**, **Ujian**, **Presensi**, dan **Nilai** dalam horizontal scrollable tab bar.
  - Menambahkan Hero Card Nilai Akhir Terhitung dengan huruf mutu (A, B+, dll) dan titik mutu 4.0 pada tab Nilai.
- **Layar GPA Tracker & Simulator Baru (`apps/mobile/src/app/gpa.tsx`)**:
  - Hero Card Bento IPK Kumulatif dengan tipografi display `Syne_700Bold`, predikat kelulusan (*Cumlaude*, *Sangat Memuaskan*, dll), total SKS lulus, dan progress bar menuju target 144 SKS.
  - Rincian IPS per semester dengan daftar kartu riwayat semester.
  - Interactive GPA Simulator: Tambah matkul simulasi, pilih SKS (1-6) dan target huruf mutu (A s.d. E) secara visual, kalkulasi delta proyeksi IPK real-time dengan badge dinamis (`+0.12` / `-0.05`) terhubung ke endpoint `/api/gpa-simulator`.
- **Integrasi Beranda (`apps/mobile/src/app/index.tsx`)**:
  - Menambahkan Bento Card ke-3 pada dashboard beranda sebagai shortcut langsung ke layar `/gpa` yang menampilkan IPK kumulatif terkini.
  - Mendaftarkan rute `gpa` di `_layout.tsx` dengan transisi tumpukan halus `slide_from_right`.

**Screen/komponen yang dibuat/diubah:**
- `apps/mobile/src/types/tracking.ts` — Shared types & payload DTOs tracking
- `apps/mobile/src/services/trackingService.ts` — API client service tracking
- `apps/mobile/src/store/useTrackingStore.ts` — Zustand store tracking & simulator
- `apps/mobile/src/components/tracking/AttendanceSummaryCard.tsx` — Visual summary card presensi
- `apps/mobile/src/components/tracking/AttendanceItemCard.tsx` — Kartu riwayat kehadiran pertemuan
- `apps/mobile/src/components/tracking/MarkAttendanceModal.tsx` — Modal visual tap catat kehadiran
- `apps/mobile/src/components/tracking/GradeComponentModal.tsx` — Modal kelola komponen bobot nilai
- `apps/mobile/src/components/tracking/GradeItemCard.tsx` — Kartu nilai asesmen
- `apps/mobile/src/components/tracking/AddGradeModal.tsx` — Modal input nilai asesmen
- `apps/mobile/src/app/course/[id].tsx` — Detail matkul dengan 5 tab interaktif
- `apps/mobile/src/app/gpa.tsx` — Layar dedicated GPA tracker & simulator
- `apps/mobile/src/app/index.tsx` — Bento dashboard shortcut ke GPA screen
- `apps/mobile/src/app/_layout.tsx` — Registrasi screen stack gpa

**Vibe Check hasil:**
- Layout: Bento cards, segmented multi-tab horizontal bar, thumb-zone friendly touch targets.
- Animasi: FadeInDown on mount (duration 220-300ms), tactile spring feedback pada tap status & chip.
- Anti-slop: Tanpa `#000000`/`#FFFFFF` statis, font Syne + Space Grotesk + JetBrains Mono, Phosphor Icons Duotone, tanpa input teks manual tanggal (UniDatePicker).

**API yang diintegrasikan:**
- `GET/POST /api/courses/{id}/attendances` → Log presensi matkul
- `GET /api/courses/{id}/attendance-summary` → Ringkasan persentase & status peringatan batas alpa
- `DELETE /api/attendances/{id}` → Hapus log presensi
- `GET/POST /api/courses/{id}/grade-components` → Bobot komponen penilaian
- `DELETE /api/grade-components/{id}` → Hapus komponen penilaian
- `GET/POST /api/courses/{id}/grades` → Nilai asesmen mahasiswa
- `DELETE /api/grades/{id}` → Hapus nilai asesmen
- `GET /api/courses/{id}/gpa` → Nilai akhir matkul & huruf mutu
- `GET /api/gpa/cumulative` → IPK kumulatif & riwayat semester
- `POST /api/gpa-simulator` → Proyeksi delta IPK simulasi

**Verifikasi:**
- `npx tsc --noEmit` di `apps/mobile`: 100% Lolos tanpa error.




