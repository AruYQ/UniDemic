import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight, Easing } from 'react-native-reanimated';
import {
  CalendarDots,
  Clock,
  MapPin,
  Books,
  Trash,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Exam } from '@/types/academic';
import { UniBadge } from '../ui/UniBadge';

/*
<vibe_check>
Screen/Component : ExamCard (components/academic/ExamCard.tsx)
Tujuan           : Menampilkan jadwal dan persiapan ujian mahasiswa (UTS, UAS, Quiz) lengkap dengan tanggal, ruangan, dan topik
Layout strategy  : Top row badge tipe ujian + tombol hapus, nama mata kuliah besar, grid waktu & lokasi, expandable topik
Color tokens     : bg.surface (#171B26), brand.accent (#F7B731), brand.primary (#6B7FD7), border.subtle (#252A3D)
Animation plan   : FadeInRight staggered
Typography       : SpaceGrotesk_600SemiBold untuk judul matkul, JetBrainsMono_400Regular untuk tanggal & jam
Anti-slop check  : Rule #7 (Badge geometris), Rule #10 (Space Grotesk + JetBrains Mono)
</vibe_check>
*/

interface ExamCardProps {
  exam: Exam;
  index?: number;
  onDelete?: (id: number) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  index = 0,
  onDelete,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]} WIB`;
  };

  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const target = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'SELESAI', variant: 'neutral' as const };
    }
    if (diffDays === 0) {
      return { label: 'HARI INI', variant: 'danger' as const };
    }
    if (diffDays === 1) {
      return { label: 'BESOK (H-1)', variant: 'danger' as const };
    }
    if (diffDays <= 7) {
      return { label: `H-${diffDays} HARI`, variant: 'warning' as const };
    }
    return { label: `H-${diffDays} HARI`, variant: 'primary' as const };
  };

  const countdown = getDaysRemaining(exam.date);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50)
        .duration(240)
        .easing(Easing.out(Easing.cubic))}
      style={styles.container}
    >
      <View style={styles.card}>
        {/* Header: Exam Type & Course */}
        <View style={styles.header}>
          <View style={styles.badgeGroup}>
            <UniBadge
              label={exam.type.toUpperCase()}
              variant="warning"
              size="sm"
            />
            {countdown && (
              <UniBadge
                label={countdown.label}
                variant={countdown.variant}
                size="sm"
              />
            )}
          </View>
          {onDelete && (
            <Pressable
              onPress={() => onDelete(exam.id)}
              hitSlop={8}
              style={styles.deleteBtn}
            >
              <Trash size={15} color={themeColors.text.muted} weight="duotone" />
            </Pressable>
          )}
        </View>

        <Text style={styles.courseName} numberOfLines={2}>
          {exam.course?.name || 'Mata Kuliah'}
        </Text>

        {/* Date & Time Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <CalendarDots size={14} color={themeColors.brand.accent} weight="duotone" />
            <Text style={styles.infoText}>{formatDate(exam.date)}</Text>
          </View>

          {exam.time && (
            <View style={styles.infoItem}>
              <Clock size={14} color={themeColors.brand.primary} weight="duotone" />
              <Text style={styles.infoText}>{formatTime(exam.time)}</Text>
            </View>
          )}
        </View>

        {/* Location / Room */}
        {exam.location ? (
          <View style={styles.locationItem}>
            <MapPin size={14} color={themeColors.brand.secondary} weight="duotone" />
            <Text style={styles.locationText}>Ruang / Lokasi: {exam.location}</Text>
          </View>
        ) : null}

        {/* Topics / Syllabus */}
        {exam.topics ? (
          <View style={styles.topicsBox}>
            <View style={styles.topicsHeader}>
              <Books size={13} color={themeColors.text.muted} weight="duotone" />
              <Text style={styles.topicsTitle}>Materi / Kisi-kisi:</Text>
            </View>
            <Text style={styles.topicsContent}>{exam.topics}</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    badgeGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    deleteBtn: {
      padding: 2,
    },
    courseName: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 17,
      color: colors.text.primary,
      marginBottom: spacing.md,
      lineHeight: 22,
    },
    infoRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
      marginBottom: spacing.sm,
    },
    locationText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.brand.secondary,
    },
    topicsBox: {
      backgroundColor: colors.bg.overlay,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginTop: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    topicsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 2,
    },
    topicsTitle: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    topicsContent: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.primary,
      lineHeight: 16,
    },
  });
