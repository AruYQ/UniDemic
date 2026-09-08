// tokens.ts — UniDemic Elite UI/UX Design System Tokens
// Derived directly from .agents/skills/unidemic-ui-ux/SKILL.md

export const colors = {
  // Backgrounds — BUKAN pure black atau white (#000000 atau #ffffff dilarang)
  bg: {
    base: '#0F1117',        // deep navy-slate
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
} as const;

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
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,     // elemen kecil: badges, chips
  md: 10,    // cards, inputs
  lg: 16,    // bottom sheets, modals
  xl: 24,    // hero cards, container besar
  full: 999, // pills, avatars
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;
