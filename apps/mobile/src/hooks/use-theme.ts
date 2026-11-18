import { useThemeStore } from '@/store/useThemeStore';

/**
 * Hook to access current theme tokens and mode
 */
export function useTheme() {
  const { colors, resolvedTheme, themeMode, isDark, setThemeMode } = useThemeStore();
  return {
    ...colors,
    resolvedTheme,
    themeMode,
    isDark,
    setThemeMode,
    // Compatibility helpers for standard template
    text: colors.text.primary,
    background: colors.bg.base,
    backgroundElement: colors.bg.surface,
    backgroundSelected: colors.bg.overlay,
    textSecondary: colors.text.secondary,
  };
}

export { useUniTheme } from '@/store/useThemeStore';
