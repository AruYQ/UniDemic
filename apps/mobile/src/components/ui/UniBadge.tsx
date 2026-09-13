import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { radius, spacing, typography } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : UniBadge
Tujuan           : Badge status akademik geometris yang elegan (BUKAN emoji)
Layout strategy  : Inline-flex container dengan padding presisi dan rounded pill
Color tokens     : semantic.success/danger/warning/info background tint & solid borders
Animation plan   : None (statis & crisp)
Typography       : SpaceGrotesk_500Medium label, letterSpacing 0.4
Anti-slop check  : Rule #7 (No emoji sebagai status/label), Rule #19 (radius.sm / full)
</vibe_check>
*/

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

export interface UniBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const UniBadge: React.FC<UniBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle,
}) => {
  const { colors: themeColors, isDark } = useUniTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: isDark ? 'rgba(107, 127, 215, 0.15)' : 'rgba(80, 99, 191, 0.12)',
          text: themeColors.brand.primary,
          border: isDark ? 'rgba(107, 127, 215, 0.3)' : 'rgba(80, 99, 191, 0.25)',
        };
      case 'success':
        return {
          bg: isDark ? 'rgba(78, 205, 196, 0.15)' : 'rgba(0, 168, 150, 0.12)',
          text: themeColors.semantic.success,
          border: isDark ? 'rgba(78, 205, 196, 0.3)' : 'rgba(0, 168, 150, 0.25)',
        };
      case 'warning':
        return {
          bg: isDark ? 'rgba(247, 183, 49, 0.15)' : 'rgba(217, 130, 43, 0.12)',
          text: themeColors.semantic.warning,
          border: isDark ? 'rgba(247, 183, 49, 0.3)' : 'rgba(217, 130, 43, 0.25)',
        };
      case 'danger':
        return {
          bg: isDark ? 'rgba(224, 91, 91, 0.15)' : 'rgba(214, 48, 49, 0.12)',
          text: themeColors.semantic.danger,
          border: isDark ? 'rgba(224, 91, 91, 0.3)' : 'rgba(214, 48, 49, 0.25)',
        };
      case 'neutral':
      default:
        return {
          bg: themeColors.bg.overlay,
          text: themeColors.text.secondary,
          border: themeColors.border.subtle,
        };
    }
  };

  const scheme = getColors();

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        { backgroundColor: scheme.bg, borderColor: scheme.border },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: scheme.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
  },
  sizeMd: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
  },
  text: {
    fontFamily: typography.label.fontFamily,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: typography.label.fontSize,
  },
});
