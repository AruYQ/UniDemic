import { Platform } from 'react-native';
import { colors, typography, spacing, radius, shadows } from './tokens';

export * from './tokens';

export const Colors = {
  light: {
    text: colors.text.primary,
    background: colors.bg.base,
    backgroundElement: colors.bg.surface,
    backgroundSelected: colors.bg.overlay,
    textSecondary: colors.text.secondary,
  },
  dark: {
    text: colors.text.primary,
    background: colors.bg.base,
    backgroundElement: colors.bg.surface,
    backgroundSelected: colors.bg.overlay,
    textSecondary: colors.text.secondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'SpaceGrotesk_400Regular',
    serif: 'SpaceGrotesk_400Regular',
    rounded: 'SpaceGrotesk_500Medium',
    mono: 'JetBrainsMono_400Regular',
  },
  default: {
    sans: 'SpaceGrotesk_400Regular',
    serif: 'SpaceGrotesk_400Regular',
    rounded: 'SpaceGrotesk_500Medium',
    mono: 'JetBrainsMono_400Regular',
  },
  web: {
    sans: 'SpaceGrotesk_400Regular, sans-serif',
    serif: 'serif',
    rounded: 'SpaceGrotesk_500Medium, sans-serif',
    mono: 'JetBrainsMono_400Regular, monospace',
  },
});

export const Spacing = {
  ...spacing,
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = radius;
export const Shadows = shadows;
export const MaxContentWidth = 800;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
