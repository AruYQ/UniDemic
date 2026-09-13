import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Trash } from 'phosphor-react-native';
import { Grade } from '@/types/tracking';
import { UniBadge } from '@/components/ui/UniBadge';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : GradeItemCard (components/tracking/GradeItemCard.tsx)
Tujuan           : Menampilkan kartu nilai individu (nama asesmen, skor nilai 0-100, komponen terkait, dan aksi hapus)
Layout strategy  : Horizontal row dengan nama dan komponen di kiri, badge skor nilai besar di kanan, dan delete button
Color tokens     : bg.surface, bg.elevated, border.subtle, score color semantic
Animation plan   : FadeInDown duration 220ms
Typography       : SpaceGrotesk untuk nama nilai, Syne_700Bold untuk skor numerik
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #10 (typography)
</vibe_check>
*/

interface GradeItemCardProps {
  grade: Grade;
  onDelete?: (id: number) => void;
}

export const GradeItemCard: React.FC<GradeItemCardProps> = ({ grade, onDelete }) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const scoreNum = Number(grade.score);
  const getScoreVariant = (score: number) => {
    if (score >= 80) return { color: themeColors.semantic.success, variant: 'success' as const };
    if (score >= 65) return { color: themeColors.brand.accent, variant: 'warning' as const };
    return { color: themeColors.semantic.danger, variant: 'danger' as const };
  };

  const { color: scoreColor } = getScoreVariant(scoreNum);

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={styles.card}
    >
      <View style={styles.leftContent}>
        <View style={styles.badgeRow}>
          {grade.component?.name ? (
            <UniBadge label={grade.component.name.toUpperCase()} variant="primary" size="sm" />
          ) : (
            <UniBadge label="CUSTOM" variant="neutral" size="sm" />
          )}
          {grade.weight ? (
            <Text style={styles.weightText}>Bobot: {grade.weight}%</Text>
          ) : grade.component?.weight ? (
            <Text style={styles.weightText}>Bobot: {grade.component.weight}%</Text>
          ) : null}
        </View>
        <Text style={styles.gradeName}>{grade.name}</Text>
      </View>

      <View style={styles.rightContent}>
        <View style={[styles.scorePill, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {Math.round(scoreNum * 10) / 10}
          </Text>
        </View>
        {onDelete && (
          <Pressable
            onPress={() => onDelete(grade.id)}
            style={styles.deleteBtn}
            hitSlop={8}
          >
            <Trash size={16} color={themeColors.text.muted} weight="duotone" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.sm,
      ...shadows.card,
    },
    leftContent: {
      flex: 1,
      paddingRight: spacing.md,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    weightText: {
      ...typography.mono,
      fontSize: 11,
      color: colors.text.muted,
    },
    gradeName: {
      ...typography.body,
      fontFamily: 'SpaceGrotesk_600SemiBold',
      color: colors.text.primary,
    },
    rightContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    scorePill: {
      minWidth: 48,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.md,
      borderWidth: 1.5,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreText: {
      fontFamily: 'Syne_700Bold',
      fontSize: 18,
    },
    deleteBtn: {
      padding: spacing.xs,
    },
  });
