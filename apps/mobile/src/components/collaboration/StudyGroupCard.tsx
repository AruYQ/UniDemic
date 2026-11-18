import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  UsersThree,
  FolderSimple,
  GlobeHemisphereWest,
  LockKey,
  Key,
  ArrowRight,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniBadge } from '@/components/ui/UniBadge';
import { StudyGroup } from '@/types/collaboration';

/*
<vibe_check>
Screen/Component : StudyGroupCard (components/collaboration/StudyGroupCard.tsx)
Tujuan           : Menampilkan ringkasan grup belajar mahasiswa dengan kode undangan, jumlah anggota, proyek aktif, dan status akses
Layout strategy  : Surface card dengan top badge row -> title & deskripsi -> bottom metadata pills (members, projects, invite code)
Color tokens     : bg.surface, bg.overlay, brand.primary, brand.secondary, border.subtle
Animation plan   : FadeInRight staggered per index + withSpring(0.97) press-down tactile feedback
Typography       : SpaceGrotesk_600SemiBold title, SpaceGrotesk_400Regular body, JetBrainsMono angka & kode undangan
Anti-slop check  : Rule #2 (Phosphor Duotone), Rule #7 (UniBadge bukan emoji), Rule #19 (variasi radius), Rule #28 (spring 0.97)
</vibe_check>
*/

export interface StudyGroupCardProps {
  group: StudyGroup;
  index?: number;
  isMember?: boolean;
  onPress: () => void;
  onJoinPublic?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const StudyGroupCard: React.FC<StudyGroupCardProps> = React.memo(
  ({ group, index = 0, isMember = true, onPress, onJoinPublic }) => {
    const { colors: themeColors, shadows: themeShadows } = useUniTheme();
    const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

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
            <View style={styles.badgesRow}>
              <UniBadge
                label={group.subject || group.course?.code || 'UMUM'}
                variant="primary"
                size="sm"
              />
              <View style={styles.visibilityPill}>
                {group.is_public ? (
                  <GlobeHemisphereWest size={12} color={themeColors.brand.secondary} weight="duotone" />
                ) : (
                  <LockKey size={12} color={themeColors.text.secondary} weight="duotone" />
                )}
                <Text style={styles.visibilityText}>
                  {group.is_public ? 'Publik' : 'Privat'}
                </Text>
              </View>
            </View>

            {isMember ? (
              <View style={styles.inviteChip}>
                <Key size={12} color={themeColors.brand.accent} weight="duotone" />
                <Text style={styles.inviteCode}>{group.invite_code}</Text>
              </View>
            ) : onJoinPublic ? (
              <Pressable onPress={onJoinPublic} style={styles.joinPill} hitSlop={8}>
                <Text style={styles.joinPillText}>Gabung</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {group.name}
          </Text>

          {group.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {group.description}
            </Text>
          ) : null}

          <View style={styles.footerRow}>
            <View style={styles.metricsRow}>
              <View style={styles.metricPill}>
                <UsersThree size={14} color={themeColors.brand.primary} weight="duotone" />
                <Text style={styles.metricText}>
                  {group.members_count ?? group.members?.length ?? 1}
                  {group.max_members ? `/${group.max_members}` : ''} Anggota
                </Text>
              </View>

              <View style={styles.metricPill}>
                <FolderSimple size={14} color={themeColors.brand.secondary} weight="duotone" />
                <Text style={styles.metricText}>
                  {group.projects_count ?? 0} Proyek
                </Text>
              </View>
            </View>

            <ArrowRight size={16} color={themeColors.text.muted} weight="bold" />
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  }
);

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
    badgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    visibilityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    visibilityText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    inviteChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    inviteCode: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.brand.accent,
      fontWeight: '600',
    },
    joinPill: {
      backgroundColor: colors.brand.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      minHeight: 30,
      justifyContent: 'center',
    },
    joinPillText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.inverse,
      fontWeight: '600',
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
    },
    metricPill: {
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
