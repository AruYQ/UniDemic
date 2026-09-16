# 🤝 Contributing to UniDemic

> 🌐 **Language**: [English](CONTRIBUTING.en.md) | [Bahasa Indonesia](CONTRIBUTING.md)

Thank you for your interest in contributing to UniDemic! As an open-source project, we welcome every form of contribution, including bug reports, feature suggestions, documentation enhancements, and codebase optimizations.

---

## 📜 Code of Conduct

All contributors are expected to uphold our [CODE_OF_CONDUCT.en.md](CODE_OF_CONDUCT.en.md) (or [Versi Bahasa Indonesia](CODE_OF_CONDUCT.md)) to maintain an inclusive, welcoming, and harassment-free environment.

---

## 🌳 Branching Strategy & Git Flow

UniDemic follows a feature-branch workflow:

- **`main`**: Stable production branch. Only receives merges from verified official release tags.
- **`develop`**: Main integration branch (*default development branch*). All feature PRs target this branch.
- **Feature & Fix Branch Naming Pattern**:
  - `feature/backend/<feature-name>` — for backend API development.
  - `feature/mobile/<feature-name>` — for React Native mobile development.
  - `fix/<issue-description>` — for bug fixes.
  - `docs/<topic>` — for documentation updates.

---

## 📝 Commit Message Standard (Conventional Commits)

All commit messages **MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification** and **MUST be written in English** using imperative verbs (`add`, `fix`, `implement`, `update`):

```
<type>(<scope>): <short description in English>

[optional body — detailed explanation of changes]
```

### Commit Types:
| Type | Usage |
| :--- | :--- |
| `feat` | New user or API feature |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `refactor` | Code refactoring without behavior modification |
| `test` | Adding or updating test suites |
| `style` | Formatting, code styling, or UI layout adjustments without logic changes |
| `perf` | Performance improvements |
| `chore` | Build configuration, tooling, dependency updates |

*Examples:*
```
feat(academic): add course schedule conflict detection
fix(api): include course relation in schedule resource
docs: update contributing guide and roadmap
```

---

## 💻 Local Environment Setup

### 1. Prerequisites
- Git
- PHP 8.3+ & Composer 2.x
- Node.js 20+ & npm
- Docker & Docker Compose

### 2. Clone Repository
```bash
git clone https://github.com/AruYQ/UniDemic.git
cd UniDemic
git checkout develop
```

### 3. Start Infrastructure Services (Docker)
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```
Running services:
- PostgreSQL 16 (`localhost:5432`)
- Redis 7 (`localhost:6379`)
- MinIO S3 Local (`localhost:9000`, Web Console `localhost:9001`)

### 4. Run Backend API (`apps/api`)
```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
API endpoint: `http://localhost:8000`

### 5. Run Mobile App (`apps/mobile`)
```bash
cd apps/mobile
npm install
npx expo start
```
Scan the QR code with **Expo Go** on your device or start an Android Emulator / iOS Simulator.

---

## ✅ Quality Checks & Definition of Done

Before submitting a Pull Request, verify that all local quality gates pass:

1. **Backend Tests**:
   ```bash
   cd apps/api
   php artisan test
   ```
   *All unit & feature tests must pass 100%.*

2. **Frontend Typecheck**:
   ```bash
   cd apps/mobile
   npx tsc --noEmit
   ```
   *Must report 0 errors.*

3. **Mandatory Documentation**:
   - Update active milestone tasks in [`docs/PROGRESS.md`](docs/PROGRESS.md).
   - Add an engineering journal entry in [`docs/devlog/DEV-A.md`](docs/devlog/DEV-A.md) (Backend) or [`docs/devlog/DEV-B.md`](docs/devlog/DEV-B.md) (Frontend).
   - If introducing major architectural patterns, log an entry in [`docs/decisions/ADR.md`](docs/decisions/ADR.md).

---

## 🚀 Pull Request (PR) Workflow

1. Branch off `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
2. Make your changes, write tests, and update documentation.
3. Commit with Conventional Commits in English.
4. Push your branch to GitHub and open a Pull Request targeting `develop`.
5. Complete the PR template (`.github/pull_request_template.md`).
6. Await review and verify that GitHub Actions CI checks are green.
