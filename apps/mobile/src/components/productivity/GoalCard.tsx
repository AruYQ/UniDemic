import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Target,
  CheckCircle,
  Plus,
  Trash,
} from 'phosphor-react-native';
import { Goal } from '@/types/productivity';
import { UniBadge } from '@/components/ui/UniBadge';
import { UniSwipeable } from '@/components/ui/UniSwipeable';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : GoalCard (components/productivity/GoalCard.tsx)
Tujuan           : Menampilkan kartu target belajar mahasiswa dengan progress bar target vs realisasi, quick increment, dan swipe-to-delete
Layout strategy  : Header (Goal Type + Target Badge) -> Title -> Progress Bar -> Quick +1 button & Footer
Color tokens     : bg.surface, bg.elevated, brand.primary, brand.secondary, semantic.success
Animation plan   : FadeInDown 220ms
Typography       : SpaceGrotesk untuk title, JetBrainsMono untuk angka target/unit
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #28 (spring tap)
</vibe_check>
*/

interface GoalCardProps {
  goal: Goal;
  onIncrement?: (id: number, nextVal: number) => void;
  onDelete?: (id: number) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onIncrement,
  onDelete,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const percentage = Math.min(
    Math.round((goal.current_value / Math.max(goal.target_value, 1)) * 100),
    100
  );
  const isCompleted = goal.is_completed || goal.current_value >= goal.target_value;

  const handleQuickAdd = () => {
    if (!onIncrement || isCompleted) return;
    onIncrement(goal.id, goal.current_value + 1);
  };

  return (
    <UniSwipeable onDelete={onDelete ? () => onDelete(goal.id) : undefined}>
      <Animated.View
        entering={FadeInDown.duration(220)}
        style={[styles.container, isCompleted && styles.containerCompleted]}
      >
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <Target size={16} color={themeColors.brand.primary} weight="duotone" />
            <UniBadge
              label={goal.type.toUpperCase()}
              variant="primary"
              size="sm"
            />
          </View>

          {isCompleted ? (
            <UniBadge label="TERCAPAI" variant="success" size="sm" />
          ) : (
            <Text style={styles.percentText}>{percentage}%</Text>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {goal.title}
        </Text>

        {goal.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {goal.description}
          </Text>
        ) : null}

        {/* Progress Bar & Value Meta */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressValueText}>
              {goal.current_value} / {goal.target_value} {goal.unit}
            </Text>
            {!isCompleted && onIncrement && (
              <Pressable
                onPress={handleQuickAdd}
                style={styles.quickAddBtn}
                hitSlop={6}
              >
                <Plus size={11} color={themeColors.brand.primary} weight="bold" />
                <Text style={styles.quickAddText}>+1 {goal.unit}</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: isCompleted
                    ? themeColors.semantic.success
                    : themeColors.brand.primary,
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    </UniSwipeable>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.sm,
      ...shadows.card,
    },
    containerCompleted: {
      borderColor: 'rgba(78, 205, 196, 0.3)',
      backgroundColor: 'rgba(78, 205, 196, 0.05)',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    percentText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    title: {
      fontFamily: typography.body.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 21,
      marginBottom: 2,
    },
    description: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    progressContainer: {
      marginTop: spacing.xs,
    },
    progressLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    progressValueText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    quickAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: 'rgba(107, 127, 215, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: 'rgba(107, 127, 215, 0.3)',
    },
    quickAddText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 10,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    progressTrack: {
      height: 6,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
    },
  });
