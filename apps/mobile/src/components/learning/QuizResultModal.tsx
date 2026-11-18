import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  X,
  Trophy,
  CheckCircle,
  XCircle,
  Sparkle,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Quiz, QuizAttempt, QuizQuestion } from '@/types/learning';
import { UniButton } from '../ui/UniButton';

/*
<vibe_check>
Screen/Component : QuizResultModal (components/learning/QuizResultModal.tsx)
Tujuan           : Menampilkan hasil penilaian kuis otomatis, persentase nilai, dan ulasan kunci jawaban per soal
Layout strategy  : Header -> Skor Hero Circle -> Ringkasan Benar/Salah -> Ulasan Detail Soal -> Tombol Selesai
Color tokens     : bg.base, bg.surface, brand.primary, brand.accent, semantic.success, semantic.danger
Animation plan   : Modal slide up
Typography       : SpaceGrotesk untuk pertanyaan, JetBrainsMono untuk skor & angka
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface QuizResultModalProps {
  visible: boolean;
  attempt: QuizAttempt | null;
  quiz: Quiz | null;
  onClose: () => void;
}

export const QuizResultModal: React.FC<QuizResultModalProps> = ({
  visible,
  attempt,
  quiz,
  onClose,
}) => {
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);

  if (!attempt || !quiz) return null;

  const score = attempt.score ?? 0;
  const questions = quiz.questions || [];

  const getScoreHeadline = () => {
    if (score >= 90) return 'Luar Biasa! 🏆';
    if (score >= 75) return 'Bagus Sekali! 🎉';
    if (score >= 60) return 'Cukup Baik! 👍';
    return 'Tetap Semangat! 💪';
  };

  const formatAnswerDisplay = (ans: any, q: QuizQuestion) => {
    if (ans === undefined || ans === null || String(ans).trim() === '') {
      return '(Kosong)';
    }
    const str = String(ans).trim();

    // True False formatting
    if (q.type === 'true_false') {
      const lower = str.toLowerCase();
      if (['true', 'benar', 'ya', '1'].includes(lower)) return 'BENAR';
      if (['false', 'salah', 'tidak', '0'].includes(lower)) return 'SALAH';
      return str.toUpperCase();
    }

    // Multiple choice formatting
    if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const lower = str.toLowerCase();
      // Check if ans is just a letter like "C"
      const letterIdx = letters.map((l) => l.toLowerCase()).indexOf(lower);
      if (letterIdx !== -1 && q.options[letterIdx]) {
        return `${letters[letterIdx]}. ${q.options[letterIdx]}`;
      }
      // Check if ans is the option text like "Merge Sort"
      const optIdx = q.options.map((o: string) => o.trim().toLowerCase()).indexOf(lower);
      if (optIdx !== -1) {
        return `${letters[optIdx] ?? ''}. ${q.options[optIdx]}`;
      }
    }

    return str;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hasil Evaluasi Kuis</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <X size={18} color={themeColors.text.primary} weight="bold" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Score Hero Card */}
          <View style={styles.scoreCard}>
            <View style={styles.trophyBadge}>
              <Trophy size={36} color={themeColors.brand.accent} weight="fill" />
            </View>
            <Text style={styles.scoreHeadline}>{getScoreHeadline()}</Text>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreScale}>DARI 100 POIN</Text>

            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>
                {attempt.correct_answers} dari {attempt.total_questions} Soal Terjawab Benar
              </Text>
            </View>
          </View>

          {/* Question Review Breakdown */}
          <Text style={styles.reviewSectionTitle}>Pembahasan Kunci Jawaban</Text>
          <View style={styles.reviewList}>
            {questions.map((q, idx) => {
              const answerDetail = Array.isArray(attempt.answers)
                ? attempt.answers.find((a: any) => a.question_id === q.id)
                : null;
              const userAnswer = answerDetail
                ? answerDetail.user_answer
                : (attempt.answers as any)?.[q.id];
              const isCorrect =
                answerDetail?.is_correct !== undefined
                  ? Boolean(answerDetail.is_correct)
                  : userAnswer !== undefined &&
                    String(userAnswer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();

              return (
                <View key={q.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <Text style={styles.questionNum}>Soal #{idx + 1}</Text>
                    <View style={[styles.statusTag, isCorrect ? styles.tagCorrect : styles.tagWrong]}>
                      {isCorrect ? (
                        <>
                          <CheckCircle size={13} color={themeColors.semantic.success} weight="bold" />
                          <Text style={[styles.statusText, { color: themeColors.semantic.success }]}>BENAR</Text>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} color={themeColors.semantic.danger} weight="bold" />
                          <Text style={[styles.statusText, { color: themeColors.semantic.danger }]}>SALAH</Text>
                        </>
                      )}
                    </View>
                  </View>

                  <Text style={styles.reviewQuestionText}>{q.question}</Text>

                  <View style={styles.answersComparison}>
                    <Text style={styles.userAnswerLabel}>
                      Jawaban Anda: <Text style={styles.userAnswerVal}>{formatAnswerDisplay(userAnswer, q)}</Text>
                    </Text>
                    {!isCorrect && (
                      <Text style={styles.correctAnswerLabel}>
                        Kunci Jawaban: <Text style={styles.correctAnswerVal}>{formatAnswerDisplay(q.correct_answer, q)}</Text>
                      </Text>
                    )}
                  </View>

                  {q.explanation ? (
                    <View style={styles.explanationBox}>
                      <Text style={styles.explanationLabel}>Pembahasan:</Text>
                      <Text style={styles.explanationText}>{q.explanation}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Bottom Button */}
          <View style={styles.buttonWrapper}>
            <UniButton label="Selesai & Tutup" onPress={onClose} />
          </View>
        </ScrollView>
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
    headerTitle: {
      fontFamily: typography.display.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.primary,
    },
    closeBtn: {
      padding: 6,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: 60,
    },
    scoreCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.default,
      marginBottom: spacing.lg,
      ...shadows.elevated,
    },
    trophyBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.brand.accent + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    scoreHeadline: {
      fontFamily: typography.display.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: 2,
    },
    scoreNumber: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 44,
      fontWeight: '800',
      color: colors.brand.primary,
    },
    scoreScale: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.text.muted,
      letterSpacing: 1,
      marginBottom: spacing.md,
    },
    summaryPill: {
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.full,
    },
    summaryPillText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    reviewSectionTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    reviewList: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    reviewCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    reviewCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    questionNum: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: colors.text.muted,
    },
    statusTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    tagCorrect: {
      backgroundColor: colors.semantic.success + '18',
    },
    tagWrong: {
      backgroundColor: colors.semantic.danger + '18',
    },
    statusText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      fontWeight: '700',
    },
    reviewQuestionText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 20,
      marginBottom: spacing.xs,
    },
    answersComparison: {
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.sm,
      padding: spacing.xs + 2,
      marginVertical: spacing.xs,
      gap: 3,
    },
    userAnswerLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    userAnswerVal: {
      fontFamily: typography.mono.fontFamily,
      color: colors.text.primary,
      fontWeight: '600',
    },
    correctAnswerLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      color: colors.semantic.success,
    },
    correctAnswerVal: {
      fontFamily: typography.mono.fontFamily,
      color: colors.semantic.success,
      fontWeight: '700',
    },
    explanationBox: {
      borderLeftWidth: 2,
      borderLeftColor: colors.brand.primary,
      paddingLeft: spacing.sm,
      marginTop: spacing.xs,
    },
    explanationLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: colors.brand.primary,
      marginBottom: 2,
    },
    explanationText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 16,
    },
    buttonWrapper: {
      marginTop: spacing.sm,
    },
  });
