import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import {
  darkColors,
  lightColors,
  darkShadows,
  lightShadows,
  ThemeColors,
  ThemeShadows,
} from '@/constants/tokens';
import { secureStorage } from '@/utils/secureStore';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  colors: ThemeColors;
  shadows: ThemeShadows;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'unidemic_theme_mode';

const resolveTheme = (
  mode: ThemeMode,
  systemScheme?: ColorSchemeName | null
): 'dark' | 'light' => {
  if (mode === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return mode;
};

const initialScheme = Appearance.getColorScheme();
const initialResolved = resolveTheme('system', initialScheme);

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'system',
  resolvedTheme: initialResolved,
  colors: initialResolved === 'dark' ? darkColors : lightColors,
  shadows: initialResolved === 'dark' ? darkShadows : lightShadows,
  isDark: initialResolved === 'dark',

  setThemeMode: async (mode: ThemeMode) => {
    const systemScheme = Appearance.getColorScheme();
    const resolved = resolveTheme(mode, systemScheme);

    set({
      themeMode: mode,
      resolvedTheme: resolved,
      colors: resolved === 'dark' ? darkColors : lightColors,
      shadows: resolved === 'dark' ? darkShadows : lightShadows,
      isDark: resolved === 'dark',
    });

    try {
      await secureStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('[ThemeStore] Failed to save theme mode:', error);
    }
  },

  initTheme: async () => {
    try {
      const savedMode = (await secureStorage.getItem(THEME_STORAGE_KEY)) as ThemeMode | null;
      const activeMode: ThemeMode = savedMode || 'system';
      const systemScheme = Appearance.getColorScheme();
      const resolved = resolveTheme(activeMode, systemScheme);

      set({
        themeMode: activeMode,
        resolvedTheme: resolved,
        colors: resolved === 'dark' ? darkColors : lightColors,
        shadows: resolved === 'dark' ? darkShadows : lightShadows,
        isDark: resolved === 'dark',
      });
    } catch (error) {
      console.error('[ThemeStore] Failed to init theme:', error);
    }

    // Listen to system color scheme changes if mode is 'system'
    Appearance.addChangeListener(({ colorScheme }) => {
      const { themeMode } = get();
      if (themeMode === 'system') {
        const resolved = resolveTheme('system', colorScheme);
        set({
          resolvedTheme: resolved,
          colors: resolved === 'dark' ? darkColors : lightColors,
          shadows: resolved === 'dark' ? darkShadows : lightShadows,
          isDark: resolved === 'dark',
        });
      }
    });
  },
}));

export const useUniTheme = () => {
  const { themeMode, resolvedTheme, colors, shadows, isDark, setThemeMode } = useThemeStore();
  return { themeMode, resolvedTheme, colors, shadows, isDark, setThemeMode };
};
