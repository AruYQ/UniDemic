# 🛡️ Security Policy

UniDemic takes security and data privacy very seriously. We appreciate your efforts to responsibly disclose any vulnerabilities.

---

## 📦 Supported Versions

Kami secara aktif memelihara dan memberikan patch keamanan pada versi berikut:

| Project / Component | Version | Supported |
| :--- | :--- | :---: |
| **API (`apps/api`)** | Laravel 11.x / PHP 8.3+ | :white_check_mark: |
| **Mobile (`apps/mobile`)** | Expo SDK 57 / React Native 0.81+ | :white_check_mark: |
| **Shared Types (`packages/types`)** | v0.1.x | :white_check_mark: |

---

## 🚨 Reporting a Vulnerability

Jika Anda menemukan potensi kerentanan keamanan di UniDemic:

1. **JANGAN** membuat public issue atau pull request terbuka yang mempublikasikan celah keamanan tersebut.
2. Laporkan secara privat melalui fitur **[GitHub Security Advisory](https://github.com/AruYQ/UniDemic/security/advisories/new)** atau kirimkan email ke:
   - `security@unidemic.dev` (atau kontak maintainer utama: `@AruYQ` & `@rekis-0103` via GitHub).
3. Cantumkan informasi sedetail mungkin dalam laporan Anda:
   - Deskripsi kerentanan dan potensi dampak.
   - Langkah-langkah reproduksi (proof-of-concept / request payload).
   - Versi komponen atau endpoint API yang terdampak.
   - Usulan mitigasi atau perbaikan (jika ada).

---

## ⏱️ Response Timeline & SLA

- **Konfirmasi Awal**: Tim akan merespons dan mengonfirmasi penerimaan laporan dalam waktu **48 jam**.
- **Investigasi & Validasi**: Tim akan memverifikasi kerentanan dalam kurun waktu **3-5 hari kerja**.
- **Patch & Rilis**: Perbaikan keamanan akan dirilis secepat mungkin, dan kredit kontributor keamanan akan dicantumkan dalam rilis (kecuali jika pelapor meminta anonimitas).

---

## 🔒 Praktik Keamanan dalam UniDemic

UniDemic menerapkan standar keamanan multi-lapis:

- **Autentikasi & Sesi**: Laravel Sanctum token-based authentication dengan hashing SHA-256 dan revocable tokens per perangkat.
- **Enkripsi Kredensial**: Password di-hash menggunakan algoritma modern (Bcrypt/Argon2).
- **Proteksi Brute-Force**: Rate limiting ketat (10 request/menit) pada endpoint autentikasi (`/auth/login`, `/auth/register`).
- **Validasi Data**: Validasi ketat dua arah menggunakan Laravel FormRequest di backend dan Zod schema di frontend.
- **Isolasi Data (Multi-tenancy)**: Setiap entitas akademik (semester, kuliah, jadwal, tugas, ujian, presensi, nilai) terisolasi secara ketat berdasarkan `user_id` pemilik token.
- **Penyimpanan Token Mobile**: Menggunakan `expo-secure-store` (Keychain di iOS dan Keystore bersandi AES di Android).
