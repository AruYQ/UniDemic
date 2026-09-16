# 🤝 Panduan Kontribusi UniDemic

> 🌐 **Bahasa**: [Bahasa Indonesia](CONTRIBUTING.md) | [English](CONTRIBUTING.en.md)

Terima kasih atas minat Anda untuk berkontribusi pada UniDemic! Sebagai proyek sumber terbuka (*open-source*), kami menyambut hangat setiap bentuk kontribusi, baik berupa pelaporan masalah (*bug report*), usulan fitur baru, penyempurnaan dokumentasi, maupun optimasi basis kode.

---

## 📜 Pedoman Perilaku

Seluruh kontributor diharapkan mematuhi [Pedoman Perilaku Komunitas (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md) (tersedia pula versi [English](CODE_OF_CONDUCT.en.md)) demi menjaga lingkungan kolaborasi yang inklusif, ramah, dan profesional.

---

## 🌳 Strategi Percabangan & Alur Kerja Git (Git Flow)

UniDemic menggunakan alur kerja cabang berbasis fitur (*feature-branch workflow*):

- **`main`**: Cabang produksi stabil. Hanya menerima penggabungan (*merge*) dari tag rilis resmi yang terverifikasi.
- **`develop`**: Cabang integrasi utama (*default development branch*). Semua cabang fitur bermuara dan diajukan ke cabang ini.
- **Pola Penamaan Cabang Fitur & Perbaikan**:
  - `feature/backend/<nama-fitur>` — untuk pengerjaan backend API.
  - `feature/mobile/<nama-fitur>` — untuk pengerjaan aplikasi React Native.
  - `fix/<deskripsi-masalah>` — untuk perbaikan masalah atau *bug*.
  - `docs/<topik>` — untuk pembaruan dokumentasi.

---

## 📝 Format Pesan Komit (Conventional Commits)

Semua pesan komit **WAJIB mengikuti spesifikasi [Conventional Commits](https://www.conventionalcommits.org/)** dan **WAJIB ditulis dalam Bahasa Inggris** dengan kata kerja imperatif (`add`, `fix`, `implement`, `update`):

```
<type>(<scope>): <short description in English>

[opsional body — penjelasan terperinci mengenai perubahan kode]
```

### Jenis Komit (Commit Types):
| Tipe | Kegunaan |
| :--- | :--- |
| `feat` | Penambahan fitur baru bagi pengguna atau API |
| `fix` | Perbaikan masalah atau kesalahan kode (*bug fix*) |
| `docs` | Khusus pembaruan dokumen saja |
| `refactor` | Restrukturisasi kode tanpa mengubah perilaku fitur |
| `test` | Penambahan atau pembetulan rangkaian pengujian (*test suite*) |
| `style` | Pemformatan tampilan atau gaya kode tanpa mengubah logika |
| `perf` | Peningkatan kinerja atau kecepatan eksekusi |
| `chore` | Pembaruan konfigurasi alat bantu, dependensi, atau skrip pembangunan |

*Contoh Komit yang Benar:*
```
feat(academic): add course schedule conflict detection
fix(api): include course relation in schedule resource
docs: update contributing guide and roadmap
```

---

## 💻 Panduan Penyiapan Lingkungan Lokal

### 1. Prasyarat Sistem
- Git
- PHP 8.3+ dan Composer 2.x
- Node.js 20+ dan npm
- Docker dan Docker Compose

### 2. Kloning Repositori
```bash
git clone https://github.com/AruYQ/UniDemic.git
cd UniDemic
git checkout develop
```

### 3. Menjalankan Layanan Infrastruktur (Docker)
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```
Layanan yang berjalan di latar belakang:
- PostgreSQL 16 (`localhost:5432`)
- Redis 7 (`localhost:6379`)
- MinIO S3 Lokal (`localhost:9000`, Konsol Web `localhost:9001`)

### 4. Menjalankan Backend API (`apps/api`)
```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
Alamat API: `http://localhost:8000`

### 5. Menjalankan Aplikasi Mobile (`apps/mobile`)
```bash
cd apps/mobile
npm install
npx expo start
```
Pindai kode QR menggunakan aplikasi ponsel **Expo Go** atau jalankan Emulator Android / Simulator iOS.

---

## ✅ Pemeriksaan Kualitas & Definisi Selesai (Definition of Done)

Sebelum membuat Pull Request, pastikan seluruh gerbang kualitas lokal telah terpenuhi:

1. **Pengujian Backend**:
   ```bash
   cd apps/api
   php artisan test
   ```
   *Seluruh pengujian unit dan fitur harus 100% LULUS (PASS).*

2. **Pemeriksaan Tipe Frontend**:
   ```bash
   cd apps/mobile
   npx tsc --noEmit
   ```
   *Wajib menghasilkan 0 kesalahan (0 error).*

3. **Dokumentasi Wajib**:
   - Perbarui pos pemeriksaan pada [`docs/PROGRESS.md`](docs/PROGRESS.md).
   - Tuliskan entri jurnal rekayasa di [`docs/devlog/DEV-A.md`](docs/devlog/DEV-A.md) (Backend) atau [`docs/devlog/DEV-B.md`](docs/devlog/DEV-B.md) (Frontend).
   - Catat keputusan arsitektur baru di [`docs/decisions/ADR.md`](docs/decisions/ADR.md) bila diperlukan.

---

## 🚀 Alur Pengajuan Pull Request (PR)

1. Buat cabang baru dari `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nama-fitur-anda
   ```
2. Lakukan perubahan kode, lengkapi pengujian, dan perbarui dokumen terkait.
3. Komit perubahan menggunakan format Conventional Commits berbahasa Inggris.
4. Unggah cabang ke GitHub dan buka Pull Request dengan target cabang `develop`.
5. Lengkapi formulir deskripsi PR sesuai template yang tersedia (`.github/pull_request_template.md`).
6. Tunggu proses tinjauan kode dan pastikan alur kerja CI GitHub Actions berhasil tanpa galat.
