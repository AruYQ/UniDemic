---
name: unidemic-ui-ux
description: >
  Elite UI/UX design system dan coding standards untuk UniDemic mobile app
  (React Native + Expo). WAJIB diaktifkan oleh AI agent sebelum membuat,
  memodifikasi, atau mereview screen, komponen, atau elemen UI apapun.
  Menerapkan prinsip Vibe Coding, 30 anti-slop rules, dan design standards
  premium yang spesifik untuk platform akademik UniDemic.
---

# UniDemic — UI/UX Skill (Vibe Coding Mode: ENABLED)

## 🧠 Mandatory Pre-Coding Ritual (Chain of Thought)

Sebelum menulis kode UI APAPUN, WAJIB lakukan blok `<vibe_check>`:

```
<vibe_check>
Screen/Component : [nama]
Tujuan           : [apa yang dilakukan untuk mahasiswa]
Layout strategy  : [susunan elemen — BUKAN default 3-col card]
Color tokens     : [dari design system, bukan arbitrary]
Animation plan   : [apa yang bergerak, apa yang tidak, kenapa]
Typography       : [pilihan font per level hierarki]
Anti-slop check  : [rule mana yang relevan di sini]
</vibe_check>
```

**Langkah ini NON-OPSIONAL. Tidak ada vibe_check = tidak ada kode.**

---

## 📐 Design Philosophy

UniDemic menyasar **mahasiswa** — audiens mobile-native yang langsung mengenali
app generik dan template-looking. Setiap screen harus terasa **crafted**, bukan
generated.

Prinsip utama:
- **Premium first**: Desain seperti produk agency, bukan demo MVP
- **Mobile native**: Setiap interaksi dioptimalkan untuk thumb reach zone
- **Information density**: Data akademik kompleks — desain harus menanganinya
  secara elegan tanpa visual noise
- **Calm productivity**: Bukan gaming app. Tidak ada animasi overstimulating.
  Hanya motion yang subtle dan purposeful.

---

## 🎨 Design System

### Color Palette (Dark Mode First)

```typescript
// tokens/colors.ts — GUNAKAN INI, jangan nilai hex arbitrary
export const colors = {
  // Backgrounds — BUKAN pure black atau white
  bg: {
    base: '#0F1117',        // deep navy-slate (BUKAN #000000)
    surface: '#171B26',     // card surfaces
    elevated: '#1E2333',    // modals, bottom sheets
    overlay: '#252A3D',     // hover states, selected
  },

  // Brand — muted indigo-slate, BUKAN purple-black clone
  brand: {
    primary: '#6B7FD7',     // main CTA, active tabs
    secondary: '#4ECDC4',   // success, attendance ok
    accent: '#F7B731',      // warnings, exam dates
  },

  // Text hierarchy
  text: {
    primary: '#F0F2F8',     // headings
    secondary: '#9BA3BE',   // subtitles, labels
    muted: '#5A6177',       // disabled, placeholders
    inverse: '#0F1117',     // text on bright backgrounds
  },

  // Semantic
  semantic: {
    danger: '#E05B5B',      // attendance warning, overdue
    warning: '#F7B731',     // upcoming deadline
    success: '#4ECDC4',     // submitted, present
    info: '#6B7FD7',        // neutral information
  },

  // Borders — subtle, never stark
  border: {
    subtle: '#252A3D',
    default: '#2E3450',
    strong: '#3D4566',
  },
}
```

### Typography — NO Inter/Roboto/Arial

```typescript
export const typography = {
  // Display / Hero text (nama semester, angka GPA)
  display: { fontFamily: 'Syne_700Bold', letterSpacing: -0.5 },

  // Headings (judul screen, judul card)
  h1: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 24 },
  h2: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20 },
  h3: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: 17 },

  // Body (konten, deskripsi)
  body: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: 15 },
  bodySmall: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: 13 },

  // Labels (tags, badges, label input)
  label: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: 12, letterSpacing: 0.3 },

  // Mono (kode mata kuliah, angka GPA, nilai)
  mono: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 14 },
}
```

### Spacing & Radius System

```typescript
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
}

export const radius = {
  sm: 6,    // elemen kecil: badges, chips
  md: 10,   // cards, inputs
  lg: 16,   // bottom sheets, modals
  xl: 24,   // hero cards, container besar
  full: 999, // pills, avatars
}
// RULE: Jangan pakai radius yang sama untuk SEMUA elemen — variasikan
```

---

## 🏗️ Layout Principles

### ✅ DO — Asymmetric & Dynamic Layouts
- **Bento-style grids**: variasi column span — 2+1, 1+2, full-width hero
- **Section dividers**: gunakan border subtle atau spacing, BUKAN garis divider
- **Information hierarchy**: info terpenting mendapat bobot visual terbesar
- **Progressive disclosure**: tampilkan ringkasan → expand untuk detail

### ❌ DON'T — Slop Patterns
- 3-kolom card simetris untuk setiap fitur
- Tinggi card yang sama semua — biarkan konten bernapas
- Layout centered untuk segalanya — gunakan reading flow left-aligned
- Padding yang identik untuk setiap screen

### Thumb Zone Awareness (Kritis untuk Mobile)
```
Zona layar:
┌────────────────────┐
│   ☠️ DEAD ZONE     │ ← area status bar, sistem UI
├────────────────────┤
│   ⚠️ STRETCH ZONE  │ ← aksi sekunder (filter, search)
│                    │
│   ✅ NATURAL ZONE  │ ← CTA utama, navigasi primer
│   (40% bawah)     │
└────────────────────┘

Rule: Aksi destruktif SELALU di Dead Zone (susah dijangkau)
      CTA primer SELALU di Natural Zone (mudah dijangkau)
```

---

## ✨ Animation Guidelines (react-native-reanimated v3)

```typescript
// Entry animations — untuk screen/card baru
FadeInDown.duration(300).easing(Easing.out(Easing.cubic))

// List items — stagger enter, BUKAN semua sekaligus
FadeInRight.delay(index * 60).duration(250)

// Press feedback — BUKAN scale-105 hover
withSpring(0.97, { damping: 15 }) // tekan turun subtle

// Progress bars — selalu animasi saat mount
withTiming(targetValue, { duration: 800, easing: Easing.out(Easing.exp) })
```

### Loading States — NO Spinner untuk konten
```typescript
// SELALU gunakan Skeleton/Shimmer, BUKAN ActivityIndicator untuk konten
// Spinner HANYA untuk: submit button, inline async actions
```

### Animasi yang DILARANG
- `scale: 1.05` on press — terlalu generik
- Bounce animations untuk data akademik serius
- Particle effects, sparkles, confetti (kecuali: selesai assignment — sangat jarang)
- Looping idle animations — pembunuh performa

---

## 🧩 Component Standards

### Card Component
```typescript
// Setiap card HARUS memiliki:
// 1. Border subtle (colors.border.subtle), BUKAN shadow generic
// 2. Background dari surface palette (BUKAN putih)
// 3. Hierarki visual jelas (title > metadata > action)
// 4. Minimal satu elemen data-driven (bukan placeholder statis)

// Offset shadow (efek elevasi) — menggantikan drop shadow
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 12,
elevation: 8,
```

### Icon Rules
- Gunakan **Phosphor Icons** (`phosphor-react-native`) — Duotone style
- JANGAN Lucide atau Heroicons default
- Ukuran: 16 (inline), 20 (list item), 24 (primary action), 32 (hero)

### Badge/Status (BUKAN emoji)
```typescript
// ✅ BENAR:
<Badge variant="danger" label="TERLAMBAT" />

// ❌ SALAH:
<Text>⚠️ Terlambat</Text>
```

---

## 🚫 30 Anti-Slop Rules (Adaptasi React Native)

| # | Rule | Penerapan React Native |
|---|------|------------------------|
| 1 | No harsh linear gradients | Max 2-stop gradient, atau solid surface |
| 2 | No icon set default | Phosphor Duotone atau custom SVG |
| 3 | No pure white `#FFFFFF` | Gunakan `bg.base: #0F1117` |
| 4 | No rainbow coloring | Max 2-3 brand colors per screen |
| 5 | No generic heavy shadow | Gunakan offset shadow system |
| 6 | No 3-column symmetric grids | Layout Bento/asimetris |
| 7 | No emoji sebagai status/label | Badge geometris dengan teks |
| 8 | No excess glassmorphism | Max 1 glass effect per screen |
| 9 | No em dash di tagline | Copy langsung dan percaya diri |
| 10 | No Inter/Roboto/Arial | Syne + Space Grotesk + JetBrains Mono |
| 11 | No colored left border stripe | Full background tint atau border |
| 12 | No avatar/data fake | Gunakan initials avatar atau data real |
| 13 | No Bento simetris membosankan | Variasikan bobot span dengan sengaja |
| 14 | No estetik terminal macOS | UI akademik, bukan developer portfolio |
| 15 | No "It's not X, it's Y" copy | Value statement langsung |
| 16 | No checkmark bullet list | Gunakan komponen list terstruktur |
| 17 | No 3 tier pricing standar | N/A untuk mobile app UI |
| 18 | No ilustrasi statis saja | Gunakan Lottie atau video preview |
| 19 | No `borderRadius: 16` di semua | Variasikan radius per tipe komponen |
| 20 | No purple-black Linear clone | Indigo-slate dengan aksen teal |
| 21 | No `ActivityIndicator` untuk konten | Skeleton/Shimmer selalu |
| 22 | No radial blur orb background | Noise texture subtle atau flat bersih |
| 23 | No dot grid background | Surface bersih, texture purposeful saja |
| 24 | No sparkle icon untuk AI | Badge minimal atau monogram icon |
| 25 | No animated arrow ke button | Biarkan desain yang mengarahkan perhatian |
| 26 | No Terms of Service hilang | Link di settings/onboarding |
| 27 | No Privacy Policy hilang | Link di settings/onboarding |
| 28 | No generic `scale(1.05)` press | `withSpring(0.97)` press-down |
| 29 | No neon colors random | Palette terkontrol saja |
| 30 | No low-contrast pastels | Minimum WCAG AA contrast ratio |

---

## 📱 Panduan Per Screen

### Dashboard
- Greeting dengan konteks waktu (pagi/siang/malam)
- **Hero card**: Info kelas berikutnya — besar, prominent, thumb-zone
- **Timeline strip**: Jadwal hari ini, horizontal scroll
- **Urgency stack**: Diurutkan mendekati deadline, BUKAN alfabetis
- Statistik: **angka mono besar** + label kecil — BUKAN pie chart

### Academic (Courses, Assignments, Exams)
- List item: kiri = icon+judul, kanan = metadata (tanggal/nilai)
- Item terlambat: tint `colors.semantic.danger` pada bg baris penuh
- Progress bar: selalu animasi, horizontal bar — BUKAN teks persentase saja
- Empty state: Lottie illustrated + CTA jelas — bukan "Belum ada data"

### Grade/GPA Screen
- GPA: **hero number** besar (Syne Bold)
- Breakdown nilai: horizontal stacked bar — BUKAN tabel
- Simulator: slider input — BUKAN text field

### Chat Screen
- Bubble sender: kanan (brand.primary tint)
- Bubble receiver: kiri (bg.elevated)
- Timestamp: muted, antar grup pesan — BUKAN di setiap pesan
- Attachment: thumbnail preview card — BUKAN text link nama file

### Focus Timer
- Timer: Syne Bold display number sangat besar, centered
- Course chip kecil di bawah timer
- Progress arc ambient mengelilingi timer
- Kontrol: touch target minimal 56px height

---

## ⚡ Performance Rules (Wajib)

```typescript
// 1. Memoize komponen mahal
const CourseCard = React.memo(({ course }) => { ... })

// 2. Virtualize SEMUA list — jangan ScrollView untuk > 5 item
<FlashList data={courses} estimatedItemSize={80} renderItem={...} />

// 3. Image — selalu lazy + cached (expo-image, BUKAN Image dari RN)
<Image source={{ uri }} cachePolicy="memory-disk" />

// 4. Debounce search
const debouncedSearch = useDebounce(query, 300)

// 5. Skeleton selama semua async states
if (isLoading) return <CourseSkeleton />

// 6. Error boundaries per section screen
<ErrorBoundary fallback={<SectionError />}>
  <GradeSection />
</ErrorBoundary>
```

---

## 🔐 Security UI Rules

- Jangan pernah tampilkan raw token di UI
- Password field: selalu `secureTextEntry` + toggle show/hide
- Data sensitif (nilai, GPA): opsi blur di settings ("stealth mode")
- Error message: generic untuk user, detail hanya ke console
  ```typescript
  // User hanya lihat pesan generik
  toast.error("Terjadi kesalahan. Coba lagi.")
  // Console dapat error aslinya
  console.error('[AuthService]', error.response?.data)
  ```

---

## 🤖 Instruksi untuk AI Agent

Saat skill ini aktif, WAJIB:

1. **Mulai dengan `<vibe_check>`** sebelum kode UI apapun
2. **Jangan tulis placeholder code** — setiap komponen harus 100% lengkap
3. **Gunakan design tokens** — jangan hardcode warna, spacing, atau ukuran font
4. **Handle SEMUA state** — loading, error, empty, populated — tanpa pengecualian
5. **Test thumb zones** — pastikan tap target minimum 44x44px
6. **Gunakan FlashList** untuk list dengan potensi > 5 item
7. **Terapkan entrance animations** ke setiap screen baru (Reanimated v3)
8. **Export TypeScript types** untuk setiap component props

Saat mereview kode yang ada, tandai pelanggaran dengan:
```
⚠️ ANTI-SLOP VIOLATION [Rule #X]: [deskripsi]
💡 FIX: [koreksi spesifik]
```

---

## 📦 Library Wajib (install saat init project)

```bash
# Animation
npx expo install react-native-reanimated react-native-gesture-handler

# Icons
npm install phosphor-react-native

# List virtualization
npm install @shopify/flash-list

# Image caching
npx expo install expo-image

# Fonts
npx expo install @expo-google-fonts/space-grotesk @expo-google-fonts/syne
npm install @expo-google-fonts/jetbrains-mono

# Skeleton / animation primitives
npm install moti
```

---

*Skill ini diterapkan pada setiap task UI di UniDemic.
Versi: Phase 1 — Foundation*
