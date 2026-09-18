import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Cards, GraduationCap } from 'phosphor-react-native';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { Course } from '@/types/academic';
import { CreateDeckPayload } from '@/types/learning';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : CreateDeckModal (components/learning/CreateDeckModal.tsx)
Tujuan           : Dialog modal elegan untuk membuat dek flashcard baru terikat matkul atau topik umum
Layout strategy  : Course horizontal selector -> Nama Dek -> Deskripsi -> Tombol Simpan
Color tokens     : bg.surface, bg.overlay, brand.primary, text.primary
Animation plan   : FadeInDown modal transition
Typography       : SpaceGrotesk untuk label
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface CreateDeckModalProps {
  visible: boolean;
  onClose: () => void;
  courses: Course[];
  initialCourseId?: number | null;
  onSubmit: (payload: CreateDeckPayload) => Promise<any>;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({
  visible,
  onClose,
  courses,
  initialCourseId = null,
  onSubmit,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [courseId, setCourseId] = useState<number | null>(initialCourseId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialCourseId) {
      setCourseId(initialCourseId);
    }
  }, [initialCourseId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Perhatian', 'Nama dek wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        course_id: courseId,
      });

      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Gagal membuat dek flashcard.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title="Buat Dek Flashcard"
      subtitle="Kumpulan kartu belajar dengan sistem hafalan berulang (Spaced Repetition)"
    >
      <View style={styles.formContainer}>
        {/* Course Picker */}
        <Text style={styles.fieldLabel}>Mata Kuliah Terkait (Opsional)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseScroll}
        >
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
                <Text
                  style={[
                    styles.coursePillText,
                    isSelected && styles.coursePillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {c.code || c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Deck Name */}
        <UniInput
          label="Nama Dek Kartu"
          placeholder="Contoh: Istilah & Konsep Dasar Jaringan Komputer"
          value={name}
          onChangeText={setName}
        />

        {/* Description */}
        <UniInput
          label="Deskripsi / Cakupan Materi (Opsional)"
          placeholder="Topik persiapan kuis atau UAS..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* Submit */}
        <View style={styles.buttonWrapper}>
          <UniButton
            label="Buat Dek"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </AcademicModal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    formContainer: {
      paddingBottom: spacing.lg,
    },
    fieldLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
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
      fontSize: 12,
      color: colors.text.secondary,
    },
    coursePillTextActive: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    buttonWrapper: {
      marginTop: spacing.md,
    },
  });
