# 🎓 UniDemic — Implementation Plan

> **Platform**: Academic Productivity & Collaboration App  
> **Stack**: React Native (Expo) + Laravel API + PostgreSQL + Redis + S3  
> **AI Model**: Gemini Flash 2.5 (untuk AI features & AI-assisted development)  
> **Status**: 🚧 Early Development  

---

## 📋 Ringkasan Analisis Read.md

UniDemic adalah **Student Operating System** open-source yang mengintegrasikan:

| Modul | Deskripsi |
|-------|-----------|
| 🏠 Dashboard | Ringkasan harian: jadwal, tugas, absensi, GPA |
| 📚 Academic | Semester, mata kuliah, jadwal, tugas, ujian |
| 📊 Tracking | Absensi, nilai, GPA calculator & simulator |
| 🧠 Productivity | Task manager, study planner, focus timer, goals |
| 📖 Learning | Materi kuliah, catatan, flashcard, kuis |
| 🤖 AI | Study assistant (RAG), quiz generator, weak-topic detection |
| 💬 Chat | DM, group chat, course discussion, contextual chat |
| 👥 Collaboration | Study groups, project workspace, Kanban, GitHub integration |
| 📈 Analytics | Study time, GPA trends, performance insights |
| 🌐 Cross-platform | Mobile-first (Android/iOS) + Web companion |

---

## ⚠️ User Review Required

> [!IMPORTANT]
> Plan ini dibagi menjadi **2 jalur paralel** (Dev A & Dev B) yang bisa dikerjakan bersamaan, serta **2 AI Agent** untuk membantu masing-masing jalur. Setiap fitur memiliki **checkpoint verifikasi** sebelum lanjut ke fase berikutnya.

> [!WARNING]
> Urutan fase **harus diikuti** — Phase 1 (Foundation) adalah blocker untuk semua fase lain. Dev A dan Dev B baru bisa split setelah Foundation selesai.

> [!CAUTION]
> AI features (Phase 8) membutuhkan cost management yang ketat. Pastikan rate limiting dan quota system sudah diimplementasi sebelum expose ke user.

---

## 🤖 Pembagian AI Agent

### AI Agent 1 — Backend Agent (membantu Dev A)
- Model: **Gemini Flash 2.5**
- Fokus: Laravel API, database migrations, endpoint generation, testing
- Tools: `run_command`, `write_to_file`, `grep_search`, `view_file`
- Tanggung jawab: Generate boilerplate API, schema database, seeding, unit test

### AI Agent 2 — Frontend Agent (membantu Dev B)
- Model: **Gemini Flash 2.5**
- Fokus: React Native screens, state management, UI components, Expo Router
- Tools: `run_command`, `write_to_file`, `grep_search`, `view_file`
- Tanggung jawab: Generate screens, komponen UI, integrasi API client, testing

---

## 👥 Pembagian Developer

### 🔵 Dev A — Backend Engineer
**Stack**: Laravel · PostgreSQL · Redis · S3 · WebSocket

| Phase | Tanggung Jawab |
|-------|----------------|
| 1 | Setup project, Docker, CI/CD, auth API, user profile API |
| 2 | Academic API (semester, course, schedule, assignment, exam) |
| 3 | Attendance API, Grades API, GPA calculator |
| 4 | Task API, Study planner, Focus session API, Goals API |
| 5 | Materials API, Notes API, Flashcard API, Quiz API |
| 6 | Chat backend (WebSocket/Pusher), DM, group, attachments |
| 7 | Study group API, Project workspace API, GitHub integration |
| 8 | AI gateway, RAG pipeline, rate limiting, quota management |

### 🟢 Dev B — Frontend Engineer (Mobile)
**Stack**: React Native · Expo · TypeScript · TanStack Query · Zustand

| Phase | Tanggung Jawab |
|-------|----------------|
| 1 | Setup Expo project, navigation structure, auth screens, onboarding |
| 2 | Dashboard screen, Academic screens (semester, course, schedule) |
| 3 | Attendance UI, Grades UI, GPA tracker & simulator |
| 4 | Task manager UI, Study planner UI, Focus timer UI |
| 5 | Materials UI, Notes editor, Flashcard UI, Quiz UI |
| 6 | Chat UI (DM, group, course discussion), real-time messaging |
| 7 | Study group UI, Project workspace, Kanban board |
| 8 | AI chat UI, quiz generator UI, analytics dashboard |

---

## 🗺️ Roadmap dengan Verifikasi Per Fase

---

### PHASE 1 — Foundation
> **Estimasi**: 1–2 minggu | **Blocker untuk semua fase lain**

#### 🔵 Dev A (Backend)

##### [NEW] `apps/api/` — Laravel Project Setup
- Init Laravel project dengan Docker Compose
- Setup PostgreSQL + Redis containers
- Konfigurasi environment (.env, .env.example)
- Database migrations awal (users, tokens)
- Laravel Sanctum untuk auth
- API: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- User profile API: `GET/PUT /profile`
- CI/CD pipeline (GitHub Actions)

##### [NEW] `infrastructure/docker-compose.yml`
- Services: api, db (PostgreSQL), redis, minio (S3 local)

---

#### 🟢 Dev B (Frontend)

##### [NEW] `apps/mobile/` — Expo Project Setup
- Init Expo + TypeScript + Expo Router
- Setup TanStack Query + Zustand + Zod
- Konfigurasi folder structure (`app/`, `components/`, `hooks/`, `store/`, `lib/`)
- Auth screens: Login, Register, Forgot Password
- Secure token storage (expo-secure-store)
- API client setup (axios/fetch wrapper)

---

#### ✅ CHECKPOINT 1 — Verifikasi Foundation
```
[ ] API register/login/logout bekerja (test via Postman/curl)
[ ] Token tersimpan di mobile dan dikirim ke setiap request
[ ] User bisa login dan melihat profile screen
[ ] Docker compose berjalan lokal
[ ] CI/CD pipeline hijau (build pass)
```
> **➡️ Konfirmasi sebelum lanjut ke Phase 2**

---

### PHASE 2 — Academic Core
> **Estimasi**: 2–3 minggu | Mulai paralel setelah Phase 1 ✅

#### 🔵 Dev A — Academic APIs

##### [NEW] Database Migrations
- `semesters` — id, user_id, name, start_date, end_date, is_active
- `courses` — id, semester_id, name, code, lecturer, credits, classroom
- `course_schedules` — id, course_id, day, start_time, end_time, room
- `assignments` — id, course_id, title, description, deadline, priority, progress
- `exams` — id, course_id, type, date, time, location, topics

##### [NEW] API Endpoints
```
GET|POST        /semesters
GET|PUT|DELETE  /semesters/{id}
POST            /semesters/{id}/activate

GET|POST        /courses
GET|PUT|DELETE  /courses/{id}

GET|POST        /courses/{id}/schedules
PUT|DELETE      /schedules/{id}

GET|POST        /courses/{id}/assignments
PUT|DELETE      /assignments/{id}

GET|POST        /courses/{id}/exams
PUT|DELETE      /exams/{id}
```

---

#### 🟢 Dev B — Academic Screens

- Semester list & create screen
- Course list + detail screen
- Weekly schedule view (calendar grid)
- Assignment list + detail + progress update
- Exam tracker screen
- **Dashboard screen** (today's schedule, upcoming, attendance summary)

---

#### ✅ CHECKPOINT 2 — Verifikasi Academic Core
```
[ ] User bisa buat semester dan aktifkan semester
[ ] User bisa tambah mata kuliah dengan jadwal
[ ] Jadwal tampil di weekly view mobile
[ ] Assignment bisa dibuat, diupdate progress
[ ] Dashboard menampilkan data nyata dari API
```
> **➡️ Konfirmasi sebelum lanjut ke Phase 3**

---

### PHASE 3 — Academic Tracking
> **Estimasi**: 1–2 minggu

#### 🔵 Dev A — Tracking APIs

##### [NEW] Database Migrations
- `attendances` — id, course_id, date, status (present/absent/permission)
- `grades` — id, course_id, component, score, weight
- `grade_components` — id, course_id, name, weight (configurable)

##### [NEW] API Endpoints
```
GET|POST        /courses/{id}/attendances
PUT             /attendances/{id}
GET             /courses/{id}/attendance-summary

GET|POST        /courses/{id}/grades
GET             /courses/{id}/gpa
GET             /semesters/{id}/gpa
GET             /profile/cumulative-gpa

POST            /gpa-simulator   (body: hypothetical grades)
```

---

#### 🟢 Dev B — Tracking Screens
- Attendance log per mata kuliah
- Attendance warning alerts
- Grade input per komponen
- GPA tracker (per semester + kumulatif)
- GPA Simulator screen

---

#### ✅ CHECKPOINT 3 — Verifikasi Tracking
```
[ ] Attendance tercatat dan persentase terhitung otomatis
[ ] Warning muncul jika absensi mendekati batas
[ ] Nilai per komponen ter-input dan GPA terhitung benar
[ ] GPA simulator berfungsi dengan input nilai hipotetis
```
> **➡️ Konfirmasi sebelum lanjut ke Phase 4**

---

### PHASE 4 — Productivity
> **Estimasi**: 1–2 minggu

#### 🔵 Dev A — Productivity APIs
- `tasks` — id, user_id, title, priority, deadline, label, is_recurring, progress
- `task_subtasks` — id, task_id, title, is_done
- `study_sessions` — id, user_id, course_id, duration_minutes, started_at
- `goals` — id, user_id, title, type (weekly/monthly), target, current
- Study planner: endpoint untuk suggest jadwal belajar berdasarkan deadline & free time

---

#### 🟢 Dev B — Productivity Screens
- Task list + create/edit (dengan subtask)
- Study planner view (suggested time blocks)
- Focus session timer (Pomodoro / custom)
- Goals screen dengan progress tracking
- Calendar integration

---

#### ✅ CHECKPOINT 4 — Verifikasi Productivity
```
[ ] Task bisa dibuat, diedit, dengan subtask
[ ] Focus timer berjalan dan mencatat durasi ke study_sessions
[ ] Study planner menampilkan saran jadwal
[ ] Goals terbuat dan progress terupdate otomatis
```
> **➡️ Konfirmasi sebelum lanjut ke Phase 5**

---

### PHASE 5 — Learning
> **Estimasi**: 2–3 minggu

#### 🔵 Dev A — Learning APIs
- `materials` — id, course_id, title, type (pdf/link/video/etc), url, file_path
- `notes` — id, user_id, course_id, title, content (markdown), tags
- `note_links` — id, note_id, linked_note_id
- `flashcard_decks` — id, user_id, course_id, name
- `flashcards` — id, deck_id, question, answer, next_review_at, interval
- `quizzes` — id, user_id, course_id, title
- `quiz_questions` — id, quiz_id, type, question, options (JSON), answer
- S3 integration untuk file upload materials
- Spaced Repetition algorithm (SM-2)

##### API Endpoints
```
GET|POST        /courses/{id}/materials
POST            /materials/upload
GET|POST        /notes
GET|PUT|DELETE  /notes/{id}

GET|POST        /flashcard-decks
GET|POST        /flashcard-decks/{id}/cards
POST            /flashcards/{id}/review  (update SRS interval)

GET|POST        /quizzes
GET|POST        /quizzes/{id}/questions
POST            /quizzes/{id}/attempt
```

---

#### 🟢 Dev B — Learning Screens
- Materials list + viewer (PDF, link, video)
- Notes editor (Markdown dengan preview)
- Note linking / backlinks view
- Flashcard study screen (flip card animation)
- Quiz creation + attempt screen

---

#### ✅ CHECKPOINT 5 — Verifikasi Learning
```
[ ] File PDF bisa diupload ke S3 dan ditampilkan di mobile
[ ] Notes bisa ditulis dalam Markdown dan dipreview
[ ] Flashcard bisa di-review dengan spaced repetition
[ ] Kuis bisa dibuat dan dikerjakan dengan hasil tersimpan
```
> **➡️ Konfirmasi sebelum lanjut ke Phase 6**

---

### PHASE 6 — Communication (Chat)
> **Estimasi**: 2–3 minggu | Kompleks — WebSocket real-time

#### 🔵 Dev A — Chat Backend
- `conversations` — DM dan group
- `messages` — id, conversation_id, user_id, content, type, reply_to_id
- `message_reactions` — id, message_id, user_id, emoji
- `message_reads` — id, message_id, user_id, read_at
- `attachments` — id, message_id, file_path, type
- WebSocket setup (Laravel Broadcasting + Pusher/Reverb)
- Push notifications (FCM untuk Android, APNs untuk iOS)

##### API Endpoints
```
GET|POST        /conversations
GET             /conversations/{id}/messages
POST            /conversations/{id}/messages
POST            /messages/{id}/reactions
GET             /courses/{id}/discussions
```

---

#### 🟢 Dev B — Chat Screens
- DM conversation list + chat screen
- Group chat screen
- Course discussion channels
- Message reply & reactions UI
- Typing indicator + read receipt
- File attachment picker & preview

---

#### ✅ CHECKPOINT 6 — Verifikasi Chat
```
[ ] DM real-time berfungsi antara 2 user
[ ] Group chat berfungsi
[ ] Attachment (gambar/PDF) bisa dikirim & dilihat
[ ] Push notification muncul saat ada pesan baru
[ ] Read receipt dan typing indicator berfungsi
```
> **➡️ Konfirmasi sebelum lanjut ke Phase 7**

---

### PHASE 7 — Collaboration
> **Estimasi**: 2 minggu

#### 🔵 Dev A — Collaboration APIs
- `study_groups` — id, name, creator_id, members, roles
- `projects` — id, group_id/course_id, name, description
- `project_tasks` — id, project_id, title, status (todo/in_progress/done), assignee
- `milestones` — id, project_id, title, due_date
- GitHub OAuth integration + webhook untuk display commits/PRs

---

#### 🟢 Dev B — Collaboration Screens
- Study group list + create + member management
- Project overview screen
- Kanban board (drag & drop tasks)
- Milestone tracker
- GitHub activity feed in project screen

---

#### ✅ CHECKPOINT 7 — Verifikasi Collaboration
```
[ ] Study group bisa dibuat, anggota bisa diundang
[ ] Project bisa dibuat dengan tasks
[ ] Kanban board bisa drag tasks antar kolom
[ ] GitHub repo bisa dikoneksikan dan commits tampil
```
> **➡️ Konfirmasi sebelum lanjut ke Phase 8**

---

### PHASE 8 — Intelligence (AI)
> **Estimasi**: 3–4 minggu | Gunakan Gemini Flash 2.5

#### 🔵 Dev A — AI Backend
- AI Gateway service (proxy ke Gemini API)
- Rate limiting middleware: daily/hourly quota per user
- Redis-based semantic query caching
- Vector embedding pipeline (pgvector)
- RAG: index materials → embed chunks → query
- BYOK support (user bawa API key sendiri)
- Token budget enforcer
- Weak-topic detection berdasarkan quiz & flashcard stats

##### API Endpoints
```
POST    /ai/chat              (RAG-based Q&A)
POST    /ai/generate-quiz     (dari material/notes)
GET     /ai/weak-topics       (analisis performance)
POST    /ai/study-plan        (rekomendasi berbasis deadline)
GET     /ai/quota             (sisa quota user)
```

---

#### 🟢 Dev B — AI Screens
- AI Study Assistant chat screen
- Quiz generator screen (pilih sumber, difficulty, jumlah soal)
- Weak topic detection cards di dashboard
- AI quota display di profile/settings
- BYOK settings screen

---

#### ✅ CHECKPOINT 8 — Verifikasi AI
```
[ ] AI bisa menjawab pertanyaan berdasarkan PDF yang diupload (RAG)
[ ] Quiz bisa digenerate dari materi kuliah
[ ] Weak topic terdeteksi dari data quiz & flashcard
[ ] Rate limit berfungsi (user diblokir setelah melebihi quota)
[ ] BYOK bekerja (user dengan API key sendiri tidak kena limit)
[ ] Semantic cache berfungsi (pertanyaan sama tidak hit API lagi)
```
> **➡️ Konfirmasi sebelum lanjut ke Phase 9**

---

### PHASE 9 — Web Companion
> **Estimasi**: 2–3 minggu | Dev B tambah Next.js

#### [NEW] `apps/web/` — Next.js Dashboard
- Web dashboard (analytics, advanced views)
- Long-form notes editor
- Project management view
- File manager
- Semester & course setup wizard

---

#### ✅ CHECKPOINT 9 — Verifikasi Web
```
[ ] Web app bisa login dan ambil data dari API yang sama
[ ] Analytics dashboard menampilkan data study & GPA
[ ] Notes bisa diedit dari web dengan full Markdown
```

---

## 📦 Shared Packages

### `packages/types/`
- TypeScript types (User, Course, Assignment, dll)
- Dipakai oleh mobile, web, dan api-client

### `packages/validation/`
- Zod schemas shared antara mobile dan web
- Konsistensi validasi form

### `packages/api-client/`
- HTTP client wrapper (axios)
- Auto-generated types dari Laravel API

### `packages/config/`
- Constants: API URLs, env config

---

## 🏗️ Arsitektur File Structure

```
unidemic/
│
├── apps/
│   ├── mobile/          ← 🟢 Dev B
│   │   ├── app/         (Expo Router screens)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/       (Zustand)
│   │   ├── lib/         (api client, utils)
│   │   └── assets/
│   │
│   ├── api/             ← 🔵 Dev A
│   │   ├── app/
│   │   │   ├── Http/Controllers/
│   │   │   ├── Models/
│   │   │   ├── Services/
│   │   │   └── Jobs/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   ├── factories/
│   │   │   └── seeders/
│   │   └── routes/api.php
│   │
│   └── web/             ← 🟢 Dev B (Phase 9)
│       └── Next.js
│
├── packages/
│   ├── types/
│   ├── validation/
│   ├── api-client/
│   └── config/
│
├── infrastructure/
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
│
└── .github/
    └── workflows/
        ├── backend-ci.yml
        └── mobile-ci.yml
```

---

## 🔄 Workflow Kolaborasi

```
main
 ├── develop          ← branch utama development
 │    ├── feature/backend/auth        ← Dev A
 │    ├── feature/backend/academic    ← Dev A
 │    ├── feature/mobile/auth         ← Dev B
 │    └── feature/mobile/dashboard   ← Dev B
```

**Aturan PR**:
- Setiap fitur = 1 branch
- PR ke `develop` wajib 1 review
- CI harus hijau sebelum merge
- Checkpoint verifikasi dilakukan dari branch `develop`

---

## 🤖 Prompt Template untuk AI Agent

### AI Agent 1 (Backend) — contoh instruksi:
```
Kamu adalah Backend Agent untuk proyek UniDemic.
Stack: Laravel 11, PostgreSQL, Redis, S3.
Tugas sekarang: [DESKRIPSI TUGAS]
File yang relevan: [PATH FILE]
Buat: [migration / controller / service / test]
Ikuti naming convention Laravel. Selalu sertakan PHPDoc.
Setelah selesai, jalankan `php artisan test` dan laporkan hasilnya.
```

### AI Agent 2 (Frontend) — contoh instruksi:
```
Kamu adalah Frontend Agent untuk proyek UniDemic.
Stack: React Native, Expo, TypeScript, TanStack Query, Zustand.
Tugas sekarang: [DESKRIPSI TUGAS]
File yang relevan: [PATH FILE]
Buat: [screen / component / hook / store]
Ikuti struktur folder yang sudah ada.
Pastikan TypeScript strict, gunakan Zod untuk validasi.
Setelah selesai, jalankan `npx expo start` dan screenshot hasilnya.
```

---

## 📅 Estimasi Timeline Keseluruhan

| Phase | Nama | Estimasi | Dev A | Dev B |
|-------|------|----------|-------|-------|
| 1 | Foundation | 1–2 minggu | Backend setup + Auth API | Mobile setup + Auth UI |
| 2 | Academic Core | 2–3 minggu | Academic APIs | Academic Screens |
| 3 | Academic Tracking | 1–2 minggu | Attendance + Grade API | Tracking UI |
| 4 | Productivity | 1–2 minggu | Task + Focus API | Productivity UI |
| 5 | Learning | 2–3 minggu | Materials + Notes + Quiz API | Learning UI |
| 6 | Communication | 2–3 minggu | Chat WebSocket backend | Chat UI |
| 7 | Collaboration | 2 minggu | Group + Project API | Kanban + Group UI |
| 8 | Intelligence (AI) | 3–4 minggu | AI Gateway + RAG | AI UI |
| 9 | Web Companion | 2–3 minggu | — | Next.js web |
| **Total** | | **~18–25 minggu** | | |

---

## 🔍 Verification Plan

### Per-Checkpoint Testing Strategy
1. **Manual Testing** via Postman (backend) + physical device/emulator (mobile)
2. **Automated Tests**: Laravel Feature Tests, Expo unit tests
3. **AI Debugging Loop**: jika ada bug, AI Agent akan analisis log → suggest fix → retest

### CI/CD Pipeline
```yaml
# backend-ci.yml
- php artisan test
- php artisan migrate --env=testing
- php artisan db:seed --env=testing

# mobile-ci.yml  
- npx expo export --platform android
- npx jest
```

---

> [!NOTE]
> Plan ini menggunakan **Gemini Flash 2.5** sebagai AI model untuk:
> - Membantu generate kode boilerplate
> - Debugging dan analisis error
> - Review kode dan saran improvement
> - Generate test cases
> 
> Setiap AI agent hanya aktif dalam scope yang didefinisikan per phase untuk menghindari konflik.
