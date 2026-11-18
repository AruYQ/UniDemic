import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Kanban, UsersThree, BookBookmark } from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { UniDatePicker } from '@/components/ui/UniDatePicker';
import { Course } from '@/types/academic';
import {
  StudyGroup,
  ProjectStatus,
  CreateProjectPayload,
  createProjectSchema,
} from '@/types/collaboration';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : CreateProjectModal (components/collaboration/CreateProjectModal.tsx)
Tujuan           : Modal pembuatan Project Workspace baru dengan pengait Grup Belajar/Mata Kuliah, status proyek, dan UniDatePicker
Layout strategy  : Bottom sheet modal dengan header -> form scrollable -> primary button di thumb zone
Color tokens     : bg.elevated, bg.surface, brand.primary, border.subtle, semantic.danger
Animation plan   : Native slide modal + UniButton spring feedback
Typography       : SpaceGrotesk untuk headers & inputs
Anti-slop check  : Rule #3 (no pure white/black), UniDatePicker wajib tanpa input teks tanggal manual, Zod validation
</vibe_check>
*/

export interface CreateProjectModalProps {
  visible: boolean;
  studyGroups: StudyGroup[];
  courses: Course[];
  defaultStudyGroupId?: number | null;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void>;
}

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Perencanaan' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Selesai' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  visible,
  studyGroups,
  courses,
  defaultStudyGroupId = null,
  onClose,
  onSubmit,
}) => {
  const { colors: themeColors } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [dueDate, setDueDate] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(defaultStudyGroupId);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('active');
    setDueDate('');
    setSelectedGroupId(defaultStudyGroupId);
    setSelectedCourseId(null);
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    const parsed = createProjectSchema.safeParse({
      name,
      description: description || undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Periksa kembali input proyek Anda');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: parsed.data.name,
        description: parsed.data.description || null,
        study_group_id: selectedGroupId,
        course_id: selectedCourseId,
        status,
        due_date: dueDate || null,
      });
      resetForm();
      onClose();
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Kanban size={22} color={themeColors.brand.primary} weight="duotone" />
              <Text style={styles.title}>Buat Proyek Kolaborasi</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={20} color={themeColors.text.secondary} weight="bold" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formBody}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <UniInput
              label="Nama Proyek *"
              placeholder="Contoh: Aplikasi Mobile Capstone"
              value={name}
              onChangeText={setName}
            />

            <UniInput
              label="Deskripsi Proyek"
              placeholder="Lingkup pekerjaan, target luaran..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />

            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>Status Awal</Text>
              <View style={styles.chipRowWrap}>
                {PROJECT_STATUSES.map((opt) => {
                  const active = status === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setStatus(opt.value)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <UniDatePicker
              label="Target Tenggat (Opsional)"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Pilih tanggal deadline proyek"
            />

            {studyGroups.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionLabelRow}>
                  <UsersThree size={14} color={themeColors.text.secondary} weight="duotone" />
                  <Text style={styles.sectionLabel}>Grup Belajar Terkait (Opsional)</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <Pressable
                    onPress={() => setSelectedGroupId(null)}
                    style={[styles.chip, selectedGroupId === null && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedGroupId === null && styles.chipTextActive]}>
                      Mandiri / Personal
                    </Text>
                  </Pressable>
                  {studyGroups.map((g) => {
                    const active = selectedGroupId === g.id;
                    return (
                      <Pressable
                        key={g.id}
                        onPress={() => setSelectedGroupId(g.id)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {g.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {courses.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionLabelRow}>
                  <BookBookmark size={14} color={themeColors.text.secondary} weight="duotone" />
                  <Text style={styles.sectionLabel}>Mata Kuliah (Opsional)</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <Pressable
                    onPress={() => setSelectedCourseId(null)}
                    style={[styles.chip, selectedCourseId === null && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedCourseId === null && styles.chipTextActive]}>
                      Umum
                    </Text>
                  </Pressable>
                  {courses.map((c) => {
                    const active = selectedCourseId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setSelectedCourseId(c.id)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {c.code || c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <UniButton label="Buat Workspace Proyek" onPress={handleSubmit} loading={isSubmitting} size="lg" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 17, 23, 0.72)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.bg.elevated,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderTopWidth: 1,
      borderColor: colors.border.default,
      maxHeight: '88%',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 19,
      color: colors.text.primary,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formBody: {
      paddingBottom: spacing.lg,
    },
    errorBanner: {
      backgroundColor: 'rgba(224, 91, 91, 0.14)',
      borderWidth: 1,
      borderColor: colors.semantic.danger,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.semantic.danger,
    },
    sectionBox: {
      marginBottom: spacing.md,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.sm,
    },
    sectionLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    chipRow: {
      gap: spacing.sm,
      paddingVertical: 2,
    },
    chipRowWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    chipActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    chipText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    chipTextActive: {
      color: colors.text.inverse,
      fontWeight: '600',
    },
    footer: {
      paddingTop: spacing.sm,
    },
  });
