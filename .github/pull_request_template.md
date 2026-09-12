## 📌 Description

Tuliskan ringkasan singkat mengenai perubahan yang dibuat pada PR ini. Mengapa perubahan ini diperlukan?

Fixes / Closes #(issue_number) <!-- opsional jika terkait dengan issue tertentu -->

---

## 🛠️ Type of Change

Pilih salah satu atau lebih tipe perubahan berikut (beri tanda `x` pada kotak yang sesuai):

- [ ] `feat`: Fitur baru untuk pengguna/API
- [ ] `fix`: Perbaikan bug
- [ ] `docs`: Pembaruan dokumentasi saja
- [ ] `refactor`: Perbaikan struktur kode tanpa mengubah fungsionalitas
- [ ] `test`: Penambahan atau perbaikan unit/feature tests
- [ ] `perf`: Peningkatan performa
- [ ] `style`: Penyesuaian styling / format kode
- [ ] `chore`: Pembaruan dependency, CI/CD, atau build tooling

---

## 📦 Komponen yang Terdampak

- [ ] Mobile Frontend (`apps/mobile`)
- [ ] Backend API (`apps/api`)
- [ ] Shared Types (`packages/types`)
- [ ] Infrastructure / Docker (`infrastructure/`)
- [ ] Dokumentasi (`docs/` / root markdown)

---

## ✅ Checklist Pengujian & Kualitas

Harap pastikan semua poin berikut telah terpenuhi sebelum mengajukan PR:

- [ ] Kode mengikuti konvensi penamaan dan arsitektur UniDemic.
- [ ] `php artisan test` dijalankan di `apps/api` dan **100% PASS** (jika mengubah backend).
- [ ] `npx tsc --noEmit` dijalankan di `apps/mobile` dan **0 error** (jika mengubah mobile).
- [ ] Telah memperbarui status task di `docs/PROGRESS.md`.
- [ ] Telah menambahkan log pengerjaan di `docs/devlog/DEV-A.md` atau `docs/devlog/DEV-B.md`.
- [ ] Telah menambahkan catatan di `docs/decisions/ADR.md` (jika ada keputusan arsitektur baru).

---

## 📸 Screenshots / Video (Opsional)

*Jika ada perubahan UI pada aplikasi mobile, lampirkan tangkapan layar atau rekaman demo di sini.*
