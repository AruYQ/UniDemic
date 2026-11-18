export interface ThemeColors {
  bg: {
    base: string;
    surface: string;
    elevated: string;
    overlay: string;
  };
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  semantic: {
    danger: string;
    warning: string;
    success: string;
    info: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
  };
}

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ThemeShadows {
  card: ShadowStyle;
  elevated: ShadowStyle;
}

export const darkColors: ThemeColors = {
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
};

export const lightColors: ThemeColors = {
  // Backgrounds — Soft muted alabaster/slate, BUKAN pure blinding white
  bg: {
    base: '#F4F5F9',        // soft warm slate
    surface: '#FFFFFF',     // clean card surface
    elevated: '#FFFFFF',    // modals, elevated elements
    overlay: '#E8ECF5',     // hover / selected tab
  },

  // Brand — slightly deepened indigo/teal for rich WCAG AA contrast on light
  brand: {
    primary: '#5063BF',     // vibrant indigo CTA
    secondary: '#00A896',   // clean teal
    accent: '#D9822B',      // warm amber
  },

  // Text hierarchy
  text: {
    primary: '#111625',     // deep navy-slate headings & titles
    secondary: '#555E75',   // medium slate labels & subtitles
    muted: '#8A94A6',       // disabled, subtle placeholders
    inverse: '#FFFFFF',     // text on primary buttons
  },

  // Semantic
  semantic: {
    danger: '#D63031',      // danger alert
    warning: '#E17055',     // deadline warning
    success: '#00B894',     // submitted / present
    info: '#5063BF',        // neutral info
  },

  // Borders — soft and refined
  border: {
    subtle: '#E4E8F1',
    default: '#D0D6E4',
    strong: '#B4BCCF',
  },
};

// Default colors (Dark mode first fallback)
export const colors: ThemeColors = darkColors;

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

export const darkShadows: ThemeShadows = {
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
};

export const lightShadows: ThemeShadows = {
  card: {
    shadowColor: '#111625',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#111625',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const shadows: ThemeShadows = darkShadows;
