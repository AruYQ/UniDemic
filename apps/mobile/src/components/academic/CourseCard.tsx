import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight, Easing } from 'react-native-reanimated';
import {
  BookOpen,
  CalendarCheck,
  CheckSquareOffset,
  GraduationCap,
  MapPin,
  Trash,
  User,
} from 'phosphor-react-native';
import { colors, radius, spacing, typography, shadows } from '@/constants/tokens';
import { Course } from '@/types/academic';
import { UniBadge } from '../ui/UniBadge';

/*
<vibe_check>
Screen/Component : CourseCard (components/academic/CourseCard.tsx)
Tujuan           : Menampilkan informasi ringkas mata kuliah yang diambil mahasiswa pada semester aktif
Layout strategy  : Bento card: Header (Kode MK + SKS badge), Nama MK prominent, metadata dosen/ruang, footer jumlah jadwal & tugas
Color tokens     : bg.surface (#171B26), border.subtle (#252A3D), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : FadeInRight staggered
Typography       : SpaceGrotesk_600SemiBold (nama MK), JetBrainsMono_400Regular (kode & SKS)
Anti-slop check  : Rule #5 (Offset shadow), Rule #10 (JetBrains Mono untuk SKS & Kode)
</vibe_check>
*/

interface CourseCardProps {
  course: Course;
  index?: number;
  onPress?: () => void;
  onDelete?: (id: number) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  index = 0,
  onPress,
  onDelete,
}) => {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50)
        .duration(240)
        .easing(Easing.out(Easing.cubic))}
      style={styles.container}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        {/* Header: Code & Credits */}
        <View style={styles.header}>
          <View style={styles.codeRow}>
            <BookOpen size={16} color={colors.brand.primary} weight="duotone" />
            <Text style={styles.courseCode}>{course.code || 'MK'}</Text>
          </View>
          <View style={styles.badgeRow}>
            <UniBadge
              label={`${course.credits} SKS`}
              variant="neutral"
              size="sm"
            />
            {onDelete && (
              <Pressable
                onPress={() => onDelete(course.id)}
                hitSlop={8}
                style={styles.deleteBtn}
              >
                <Trash size={15} color={colors.text.muted} weight="duotone" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.courseName} numberOfLines={2}>
          {course.name}
        </Text>

        {/* Lecturer & Classroom */}
        <View style={styles.metaContainer}>
          {course.lecturer ? (
            <View style={styles.metaItem}>
              <User size={13} color={colors.text.muted} weight="duotone" />
              <Text style={styles.metaText} numberOfLines={1}>
                {course.lecturer}
              </Text>
            </View>
          ) : null}

          {course.classroom ? (
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.brand.secondary} weight="duotone" />
              <Text style={styles.metaText}>{course.classroom}</Text>
            </View>
          ) : null}
        </View>

        {/* Footer: Schedules & Assignments counts */}
        <View style={styles.footer}>
          <View style={styles.statItem}>
            <CalendarCheck size={13} color={colors.brand.primary} weight="duotone" />
            <Text style={styles.statText}>
              {course.schedules_count ?? (course.schedules?.length || 0)} Jadwal
            </Text>
          </View>

          <View style={styles.statItem}>
            <CheckSquareOffset size={13} color={colors.brand.secondary} weight="duotone" />
            <Text style={styles.statText}>
              {course.assignments_count ?? (course.assignments?.length || 0)} Tugas
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseCode: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 12,
    color: colors.brand.primary,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteBtn: {
    padding: 2,
  },
  courseName: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 17,
    color: colors.text.primary,
    lineHeight: 23,
    marginBottom: spacing.sm,
  },
  metaContainer: {
    gap: 4,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 11,
    color: colors.text.muted,
  },
});
