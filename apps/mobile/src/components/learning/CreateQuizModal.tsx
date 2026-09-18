import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  Brain,
  GraduationCap,
  Plus,
  Trash,
  CheckCircle,
} from 'phosphor-react-native';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { Course } from '@/types/academic';
import {
  QuizQuestionType,
  CreateQuizPayload,
} from '@/types/learning';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : CreateQuizModal (components/learning/CreateQuizModal.tsx)
Tujuan           : Dialog modal pembuatan kuis latihan baru lengkap dengan builder butir soal dan kunci jawaban
Layout strategy  : Course selector -> Judul Kuis & Batas Waktu -> Builder Soal Interaktif -> Tombol Simpan
Color tokens     : bg.surface, bg.overlay, brand.primary, brand.secondary, text.primary
Animation plan   : FadeInDown modal transition
Typography       : SpaceGrotesk untuk pertanyaan, JetBrainsMono untuk timer & option keys
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface DraftQuestion {
  type: QuizQuestionType;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface CreateQuizModalProps {
  visible: boolean;
  onClose: () => void;
  courses: Course[];
  initialCourseId?: number | null;
  onSubmit: (payload: CreateQuizPayload) => Promise<any>;
}

export const CreateQuizModal: React.FC<CreateQuizModalProps> = ({
  visible,
  onClose,
  courses,
  initialCourseId = null,
  onSubmit,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [courseId, setCourseId] = useState<number | null>(initialCourseId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('15');
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    {
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialCourseId) setCourseId(initialCourseId);
  }, [initialCourseId]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        type: 'multiple_choice',
        question: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      Alert.alert('Perhatian', 'Kuis minimal memiliki 1 butir soal.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  };

  const updateOption = (qIdx: number, optIdx: number, text: string) => {
    const q = questions[qIdx];
    const newOptions = [...q.options];
    newOptions[optIdx] = text;
    updateQuestion(qIdx, { options: newOptions });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Perhatian', 'Judul kuis wajib diisi.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        Alert.alert('Perhatian', `Soal nomor ${i + 1} belum memiliki teks pertanyaan.`);
        return;
      }
      if (!q.correct_answer.trim()) {
        Alert.alert('Perhatian', `Soal nomor ${i + 1} belum memiliki kunci jawaban.`);
        return;
      }
      if (q.type === 'multiple_choice') {
        const filledOptions = q.options.filter((o) => o.trim().length > 0);
        if (filledOptions.length < 2) {
          Alert.alert('Perhatian', `Soal nomor ${i + 1} minimal harus memiliki 2 pilihan jawaban.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateQuizPayload = {
        title: title.trim(),
        description: description.trim() || null,
        course_id: courseId,
        time_limit_minutes: parseInt(timeLimit, 10) || 15,
        questions: questions.map((q, i) => ({
          type: q.type,
          question: q.question.trim(),
          options: q.type === 'multiple_choice' ? q.options.filter((o) => o.trim().length > 0) : undefined,
          correct_answer: q.correct_answer.trim(),
          explanation: q.explanation.trim() || null,
          order: i + 1,
        })),
      };

      await onSubmit(payload);
      setTitle('');
      setDescription('');
      setTimeLimit('15');
      setQuestions([
        {
          type: 'multiple_choice',
          question: '',
          options: ['', '', '', ''],
          correct_answer: '',
          explanation: '',
        },
      ]);
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Gagal membuat kuis latihan.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title="Buat Kuis Latihan Baru"
      subtitle="Uji pemahaman mandiri dengan sistem penilaian dan kunci jawaban otomatis"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Course Picker */}
        <Text style={styles.sectionLabel}>Mata Kuliah Terkait (Opsional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseScroll}>
          <Pressable
            onPress={() => setCourseId(null)}
            style={[styles.coursePill, courseId === null && styles.coursePillActive]}
          >
            <Text style={[styles.coursePillText, courseId === null && styles.coursePillTextActive]}>
              Umum (Tanpa Matkul)
            </Text>
          </Pressable>
          {courses.map((c) => {
            const isSelected = courseId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCourseId(c.id)}
                style={[styles.coursePill, isSelected && styles.coursePillActive]}
              >
                <GraduationCap
                  size={14}
                  color={isSelected ? themeColors.text.primary : themeColors.text.secondary}
                />
                <Text style={[styles.coursePillText, isSelected && styles.coursePillTextActive]} numberOfLines={1}>
                  {c.code || c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Title */}
        <UniInput
          label="Judul Kuis"
          placeholder="Contoh: Latihan Soal UTS — Sistem Operasi"
          value={title}
          onChangeText={setTitle}
        />

        {/* Time Limit */}
        <UniInput
          label="Batas Waktu (Menit)"
          placeholder="15"
          value={timeLimit}
          onChangeText={setTimeLimit}
          keyboardType="numeric"
        />

        {/* Questions Builder */}
        <View style={styles.questionsHeader}>
          <Text style={styles.sectionLabel}>Daftar Butir Soal ({questions.length})</Text>
          <Pressable onPress={handleAddQuestion} style={styles.addQBtn}>
            <Plus size={13} color="#FFF" weight="bold" />
            <Text style={styles.addQBtnText}>Tambah Soal</Text>
          </Pressable>
        </View>

        {questions.map((q, idx) => (
          <View key={idx} style={styles.questionCard}>
            <View style={styles.qCardHeader}>
              <Text style={styles.qCardNum}>Soal #{idx + 1}</Text>
              {questions.length > 1 && (
                <Pressable onPress={() => handleRemoveQuestion(idx)} style={styles.delQBtn}>
                  <Trash size={14} color={themeColors.semantic.danger} weight="bold" />
                </Pressable>
              )}
            </View>

            {/* Type Switcher */}
            <View style={styles.typeSwitcher}>
              {(['multiple_choice', 'true_false', 'short_answer'] as QuizQuestionType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => updateQuestion(idx, { type: t, correct_answer: '' })}
                  style={[styles.typeBtn, q.type === t && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, q.type === t && styles.typeBtnTextActive]}>
                    {t === 'multiple_choice' ? 'Pilgan' : t === 'true_false' ? 'B / S' : 'Isian'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Question Text */}
            <TextInput
              style={styles.questionTextInput}
              placeholder="Tuliskan butir pertanyaan..."
              placeholderTextColor={themeColors.text.muted}
              value={q.question}
              onChangeText={(txt) => updateQuestion(idx, { question: txt })}
              multiline
            />

            {/* Multiple Choice Options */}
            {q.type === 'multiple_choice' && (
              <View style={styles.optionsWrap}>
                <Text style={styles.subLabel}>Pilihan & Kunci Jawaban (Sentuh huruf untuk kunci):</Text>
                {q.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isKey = q.correct_answer === opt && opt.length > 0;
                  return (
                    <View key={optIdx} style={styles.optInputRow}>
                      <Pressable
                        onPress={() => updateQuestion(idx, { correct_answer: opt })}
                        style={[styles.keyBadge, isKey && styles.keyBadgeActive]}
                      >
                        <Text style={[styles.keyBadgeText, isKey && styles.keyBadgeTextActive]}>
                          {letter}
                        </Text>
                      </Pressable>
                      <TextInput
                        style={styles.optInput}
                        placeholder={`Pilihan ${letter}`}
                        placeholderTextColor={themeColors.text.muted}
                        value={opt}
                        onChangeText={(txt) => {
                          updateOption(idx, optIdx, txt);
                          if (isKey) updateQuestion(idx, { correct_answer: txt });
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            )}

            {/* True False Key */}
            {q.type === 'true_false' && (
              <View style={styles.tfWrap}>
                <Text style={styles.subLabel}>Kunci Jawaban yang Benar:</Text>
                <View style={styles.tfKeyRow}>
                  {['true', 'false'].map((v) => {
                    const isKey = q.correct_answer === v;
                    return (
                      <Pressable
                        key={v}
                        onPress={() => updateQuestion(idx, { correct_answer: v })}
                        style={[styles.tfKeyBtn, isKey && styles.tfKeyBtnActive]}
                      >
                        <Text style={[styles.tfKeyText, isKey && styles.tfKeyTextActive]}>
                          {v === 'true' ? 'BENAR' : 'SALAH'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Short Answer Key */}
            {q.type === 'short_answer' && (
              <View style={styles.saWrap}>
                <Text style={styles.subLabel}>Kunci Jawaban Tepat:</Text>
                <TextInput
                  style={styles.saInput}
                  placeholder="Ketik kunci jawaban..."
                  placeholderTextColor={themeColors.text.muted}
                  value={q.correct_answer}
                  onChangeText={(txt) => updateQuestion(idx, { correct_answer: txt })}
                />
              </View>
            )}

            {/* Explanation */}
            <TextInput
              style={styles.explanationInput}
              placeholder="Pembahasan / Penjelasan (Opsional)"
              placeholderTextColor={themeColors.text.muted}
              value={q.explanation}
              onChangeText={(txt) => updateQuestion(idx, { explanation: txt })}
            />
          </View>
        ))}

        {/* Submit */}
        <View style={styles.submitWrap}>
          <UniButton
            label="Simpan & Terbitkan Kuis"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </AcademicModal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    sectionLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
      marginBottom: spacing.xs,
      marginTop: spacing.xs,
    },
    courseScroll: {
      gap: spacing.xs,
      paddingVertical: 4,
      marginBottom: spacing.sm,
    },
    coursePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.bg.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    coursePillActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    coursePillText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    coursePillTextActive: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    questionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    addQBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.brand.secondary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    addQBtnText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    questionCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
      marginBottom: spacing.md,
    },
    qCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    qCardNum: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: colors.brand.primary,
    },
    delQBtn: {
      padding: 4,
    },
    typeSwitcher: {
      flexDirection: 'row',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      padding: 3,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
    },
    typeBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    typeBtnActive: {
      backgroundColor: colors.brand.primary,
    },
    typeBtnText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    typeBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    questionTextInput: {
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.sm,
      padding: spacing.sm,
      color: colors.text.primary,
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.xs,
      minHeight: 60,
    },
    subLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
      marginBottom: 4,
    },
    optionsWrap: {
      gap: 4,
      marginBottom: spacing.xs,
    },
    optInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    keyBadge: {
      width: 26,
      height: 26,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    keyBadgeActive: {
      backgroundColor: colors.semantic.success,
      borderColor: colors.semantic.success,
    },
    keyBadgeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.secondary,
    },
    keyBadgeTextActive: {
      color: '#FFFFFF',
    },
    optInput: {
      flex: 1,
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      color: colors.text.primary,
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    tfWrap: {
      marginVertical: spacing.xs,
    },
    tfKeyRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    tfKeyBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    tfKeyBtnActive: {
      backgroundColor: colors.semantic.success,
      borderColor: colors.semantic.success,
    },
    tfKeyText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.secondary,
    },
    tfKeyTextActive: {
      color: '#FFFFFF',
    },
    saWrap: {
      marginVertical: spacing.xs,
    },
    saInput: {
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      color: colors.text.primary,
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    explanationInput: {
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      color: colors.text.secondary,
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginTop: spacing.xs,
    },
    submitWrap: {
      marginTop: spacing.md,
    },
  });
