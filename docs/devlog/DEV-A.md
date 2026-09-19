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

### [2026-09-10] — Academic Core Backend Implementation

**Branch**: `feature/backend/academic-core`
**Status**: Selesai (Backend Academic Core)

**Yang dikerjakan:**
- Shared Types: Menambahkan TypeScript interfaces di `packages/types/src/index.ts` (`Semester`, `Course`, `CourseSchedule`, `Assignment`, `Exam`).
- Database Migrations:
  - `create_semesters_table`: kolom `name`, `academic_year`, `start_date`, `end_date`, `is_active`, foreign key ke `users`.
  - `create_courses_table`: kolom `name`, `code`, `credits`, `color`, `room`, `lecturer_name`, `lecturer_contact`, foreign key ke `semesters`.
  - `create_course_schedules_table`: kolom `day_of_week` (1-7), `start_time`, `end_time`, `room`, `type` (lecture, lab, tutorial, seminar, other).
  - `create_assignments_table`: kolom `title`, `description`, `due_date`, `due_time`, `priority` (low, medium, high), `progress` (0-100), `is_completed`.
  - `create_exams_table`: kolom `title`, `type` (midterm, final, quiz, other), `date`, `start_time`, `end_time`, `room`, `notes`.
- Eloquent Models & Relationships:
  - `Semester`: belongsTo `User`, hasMany `Course`, scope `active`.
  - `Course`: belongsTo `Semester`, hasMany `CourseSchedule`, `Assignment`, `Exam`.
  - `CourseSchedule`: belongsTo `Course`.
  - `Assignment`: belongsTo `Course`.
  - `Exam`: belongsTo `Course`.
  - `User`: hasMany `Semester`, hasOne `activeSemester`.
- Form Requests & API Resources:
  - FormRequest untuk validasi input: `StoreSemesterRequest`, `UpdateSemesterRequest`, `StoreCourseRequest`, `UpdateCourseRequest`, `StoreScheduleRequest`, `UpdateScheduleRequest`, `StoreAssignmentRequest`, `UpdateAssignmentRequest`, `StoreExamRequest`, `UpdateExamRequest`.
  - API Resources untuk standardisasi response JSON: `SemesterResource`, `CourseResource`, `CourseScheduleResource`, `AssignmentResource`, `ExamResource`.
- Controllers & API Routes:
  - `SemesterController`: CRUD semester, get active semester (`GET /api/semesters/active`), toggle aktifkan semester (`POST /api/semesters/{id}/activate`) yang secara otomatis menonaktifkan semester lain milik user yang sama.
  - `CourseController`: CRUD mata kuliah, filter per semester (`?semester_id=`), isolasi hak akses data user.
  - `CourseScheduleController`: CRUD jadwal kuliah untuk course tertentu (`/api/courses/{course}/schedules`).
  - `AssignmentController`: CRUD tugas, filter per course (`?course_id=`), auto update status `is_completed = true` ketika progress mencapai 100%.
  - `ExamController`: CRUD jadwal ujian, filter per course (`?course_id=`), isolasi hak akses user.
  - Pendaftaran rute ganda (`/api/...` dan `/api/v1/...`) di bawah middleware `auth:sanctum`.
- Testing:
  - Menulis 5 Feature Test classes komprehensif (`SemesterTest`, `CourseTest`, `ScheduleTest`, `AssignmentTest`, `ExamTest`).
  - Menjalankan test suite: seluruh 51 tests (168 assertions) 100% PASS.

**Keputusan teknis:**
- Multi-tenancy / Data Isolation: Semua query dilakukan dengan membatasi kepemilikan user (misal `where('user_id', $user->id)` atau `whereHas('semester', fn($q) => $q->where('user_id', $user->id))`) sehingga user tidak dapat mengakses data milik user lain.
- Active Semester Logic: Menggunakan database transaction saat aktivasi semester agar operasi atomic saat mengeset `is_active = false` pada semester lain sebelum mengeset `is_active = true` pada semester yang dipilih.
- Auto Completion on Assignment: Controller secara cerdas mengatur flag `is_completed` bila user mengirimkan update `progress: 100`, menjaga konsistensi state.

**Masalah yang ditemukan:**
- Formatting string tanggal pada SQLite in-memory test (`ExamTest`) menghasilkan format `YYYY-MM-DD 00:00:00` pada kolom date native, menyebabkan mismatch saat `assertDatabaseHas('exams', ['date' => '2026-12-15'])` → Diatasi dengan memverifikasi data date melalui model accessor `format('Y-m-d')` dan memverifikasi field lainnya melalui `assertDatabaseHas`.

**Referensi:**
- Branch: `feature/backend/academic-core`
- Implementation Plan: Academic Core Section

---

### [2026-09-11] — Academic Tracking Backend Implementation

**Branch**: `feature/backend/academic-tracking`
**Status**: Selesai (Backend Academic Tracking)

**Yang dikerjakan:**
- Shared Types: Menambahkan TypeScript interfaces di `packages/types/src/index.ts` (`Attendance`, `AttendanceStatus`, `AttendanceSummary`, `GradeComponent`, `Grade`, `CourseGpa`, `SemesterGpa`, `CumulativeGpa`, `GpaSimulationItem`, `GpaSimulationPayload`, `GpaSimulationResult`).
- Database Migrations:
  - `create_attendances_table`: kolom `course_id`, `date`, `status` (present, absent, permission, sick), `notes`, index pada `[course_id, date]` dan `[course_id, status]`.
  - `create_grade_components_table`: kolom `course_id`, `name`, `weight` (persentase bobot), index pada `course_id`.
  - `create_grades_table`: kolom `course_id`, `grade_component_id` (nullable), `name`, `score` (0-100), `weight` (nullable custom weight).
- Eloquent Models & Relationships:
  - `Attendance`: belongsTo `Course`.
  - `GradeComponent`: belongsTo `Course`, hasMany `Grade`.
  - `Grade`: belongsTo `Course`, belongsTo `GradeComponent`.
  - `Course`: hasMany `attendances`, `gradeComponents`, `grades`.
- Form Requests & API Resources:
  - FormRequest: `StoreAttendanceRequest`, `UpdateAttendanceRequest`, `StoreGradeComponentRequest`, `UpdateGradeComponentRequest`, `StoreGradeRequest`, `UpdateGradeRequest`, `SimulateGpaRequest`.
  - Resources: `AttendanceResource`, `GradeComponentResource`, `GradeResource`.
- Controllers & API Routes:
  - `AttendanceController`: CRUD presensi, filter status, summary presensi (`/courses/{id}/attendance-summary`) dengan kalkulasi persentase dan peringatan ambang batas (threshold warning jika kehadiran < 75% atau sisa jatah alpa <= 1).
  - `GradeController`: CRUD komponen penilaian berbobot per mata kuliah, CRUD nilai per komponen dengan validasi kepemilikan komponen.
  - `GpaController`:
    - `courseGpa`: kalkulasi nilai akhir berbobot, konversi huruf mutu (A, A-, B+, B, dst.), dan bobot mutu (4.0 scale).
    - `semesterGpa`: kalkulasi Indeks Prestasi Semester (IPS) berbobot SKS.
    - `cumulativeGpa`: kalkulasi Indeks Prestasi Kumulatif (IPK) lintas semester.
    - `simulate`: simulator proyeksi IPK berdasarkan target nilai hipotetis.
  - Pendaftaran rute ganda (`/api/...` dan `/api/v1/...`) di bawah middleware `auth:sanctum`.
- Testing:
  - Menulis 3 Feature Test classes (`AttendanceTest`, `GradeTest`, `GpaTest`) dengan total 19 tests baru (59 assertions).
  - Seluruh test suite (70 tests, 227 assertions) 100% PASS tanpa error.

**Keputusan teknis:**
- Multi-tenancy / Data Isolation: Semua endpoint presensi, nilai, dan IPK memverifikasi kepemilikan user melalui relasi `whereHas('course.semester', fn($q) => $q->where('user_id', $user->id))` sehingga user lain mendapatkan respon 404/403.
- Grading Scale Standard: Menerapkan skala standar 4.0 (A: 4.0, A-: 3.7, B+: 3.3, B: 3.0, B-: 2.7, C+: 2.3, C: 2.0, D: 1.0, E: 0.0) dengan kalkulasi terbobot SKS yang akurat.
- GPA Simulator Flexibility: Simulator dapat menerima nilai saat ini dan SKS saat ini secara manual, atau secara cerdas mengambil data riwayat akademik user secara otomatis jika tidak disediakan di payload.

**Masalah yang ditemukan:**
- Assertions angka desimal pada `assertJsonPath` mendeteksi perbedaan tipe strict antara integer (misal 75 yang di-encode JSON tanpa desimal) dan float (75.0) → Diatasi dengan membandingkan nilai numerik via callback closure `(float) $val == 75.0`.

**Referensi:**
- Branch: `feature/backend/academic-tracking`
- Implementation Plan: Phase 3 Academic Tracking

---

### [2026-09-12] — Phase 2 Frontend-Backend Contract Alignment

**Branch**: `develop`
**Status**: Selesai

**Yang dikerjakan:**
- Audit & testing integrasi end-to-end Phase 2 antara React Native client (`apps/mobile`) dan Laravel API (`apps/api`).
- Memperbaiki `CourseScheduleResource`, `AssignmentResource`, dan `ExamResource` untuk menyertakan relasi objek `course` (`'course' => new CourseResource($this->whenLoaded('course'))`).
- Menjalankan 24 automated contract assertions covering seluruh interaksi user di 5 screen mobile: Beranda, Jadwal, Kuliah, Detail Kuliah, Tugas/Ujian.

**Masalah yang ditemukan:**
- Komponen frontend (`ScheduleCard`, `AssignmentCard`, `ExamCard`) mengakses nested property `item.course?.name`, `item.course?.code`, `item.course?.lecturer`, `item.course?.classroom`, sedangkan sebelumnya backend resource hanya menyediakan flat fields (`course_name`, `course_code`).
- Solusi: Menyertakan relasi `course` dengan `CourseResource` ketika loaded (`whenLoaded('course')`), sehingga backward-compatible dan memenuhi ekspektasi kontrak frontend.

**Test results:**
- 24/24 contract assertions PASS di script verifikasi integrasi.
- `php artisan test`: 70 passed (227 assertions).
- Mobile TypeScript: `npx tsc --noEmit` 0 error.

---

### [2026-09-12] — Community Standards & Repository Documentation

**Branch**: `develop`
**Status**: Selesai

**Yang dikerjakan:**
- Menambahkan lisensi open-source resmi `LICENSE` (MIT License).
- Menambahkan kebijakan pelaporan kerentanan keamanan `SECURITY.md`.
- Menambahkan panduan kontributor `CONTRIBUTING.md` (alur branching, conventional commits, instruksi lokal, dan definition of done).
- Menambahkan kode etik komunitas `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1).
- Menambahkan GitHub template: `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`.
- Memperbarui `README.md`: sinkronisasi badge, status roadmap akurat, panduan instalasi lokal cepat (Docker, API, Mobile), dan indeks dokumentasi.

---

### [2026-09-13] — Mobile UX Enhancements & Full Dynamic Theme System

**Branch**: `develop`
**Status**: Selesai

**Yang dikerjakan:**
- **Metro Bundler (Windows EMFILE fix)**: Mengonfigurasi `apps/mobile/metro.config.js` dengan `graceful-fs` untuk mengatasi batas file descriptor (`EMFILE: too many open files`) pada Windows saat reload Metro bundler.
- **Exam Countdown**: Menambahkan kalkulasi sisa hari (`getDaysRemaining`) dan badge countdown dinamis (`H-hari`, `Besok (H-1)`, `Hari Ini`, `Selesai`) dengan color variant semantik pada `ExamCard.tsx`.
- **Login UX & Keyboard Handling**: Mengoptimalkan `KeyboardAvoidingView` dan padding scroll pada `login.tsx` agar form input password tidak terhalang keyboard virtual di perangkat fisik.
- **Dashboard Top Bar Safe Area**: Memperbaiki header beranda (`index.tsx`) dengan `SafeAreaView edges={['top']}` agar tidak terpotong oleh status bar atau notch layar hp.
- **Theme System & Appearance Modal**:
  - Membuat `useThemeStore.ts` dengan dukungan tiga mode: `'dark'`, `'light'`, dan `'system'` (mengikuti skema warna sistem OS via `Appearance.addChangeListener`).
  - Menambahkan dialog pemilihan tema `AppearanceModal.tsx` dengan micro-interaction dan icon toggle pada top bar beranda.
  - Memperluas token warna dan shadow pada `tokens.ts` (`lightColors`, `lightShadows`, `darkColors`, `darkShadows`).
  - Mengubah arsitektur stylesheet di seluruh screen dan komponen mobile dari pola statis menjadi pola pabrik dinamis `createStyles(colors, shadows)` dengan `useUniTheme()` dan `useMemo()`.
  - Memperbaiki reaktivitas warna background, card, avatar profile, teks nama pengguna, input form, dialog modal, picker, bottom nav, dan badge di seluruh antarmuka saat beralih antara Dark Mode dan Light Mode.

**Test results:**
- `npx tsc --noEmit` di `apps/mobile`: 0 error.
- `php artisan test` di `apps/api`: 70 tests passed (227 assertions).

---

### [2026-09-16] — Phase 3 E2E Integration Verification & Swipe-to-Delete Refinement

**Branch**: `develop`
**Status**: Selesai ✅

**Yang dikerjakan:**
- **Merge & Verification Phase 3**: Menggabungkan dan memverifikasi integrasi antarmuka Phase 3 Academic Tracking (Presensi, Nilai, GPA, Simulator) dari branch `feature/mobile/academic-tracking` ke `develop`.
- **Swipe-to-Delete Automatic Trigger ([UniSwipeable.tsx](apps/mobile/src/components/ui/UniSwipeable.tsx))**:
  - Menambahkan listener `onSwipeableOpen` pada komponen reusable `UniSwipeable` dengan debounce guard (`isPromptingRef`).
  - Mengubah alur swipe agar begitu kartu digeser melewati ambang batas (`rightThreshold: 40`), dialog konfirmasi peringatan (`Alert.alert`) langsung terbuka seketika tanpa mengharuskan pengguna mengetuk tombol tempat sampah merah dua kali.
  - Menyelaraskan animasi penutupan kartu otomatis (`swipeableRef.current?.close()`), sehingga jika pengguna membatalkan penghapusan, kartu kembali ke posisi normal tanpa tersangkut dalam kondisi terbuka.
- **Konsistensi Dialog Peringatan ([course/[id].tsx](apps/mobile/src/app/course/[id].tsx))**:
  - Membungkus seluruh aksi penghapusan jadwal, tugas, ujian, presensi, dan nilai asesmen dengan dialog konfirmasi `Alert.alert` agar konsisten dan mencegah penghapusan data akademik tanpa sengaja.

**Test results:**
- `npx tsc --noEmit` di `apps/mobile`: 0 error (100% Pass).
- `php artisan test` di `apps/api`: 70 tests passed (227 assertions, 100% Pass).
- `npx tsx scripts/verify-tracking.ts`: 12/12 tracking tests passed (100% Pass).

---

### [2026-09-16] — Phase 4 Productivity Backend API Implementation

**Branch**: `develop` (via PR [#2](https://github.com/AruYQ/UniDemic/pull/2) dari `feature/backend/productivity`)
**Status**: Selesai & Merged ke `develop` ✅

**Yang dikerjakan:**
- **Shared Types ([packages/types/src/index.ts](file:///c:/proj/UniDemic/packages/types/src/index.ts))**:
  - Menambahkan kontrak TypeScript lengkap untuk modul Produktivitas: `ProductivityTask`, `TaskSubtask`, `TaskPriority`, `StudySession`, `StudySessionType`, `StudySessionSummary`, `Goal`, `GoalType`, `StudyPlanItem`, `StudyPlanSuggestion`, serta seluruh payload request/response CRUD terkait.
- **Database Migrations (`apps/api/database/migrations/`)**:
  - `2026_09_16_000001_create_productivity_tasks_table.php`: tabel `productivity_tasks` dengan kolom `user_id`, `course_id` (nullable), `title`, `description`, `priority` (low, medium, high, urgent), `deadline`, `label`, `is_recurring`, `recurrence_pattern`, `progress` (0-100), `is_completed`, `completed_at`.
  - `2026_09_16_000002_create_task_subtasks_table.php`: tabel `task_subtasks` dengan kolom `task_id`, `title`, `is_done`, `order`.
  - `2026_09_16_000003_create_study_sessions_table.php`: tabel `study_sessions` dengan kolom `user_id`, `course_id`, `task_id`, `type` (pomodoro, custom, stopwatch), `duration_minutes`, `started_at`, `ended_at`, `notes`, `is_completed`.
  - `2026_09_16_000004_create_goals_table.php`: tabel `goals` dengan kolom `user_id`, `title`, `description`, `type` (weekly, monthly, semester, custom), `target_value`, `current_value`, `unit`, `start_date`, `end_date`, `is_completed`.
- **Eloquent Models & Hooks (`apps/api/app/Models/`)**:
  - `Task`: relasi ke `User`, `Course`, `TaskSubtask`, dan `StudySession`. Dilengkapi method `recalculateProgress()` untuk kalkulasi otomatis `progress` dan `is_completed` berdasarkan rasio subtask yang selesai.
  - `TaskSubtask`: model hook `booted()` pada event `saved` dan `deleted` yang memicu pembaruan progress task induk secara reaktif.
  - `StudySession`: relasi ke `User`, `Course`, dan `Task`.
  - `Goal`: model hook `saving` yang secara otomatis menandai `is_completed = true` ketika `current_value >= target_value`.
  - `User`: penambahan relasi `tasks()`, `studySessions()`, dan `goals()`.
- **FormRequests & API Resources (`apps/api/app/Http/Requests/Productivity/` & `Resources/`)**:
  - Validasi ketat: `StoreTaskRequest`, `UpdateTaskRequest`, `StoreSubtaskRequest`, `UpdateSubtaskRequest`, `StoreStudySessionRequest`, `StoreGoalRequest`, `UpdateGoalRequest`, `StudyPlannerRequest`.
  - Resources: `TaskResource`, `TaskSubtaskResource`, `StudySessionResource`, `GoalResource`.
- **Controllers & API Endpoints (`apps/api/app/Http/Controllers/Api/`)**:
  - `TaskController`: CRUD task, filter prioritas/status/label/mata kuliah, toggle complete (`/tasks/{id}/toggle-complete`), serta operasi subtask mandiri.
  - `StudySessionController`: pencatatan sesi belajar mandiri/pomodoro/stopwatch dengan validasi isolasi data dan metrik agregasi ringkasan (`/study-sessions/summary`) mencakup menit belajar hari ini, minggu ini, total sesi, dan rincian per mata kuliah.
  - `GoalController`: manajemen target capaian akademik, filter jenis target, dan update progress cepat via PATCH (`/goals/{id}/progress`).
  - `StudyPlannerController`: algoritma rekomendasi jadwal cerdas (`/study-planner/suggest`) yang memadukan deadline tugas mendesak, jadwal ujian mendatang, dan jadwal kuliah aktif untuk memetakan blok belajar bebas tabrakan jadwal.
- **Pendaftaran Rute API ([routes/api.php](file:///c:/proj/UniDemic/apps/api/routes/api.php))**:
  - Mendaftarkan rute Productivity di bawah middleware `auth:sanctum` untuk namespace `/api/...` dan `/api/v1/...`.
- **Feature Test Suite (`apps/api/tests/Feature/Productivity/`)**:
  - Menulis 4 file test komprehensif: `TaskTest.php` (8 tests), `StudySessionTest.php` (5 tests), `GoalTest.php` (6 tests), `StudyPlannerTest.php` (3 tests).
  - Hasil test: 22 tests lulus (107 assertions).
  - Total test suite backend: 92 tests lulus (334 assertions, 100% Pass).

**Keputusan teknis:**
- **Table Name Isolation**: Menggunakan nama tabel `productivity_tasks` untuk menghindari potensi benturan dengan reserved keywords atau queue job workers, sembari mempertahankan nama class Eloquent `App\Models\Task`.
- **Subtask Reactive Progress**: Menggunakan model events Eloquent (`saved` dan `deleted` pada `TaskSubtask`) agar progres task selalu terhitung secara konsisten baik saat subtask ditandai selesai, diubah, maupun dihapus.
- **Smart Planner Constraint Checking**: Algoritma penjadwalan secara dinamis memeriksa nama hari kuliah (`monday`, `tuesday`, dll.) dan memverifikasi ketiadaan interval tumpang tindih waktu sebelum menugaskan slot belajar.

**Test results:**
- `php artisan test --filter=Productivity`: 22 passed (107 assertions, 100% Pass).
- `php artisan test` (seluruh sistem): 92 passed (334 assertions, 100% Pass).
- `npx tsc --noEmit` di `apps/mobile`: 0 error (100% Pass).

---

### [2026-09-18] — Phase 5 Learning Backend API Implementation

**Branch**: `feature/backend/learning`
**Status**: Selesai & Terverifikasi (107 Feature Tests Pass) ✅

**Yang dikerjakan:**
- **Shared Types ([packages/types/src/index.ts](file:///c:/proj/UniDemic/packages/types/src/index.ts))**:
  - Menambahkan tipe dan antarmuka TypeScript lengkap untuk modul Pembelajaran (Learning): `MaterialType`, `Material`, `CreateMaterialPayload`, `UpdateMaterialPayload`, `Note`, `CreateNotePayload`, `UpdateNotePayload`, `FlashcardDeck`, `Flashcard`, `CreateFlashcardDeckPayload`, `UpdateFlashcardDeckPayload`, `CreateFlashcardPayload`, `UpdateFlashcardPayload`, `ReviewFlashcardPayload`, `QuizQuestionType`, `QuizQuestion`, `CreateQuizQuestionPayload`, `UpdateQuizQuestionPayload`, `Quiz`, `QuizAttempt`, `CreateQuizPayload`, `UpdateQuizPayload`, `SubmitQuizAttemptPayload`.
- **Database Migrations (`apps/api/database/migrations/`)**:
  - `2026_09_18_000001_create_materials_table.php`: tabel `materials` (course_id, title, type, file_path, file_size, url, description).
  - `2026_09_18_000002_create_notes_table.php`: tabel `notes` (user_id, course_id, title, content, tags, is_pinned, color).
  - `2026_09_18_000003_create_note_links_table.php`: tabel pivot `note_links` untuk bidirectional/networked notes (note_id, linked_note_id).
  - `2026_09_18_000004_create_flashcards_tables.php`: tabel `flashcard_decks` dan `flashcards` (deck_id, question, answer, ease_factor, interval, repetitions, next_review_at, last_reviewed_at).
  - `2026_09_18_000005_create_quizzes_tables.php`: tabel `quizzes`, `quiz_questions`, dan `quiz_attempts` (user_id, quiz_id, score, total_questions, correct_answers, answers, completed_at).
- **Eloquent Models (`apps/api/app/Models/`)**:
  - `Material`: relasi ke `Course`.
  - `Note`: relasi ke `User`, `Course`, `linkedNotes`, dan `backlinks` via pivot `note_links`.
  - `FlashcardDeck`: relasi ke `User`, `Course`, `cards`, dan query `dueCards`.
  - `Flashcard`: algoritma Spaced Repetition **SuperMemo SM-2** pada method `applyReview(int $rating)` (Rating 1: Again, 2: Hard, 3: Good, 4: Easy; EF calculation dengan threshold min 1.30; recalculate interval & next review date).
  - `Quiz`, `QuizQuestion`, `QuizAttempt`: relasi terstruktur untuk bank soal latihan dan riwayat pengerjaan quiz.
  - Penambahan relasi di `User` (`notes`, `flashcardDecks`, `quizzes`, `quizAttempts`) dan `Course` (`materials`, `notes`, `flashcardDecks`, `quizzes`).
- **FormRequests & API Resources (`apps/api/app/Http/Requests/Learning/` & `Resources/`)**:
  - FormRequest: `StoreMaterialRequest`, `UpdateMaterialRequest`, `UploadMaterialFileRequest`, `StoreNoteRequest`, `UpdateNoteRequest`, `StoreFlashcardDeckRequest`, `UpdateFlashcardDeckRequest`, `StoreFlashcardRequest`, `UpdateFlashcardRequest`, `ReviewFlashcardRequest`, `StoreQuizRequest`, `UpdateQuizRequest`, `StoreQuizQuestionRequest`, `UpdateQuizQuestionRequest`, `SubmitQuizAttemptRequest`.
  - API Resources: `MaterialResource`, `NoteResource`, `FlashcardDeckResource`, `FlashcardResource`, `QuizResource`, `QuizQuestionResource`, `QuizAttemptResource`.
- **Controllers & API Endpoints (`apps/api/app/Http/Controllers/Api/`)**:
  - `MaterialController`: Upload materi kuliah, lampiran file mandiri via disk public/MinIO, link referensi eksternal, dan filter mata kuliah.
  - `NoteController`: Catatan Markdown, filtering tag / status pinned / search keyword, serta endpoint link & unlink antar-catatan (`/notes/{id}/link/{target_id}`).
  - `FlashcardController`: CRUD deck & cards, endpoint kartu yang jatuh tempo (`/flashcard-decks/{id}/due-cards`), serta pencatatan review SM-2 (`/flashcards/{id}/review`).
  - `QuizController`: Pembuatan quiz, bank pertanyaan (multiple choice, true/false, short answer), submit pengerjaan dengan auto-grading skor 0-100 (`/quizzes/{id}/attempt`), dan riwayat attempt.
- **Pendaftaran Rute API ([routes/api.php](file:///c:/proj/UniDemic/apps/api/routes/api.php))**:
  - Mendaftarkan endpoint Phase 5 di bawah middleware `auth:sanctum` untuk `/api/...` dan `/api/v1/...`.
- **Feature Test Suite (`apps/api/tests/Feature/Learning/`)**:
  - `MaterialTest.php`: 5 tests pass (upload file, link resource, CRUD, tenant isolation).
  - `NoteTest.php`: 4 tests pass (Markdown note creation, keyword search, tag filtering, note linking/unlinking).
  - `FlashcardTest.php`: 3 tests pass (deck creation, SuperMemo SM-2 interval progression & repetition reset).
  - `QuizTest.php`: 3 tests pass (quiz & questions creation, attempt grading, score percentage calculation).
  - Total test suite backend: 107 tests pass (503 assertions, 100% Pass).

**Keputusan teknis:**
- **SM-2 Algorithm Integration**: Mengimplementasikan formula resmi SuperMemo SM-2 langsung pada level model (`Flashcard::applyReview`), memetakan rating 1-4 ke kualitas respon 1-5, dan menghitung ease factor serta penjadwalan tanggal `next_review_at` secara akurat.
- **Bidirectional Note Linking**: Menggunakan pivot `note_links` berorientasi graf sehingga sebuah catatan dapat memuat relasi catatan keluar (`linkedNotes`) dan catatan masuk (`backlinks`) untuk fondasi visualisasi knowledge graph.
- **Strict Multi-Tenancy**: Seluruh akses ke materi, catatan, dek flashcard, dan kuis diproteksi dan diverifikasi kepemilikan tokennya terhadap user yang sedang login.

**Test results:**
- `php artisan test --filter=Learning`: 15 passed (73 assertions, 100% Pass).
- `php artisan test` (seluruh sistem): 107 passed (503 assertions, 100% Pass).
- `npx tsc --noEmit` di `apps/mobile`: 0 error (100% Pass).

---

### [2026-09-19] — Phase 6 Communication Backend API Implementation

**Branch**: `feature/backend/communication`
**Status**: Selesai & Terverifikasi (124 Feature Tests Pass) ✅

**Yang dikerjakan:**
- **Shared Types ([packages/types/src/index.ts](file:///c:/proj/UniDemic/packages/types/src/index.ts))**:
  - Menambahkan tipe & antarmuka TypeScript untuk komunikasi perkuliahan: `ConversationType`, `ParticipantRole`, `MessageType`, `AcademicReferenceType`, `ConversationParticipant`, `MessageAttachment`, `MessageReaction`, `AcademicReference`, `Message`, `Conversation`, `CreateConversationPayload`, `UpdateConversationPayload`, `AddParticipantPayload`, `SendMessagePayload`, `UpdateMessagePayload`, `ToggleReactionPayload`, `CreateCourseChannelPayload`.
- **Database Migrations (`apps/api/database/migrations/`)**:
  - `2026_09_19_000001_create_conversations_table.php`: tabel `conversations` (type, name, description, course_id, avatar_url, created_by, last_message_at) dan `conversation_participants` (conversation_id, user_id, role, last_read_at, joined_at).
  - `2026_09_19_000002_create_messages_table.php`: tabel `messages` (conversation_id, user_id, content, type, reply_to_id, reference_type, reference_id, deleted_at), `message_attachments` (message_id, file_path, file_name, file_size, file_type), dan `message_reactions` (message_id, user_id, emoji).
- **Eloquent Models (`apps/api/app/Models/`)**:
  - `Conversation`: method pembantu `isParticipant($userId)`, `unreadCountFor($userId)`, relasi ke `course`, `creator`, `participants`, `users`, `messages`, `lastMessage`.
  - `ConversationParticipant`: relasi ke `conversation` dan `user`.
  - `Message`: relasi ke `conversation`, `user`, `replyTo`, `replies`, `attachments`, `reactions`, accessor `academic_reference_data` (resolusi dinamis ke assignment, exam, material, note, quiz).
  - `MessageAttachment`: accessor `file_url` (Storage URL).
  - `MessageReaction`: relasi ke `message` dan `user`.
  - Penambahan relasi di `User` (`conversations`, `participations`, `messages`) dan `Course` (`discussions`).
- **Events & Broadcasting (`apps/api/app/Events/`)**:
  - `MessageSent`: implements `ShouldBroadcast` pada channel privat `conversation.{id}`.
  - `MessageReactionUpdated`: implements `ShouldBroadcast` pada channel privat `conversation.{id}`.
- **FormRequests & API Resources (`apps/api/app/Http/Requests/Communication/` & `Resources/`)**:
  - FormRequest: `StoreConversationRequest`, `UpdateConversationRequest`, `AddParticipantRequest`, `SendMessageRequest`, `UpdateMessageRequest`, `ToggleReactionRequest`, `StoreCourseChannelRequest`.
  - API Resources: `ConversationResource`, `ConversationParticipantResource`, `MessageResource`, `MessageAttachmentResource`, `MessageReactionResource`.
- **Controllers & API Endpoints (`apps/api/app/Http/Controllers/Api/`)**:
  - `ConversationController`: CRUD percakapan, deduplikasi pesan langsung (DM), manajemen partisipan (tambah/hapus), serta penandaan pesan telah dibaca (`/conversations/{id}/read`).
  - `MessageController`: Pagination pesan (50 pesan terbaru), pengiriman pesan teks & lampiran file, reply thread, update/delete pesan (soft delete), serta toggle reaksi emoji (`/messages/{id}/reactions`).
  - `CourseDiscussionController`: Auto-provisioning kanal diskusi default kelas (`#general`, `#tugas`, `#ujian`, `#resources`) untuk setiap mata kuliah, serta pembuatan custom channel.
- **Pendaftaran Rute API ([routes/api.php](file:///c:/proj/UniDemic/apps/api/routes/api.php))**:
  - Mendaftarkan 20 endpoint komunikasi di bawah middleware `auth:sanctum` untuk `/api/...` dan `/api/v1/...`.
- **Feature Test Suite (`apps/api/tests/Feature/Communication/`)**:
  - `ConversationTest.php`: 6 tests pass (create direct message, deduplicate DM, group conversation, unread count & mark read, add participant, access control).
  - `MessageTest.php`: 6 tests pass (send message, reply to message, upload attachment, toggle emoji reaction, soft delete message, access control).
  - `CourseDiscussionTest.php`: 3 tests pass (auto-provision default course channels, create custom channel, post message to course channel).
  - Total test suite backend: 124 tests pass (570 assertions, 100% Pass).

**Keputusan teknis:**
- **Direct Message (DM) Deduplication**: Sebelum membuat percakapan `direct`, backend memeriksa apakah sudah ada percakapan direct antara 2 user tersebut. Jika sudah ada, sistem mengembalikan percakapan yang sudah ada daripada membuat duplikat baru.
- **Course Channel Auto-Provisioning**: Setiap mata kuliah secara cerdas otomatis dilengkapi dengan 4 kanal diskusi baku (`#general`, `#tugas`, `#ujian`, `#resources`) saat endpoint diskusi pertama kali diakses, memastikan mahasiswa langsung memiliki ruang diskusi yang terstruktur.
- **Real-time Event Broadcasting**: Event `MessageSent` dan `MessageReactionUpdated` disiapkan dengan kontrak `ShouldBroadcast` pada `PrivateChannel('conversation.{id}')` untuk mendukung integrasi WebSocket (Laravel Reverb / Pusher / Soketi) di masa mendatang tanpa breaking changes.
- **Soft Message Deletion**: Pesan yang dihapus menggunakan soft-delete sehingga status pesan tetap tercatat di database (`deleted_at`), dan konten digantikan dengan teks penanda ("Pesan ini telah dihapus") pada respons JSON untuk menjaga integritas alur thread/balasan.

**Test results:**
- `php artisan test --filter=Communication`: 15 passed (57 assertions, 100% Pass).
- `php artisan test` (seluruh sistem): 124 passed (570 assertions, 100% Pass).
- `npx tsc --noEmit` di `apps/mobile`: 0 error (100% Pass).





