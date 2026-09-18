import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import {
  FilePdf,
  Presentation,
  FileText,
  LinkSimple,
  VideoCamera,
  Files,
  GraduationCap,
} from 'phosphor-react-native';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { Course } from '@/types/academic';
import { MaterialType, CreateMaterialPayload } from '@/types/learning';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : CreateMaterialModal (components/learning/CreateMaterialModal.tsx)
Tujuan           : Dialog modal elegan untuk mencatat atau menautkan berkas materi perkuliahan baru
Layout strategy  : Course horizontal selector -> Judul -> Type Pill Chips -> URL/Link Input -> Deskripsi -> Tombol Simpan
Color tokens     : bg.surface, bg.overlay, brand.primary, brand.secondary, text.primary
Animation plan   : FadeInDown modal transition
Typography       : SpaceGrotesk untuk label, JetBrainsMono untuk kode matkul
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface CreateMaterialModalProps {
  visible: boolean;
  onClose: () => void;
  courses: Course[];
  initialCourseId?: number | null;
  onSubmit: (payload: CreateMaterialPayload) => Promise<any>;
}

export const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({
  visible,
  onClose,
  courses,
  initialCourseId = null,
  onSubmit,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [courseId, setCourseId] = useState<number | null>(initialCourseId || (courses[0]?.id ?? null));
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MaterialType>('pdf');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialCourseId) {
      setCourseId(initialCourseId);
    } else if (courses.length > 0 && !courseId) {
      setCourseId(courses[0].id);
    }
  }, [initialCourseId, courses]);

  const typeOptions: { key: MaterialType; label: string; icon: any }[] = [
    { key: 'pdf', label: 'PDF', icon: FilePdf },
    { key: 'slide', label: 'Slide PPT', icon: Presentation },
    { key: 'doc', label: 'Dokumen', icon: FileText },
    { key: 'link', label: 'Tautan Web', icon: LinkSimple },
    { key: 'video', label: 'Video', icon: VideoCamera },
    { key: 'other', label: 'Lainnya', icon: Files },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Perhatian', 'Judul materi wajib diisi.');
      return;
    }

    if (!courseId) {
      Alert.alert('Perhatian', 'Pilih mata kuliah terkait.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        course_id: courseId,
        title: title.trim(),
        type,
        url: url.trim() || null,
        description: description.trim() || null,
      });

      // Reset
      setTitle('');
      setUrl('');
      setDescription('');
      setType('pdf');
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Gagal menyimpan materi kuliah.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title="Tambah Materi Kuliah"
      subtitle="Kumpulkan slide, berkas PDF, atau link bahan ajar per mata kuliah"
    >
      <View style={styles.formContainer}>
        {/* Course Picker */}
        <Text style={styles.fieldLabel}>Mata Kuliah Terkait</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseScroll}
        >
          {courses.map((c) => {
            const isSelected = courseId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCourseId(c.id)}
                style={[
                  styles.coursePill,
                  isSelected && styles.coursePillActive,
                ]}
              >
                <GraduationCap
                  size={14}
                  color={isSelected ? themeColors.text.primary : themeColors.text.secondary}
                  weight={isSelected ? 'fill' : 'duotone'}
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

        {/* Title Input */}
        <UniInput
          label="Judul Materi"
          placeholder="Contoh: Modul Pertemuan 4 — Relational Algebra"
          value={title}
          onChangeText={setTitle}
        />

        {/* Material Type Pills */}
        <Text style={styles.fieldLabel}>Jenis Materi</Text>
        <View style={styles.typeGrid}>
          {typeOptions.map((opt) => {
            const isSelected = type === opt.key;
            const Icon = opt.icon;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setType(opt.key)}
                style={[styles.typeButton, isSelected && styles.typeButtonActive]}
              >
                <Icon
                  size={15}
                  color={isSelected ? themeColors.brand.primary : themeColors.text.secondary}
                  weight={isSelected ? 'fill' : 'duotone'}
                />
                <Text style={[styles.typeButtonText, isSelected && styles.typeButtonTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* URL / Link */}
        <UniInput
          label="Tautan Berkas / Link Eksternal (Opsional)"
          placeholder="https://drive.google.com/... atau https://..."
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        {/* Description */}
        <UniInput
          label="Catatan / Deskripsi Tambahan (Opsional)"
          placeholder="Ringkasan topik atau instruksi dosen..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* Submit Button */}
        <View style={styles.buttonWrapper}>
          <UniButton
            label="Simpan Materi"
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
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.bg.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    typeButtonActive: {
      backgroundColor: colors.brand.primary + '18',
      borderColor: colors.brand.primary,
    },
    typeButtonText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    typeButtonTextActive: {
      color: colors.brand.primary,
      fontWeight: '700',
    },
    buttonWrapper: {
      marginTop: spacing.md,
    },
  });
