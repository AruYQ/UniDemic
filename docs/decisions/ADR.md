# 🏛️ Architecture Decision Records (ADR)

> Dokumen keputusan arsitektur penting UniDemic.
> Setiap keputusan besar yang berdampak pada struktur proyek WAJIB dicatat di sini.
> Format: ADR-XXXX

---

## ADR-0001 — Tech Stack Selection

**Tanggal**: 2026-09-08
**Status**: Accepted
**Dibuat oleh**: AruYQ + AI Agent

### Konteks
UniDemic membutuhkan platform cross-platform (Android + iOS) dengan backend yang
bisa handle real-time communication, file storage, dan AI inference.

### Keputusan

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Mobile | React Native + Expo | Cross-platform, TypeScript, ekosistem besar, OTA updates |
| Navigation | Expo Router | File-based routing (mirip Next.js), deep linking built-in |
| Backend | Laravel 11 | Mature PHP framework, Sanctum auth, Queue, Broadcasting |
| Database | PostgreSQL | Relational, future pgvector support untuk AI |
| Cache/Queue | Redis | Job queues, rate limit counters, semantic query cache |
| Storage | S3-compatible | Object storage untuk file, skalabel, CDN-ready |
| Auth | Laravel Sanctum | Token-based, cocok untuk mobile SPA |
| Real-time | Pluggable (Pusher/Reverb) | Hindari vendor lock-in |
| AI | Gemini Flash 2.5 (+ BYOK) | Cost-efficient, rate-limited, semantic cached |
| Web (Phase 9) | Next.js | SSR, TypeScript, shared types dengan mobile |

### Konsekuensi
- ✅ TypeScript end-to-end (mobile + web)
- ✅ Shared `packages/types` dan `packages/validation`
- ⚠️ Dev A perlu familiar dengan Laravel, Dev B dengan Expo
- ⚠️ Docker diperlukan untuk local dev

---

## ADR-0002 — Authentication Strategy

**Tanggal**: 2026-09-08
**Status**: Accepted
**Dibuat oleh**: AruYQ + AI Agent

### Konteks
Mobile app membutuhkan auth yang aman, bisa offline-aware, dan support multi-device.

### Keputusan
- **Laravel Sanctum** dengan token-based auth (bukan JWT, bukan OAuth session)
- Token disimpan di **expo-secure-store** (Keychain iOS, Keystore Android)
- Token dikirim via `Authorization: Bearer {token}` header
- **Refresh token** tidak digunakan di fase awal — token long-lived dengan revoke manual
- Token per-device (bisa revoke device tertentu)

### Konsekuensi
- ✅ Aman — token encrypted di secure storage
- ✅ Sederhana — tidak perlu refresh token flow awal
- ⚠️ Token long-lived membutuhkan monitoring jika dicuri
- ⚠️ Perlu endpoint `GET /auth/tokens` dan `DELETE /auth/tokens/{id}` untuk device management

---

## ADR-0003 — UI/UX Design System

**Tanggal**: 2026-09-08
**Status**: Accepted
**Dibuat oleh**: AruYQ + AI Agent

### Konteks
Diperlukan design system yang konsisten untuk mencegah UI generik/slop dan
memastikan kualitas premium di semua screen.

### Keputusan
- **Dark mode first** dengan palette indigo-slate
- **Font stack**: Syne (display) + Space Grotesk (body) + JetBrains Mono (angka/kode)
- **Icon system**: Phosphor Icons Duotone (bukan Lucide/Heroicons default)
- **30 Anti-Slop Rules** diterapkan wajib (lihat `UI-UX_Guides.md`)
- **Vibe Coding** dengan mandatory `<vibe_check>` sebelum coding
- **Design tokens** di `tokens/colors.ts`, `tokens/typography.ts`, `tokens/spacing.ts`
- Animasi via **react-native-reanimated v3**
- Loading state: **Skeleton/Shimmer** via `moti` (bukan spinner)
- List: **FlashList** untuk semua list > 5 item

### Konsekuensi
- ✅ UI konsisten dan premium di semua screen
- ✅ AI agent punya panduan jelas (skill tersedia)
- ⚠️ Font custom perlu preload di `_layout.tsx`
- ⚠️ Phosphor icons perlu di-install manual

---

## ADR-0004 — AI Rate Limiting & Cost Management

**Tanggal**: 2026-09-08
**Status**: Accepted
**Dibuat oleh**: AruYQ + AI Agent

### Konteks
AI features (RAG, quiz generation) bisa sangat mahal jika tidak dikontrol.
Server community tidak bisa menanggung biaya tak terbatas.

### Keputusan
- **Tiered rate limiting**: max 20 RAG queries/hari untuk standard tier
- **Token budgeting**: strict truncation saat indexing dokumen & assembly prompt
- **Semantic query caching**: Redis cache untuk pertanyaan identik dari materi sama
- **Document upload quota**: batas parsing PDF + vector embedding per user/minggu
- **BYOK (Bring Your Own Key)**: user bisa supply API key sendiri (Gemini/OpenAI/Anthropic)
  untuk akses unlimited tanpa beban server community
- Rate limit enforced di **Laravel middleware** sebelum AI Gateway

### Konsekuensi
- ✅ Server cost terlindungi
- ✅ Fairness — semua user mendapat kuota yang sama
- ✅ Power users bisa pakai BYOK untuk unlimited access
- ⚠️ Implementasi rate limiting harus sebelum Phase 8 (jangan setelah)

---

## ADR-0005 — Monorepo Structure

**Tanggal**: 2026-09-08
**Status**: Accepted
**Dibuat oleh**: AruYQ + AI Agent

### Keputusan

```
unidemic/
├── apps/
│   ├── mobile/    ← React Native + Expo (Dev B)
│   ├── api/       ← Laravel (Dev A)
│   └── web/       ← Next.js (Phase 9)
├── packages/
│   ├── types/     ← Shared TypeScript types
│   ├── validation/ ← Shared Zod schemas
│   ├── api-client/ ← HTTP client wrapper
│   └── config/    ← Constants & env config
└── docs/          ← Dokumentasi
```

- **Branch strategy**: `main` (stable) → `develop` (integration) → `feature/*` (work)
- **Naming convention feature branch**:
  - Backend: `feature/backend/[nama-fitur]`
  - Frontend: `feature/mobile/[nama-fitur]`
  - Docs: `docs/[nama]`

### Konsekuensi
- ✅ Shared types mencegah mismatch antara mobile dan API
- ✅ Satu repo, satu PR review process
- ⚠️ Perlu setup workspace/turborepo jika monorepo makin besar

---

## ADR-0006 — Cybersecurity & Data Privacy Standards

**Tanggal**: 2026-09-08
**Status**: Accepted
**Dibuat oleh**: AruYQ + AI Agent

### Konteks
UniDemic menyimpan data akademik, tugas, nilai, dan file personal mahasiswa yang bersifat sensitif. Keamanan siber (cybersecurity) dan privasi data harus diterapkan secara default (secure-by-design) di semua layer: Frontend, Backend, dan AI.

### Keputusan
1. **Data in Transit**: Wajib menggunakan HTTPS (TLS 1.2+) di semua endpoint komunikasi API.
2. **Data at Rest**:
   - Password di-hash menggunakan **Bcrypt/Argon2** (default Laravel).
   - Token auth dan data sensitif di mobile WAJIB disimpan di **expo-secure-store** (menggunakan Keychain di iOS & Keystore di Android), dilarang menggunakan `AsyncStorage`.
3. **API Security**:
   - Rate limiting wajib aktif di semua endpoint publik, terutama `/auth` untuk mencegah Brute Force.
   - Wajib validasi request masuk (Input Validation) untuk mencegah SQL Injection & XSS menggunakan **Zod** (Frontend) dan **FormRequests** (Laravel).
4. **AI Privacy**:
   - Prompt ke AI Model (Gemini) *tidak boleh* menyertakan PII (Personally Identifiable Information) yang tidak relevan dengan konteks.
5. **Secret Management**:
   - API Keys, DB credentials, dan secret lainnya HANYA boleh ada di `.env`. Dilarang keras menaruh (hardcode) secret key di dalam source code.

### Konsekuensi
- ✅ Data pengguna dan kredensial aman dari akses tidak sah.
- ✅ Meminimalisir celah keamanan umum (OWASP Top 10).
- ⚠️ Developer harus ekstra disiplin (misal: tidak boleh `console.log` data token).
- ⚠️ Sedikit overhead performa karena enkripsi/dekripsi token di sisi mobile.

---

> ⬇️ ADR berikutnya ditambahkan di bawah saat ada keputusan arsitektur baru

