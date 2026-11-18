import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  X,
  Timer,
  Brain,
  CaretLeft,
  CaretRight,
  CheckCircle,
  WarningCircle,
  Shuffle,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Quiz, QuizQuestion, QuizAttempt, SubmitQuizAttemptPayload, QuizAnswerSubmission } from '@/types/learning';
import { formatApiError } from '@/lib/api';
import { UniButton } from '../ui/UniButton';

/*
<vibe_check>
Screen/Component : QuizPlayModal (components/learning/QuizPlayModal.tsx)
Tujuan           : Antarmuka pengerjaan kuis interaktif dengan timer mundur, stepper soal, radio pilihan ganda, benar/salah, dan isian singkat
Layout strategy  : Header (Timer + Close) -> Stepper indicator -> Card Soal & Opsi Jawaban -> Navigasi Prev/Next/Kumpulkan
Color tokens     : bg.base, bg.surface, brand.primary, brand.secondary, semantic.warning, semantic.danger
Animation plan   : Smooth transition antar soal, spring touch feedback
Typography       : SpaceGrotesk untuk pertanyaan, JetBrainsMono untuk timer MM:SS
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #28 (spring feedback)
</vibe_check>
*/

interface QuizPlayModalProps {
  visible: boolean;
  quiz: Quiz | null;
  onClose: () => void;
  onSubmit: (quizId: number, payload: SubmitQuizAttemptPayload) => Promise<QuizAttempt>;
  onShowResult: (attempt: QuizAttempt, quiz: Quiz) => void;
}

/**
 * True Fisher-Yates (Knuth) shuffle algorithm.
 * Guarantees unbiased O(n) permutations with equal probability.
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const QuizPlayModal: React.FC<QuizPlayModalProps> = ({
  visible,
  quiz,
  onClose,
  onSubmit,
  onShowResult,
}) => {
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);

  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const hasInitializedRef = useRef(false);
  const questions = sessionQuestions.length > 0 ? sessionQuestions : (quiz?.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const limitSeconds = (quiz?.time_limit_minutes || 15) * 60;
  const [timeRemaining, setTimeRemaining] = useState(limitSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<any>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const handleTimeoutSubmit = useCallback(() => {
    Alert.alert(
      'Waktu Habis!',
      'Waktu pengerjaan kuis telah habis. Jawaban Anda akan dikumpulkan otomatis.',
      [{ text: 'OK', onPress: () => doSubmit(answersRef.current) }]
    );
  }, [quiz]);

  // Initialize & Randomize Quiz Session
  useEffect(() => {
    if (visible && quiz) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;

        // 1. Acak urutan butir soal dengan Fisher-Yates
        const rawQuestions = quiz.questions || [];
        const shuffledQuestions = shuffleArray(rawQuestions).map((q) => {
          // 2. Acak urutan pilihan ganda (A, B, C, D) dengan Fisher-Yates
          if (q.type === 'multiple_choice' && Array.isArray(q.options) && q.options.length > 1) {
            return {
              ...q,
              options: shuffleArray(q.options),
            };
          }
          return { ...q };
        });

        setSessionQuestions(shuffledQuestions);
        setCurrentIndex(0);
        setAnswers({});
        const seconds = (quiz.time_limit_minutes || 15) * 60;
        setTimeRemaining(seconds);
        setIsSubmitting(false);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleTimeoutSubmit();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      hasInitializedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, quiz, handleTimeoutSubmit]);

  const handleSelectAnswer = (questionId: number, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleFinalSubmit = async (auto = false) => {
    if (!quiz || isSubmitting) return;

    if (!auto) {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < questions.length) {
        Alert.alert(
          'Kumpulkan Kuis?',
          `Anda baru menjawab ${answeredCount} dari ${questions.length} soal. Yakin ingin mengumpulkan sekarang?`,
          [
            { text: 'Periksa Kembali', style: 'cancel' },
            { text: 'Ya, Kumpulkan', onPress: () => doSubmit() },
          ]
        );
        return;
      }
    }

    await doSubmit();
  };

  const doSubmit = async (customAnswers?: Record<string, any>) => {
    if (!quiz || isSubmitting) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);
    try {
      const answersMap = customAnswers ?? answers;
      const formattedAnswers: QuizAnswerSubmission[] = (quiz.questions || []).map((q) => ({
        question_id: q.id,
        user_answer: answersMap[q.id] !== undefined ? String(answersMap[q.id]) : '',
      }));
      const result = await onSubmit(quiz.id, { answers: formattedAnswers });
      onClose();
      onShowResult(result, quiz);
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Gagal mengumpulkan kuis. Silakan coba lagi.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timeRemaining < 120; // < 2 menit
  const currentQuestion = questions[currentIndex];

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {!quiz || questions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Brain size={48} color={themeColors.brand.primary} weight="duotone" />
            <Text style={styles.emptyTitle}>Memuat Soal Kuis...</Text>
            <Pressable onPress={onClose} style={styles.closeEmptyBtn}>
              <Text style={styles.closeEmptyText}>Kembali</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Header: Title + Timer + Close */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Brain size={18} color={themeColors.brand.secondary} weight="duotone" />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {quiz.title}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View
              style={[
                styles.timerBox,
                isTimeCritical && styles.timerBoxCritical,
              ]}
            >
              <Timer
                size={14}
                color={isTimeCritical ? themeColors.semantic.danger : themeColors.text.primary}
                weight="bold"
              />
              <Text
                style={[
                  styles.timerText,
                  isTimeCritical && styles.timerTextCritical,
                ]}
              >
                {formatTimer(timeRemaining)}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                Alert.alert(
                  'Keluar dari Kuis?',
                  'Progres pengerjaan saat ini tidak akan disimpan jika Anda keluar.',
                  [
                    { text: 'Lanjut Mengerjakan', style: 'cancel' },
                    { text: 'Keluar', style: 'destructive', onPress: onClose },
                  ]
                );
              }}
              style={styles.closeBtn}
              hitSlop={10}
            >
              <X size={18} color={themeColors.text.primary} weight="bold" />
            </Pressable>
          </View>
        </View>

        {/* Stepper Indicator */}
        <View style={styles.stepperWrap}>
          <View style={styles.stepperHeader}>
            <View style={styles.stepperLeft}>
              <Text style={styles.stepperText}>
                SOAL {currentIndex + 1} DARI {questions.length}
              </Text>
              <View style={styles.randomBadge}>
                <Shuffle size={10} color={themeColors.brand.secondary} weight="bold" />
                <Text style={styles.randomBadgeText}>ACAK</Text>
              </View>
            </View>
            <Text style={styles.typeLabel}>
              {currentQuestion?.type === 'multiple_choice'
                ? 'PILIHAN GANDA'
                : currentQuestion?.type === 'true_false'
                ? 'BENAR / SALAH'
                : 'ISIAN SINGKAT'}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressThumb,
                { width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Question & Options ScrollView */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Question Box */}
          <View style={styles.questionBox}>
            <Text style={styles.questionText}>
              {currentQuestion?.question}
            </Text>
          </View>

          {/* Options Renderer */}
          {currentQuestion?.type === 'multiple_choice' && (
            <View style={styles.optionsList}>
              {(currentQuestion.options || []).map((opt, i) => {
                const letter = String.fromCharCode(65 + i); // A, B, C, D
                const isSelected = answers[currentQuestion.id] === opt;
                return (
                  <Pressable
                    key={`${currentQuestion.id}-${opt}-${i}`}
                    onPress={() => handleSelectAnswer(currentQuestion.id, opt)}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  >
                    <View style={[styles.letterBadge, isSelected && styles.letterBadgeSelected]}>
                      <Text style={[styles.letterText, isSelected && styles.letterTextSelected]}>
                        {letter}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {currentQuestion?.type === 'true_false' && (
            <View style={styles.tfRow}>
              {['true', 'false'].map((val) => {
                const isSelected = answers[currentQuestion.id] === val;
                const isTrue = val === 'true';
                return (
                  <Pressable
                    key={val}
                    onPress={() => handleSelectAnswer(currentQuestion.id, val)}
                    style={[
                      styles.tfButton,
                      isSelected && (isTrue ? styles.tfButtonTrueActive : styles.tfButtonFalseActive),
                    ]}
                  >
                    <Text
                      style={[
                        styles.tfButtonText,
                        isSelected && styles.tfButtonTextActive,
                      ]}
                    >
                      {isTrue ? 'BENAR' : 'SALAH'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {currentQuestion?.type === 'short_answer' && (
            <View style={styles.saBox}>
              <Text style={styles.saLabel}>Tuliskan jawaban singkat Anda:</Text>
              <TextInput
                style={styles.saInput}
                placeholder="Ketik jawaban di sini..."
                placeholderTextColor={themeColors.text.muted}
                value={answers[currentQuestion.id] || ''}
                onChangeText={(txt) => handleSelectAnswer(currentQuestion.id, txt)}
              />
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation Bar */}
        <View style={styles.footerNav}>
          <Pressable
            onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          >
            <CaretLeft size={16} color={currentIndex === 0 ? themeColors.text.muted : themeColors.text.primary} weight="bold" />
            <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>
              Sebelumnya
            </Text>
          </Pressable>

          {currentIndex < questions.length - 1 ? (
            <Pressable
              onPress={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>Berikutnya</Text>
              <CaretRight size={16} color="#FFF" weight="bold" />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => handleFinalSubmit(false)}
              disabled={isSubmitting}
              style={[styles.submitBtn, isSubmitting && styles.navBtnDisabled]}
            >
              <CheckCircle size={16} color="#FFF" weight="bold" />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Mengumpulkan...' : 'Kumpulkan Kuis'}
              </Text>
            </Pressable>
          )}
        </View>
          </>
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      marginRight: spacing.sm,
    },
    headerTitle: {
      fontFamily: typography.display.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    timerBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.bg.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    timerBoxCritical: {
      backgroundColor: colors.semantic.danger + '18',
      borderColor: colors.semantic.danger,
    },
    timerText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.primary,
    },
    timerTextCritical: {
      color: colors.semantic.danger,
    },
    closeBtn: {
      padding: 6,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
    },
    stepperWrap: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      backgroundColor: colors.bg.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    stepperHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    stepperLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    randomBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: colors.brand.secondary + '20',
      borderWidth: 0.5,
      borderColor: colors.brand.secondary + '40',
    },
    randomBadgeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 9,
      fontWeight: '700',
      color: colors.brand.secondary,
      letterSpacing: 0.5,
    },
    stepperText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: colors.brand.primary,
    },
    typeLabel: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.text.muted,
      letterSpacing: 0.5,
    },
    progressTrack: {
      height: 4,
      backgroundColor: colors.border.subtle,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressThumb: {
      height: '100%',
      backgroundColor: colors.brand.primary,
      borderRadius: radius.full,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: 80,
    },
    questionBox: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      marginBottom: spacing.md,
      ...shadows.card,
    },
    questionText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 24,
    },
    optionsList: {
      gap: spacing.xs + 2,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.sm,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    optionCardSelected: {
      backgroundColor: colors.brand.primary + '18',
      borderColor: colors.brand.primary,
    },
    letterBadge: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    letterBadgeSelected: {
      backgroundColor: colors.brand.primary,
    },
    letterText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: colors.text.secondary,
    },
    letterTextSelected: {
      color: '#FFFFFF',
    },
    optionText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.secondary,
      flex: 1,
      lineHeight: 20,
    },
    optionTextSelected: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    tfRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    tfButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    tfButtonTrueActive: {
      backgroundColor: colors.semantic.success + '20',
      borderColor: colors.semantic.success,
    },
    tfButtonFalseActive: {
      backgroundColor: colors.semantic.danger + '20',
      borderColor: colors.semantic.danger,
    },
    tfButtonText: {
      fontFamily: typography.display.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text.secondary,
    },
    tfButtonTextActive: {
      color: colors.text.primary,
    },
    saBox: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.sm,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    saLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    saInput: {
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      color: colors.text.primary,
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    footerNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bg.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      gap: spacing.sm,
    },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
    },
    navBtnDisabled: {
      opacity: 0.4,
    },
    navBtnText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.primary,
    },
    navBtnTextDisabled: {
      color: colors.text.muted,
    },
    nextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.sm,
      backgroundColor: colors.brand.primary,
    },
    nextBtnText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.sm,
      backgroundColor: colors.semantic.success,
    },
    submitBtnText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    emptyTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    closeEmptyBtn: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    closeEmptyText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
    },
  });
