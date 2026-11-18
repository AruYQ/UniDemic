import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {
  X,
  Cards,
  ArrowClockwise,
  CheckCircle,
  Sparkle,
  SmileySad,
  SmileyMeh,
  SmileyNervous,
  SmileyWink,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { FlashcardDeck, Flashcard } from '@/types/learning';
import { formatApiError } from '@/lib/api';
import { UniButton } from '../ui/UniButton';

/*
<vibe_check>
Screen/Component : FlashcardStudyModal (components/learning/FlashcardStudyModal.tsx)
Tujuan           : Mode belajar imersif Spaced Repetition (SuperMemo SM-2) dengan animasi flip 3D kartu & 4 tombol rating
Layout strategy  : Header (Deck Title & Close) -> Progress indicator -> Flippable 3D Card -> Rating Buttons (Again/Hard/Good/Easy)
Color tokens     : bg.base, bg.surface, brand.primary, semantic.danger, semantic.warning, semantic.success, semantic.info
Animation plan   : 3D Y-axis rotation flip via Reanimated withSpring, tactile button springs
Typography       : SpaceGrotesk untuk pertanyaan/jawaban, JetBrainsMono untuk step counter & rating label
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #28 (spring feedback)
</vibe_check>
*/

interface FlashcardStudyModalProps {
  visible: boolean;
  deck: FlashcardDeck | null;
  cards: Flashcard[];
  onClose: () => void;
  onSubmitReview: (cardId: number, rating: number) => Promise<void>;
}

export const FlashcardStudyModal: React.FC<FlashcardStudyModalProps> = ({
  visible,
  deck,
  cards,
  onClose,
  onSubmitReview,
}) => {
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3D rotation shared value: 0 -> 180
  const rotateAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsCompleted(false);
      rotateAnim.value = 0;
    }
  }, [visible, cards]);

  const handleFlip = () => {
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    rotateAnim.value = withSpring(nextFlipped ? 180 : 0, {
      damping: 15,
      stiffness: 120,
    });
  };

  const handleRating = async (rating: number) => {
    if (isSubmitting) return;
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    setIsSubmitting(true);
    try {
      await onSubmitReview(currentCard.id, rating);
      if (currentIndex + 1 >= cards.length) {
        setIsCompleted(true);
      } else {
        // Next card
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        rotateAnim.value = 0;
      }
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Terjadi kesalahan saat menyimpan review.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Front card animated style
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotateAnim.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      zIndex: rotateAnim.value >= 90 ? 0 : 1,
      opacity: rotateAnim.value >= 90 ? 0 : 1,
    };
  });

  // Back card animated style
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotateAnim.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      zIndex: rotateAnim.value >= 90 ? 1 : 0,
      opacity: rotateAnim.value >= 90 ? 1 : 0,
    };
  });

  const currentCard = cards[currentIndex];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Cards size={18} color={themeColors.brand.primary} weight="duotone" />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {deck?.name || 'Latihan Flashcard'}
            </Text>
          </View>

          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
            <X size={20} color={themeColors.text.primary} weight="bold" />
          </Pressable>
        </View>

        {isCompleted ? (
          /* Finished State */
          <View style={styles.completedContainer}>
            <View style={styles.trophyCircle}>
              <Sparkle size={42} color={themeColors.brand.accent} weight="fill" />
            </View>
            <Text style={styles.completedTitle}>Sesi Review Selesai! 🎉</Text>
            <Text style={styles.completedSubtitle}>
              Hebat! Anda telah me-review {cards.length} kartu dengan algoritma Spaced Repetition SuperMemo SM-2.
            </Text>
            <View style={styles.completedButtonWrap}>
              <UniButton label="Selesai & Kembali" onPress={onClose} />
            </View>
          </View>
        ) : cards.length === 0 ? (
          /* Empty Deck State */
          <View style={styles.completedContainer}>
            <Text style={styles.completedTitle}>Tidak Ada Kartu yang Perlu Di-Review</Text>
            <Text style={styles.completedSubtitle}>
              Semua kartu pada dek ini sudah Anda kuasai dengan baik untuk siklus saat ini.
            </Text>
            <View style={styles.completedButtonWrap}>
              <UniButton label="Kembali" variant="secondary" onPress={onClose} />
            </View>
          </View>
        ) : (
          /* Active Study Session */
          <View style={styles.studyContent}>
            {/* Progress Bar & Counter */}
            <View style={styles.progressRow}>
              <Text style={styles.progressCounter}>
                KARTU {currentIndex + 1} DARI {cards.length}
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(((currentIndex + 1) / cards.length) * 100)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Flippable 3D Card Area */}
            <Pressable onPress={handleFlip} style={styles.cardArea}>
              {/* FRONT (Pertanyaan) */}
              <Animated.View style={[styles.cardSurface, styles.cardFront, frontAnimatedStyle]}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>PERTANYAAN</Text>
                </View>
                <Text style={styles.cardQuestionText}>
                  {currentCard?.question}
                </Text>
                <View style={styles.cardFooterHint}>
                  <ArrowClockwise size={14} color={themeColors.text.muted} />
                  <Text style={styles.cardHintText}>Ketuk untuk melihat jawaban</Text>
                </View>
              </Animated.View>

              {/* BACK (Jawaban) */}
              <Animated.View style={[styles.cardSurface, styles.cardBack, backAnimatedStyle]}>
                <View style={[styles.cardBadge, { backgroundColor: themeColors.semantic.success + '1A', borderColor: themeColors.semantic.success + '40' }]}>
                  <Text style={[styles.cardBadgeText, { color: themeColors.semantic.success }]}>JAWABAN</Text>
                </View>
                <Text style={styles.cardAnswerText}>
                  {currentCard?.answer}
                </Text>
                <View style={styles.cardFooterHint}>
                  <CheckCircle size={14} color={themeColors.semantic.success} />
                  <Text style={[styles.cardHintText, { color: themeColors.semantic.success }]}>Pilih tingkat kemudahan Anda</Text>
                </View>
              </Animated.View>
            </Pressable>

            {/* SM-2 Rating Controls (Revealed after flip) */}
            {isFlipped ? (
              <Animated.View entering={FadeIn.duration(200)} style={styles.ratingBar}>
                <Text style={styles.ratingBarTitle}>Seberapa mudah Anda mengingat ini?</Text>
                <View style={styles.ratingButtonsRow}>
                  {/* Rating 1: Again / Lupa */}
                  <Pressable
                    onPress={() => handleRating(1)}
                    disabled={isSubmitting}
                    style={[styles.ratingBtn, { borderColor: themeColors.semantic.danger + '40', backgroundColor: themeColors.semantic.danger + '12' }]}
                  >
                    <SmileySad size={20} color={themeColors.semantic.danger} weight="duotone" />
                    <Text style={[styles.ratingLabel, { color: themeColors.semantic.danger }]}>Lupa</Text>
                    <Text style={styles.ratingSub}>Review Ulang</Text>
                  </Pressable>

                  {/* Rating 2: Hard / Sulit */}
                  <Pressable
                    onPress={() => handleRating(2)}
                    disabled={isSubmitting}
                    style={[styles.ratingBtn, { borderColor: themeColors.semantic.warning + '40', backgroundColor: themeColors.semantic.warning + '12' }]}
                  >
                    <SmileyMeh size={20} color={themeColors.semantic.warning} weight="duotone" />
                    <Text style={[styles.ratingLabel, { color: themeColors.semantic.warning }]}>Sulit</Text>
                    <Text style={styles.ratingSub}>Interval 1h</Text>
                  </Pressable>

                  {/* Rating 3: Good / Bagus */}
                  <Pressable
                    onPress={() => handleRating(3)}
                    disabled={isSubmitting}
                    style={[styles.ratingBtn, { borderColor: themeColors.semantic.success + '40', backgroundColor: themeColors.semantic.success + '12' }]}
                  >
                    <SmileyNervous size={20} color={themeColors.semantic.success} weight="duotone" />
                    <Text style={[styles.ratingLabel, { color: themeColors.semantic.success }]}>Bagus</Text>
                    <Text style={styles.ratingSub}>Interval 6h</Text>
                  </Pressable>

                  {/* Rating 4: Easy / Mudah */}
                  <Pressable
                    onPress={() => handleRating(4)}
                    disabled={isSubmitting}
                    style={[styles.ratingBtn, { borderColor: themeColors.brand.primary + '40', backgroundColor: themeColors.brand.primary + '12' }]}
                  >
                    <SmileyWink size={20} color={themeColors.brand.primary} weight="duotone" />
                    <Text style={[styles.ratingLabel, { color: themeColors.brand.primary }]}>Mudah</Text>
                    <Text style={styles.ratingSub}>Interval Panjang</Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : (
              <View style={styles.tapPromptBox}>
                <Text style={styles.tapPromptText}>
                  Ketuk kartu di atas untuk membalik dan menilai ingatan Anda
                </Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    headerTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      marginRight: spacing.sm,
    },
    headerTitle: {
      fontFamily: typography.display.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },
    closeButton: {
      padding: 6,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
    },
    studyContent: {
      flex: 1,
      padding: spacing.md,
      justifyContent: 'space-between',
    },
    progressRow: {
      marginBottom: spacing.md,
    },
    progressCounter: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: colors.text.secondary,
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    progressBarBg: {
      height: 4,
      backgroundColor: colors.border.subtle,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.brand.primary,
      borderRadius: radius.full,
    },
    cardArea: {
      flex: 1,
      position: 'relative',
      minHeight: 280,
      marginVertical: spacing.sm,
    },
    cardSurface: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      justifyContent: 'space-between',
      ...shadows.elevated,
    },
    cardFront: {},
    cardBack: {},
    cardBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.brand.primary + '18',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.brand.primary + '30',
    },
    cardBadgeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      color: colors.brand.primary,
    },
    cardQuestionText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 26,
      textAlign: 'center',
      marginVertical: spacing.md,
    },
    cardAnswerText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 17,
      color: colors.text.primary,
      lineHeight: 25,
      textAlign: 'center',
      marginVertical: spacing.md,
    },
    cardFooterHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    cardHintText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
    },
    ratingBar: {
      marginTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    ratingBarTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    ratingButtonsRow: {
      flexDirection: 'row',
      gap: 6,
    },
    ratingBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    ratingLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 4,
    },
    ratingSub: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 9,
      color: colors.text.muted,
      marginTop: 2,
    },
    tapPromptBox: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tapPromptText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    completedContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    trophyCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.brand.accent + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    completedTitle: {
      fontFamily: typography.display.fontFamily,
      fontSize: 20,
      fontWeight: '700',
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    completedSubtitle: {
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: spacing.xl,
    },
    completedButtonWrap: {
      width: '100%',
      maxWidth: 240,
    },
  });
