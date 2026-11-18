# 🛡️ Security Policy

> 🌐 **Language**: [English](SECURITY.en.md) | [Bahasa Indonesia](SECURITY.md)

UniDemic takes security and student data privacy very seriously. We appreciate your efforts to responsibly disclose any security vulnerabilities.

---

## 📦 Supported Versions

We actively maintain and provide security patches for the following versions:

| Project / Component | Version | Supported |
| :--- | :--- | :---: |
| **API (`apps/api`)** | Laravel 11.x / PHP 8.3+ | :white_check_mark: |
| **Mobile (`apps/mobile`)** | Expo SDK 57 / React Native 0.81+ | :white_check_mark: |
| **Shared Types (`packages/types`)** | v0.1.x | :white_check_mark: |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in UniDemic:

1. **DO NOT** create a public GitHub issue or pull request disclosing the vulnerability.
2. Report privately via **[GitHub Security Advisory](https://github.com/AruYQ/UniDemic/security/advisories/new)** or contact maintainers directly:
   - Email: `security@unidemic.dev` (or reach lead maintainers `@AruYQ` & `@rekis-0103` on GitHub).
3. Include as much detail as possible in your report:
   - Detailed description of the vulnerability and its potential impact.
   - Reproduction steps (proof-of-concept script or HTTP request payload).
   - Affected API endpoints, parameters, or mobile screens.
   - Any suggested mitigations or patches (if available).

---

## ⏱️ Response Timeline & SLA

- **Initial Confirmation**: The team will acknowledge and confirm receipt of your report within **48 hours**.
- **Investigation & Validation**: The team will verify and triage the vulnerability within **3-5 business days**.
- **Patch & Release**: A security release will be deployed as soon as possible, with contributor recognition in release notes (unless anonymity is requested).

---

## 🔒 Security Practices in UniDemic

UniDemic adheres to a multi-layered security model:

- **Authentication & Sessions**: Laravel Sanctum token-based authentication with SHA-256 hashed storage and device-level token revocation.
- **Credential Protection**: Passwords securely hashed with modern hashing algorithms (Bcrypt/Argon2).
- **Brute-Force Rate Limiting**: Strict rate limiting (10 requests/minute) on public authentication endpoints (`/auth/login`, `/auth/register`).
- **Input Validation**: Strict bidirectional validation using Laravel FormRequest on the backend and Zod schemas on mobile forms.
- **Data Isolation (Multi-Tenancy)**: Strict tenant-level filtering enforcing user ownership (`where('user_id', $user->id)`) across all academic entities (semesters, courses, assignments, exams, attendances, grades, tasks, study sessions, goals).
- **Mobile Token Storage**: Credential storage restricted exclusively to `expo-secure-store` (iOS Keychain and Android AES-encrypted Keystore).
