# 🛡️ Kebijakan Keamanan UniDemic

> 🌐 **Bahasa**: [Bahasa Indonesia](SECURITY.md) | [English](SECURITY.en.md)

UniDemic menempatkan keamanan data dan privasi civitas akademika sebagai prioritas tertinggi. Kami sangat menghargai kontribusi para peneliti keamanan dan komunitas dalam melaporkan kerentanan secara bertanggung jawab.

---

## 📦 Versi yang Didukung

Kami secara aktif memelihara dan menyediakan tambalan (*patch*) keamanan untuk versi berikut:

| Proyek / Komponen | Versi | Status Dukungan |
| :--- | :--- | :---: |
| **API Backend (`apps/api`)** | Laravel 11.x / PHP 8.3+ | :white_check_mark: Didukung |
| **Aplikasi Mobile (`apps/mobile`)** | Expo SDK 57 / React Native 0.81+ | :white_check_mark: Didukung |
| **Tipe Bersama (`packages/types`)** | v0.1.x | :white_check_mark: Didukung |

---

## 🚨 Pelaporan Kerentanan

Jika Anda menemukan potensi celah keamanan pada ekosistem UniDemic:

1. **JANGAN** mempublikasikan masalah tersebut secara terbuka melalui GitHub Issues publik atau Pull Request.
2. Laporkan secara privat melalui fitur **[GitHub Security Advisory](https://github.com/AruYQ/UniDemic/security/advisories/new)** atau hubungi pengelola repositori:
   - Surel: `security@unidemic.dev` (atau kontak pengelola utama `@AruYQ` & `@rekis-0103` via GitHub).
3. Sertakan rincian selengkap mungkin dalam laporan Anda:
   - Deskripsi mendalam mengenai celah keamanan dan potensi risikonya.
   - Langkah-langkah mereproduksi masalah (*proof-of-concept* skrip atau muatan data uji).
   - Layanan, parameter, atau layar yang terdampak.
   - Gagasan perbaikan atau mitigasi (bila tersedia).

---

## ⏱️ Linimasa Tanggapan & Layanan

- **Konfirmasi Penerimaan**: Tim akan mengirimkan konfirmasi penerimaan laporan maksimal dalam kurun waktu **48 jam**.
- **Investigasi & Verifikasi**: Tim akan meneliti dan memvalidasi temuan dalam waktu **3-5 hari kerja**.
- **Pembaruan & Perilisan**: Perbaikan keamanan akan segera dirilis, dan identitas pelapor akan dicantumkan dalam catatan rilis (*release notes*) sebagai bentuk penghargaan (kecuali jika pelapor meminta identitasnya dirahasiakan).

---

## 🔒 Praktik Keamanan dalam UniDemic

UniDemic menerapkan pendekatan pertahanan berlapis:

- **Autentikasi & Sesi**: Autentikasi berbasis token Laravel Sanctum dengan enkripsi hashing SHA-256 dan pencabutan token per perangkat.
- **Perlindungan Kredensial**: Kata sandi di-hash menggunakan algoritma modern standar industri (Bcrypt/Argon2).
- **Pembatasan Laju Permintaan (Rate Limiting)**: Proteksi brute-force ketat (10 permintaan/menit) pada endpoint autentikasi publik (`/auth/login`, `/auth/register`).
- **Validasi Data Menyeluruh**: Validasi ketat dua arah menggunakan Laravel FormRequest pada backend dan skema Zod pada form antarmuka mobile.
- **Isolasi Data Pengguna (Multi-Tenancy)**: Filter ketat kepemilikan data pengguna (`where('user_id', $user->id)`) di seluruh modul akademik (semester, perkuliahan, jadwal, tugas, ujian, presensi, nilai, sesi belajar, target capaian).
- **Penyimpanan Kunci Aman di Mobile**: Akses token disimpan secara eksklusif menggunakan `expo-secure-store` (iOS Keychain dan Android Keystore bersandi AES), bukan penyimpanan teks polos seperti AsyncStorage biasa.
