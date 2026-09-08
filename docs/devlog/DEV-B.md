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

