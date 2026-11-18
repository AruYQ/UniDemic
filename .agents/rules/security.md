# UniDemic — Aturan Keamanan Siber & Privasi Data

Aturan ini **wajib** ditaati oleh semua AI Agent (Frontend maupun Backend) saat menulis kode. Tidak boleh ada toleransi terhadap celah keamanan.

## 🔐 Secret Management
- **JANGAN PERNAH** hardcode API key, token, URL database, atau rahasia apapun langsung ke dalam source code (`.ts`, `.php`, dll).
- Selalu gunakan file `.env` dan baca variable melalui sistem config yang tersedia (`process.env` atau config Laravel).
- Jangan pernah me-log (`console.log`, `Log::info`) token auth, password, atau secret keys.

## 📱 Mobile/Frontend Security (Dev B)
- **Penyimpanan Token**: WAJIB menggunakan `expo-secure-store` untuk Auth Token. DILARANG menggunakan `AsyncStorage` untuk data sensitif.
- **Validasi Input**: Setiap input dari user harus divalidasi dengan **Zod** sebelum dikirim ke API. Jangan andalkan validasi backend saja.
- **XSS Prevention**: React Native secara default aman dari HTML XSS, tapi pastikan komponen WebView (jika ada) mematikan eksekusi script yang tidak terpercaya.

## 🌍 Backend/API Security (Dev A)
- **Autentikasi & Otorisasi**: Semua rute selain `/login` dan `/register` harus diproteksi dengan middleware auth Sanctum. Pastikan user hanya bisa mengakses datanya sendiri (implementasi Gate/Policy).
- **SQL Injection**: Selalu gunakan query builder atau Eloquent ORM Laravel. Jangan gunakan raw DB query dengan concatenasi string manual.
- **Rate Limiting**: Lindungi rute-rute publik (terutama otentikasi dan API AI) dari *Brute Force* dengan middleware throttle bawaan Laravel.
- **Validasi Data Masuk**: Gunakan `FormRequest` Laravel untuk menolak payload tak wajar dari client.

## 🤖 AI Privacy
- Jangan pernah mengirim Data Pribadi/PII pengguna (Nama lengkap, email, nomor identitas) ke API AI (Gemini) tanpa anonimisasi atau persetujuan tegas, kecuali konteks memang membutuhkannya dengan persetujuan user.
