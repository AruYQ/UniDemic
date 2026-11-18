import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import {
  Cards,
  GraduationCap,
  Play,
  Gear,
  CheckCircle,
  ClockCountdown,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { FlashcardDeck } from '@/types/learning';
import { UniSwipeable } from '../ui/UniSwipeable';

/*
<vibe_check>
Screen/Component : FlashcardDeckCard (components/learning/FlashcardDeckCard.tsx)
Tujuan           : Menampilkan kartu dek flashcard dengan counter kartu jatuh tempo (due cards), CTA Mulai Review, dan Kelola Kartu
Layout strategy  : Header matkul -> Nama Dek & Deskripsi -> Metrics count (Total vs Perlu Review) -> Action Buttons
Color tokens     : bg.surface, brand.primary, brand.accent, semantic.success, text.primary
Animation plan   : FadeInRight staggered, spring press
Typography       : SpaceGrotesk_600SemiBold (judul), JetBrainsMono untuk numeric counters
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface FlashcardDeckCardProps {
  deck: FlashcardDeck;
  index?: number;
  onStartStudy: (deck: FlashcardDeck) => void;
  onManageCards: (deck: FlashcardDeck) => void;
  onDelete?: (id: number) => void;
}

export const FlashcardDeckCard: React.FC<FlashcardDeckCardProps> = ({
  deck,
  index = 0,
  onStartStudy,
  onManageCards,
  onDelete,
}) => {
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);

  const dueCount = deck.due_cards_count ?? 0;
  const totalCards = deck.cards_count ?? 0;

  return (
    <Animated.View entering={FadeInRight.delay(index * 35).duration(220)}>
      <UniSwipeable
        onDelete={onDelete ? () => onDelete(deck.id) : undefined}
      >
        <View style={styles.card}>
          {/* Top Row: Course Tag */}
          <View style={styles.topRow}>
            <View style={styles.deckBadge}>
              <Cards size={14} color={themeColors.brand.primary} weight="duotone" />
              <Text style={styles.deckBadgeText}>DEK KARTU</Text>
            </View>

            {deck.course && (
              <View style={styles.courseTag}>
                <GraduationCap size={12} color={themeColors.text.secondary} weight="duotone" />
                <Text style={styles.courseText} numberOfLines={1}>
                  {deck.course.code || deck.course.name}
                </Text>
              </View>
            )}
          </View>

          {/* Title & Description */}
          <Text style={styles.title} numberOfLines={1}>
            {deck.name}
          </Text>

          {deck.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {deck.description}
            </Text>
          ) : null}

          {/* Middle Row: Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Kartu</Text>
              <Text style={styles.metricValue}>{totalCards}</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Perlu Review (SM-2)</Text>
              <View style={styles.dueWrap}>
                <ClockCountdown
                  size={14}
                  color={dueCount > 0 ? themeColors.brand.accent : themeColors.semantic.success}
                  weight="bold"
                />
                <Text
                  style={[
                    styles.dueValue,
                    { color: dueCount > 0 ? themeColors.brand.accent : themeColors.semantic.success },
                  ]}
                >
                  {dueCount > 0 ? `${dueCount} Kartu` : 'Semua Beres!'}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Actions Row */}
          <View style={styles.bottomActions}>
            <Pressable
              onPress={() => onManageCards(deck)}
              style={({ pressed }) => [styles.manageButton, pressed && styles.actionPressed]}
            >
              <Gear size={14} color={themeColors.text.secondary} weight="duotone" />
              <Text style={styles.manageButtonText}>Kelola Kartu</Text>
            </Pressable>

            <Pressable
              onPress={() => onStartStudy(deck)}
              disabled={totalCards === 0}
              style={({ pressed }) => [
                styles.studyButton,
                totalCards === 0 && styles.studyButtonDisabled,
                pressed && styles.actionPressed,
              ]}
            >
              <Play size={13} color="#FFF" weight="fill" />
              <Text style={styles.studyButtonText}>
                {dueCount > 0 ? `Review (${dueCount})` : 'Latihan Bebas'}
              </Text>
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
    deckBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.brand.primary + '14',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.brand.primary + '30',
    },
    deckBadgeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 9,
      fontWeight: '700',
      color: colors.brand.primary,
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
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
    },
    metricDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border.subtle,
      marginHorizontal: spacing.sm,
    },
    dueWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dueValue: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 13,
      fontWeight: '700',
    },
    bottomActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    manageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    manageButtonText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    studyButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.brand.primary,
    },
    studyButtonDisabled: {
      opacity: 0.5,
    },
    studyButtonText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    actionPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
  });
