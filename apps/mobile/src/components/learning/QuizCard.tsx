import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import {
  Brain,
  Timer,
  GraduationCap,
  Play,
  Trophy,
  CheckCircle,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Quiz } from '@/types/learning';
import { UniSwipeable } from '../ui/UniSwipeable';

/*
<vibe_check>
Screen/Component : QuizCard (components/learning/QuizCard.tsx)
Tujuan           : Menampilkan kartu kuis latihan dengan batas waktu, jumlah soal, skor tertinggi, dan CTA Mulai Kuis
Layout strategy  : Header matkul -> Judul Kuis & Deskripsi -> Metrics row (Waktu, Soal, Skor Terbaik) -> Tombol Mulai
Color tokens     : bg.surface, brand.primary, brand.secondary, brand.accent, text.primary
Animation plan   : FadeInRight staggered, spring press
Typography       : SpaceGrotesk_600SemiBold (judul), JetBrainsMono untuk timer & score metrics
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface QuizCardProps {
  quiz: Quiz;
  index?: number;
  onStart: (quiz: Quiz) => void;
  onDelete?: (id: number) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  index = 0,
  onStart,
  onDelete,
}) => {
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);

  const questionsCount = quiz.questions_count ?? quiz.questions?.length ?? 0;
  const timeLimit = quiz.time_limit_minutes ?? 15;

  return (
    <Animated.View entering={FadeInRight.delay(index * 35).duration(220)}>
      <UniSwipeable
        onDelete={onDelete ? () => onDelete(quiz.id) : undefined}
      >
        <View style={styles.card}>
          {/* Top Row: Quiz Badge + Course */}
          <View style={styles.topRow}>
            <View style={styles.quizBadge}>
              <Brain size={14} color={themeColors.brand.secondary} weight="duotone" />
              <Text style={styles.quizBadgeText}>KUIS LATIHAN</Text>
            </View>

            {quiz.course && (
              <View style={styles.courseTag}>
                <GraduationCap size={12} color={themeColors.text.secondary} weight="duotone" />
                <Text style={styles.courseText} numberOfLines={1}>
                  {quiz.course.code || quiz.course.name}
                </Text>
              </View>
            )}
          </View>

          {/* Title & Description */}
          <Text style={styles.title} numberOfLines={1}>
            {quiz.title}
          </Text>

          {quiz.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {quiz.description}
            </Text>
          ) : null}

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Jumlah Soal</Text>
              <Text style={styles.metricValue}>{questionsCount} Butir</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Batas Waktu</Text>
              <View style={styles.timeWrap}>
                <Timer size={13} color={themeColors.text.secondary} weight="bold" />
                <Text style={styles.metricValue}>{timeLimit} Menit</Text>
              </View>
            </View>

            {quiz.highest_score !== undefined && quiz.highest_score !== null && (
              <>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Skor Terbaik</Text>
                  <View style={styles.scoreWrap}>
                    <Trophy size={13} color={themeColors.brand.accent} weight="fill" />
                    <Text style={[styles.metricValue, { color: themeColors.brand.accent }]}>
                      {quiz.highest_score}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Bottom Action */}
          <View style={styles.bottomRow}>
            <Text style={styles.attemptsText}>
              {quiz.attempts_count ? `${quiz.attempts_count}x Dikerjakan` : 'Belum pernah dicoba'}
            </Text>

            <Pressable
              onPress={() => onStart(quiz)}
              disabled={questionsCount === 0}
              style={({ pressed }) => [
                styles.startButton,
                questionsCount === 0 && styles.startButtonDisabled,
                pressed && styles.startButtonPressed,
              ]}
            >
              <Play size={13} color="#FFF" weight="fill" />
              <Text style={styles.startButtonText}>Mulai Kuis</Text>
            </Pressable>
          </View>
        </View>
      </UniSwipeable>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    quizBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.brand.secondary + '14',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.brand.secondary + '30',
    },
    quizBadgeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 9,
      fontWeight: '700',
      color: colors.brand.secondary,
      letterSpacing: 0.5,
    },
    courseTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: radius.sm,
      maxWidth: 160,
    },
    courseText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    title: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 3,
    },
    description: {
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 16,
      marginBottom: spacing.sm,
    },
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginVertical: spacing.xs,
    },
    metricItem: {
      flex: 1,
    },
    metricLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 10,
      color: colors.text.muted,
      marginBottom: 2,
    },
    metricValue: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.primary,
    },
    metricDivider: {
      width: 1,
      height: 22,
      backgroundColor: colors.border.subtle,
      marginHorizontal: spacing.sm,
    },
    timeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    scoreWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    attemptsText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.brand.primary,
    },
    startButtonDisabled: {
      opacity: 0.5,
    },
    startButtonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    startButtonText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
