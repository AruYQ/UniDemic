import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight, Easing } from 'react-native-reanimated';
import { Clock, MapPin, User, Trash } from 'phosphor-react-native';
import { colors, radius, spacing, typography, shadows } from '@/constants/tokens';
import { CourseSchedule } from '@/types/academic';

/*
<vibe_check>
Screen/Component : ScheduleCard (components/academic/ScheduleCard.tsx)
Tujuan           : Menampilkan slot jadwal kuliah harian dengan kejelasan jam, ruang kuliah, dan nama dosen
Layout strategy  : Left column time block mono + Right content mata kuliah & chips metadata
Color tokens     : bg.surface (#171B26), border.subtle (#252A3D), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : FadeInRight staggered berdurasi 240ms
Typography       : JetBrainsMono_400Regular (jam & ruang), SpaceGrotesk_600SemiBold (nama matkul)
Anti-slop check  : Rule #5 (Offset shadow), Rule #10 (Mono + Space Grotesk), Rule #20 (Indigo-slate)
</vibe_check>
*/

interface ScheduleCardProps {
  schedule: CourseSchedule;
  index?: number;
  onDelete?: (id: number) => void;
  onPress?: () => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  index = 0,
  onDelete,
  onPress,
}) => {
  const courseName = schedule.course?.name || 'Mata Kuliah';
  const courseCode = schedule.course?.code || 'KULIAH';
  const lecturer = schedule.course?.lecturer || 'Dosen Pengampu';
  const room = schedule.room || schedule.course?.classroom || 'TBA';

  const formatTime = (timeStr: string) => {
    // Trim seconds if present e.g. "08:00:00" -> "08:00"
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50)
        .duration(240)
        .easing(Easing.out(Easing.cubic))}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        {/* Time Column */}
        <View style={styles.timeColumn}>
          <Text style={styles.startTime}>{formatTime(schedule.start_time)}</Text>
          <View style={styles.timeLine} />
          <Text style={styles.endTime}>{formatTime(schedule.end_time)}</Text>
        </View>

        {/* Info Column */}
        <View style={styles.infoColumn}>
          <View style={styles.headerRow}>
            <Text style={styles.courseCode}>{courseCode}</Text>
            {onDelete && (
              <Pressable
                onPress={() => onDelete(schedule.id)}
                hitSlop={8}
                style={styles.deleteBtn}
              >
                <Trash size={16} color={colors.text.muted} weight="duotone" />
              </Pressable>
            )}
          </View>

          <Text style={styles.courseName} numberOfLines={2}>
            {courseName}
          </Text>

          {/* Metadata Chips */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <MapPin size={12} color={colors.brand.secondary} weight="duotone" />
              <Text style={styles.chipText}>{room}</Text>
            </View>

            {lecturer && (
              <View style={styles.chip}>
                <User size={12} color={colors.text.secondary} weight="duotone" />
                <Text style={styles.chipText} numberOfLines={1}>
                  {lecturer}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  timeColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border.subtle,
    minWidth: 70,
  },
  startTime: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 14,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  timeLine: {
    width: 2,
    height: 12,
    backgroundColor: colors.border.default,
    marginVertical: 3,
    borderRadius: radius.full,
  },
  endTime: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 12,
    color: colors.text.muted,
  },
  infoColumn: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  courseCode: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 11,
    color: colors.brand.secondary,
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 2,
  },
  courseName: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg.overlay,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  chipText: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 11,
    color: colors.text.secondary,
  },
});
