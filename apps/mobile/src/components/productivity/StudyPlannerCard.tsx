import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Sparkle,
  Clock,
  BookOpen,
  Play,
  Lightbulb,
} from 'phosphor-react-native';
import { StudyPlanItem } from '@/types/productivity';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : StudyPlannerCard (components/productivity/StudyPlannerCard.tsx)
Tujuan           : Menampilkan kartu rekomendasi slot belajar cerdas dari backend tanpa bentrok jadwal kuliah
Layout strategy  : AI badge header -> Time slot row -> Title & Reason -> Start Session button
Color tokens     : bg.surface, bg.elevated, brand.primary, brand.secondary
Animation plan   : FadeInDown 220ms
Typography       : SpaceGrotesk untuk judul, JetBrainsMono untuk jam & durasi
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface StudyPlannerCardProps {
  item: StudyPlanItem;
  onStartSession?: (item: StudyPlanItem) => void;
}

export const StudyPlannerCard: React.FC<StudyPlannerCardProps> = ({
  item,
  onStartSession,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(220)} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.aiBadge}>
          <Sparkle size={12} color={themeColors.brand.primary} weight="fill" />
          <Text style={styles.aiBadgeText}>SARAN BELAJAR</Text>
        </View>

        <View style={styles.timeBadge}>
          <Clock size={12} color={themeColors.text.muted} weight="duotone" />
          <Text style={styles.timeText}>
            {item.start_time} - {item.end_time} ({item.duration_minutes}m)
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      {item.course_name ? (
        <View style={styles.courseRow}>
          <BookOpen size={12} color={themeColors.brand.secondary} weight="duotone" />
          <Text style={styles.courseText} numberOfLines={1}>
            {item.course_name}
          </Text>
        </View>
      ) : null}

      {item.reason ? (
        <View style={styles.reasonBox}>
          <Lightbulb size={12} color={themeColors.brand.accent} weight="duotone" />
          <Text style={styles.reasonText} numberOfLines={2}>
            {item.reason}
          </Text>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={styles.dateLabel}>{formatDate(item.date)}</Text>

        {onStartSession && (
          <Pressable
            onPress={() => onStartSession(item)}
            style={styles.startBtn}
            hitSlop={6}
          >
            <Play size={12} color="#FFFFFF" weight="fill" />
            <Text style={styles.startBtnText}>Mulai Fokus</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.sm,
      ...shadows.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(107, 127, 215, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: 'rgba(107, 127, 215, 0.3)',
    },
    aiBadgeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    title: {
      fontFamily: typography.body.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 20,
      marginBottom: 3,
    },
    courseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    courseText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.brand.secondary,
    },
    reasonBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.bg.elevated,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: radius.sm,
      marginTop: 2,
      marginBottom: spacing.xs,
    },
    reasonText: {
      ...typography.bodySmall,
      fontSize: 11,
      color: colors.text.secondary,
      flex: 1,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    dateLabel: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    startBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.brand.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    startBtnText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
