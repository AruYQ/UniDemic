import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/tokens';

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
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: 'rgba(107, 127, 215, 0.15)', text: colors.brand.primary, border: 'rgba(107, 127, 215, 0.3)' };
      case 'success':
        return { bg: 'rgba(78, 205, 196, 0.15)', text: colors.semantic.success, border: 'rgba(78, 205, 196, 0.3)' };
      case 'warning':
        return { bg: 'rgba(247, 183, 49, 0.15)', text: colors.semantic.warning, border: 'rgba(247, 183, 49, 0.3)' };
      case 'danger':
        return { bg: 'rgba(224, 91, 91, 0.15)', text: colors.semantic.danger, border: 'rgba(224, 91, 91, 0.3)' };
      case 'neutral':
      default:
        return { bg: colors.bg.overlay, text: colors.text.secondary, border: colors.border.subtle };
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
