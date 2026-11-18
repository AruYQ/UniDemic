import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Kanban,
  FlagCheckered,
  GitBranch,
  CalendarBlank,
  ArrowRight,
  UsersThree,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniBadge } from '@/components/ui/UniBadge';
import { Project, ProjectStatus } from '@/types/collaboration';

/*
<vibe_check>
Screen/Component : ProjectCard (components/collaboration/ProjectCard.tsx)
Tujuan           : Menampilkan ringkasan workspace proyek tim mahasiswa termasuk status, tenggat, jumlah task Kanban, milestone, dan repo GitHub
Layout strategy  : Header badges (status + GitHub chip) -> Title & description -> Study Group/Course tag -> Metrics footer
Color tokens     : bg.surface, bg.overlay, brand.primary, brand.secondary, brand.accent, border.subtle
Animation plan   : FadeInRight staggered + withSpring(0.97) press feedback
Typography       : SpaceGrotesk untuk judul & metadata, JetBrainsMono untuk angka count & tanggal due
Anti-slop check  : Rule #2 (Phosphor Duotone), Rule #7 (UniBadge bukan emoji), Rule #28 (spring 0.97)
</vibe_check>
*/

export interface ProjectCardProps {
  project: Project;
  index?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STATUS_MAP: Record<ProjectStatus, { label: string; variant: 'primary' | 'success' | 'warning' | 'neutral' }> = {
  active: { label: 'AKTIF', variant: 'primary' },
  planning: { label: 'RENCANA', variant: 'warning' },
  completed: { label: 'SELESAI', variant: 'success' },
  archived: { label: 'ARSIP', variant: 'neutral' },
};

export const ProjectCard: React.FC<ProjectCardProps> = React.memo(({ project, index = 0, onPress }) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusMeta = STATUS_MAP[project.status] || STATUS_MAP.active;

  return (
    <Animated.View entering={FadeInRight.delay(Math.min(index * 55, 300)).duration(240)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }}
        style={[styles.card, animatedStyle]}
      >
        <View style={styles.topRow}>
          <View style={styles.badgeGroup}>
            <UniBadge label={statusMeta.label} variant={statusMeta.variant} size="sm" />
            {project.study_group ? (
              <View style={styles.contextPill}>
                <UsersThree size={12} color={themeColors.brand.secondary} weight="duotone" />
                <Text style={styles.contextText} numberOfLines={1}>
                  {project.study_group.name}
                </Text>
              </View>
            ) : project.course ? (
              <View style={styles.contextPill}>
                <Text style={styles.contextText}>{project.course.code}</Text>
              </View>
            ) : null}
          </View>

          {project.github_repo ? (
            <View style={styles.githubChip}>
              <GitBranch size={12} color={themeColors.text.primary} weight="duotone" />
              <Text style={styles.githubText} numberOfLines={1}>
                {project.github_repo.repo_name}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {project.name}
        </Text>

        {project.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {project.description}
          </Text>
        ) : null}

        <View style={styles.footerRow}>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Kanban size={14} color={themeColors.brand.primary} weight="duotone" />
              <Text style={styles.metricText}>{project.tasks_count ?? 0} Task</Text>
            </View>
            <View style={styles.metricItem}>
              <FlagCheckered size={14} color={themeColors.brand.secondary} weight="duotone" />
              <Text style={styles.metricText}>{project.milestones_count ?? 0} Milestone</Text>
            </View>
            {project.due_date ? (
              <View style={styles.metricItem}>
                <CalendarBlank size={14} color={themeColors.brand.accent} weight="duotone" />
                <Text style={styles.metricText}>{project.due_date}</Text>
              </View>
            ) : null}
          </View>

          <ArrowRight size={16} color={themeColors.text.muted} weight="bold" />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
});

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      gap: spacing.sm,
      ...shadows.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    badgeGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      flexWrap: 'wrap',
    },
    contextPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
      maxWidth: 150,
    },
    contextText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    githubChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
      maxWidth: 110,
    },
    githubText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.primary,
    },
    title: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 17,
      color: colors.text.primary,
      lineHeight: 23,
    },
    description: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      lineHeight: 19,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flexWrap: 'wrap',
      flex: 1,
    },
    metricItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metricText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
  });
