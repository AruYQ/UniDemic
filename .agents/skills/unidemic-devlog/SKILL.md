---
name: unidemic-devlog
description: >
  Skill wajib untuk dokumentasi perjalanan pengerjaan UniDemic.
  AI agent HARUS mengupdate devlog, progress tracker, dan ADR setiap kali
  menyelesaikan task, membuat keputusan teknis, atau menemukan masalah penting.
  Berlaku untuk Dev A (Backend Agent) dan Dev B (Frontend Agent).
---

# UniDemic — Documentation Skill

> Dokumentasi adalah bagian dari definition of done.
> Kode yang tidak terdokumentasi = kode yang belum selesai.

---

## 🔴 Aturan Wajib (Non-Negotiable)

AI agent HARUS mendokumentasikan setelah **setiap task selesai**:

1. **Update devlog yang sesuai** (DEV-A.md atau DEV-B.md)
2. **Update PROGRESS.md** — tandai task dari `[ ]` ke `[x]`
3. **Update ADR.md** jika ada keputusan arsitektur baru
4. **Commit dokumentasi bersama kode** — bukan commit terpisah nanti

---

## 📁 Lokasi File Dokumentasi

```
docs/
├── PROGRESS.md          ← Progress tracker semua phase & checkpoint
├── devlog/
│   ├── DEV-A.md         ← Log perjalanan Dev A (Backend/rekis-0103)
│   └── DEV-B.md         ← Log perjalanan Dev B (Frontend/AruYQ)
└── decisions/
    └── ADR.md           ← Architecture Decision Records
```

---

## 📝 Format Entry Devlog

### Untuk Dev A (Backend Agent)

```markdown
### [YYYY-MM-DD] — [Judul task]

**Branch**: feature/backend/[nama]
**Status**: Selesai | Sedang dikerjakan | Blocked

**Yang dikerjakan:**
- Item konkret yang diselesaikan

**API Endpoints yang dibuat/diubah:**
| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | /auth/login | ... |

**Database changes:**
- Migration baru: `[nama_tabel]` — kolom apa saja

**Keputusan teknis:**
- [keputusan] — [alasan singkat]

**Masalah yang ditemukan:**
- [masalah] → [solusi yang dipilih]

**Test results:**
- `php artisan test` — [X passed, Y failed]

**Referensi:**
- PR: #[nomor] | Commit: [hash]
```

### Untuk Dev B (Frontend Agent)

```markdown
### [YYYY-MM-DD] — [Judul task]

**Branch**: feature/mobile/[nama]
**Status**: Selesai | Sedang dikerjakan | Blocked

**Yang dikerjakan:**
- Item konkret yang diselesaikan

**Screen/komponen yang dibuat/diubah:**
- `screens/[NamaScreen].tsx` — deskripsi singkat
- `components/[NamaComponent].tsx` — deskripsi singkat

**Vibe Check hasil:**
- Layout: [strategi yang dipakai]
- Animasi: [apa yang diimplementasi]
- Anti-slop: [rule yang dicheck]

**API yang diintegrasikan:**
- `[METHOD] /[endpoint]` → state yang diupdate

**Keputusan desain/teknis:**
- [keputusan] — [alasan singkat]

**Masalah yang ditemukan:**
- [masalah] → [solusi yang dipilih]

**Referensi:**
- PR: #[nomor] | Commit: [hash]
```

---

## 📊 Cara Update PROGRESS.md

Gunakan format ini saat mengupdate status task:

```markdown
# Sebelum (belum mulai):
| Setup Expo project | `[ ]` | |

# Saat dikerjakan:
| Setup Expo project | `[/]` | Init dengan template TypeScript |

# Setelah selesai:
| Setup Expo project | `[x]` | Done - commit abc1234 |
```

Saat checkpoint selesai, update tabel Phase Overview:
```markdown
| 1 | Foundation | `[x]` | `[x]` | `[x]` | `[x]` |
```

---

## 🏛️ Kapan Harus Buat ADR Baru

Buat ADR baru (`ADR-XXXX`) jika:

- Memilih library/framework baru yang berdampak besar
- Mengubah struktur database yang fundamental
- Mengubah strategi auth atau security
- Memilih pattern arsitektur baru (misal: menambah service layer)
- Menolak opsi yang mungkin ditanyakan di masa depan ("kenapa tidak pakai X?")

Format ADR:
```markdown
## ADR-XXXX — [Judul Keputusan]

**Tanggal**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
**Dibuat oleh**: [nama / AI Agent]

### Konteks
[Situasi yang memaksa keputusan ini]

### Keputusan
[Keputusan yang diambil + detail teknis]

### Konsekuensi
- ✅ [Benefit]
- ⚠️ [Trade-off / risiko]
```

---

## ⚡ Commit Message Convention

Semua commit WAJIB menggunakan format ini:

```
[type]: [deskripsi singkat]

[body opsional — kalau perlu penjelasan lebih]
```

**Types:**
| Type | Kapan dipakai |
|------|---------------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `docs` | Perubahan dokumentasi saja |
| `refactor` | Refactoring tanpa perubahan behavior |
| `test` | Menambah/mengubah test |
| `chore` | Setup, config, dependencies |
| `style` | Perubahan UI/UX tanpa logika |
| `perf` | Optimasi performa |

**Contoh:**
```
feat: add login screen with form validation

- Implemented email/password form with Zod validation
- Added secure token storage via expo-secure-store
- Connected to POST /auth/login endpoint
```

---

## 🔄 Alur Kerja Dokumentasi

```
Mulai task
    ↓
Update PROGRESS.md: [ ] → [/]
    ↓
Kerjakan task
    ↓
Tulis entry di devlog (DEV-A.md atau DEV-B.md)
    ↓
Update PROGRESS.md: [/] → [x]
    ↓
Jika ada keputusan besar → tambah ADR
    ↓
Commit semua (kode + docs) dalam 1 commit
    ↓
Push & buat PR ke develop
```

---

## 📌 Referensi Dokumen Utama

| Dokumen | Path | Tujuan |
|---------|------|--------|
| Spesifikasi proyek | `Read.md` | Fitur lengkap UniDemic |
| Implementation Plan | `implementation_plan.md` | Roadmap 9 phase |
| UI/UX Guides | `UI-UX_Guides.md` | Panduan desain original |
| Progress Tracker | `docs/PROGRESS.md` | Status semua task & checkpoint |
| Dev A Log | `docs/devlog/DEV-A.md` | Jurnal backend |
| Dev B Log | `docs/devlog/DEV-B.md` | Jurnal frontend |
| ADR | `docs/decisions/ADR.md` | Keputusan arsitektur |
| UI/UX Skill | `.agents/skills/unidemic-ui-ux/SKILL.md` | Design system untuk AI |
| Devlog Skill | `.agents/skills/unidemic-devlog/SKILL.md` | Panduan dokumentasi (ini) |

---

*Skill ini aktif di semua task UniDemic. Dokumentasi = bagian dari done.*
