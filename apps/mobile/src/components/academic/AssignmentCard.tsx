import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight, Easing } from 'react-native-reanimated';
import {
  CalendarBlank,
  CheckCircle,
  ClockCountdown,
  Trash,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Assignment } from '@/types/academic';
import { UniBadge } from '../ui/UniBadge';

/*
<vibe_check>
Screen/Component : AssignmentCard (components/academic/AssignmentCard.tsx)
Tujuan           : Menampilkan status tugas kuliah, tenggat waktu, prioritas, dan progress penyelesaian yang interaktif
Layout strategy  : Top metadata (matkul + priority badge), judul tugas, bar progress horizontal, status toggle
Color tokens     : bg.surface (#171B26), semantic.warning (#F7B731), semantic.danger (#E05B5B), semantic.success (#4ECDC4)
Animation plan   : FadeInRight staggered
Typography       : SpaceGrotesk_600SemiBold (judul), JetBrainsMono_400Regular (progress & tanggal)
Anti-slop check  : Rule #7 (Badge status geometris, bukan emoji), Rule #11 (Full background tint), Rule #28 (withSpring press)
</vibe_check>
*/

interface AssignmentCardProps {
  assignment: Assignment;
  index?: number;
  onUpdateProgress?: (id: number, nextProgress: number) => void;
  onDelete?: (id: number) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  index = 0,
  onUpdateProgress,
  onDelete,
}) => {
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);
  const isComplete = assignment.is_completed || assignment.progress >= 100;

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const formatDeadline = (dateStr?: string | null) => {
    if (!dateStr) return 'Tidak ada tenggat';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleNextProgress = () => {
    if (!onUpdateProgress) return;
    if (assignment.progress < 50) {
      onUpdateProgress(assignment.id, 50);
    } else if (assignment.progress < 100) {
      onUpdateProgress(assignment.id, 100);
    } else {
      onUpdateProgress(assignment.id, 0);
    }
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 45)
        .duration(240)
        .easing(Easing.out(Easing.cubic))}
      style={styles.container}
    >
      <View
        style={[
          styles.card,
          isComplete && styles.cardCompleted,
        ]}
      >
        {/* Top Header: Course tag & Priority */}
        <View style={styles.header}>
          <Text style={styles.courseName} numberOfLines={1}>
            {assignment.course?.name || 'Mata Kuliah'}
          </Text>
          <View style={styles.badgeRow}>
            <UniBadge
              label={assignment.priority.toUpperCase()}
              variant={getPriorityVariant(assignment.priority)}
              size="sm"
            />
            {onDelete && (
              <Pressable
                onPress={() => onDelete(assignment.id)}
                hitSlop={8}
                style={styles.deleteBtn}
              >
                <Trash size={15} color={themeColors.text.muted} weight="duotone" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Title & Description */}
        <Text
          style={[styles.title, isComplete && styles.titleCompleted]}
          numberOfLines={2}
        >
          {assignment.title}
        </Text>

        {assignment.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {assignment.description}
          </Text>
        ) : null}

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Progress Pengerjaan</Text>
            <Text style={styles.progressPercent}>{assignment.progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(assignment.progress, 100)}%`,
                  backgroundColor: isComplete
                    ? themeColors.semantic.success
                    : themeColors.brand.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Footer: Deadline & Quick Toggle */}
        <View style={styles.footer}>
          <View style={styles.deadlineContainer}>
            <CalendarBlank size={14} color={themeColors.text.muted} weight="duotone" />
            <Text style={styles.deadlineText}>
              {formatDeadline(assignment.deadline)}
            </Text>
          </View>

          {onUpdateProgress && (
            <Pressable
              onPress={handleNextProgress}
              style={({ pressed }) => [
                styles.toggleBtn,
                isComplete && styles.toggleBtnComplete,
                pressed && { opacity: 0.8 },
              ]}
            >
              <CheckCircle
                size={14}
                color={isComplete ? themeColors.semantic.success : themeColors.brand.primary}
                weight="duotone"
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  isComplete && { color: themeColors.semantic.success },
                ]}
              >
                {isComplete ? 'Selesai (100%)' : 'Update Progress'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows, isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      ...shadows.card,
    },
    cardCompleted: {
      borderColor: isDark ? 'rgba(78, 205, 196, 0.3)' : 'rgba(0, 168, 150, 0.25)',
      backgroundColor: isDark ? 'rgba(23, 27, 38, 0.7)' : 'rgba(232, 236, 245, 0.5)',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    courseName: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.brand.secondary,
      flex: 1,
      marginRight: spacing.sm,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    deleteBtn: {
      padding: 2,
    },
    title: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
      marginBottom: spacing.xs,
      lineHeight: 22,
    },
    titleCompleted: {
      color: colors.text.muted,
      textDecorationLine: 'line-through',
    },
    description: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.muted,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    progressContainer: {
      marginVertical: spacing.sm,
    },
    progressLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    progressLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    progressPercent: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    progressTrack: {
      height: 6,
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    deadlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    deadlineText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
    },
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    toggleBtnComplete: {
      borderColor: isDark ? 'rgba(78, 205, 196, 0.4)' : 'rgba(0, 168, 150, 0.3)',
      backgroundColor: isDark ? 'rgba(78, 205, 196, 0.1)' : 'rgba(0, 168, 150, 0.08)',
    },
    toggleBtnText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
      fontWeight: '600',
    },
  });
