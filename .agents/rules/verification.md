# UniDemic — Aturan Wajib Pengujian Fitur & Gerbang Verifikasi (Quality Gate)

Aturan ini **WAJIB dan NON-NEGOTIABLE** untuk seluruh AI Agent (Dev A - Backend dan Dev B - Frontend) yang bekerja pada proyek UniDemic.

> ⛔ **GOLDEN RULE: TIDAK ADA VERIFIKASI = TIDAK ADA PHASE BERIKUTNYA.**
> Dilarang keras memulai perencanaan atau coding untuk phase berikutnya sebelum seluruh fitur pada phase saat ini diuji dan dikonfirmasi lolos oleh User.

---

## 🎯 Cakupan Pengujian Wajib

Setiap kali menyelesaikan task atau checkpoint dalam suatu phase, AI Agent wajib mengidentifikasi dan menguji:
1. **Fitur Baru**: Semua komponen, endpoint, atau alur yang baru saja dibangun pada phase tersebut.
2. **Fitur Terdampak (Impacted Features / Regression)**: Semua fitur terdahulu yang berpotensi terganggu akibat perubahan database, API response, state management, routing, atau shared components.

---

## 🔄 Prosedur Wajib Pengujian (Step-by-Step)

```text
[Coding Fitur Selesai]
        ↓
1. Verifikasi Internal Otomatis (Typecheck / Linter / Test Backend)
        ↓
2. Susun Checklist Skenario Uji Coba untuk User
        ↓
3. Minta Konfirmasi Eksplisit dari User
        ↓
  Apakah ada Error?
   ├── YA  ──> Perbaiki langsung & ulangi pengetesan
   └── TDK ──> Update PROGRESS.md & Devlog ──> Izin lanjut ke Phase berikutnya
```

### Langkah 1: Verifikasi Internal (Oleh Agent)
Sebelum menyerahkan ke user, AI Agent wajib memastikan:
- Frontend: `npx tsc --noEmit` bersih tanpa error (Exit code 0).
- Backend: Endpoint mengembalikan format respon HTTP yang valid (`200`/`201`/`422`/dll).

### Langkah 2: Penyusunan Panduan Uji Coba User
Agent harus menyajikan panduan pengetesan yang terstruktur dan mudah diikuti oleh user, mencakup:
- URL / Layar yang harus dibuka.
- Data uji coba (akun test, input valid & invalid).
- Respon yang diharapkan *(Expected Behavior)*.

### Langkah 3: Minta Konfirmasi User (Blocking Prompt)
Agent **HARUS BERHENTI** dan menanyakan konfirmasi kepada user:
> *"Apakah seluruh skenario pengujian di atas sudah dicoba dan berjalan lancar di perangkat Anda?"*

### Langkah 4: Penanganan Hasil
- **Jika User Menemukan Error / Bug**:
  - Agent **DILARANG** menutup task atau beralih topik.
  - Agent wajib langsung menganalisis root cause, memperbaiki kode, dan meminta user mengetes ulang hingga tuntas.
- **Jika User Mengonfirmasi Aman (Lolos)**:
  - Tandai checklist verifikasi di `docs/PROGRESS.md` menjadi `[x]`.
  - Catat hasil pengujian di devlog (`DEV-A.md` atau `DEV-B.md`).
  - Barulah agent diizinkan menawarkan atau memulai phase selanjutnya.

---

## 📋 Format Template Permintaan Verifikasi ke User

Setiap kali selesai mengerjakan fitur pada phase, agent wajib menyertakan blok verifikasi seperti ini:

```markdown
### 🧪 Gerbang Verifikasi Fitur (Quality Gate — Phase X)

Silakan uji coba skenario berikut di aplikasi Anda:
1. [Skenario 1]: [Langkah uji] ➔ Ekspektasi: [Hasil yang diharapkan]
2. [Skenario 2]: [Langkah uji] ➔ Ekspektasi: [Hasil yang diharapkan]
3. [Fitur Terdampak]: [Langkah uji] ➔ Ekspektasi: [Memastikan fitur lama tidak rusak]

⚠️ **Konfirmasi Diperlukan:**
Mohon beritahu saya apakah semua skenario di atas berhasil tanpa kendala?
- Jika ada kendala/error, sebutkan dan akan langsung saya perbaiki sekarang.
- Jika sudah aman, kita baru akan melangkah ke fase berikutnya.
```

---

*Aturan ini mengikat seluruh siklus development UniDemic. Kualitas & stabilitas kode di atas kecepatan.*
