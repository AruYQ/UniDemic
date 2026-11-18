# UniDemic — Aturan Wajib Dokumentasi

Aturan ini berlaku untuk SEMUA AI agent yang bekerja di proyek UniDemic,
tanpa terkecuali dan tanpa perlu diaktifkan secara manual.

## Wajib Dilakukan Setiap Task

1. **Sebelum mulai**: Update `docs/PROGRESS.md` — tandai task `[/]` (in progress)

2. **Setelah selesai**: Tulis entry di devlog yang sesuai:
   - Backend task → `docs/devlog/DEV-A.md`
   - Frontend/mobile task → `docs/devlog/DEV-B.md`
   - Kedua sisi → update keduanya

3. **Update progress**: Tandai task `[x]` di `docs/PROGRESS.md`

4. **Keputusan teknis besar**: Tambah ADR baru di `docs/decisions/ADR.md`

5. **Commit convention**: Selalu gunakan Conventional Commits **dalam Bahasa Inggris** (*English only*, imperative format):
   - Format: `<type>(<scope>): <short description in English>`
   - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `style:`, `perf:`


## Wajib Diaktifkan untuk Task UI

Sebelum membuat atau memodifikasi screen/komponen apapun:
→ Baca dan ikuti skill: `.agents/skills/unidemic-ui-ux/SKILL.md`
→ Lakukan `<vibe_check>` sebelum menulis kode

## Wajib Diaktifkan untuk Task Dokumentasi

Saat menambah atau mengubah dokumentasi:
→ Baca dan ikuti skill: `.agents/skills/unidemic-devlog/SKILL.md`

## Wajib Diaktifkan untuk Verifikasi Fitur & Quality Gate

Sebelum menyatakan phase selesai dan sebelum melangkah ke phase berikutnya:
→ Baca dan ikuti aturan: `.agents/rules/verification.md`
→ Uji seluruh fitur baru dan fitur terdampak (regression)
→ Sediakan skenario uji coba untuk user & minta konfirmasi lolos
→ DILARANG melangkah ke phase berikutnya tanpa konfirmasi user

## Branch Naming

- Backend: `feature/backend/[nama-fitur]`
- Frontend: `feature/mobile/[nama-fitur]`
- Docs: `docs/[nama]`
- Fix: `fix/[backend|mobile]/[deskripsi]`
