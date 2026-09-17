import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Fire,
  CalendarCheck,
  Clock,
  ChartBar,
} from 'phosphor-react-native';
import { StudySessionSummary } from '@/types/productivity';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : StudySessionSummaryCard (components/productivity/StudySessionSummaryCard.tsx)
Tujuan           : Menampilkan visualisasi ringkasan waktu belajar mahasiswa (hari ini, minggu ini, per matkul)
Layout strategy  : 3-column stats metrics -> horizontal distribution bars per mata kuliah
Color tokens     : bg.surface, bg.elevated, brand.primary, brand.secondary, brand.accent
Animation plan   : FadeInDown 260ms
Typography       : Syne_700Bold display, JetBrainsMono untuk durasi jam/menit
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface StudySessionSummaryCardProps {
  summary: StudySessionSummary;
}

export const StudySessionSummaryCard: React.FC<StudySessionSummaryCardProps> = ({ summary }) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const formatHoursMins = (totalMinutes: number) => {
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}j ${mins}m` : `${hours}j`;
  };

  return (
    <Animated.View entering={FadeInDown.duration(260)} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Fire size={18} color={themeColors.brand.accent} weight="duotone" />
          <Text style={styles.cardTitle}>Statistik Fokus Belajar</Text>
        </View>
        <Text style={styles.totalSessionsText}>
          {summary.total_sessions} Sesi Selesai
        </Text>
      </View>

      {/* 3-Column Metrics Bento */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>HARI INI</Text>
          <Text style={[styles.metricValue, { color: themeColors.brand.primary }]}>
            {formatHoursMins(summary.today_minutes)}
          </Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>MINGGU INI</Text>
          <Text style={[styles.metricValue, { color: themeColors.brand.secondary }]}>
            {formatHoursMins(summary.week_minutes)}
          </Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>RATA-RATA</Text>
          <Text style={[styles.metricValue, { color: themeColors.brand.accent }]}>
            {summary.total_sessions > 0
              ? formatHoursMins(Math.round(summary.week_minutes / Math.max(summary.total_sessions, 1)))
              : '0m'}
          </Text>
        </View>
      </View>

      {/* By Course Distribution if available */}
      {summary.by_course && summary.by_course.length > 0 ? (
        <View style={styles.byCourseContainer}>
          <View style={styles.byCourseHeader}>
            <ChartBar size={13} color={themeColors.text.muted} weight="duotone" />
            <Text style={styles.byCourseLabel}>Fokus Per Mata Kuliah:</Text>
          </View>
          <View style={styles.byCourseList}>
            {summary.by_course.map((item, idx) => (
              <View key={idx} style={styles.byCourseItem}>
                <Text style={styles.courseName} numberOfLines={1}>
                  {item.course_name}
                </Text>
                <Text style={styles.courseDuration}>
                  {formatHoursMins(item.minutes)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.md,
      ...shadows.card,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    titleWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    cardTitle: {
      ...typography.h3,
      fontSize: 15,
      color: colors.text.primary,
    },
    totalSessionsText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    metricBox: {
      flex: 1,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    metricLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 9,
      color: colors.text.muted,
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    metricValue: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 18,
      fontWeight: '700',
    },
    byCourseContainer: {
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    byCourseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: spacing.xs,
    },
    byCourseLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 10,
      color: colors.text.muted,
    },
    byCourseList: {
      gap: 4,
    },
    byCourseItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 2,
    },
    courseName: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      flex: 1,
      marginRight: spacing.sm,
    },
    courseDuration: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
      fontWeight: '600',
    },
  });
