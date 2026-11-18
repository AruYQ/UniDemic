import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { radius, spacing, typography } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniButton } from './UniButton';

/*
<vibe_check>
Screen/Component : EmptyState (components/ui/EmptyState.tsx)
Tujuan           : Menampilkan status kosong yang estetik dan memotivasi mahasiswa untuk menambah data akademik pertama mereka
Layout strategy  : Centered container, surface background dengan border putus-putus subtle, icon duotone prominent
Color tokens     : Dinamis sesuai useUniTheme() (bg.surface, border.default, brand.primary, text.secondary)
Animation plan   : FadeInDown durasi 250ms dengan cubic easing
Typography       : SpaceGrotesk_600SemiBold untuk title, SpaceGrotesk_400Regular untuk deskripsi
Anti-slop check  : Rule #10 (Space Grotesk), Rule #20 (indigo palette), Rule #28 (spring press-down)
</vibe_check>
*/

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { colors } = useUniTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
      style={[
        styles.container,
        {
          backgroundColor: colors.bg.surface,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.text.secondary }]}>
        {description}
      </Text>

      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <UniButton
            label={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(107, 127, 215, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(107, 127, 215, 0.25)',
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionWrapper: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 200,
  },
});
