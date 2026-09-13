import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CheckCircle,
  WarningCircle,
  ShieldCheck,
  CalendarCheck,
  ProhibitInset,
  Heartbeat,
  FileText,
} from 'phosphor-react-native';
import { AttendanceSummary } from '@/types/tracking';
import { UniBadge } from '@/components/ui/UniBadge';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : AttendanceSummaryCard (components/tracking/AttendanceSummaryCard.tsx)
Tujuan           : Menampilkan visualisasi ringkasan presensi mata kuliah, persentase kehadiran, sisa jatah alpa, dan peringatan kritis
Layout strategy  : Bento card elevated dengan circular/bar progress, stat pills 4 kolom responsif, dan warning callout banner
Color tokens     : bg.surface, semantic.success (#4ECDC4), semantic.warning (#F7B731), semantic.danger (#E05B5B), brand.primary (#6B7FD7)
Animation plan   : FadeInDown duration 300ms cubic easing
Typography       : Syne_700Bold untuk persentase, JetBrainsMono untuk angka stat, SpaceGrotesk untuk label & warning text
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #3 (no pure black/white), Rule #4 (dynamic theme), Rule #10 (typography)
</vibe_check>
*/

interface AttendanceSummaryCardProps {
  summary: AttendanceSummary;
}

export const AttendanceSummaryCard: React.FC<AttendanceSummaryCardProps> = ({ summary }) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const percentage = Math.round(summary.attendance_percentage);
  const isCritical = summary.warning || percentage < 75;
  const isSafe = percentage >= 80;

  const statusColor = isCritical
    ? themeColors.semantic.danger
    : isSafe
    ? themeColors.semantic.success
    : themeColors.semantic.warning;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={styles.card}
    >
      {/* Top Row: Title & Status Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <CalendarCheck size={20} color={themeColors.brand.primary} weight="duotone" />
          <Text style={styles.cardTitle}>Ringkasan Kehadiran</Text>
        </View>
        <UniBadge
          label={isCritical ? 'PERINGATAN' : isSafe ? 'AMAN' : 'WASPADA'}
          variant={isCritical ? 'danger' : isSafe ? 'success' : 'warning'}
          size="sm"
        />
      </View>

      {/* Main Metric Hero */}
      <View style={styles.metricContainer}>
        <View style={styles.percentageRow}>
          <Text style={[styles.percentageNumber, { color: statusColor }]}>
            {percentage}%
          </Text>
          <View style={styles.percentageMeta}>
            <Text style={styles.metaLabel}>Tingkat Kehadiran</Text>
            <Text style={styles.metaSubtitle}>
              Min. {Math.round(summary.minimum_percentage)}% untuk ikut ujian
            </Text>
          </View>
        </View>

        {/* Visual Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Stats 4-Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <CheckCircle size={14} color={themeColors.semantic.success} weight="duotone" />
            <Text style={styles.statLabel}>Hadir</Text>
          </View>
          <Text style={[styles.statValue, { color: themeColors.semantic.success }]}>
            {summary.present_count}
          </Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <FileText size={14} color={themeColors.brand.primary} weight="duotone" />
            <Text style={styles.statLabel}>Izin</Text>
          </View>
          <Text style={[styles.statValue, { color: themeColors.brand.primary }]}>
            {summary.permission_count}
          </Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <Heartbeat size={14} color={themeColors.brand.accent} weight="duotone" />
            <Text style={styles.statLabel}>Sakit</Text>
          </View>
          <Text style={[styles.statValue, { color: themeColors.brand.accent }]}>
            {summary.total_classes - summary.present_count - summary.permission_count - summary.absent_count > 0
              ? summary.total_classes - summary.present_count - summary.permission_count - summary.absent_count
              : 0}
          </Text>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconRow}>
            <ProhibitInset size={14} color={themeColors.semantic.danger} weight="duotone" />
            <Text style={styles.statLabel}>Alpa</Text>
          </View>
          <Text style={[styles.statValue, { color: themeColors.semantic.danger }]}>
            {summary.absent_count}
          </Text>
        </View>
      </View>

      {/* Safe Absences Remaining Callout */}
      <View style={[styles.safeAllowanceBox, isCritical && styles.safeAllowanceBoxCritical]}>
        {isCritical ? (
          <WarningCircle size={18} color={themeColors.semantic.danger} weight="fill" />
        ) : (
          <ShieldCheck size={18} color={themeColors.brand.secondary} weight="duotone" />
        )}
        <Text style={[styles.safeAllowanceText, isCritical && styles.safeAllowanceTextCritical]}>
          {summary.remaining_safe_absences > 0
            ? `Sisa toleransi tidak hadir aman: ${summary.remaining_safe_absences} pertemuan lagi.`
            : summary.remaining_safe_absences === 0
            ? 'Batas alpa habis! Ketidakhadiran berikutnya menggugurkan syarat ujian.'
            : `Melebihi batas absen (${Math.abs(summary.remaining_safe_absences)}x alpa over limit)!`}
        </Text>
      </View>
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
      ...shadows.card,
      marginBottom: spacing.lg,
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
      gap: spacing.sm,
    },
    cardTitle: {
      ...typography.h3,
      color: colors.text.primary,
    },
    metricContainer: {
      marginBottom: spacing.lg,
    },
    percentageRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    percentageNumber: {
      fontFamily: 'Syne_700Bold',
      fontSize: 38,
      letterSpacing: -1,
      lineHeight: 44,
    },
    percentageMeta: {
      flex: 1,
    },
    metaLabel: {
      ...typography.label,
      color: colors.text.secondary,
      textTransform: 'uppercase',
    },
    metaSubtitle: {
      ...typography.bodySmall,
      color: colors.text.muted,
      marginTop: 2,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    statIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginBottom: 2,
    },
    statLabel: {
      ...typography.label,
      fontSize: 10,
      color: colors.text.muted,
    },
    statValue: {
      ...typography.mono,
      fontSize: 16,
      fontWeight: '700',
    },
    safeAllowanceBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    safeAllowanceBoxCritical: {
      backgroundColor: 'rgba(224, 91, 91, 0.12)',
      borderColor: 'rgba(224, 91, 91, 0.35)',
    },
    safeAllowanceText: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      flex: 1,
    },
    safeAllowanceTextCritical: {
      color: colors.semantic.danger,
      fontWeight: '600',
    },
  });
