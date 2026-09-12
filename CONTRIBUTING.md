# 🤝 Contributing to UniDemic

Terima kasih atas minat Anda untuk berkontribusi pada UniDemic! Sebagai proyek open-source, kami menyambut setiap bentuk kontribusi, baik berupa pelaporan bug, penyempurnaan fitur, perbaikan dokumentasi, maupun optimasi kode.

---

## 📜 Code of Conduct

Semua kontributor diharapkan mematuhi [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) untuk menjaga lingkungan kerja yang inklusif, profesional, dan ramah.

---

## 🌳 Branching Strategy & Git Flow

UniDemic menggunakan alur kerja cabang berbasis fitur:

- **`main`**: Cabang produksi stabil. Hanya menerima merge dari rilis resmi.
- **`develop`**: Cabang integrasi utama (*default development branch*). Semua feature branch ditargetkan ke sini.
- **Cabang Fitur / Perbaikan**:
  - `feature/backend/<nama-fitur>` — untuk pengembangan backend API.
  - `feature/mobile/<nama-fitur>` — untuk pengembangan aplikasi React Native.
  - `fix/<deskripsi-bug>` — untuk perbaikan bug.
  - `docs/<topik>` — untuk pembaruan dokumentasi.

---

## 📝 Format Commit Message (Conventional Commits)

Semua commit WAJIB mengikuti standar [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <deskripsi singkat>

[body opsional — penjelasan detail perubahan]
```

### Types:
| Type | Kapan Digunakan |
| :--- | :--- |
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `docs` | Perubahan dokumentasi |
| `refactor` | Refactoring kode tanpa mengubah fungsionalitas |
| `test` | Menambah atau memperbarui test suite |
| `style` | Perubahan format, style, atau styling UI tanpa perubahan logika |
| `perf` | Optimasi performa |
| `chore` | Konfigurasi build, dependencies, atau tooling |

*Contoh:*
```
feat(academic): add course schedule conflict detection
fix(api): include course relation in schedule resource
docs: update contributing guide and roadmap
```

---

## 💻 Panduan Setup Lingkungan Lokal

### 1. Prasyarat
- Git
- PHP 8.3+ & Composer 2.x
- Node.js 20+ & npm / yarn
- Docker & Docker Compose

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
Layanan yang berjalan:
- PostgreSQL 16 (`localhost:5432`)
- Redis 7 (`localhost:6379`)
- MinIO S3 Local (`localhost:9000`, Console `localhost:9001`)

### 4. Menjalankan Backend API (`apps/api`)
```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
API berjalan di: `http://localhost:8000`

### 5. Menjalankan Mobile App (`apps/mobile`)
```bash
cd apps/mobile
npm install
npx expo start
```
Gunakan Expo Go di ponsel fisik atau jalankan emulator Android / iOS Simulator.

---

## ✅ Quality Checks & Definition of Done

Sebelum membuat Pull Request, pastikan seluruh pengujian lokal lulus:

1. **Backend Tests**:
   ```bash
   cd apps/api
   php artisan test
   ```
   *Seluruh unit & feature tests harus 100% PASS.*

2. **Frontend Typecheck**:
   ```bash
   cd apps/mobile
   npx tsc --noEmit
   ```
   *Harus menghasilkan 0 error.*

3. **Dokumentasi Wajib**:
   - Perbarui status task di [`docs/PROGRESS.md`](docs/PROGRESS.md).
   - Tulis log pengerjaan di [`docs/devlog/DEV-A.md`](docs/devlog/DEV-A.md) (Backend) atau [`docs/devlog/DEV-B.md`](docs/devlog/DEV-B.md) (Frontend).
   - Jika ada keputusan arsitektural besar, catat di [`docs/decisions/ADR.md`](docs/decisions/ADR.md).

---

## 🚀 Alur Pembuatan Pull Request (PR)

1. Buat branch baru dari `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nama-fitur
   ```
2. Kerjakan perubahan kode, tambahkan test, dan perbarui dokumentasi.
3. Commit perubahan dengan pesan conventional commits.
4. Push branch ke GitHub dan buka Pull Request ke cabang `develop`.
5. Isi formulir PR sesuai template yang tersedia (`.github/pull_request_template.md`).
6. Tunggu proses review dan pastikan CI workflow GitHub Actions berwarna hijau.
