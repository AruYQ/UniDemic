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
  Switch,
} from 'react-native';
import { X, UsersThree, BookBookmark } from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { Course } from '@/types/academic';
import { CreateStudyGroupPayload, createStudyGroupSchema } from '@/types/collaboration';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : CreateStudyGroupModal (components/collaboration/CreateStudyGroupModal.tsx)
Tujuan           : Modal pembuatan grup belajar lintas kampus lengkap dengan opsi visibilitas publik/privat, tautan mata kuliah, dan batas anggota
Layout strategy  : Bottom sheet modal dengan header -> scrollable form inputs -> primary CTA di thumb zone
Color tokens     : bg.elevated, bg.surface, brand.primary, border.subtle, semantic.danger
Animation plan   : Native slide modal + spring press feedback via UniButton
Typography       : SpaceGrotesk untuk judul & label, JetBrainsMono untuk angka kapasitas
Anti-slop check  : Rule #3 (no pure white/black), Rule #19 (radius.lg modal, radius.md inputs), Zod validation
</vibe_check>
*/

export interface CreateStudyGroupModalProps {
  visible: boolean;
  courses: Course[];
  onClose: () => void;
  onSubmit: (payload: CreateStudyGroupPayload) => Promise<void>;
}

export const CreateStudyGroupModal: React.FC<CreateStudyGroupModalProps> = ({
  visible,
  courses,
  onClose,
  onSubmit,
}) => {
  const { colors: themeColors } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembersText, setMaxMembersText] = useState('50');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setSubject('');
    setDescription('');
    setMaxMembersText('50');
    setSelectedCourseId(null);
    setIsPublic(true);
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    const parsedMax = maxMembersText.trim() ? Number(maxMembersText.trim()) : undefined;

    const validation = createStudyGroupSchema.safeParse({
      name,
      subject: subject || undefined,
      description: description || undefined,
      max_members: Number.isNaN(parsedMax) ? undefined : parsedMax,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Periksa kembali input Anda');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: validation.data.name,
        subject: validation.data.subject || null,
        description: validation.data.description || null,
        course_id: selectedCourseId,
        is_public: isPublic,
        max_members: validation.data.max_members || 50,
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
              <UsersThree size={22} color={themeColors.brand.primary} weight="duotone" />
              <Text style={styles.title}>Buat Grup Belajar</Text>
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
              label="Nama Grup Belajar *"
              placeholder="Contoh: Kelompok Riset Algoritma"
              value={name}
              onChangeText={setName}
            />

            <UniInput
              label="Topik / Bidang Studi"
              placeholder="Contoh: Struktur Data, Kalkulus, AI"
              value={subject}
              onChangeText={setSubject}
            />

            <UniInput
              label="Deskripsi Grup"
              placeholder="Tujuan belajar, jadwal diskusi rutin..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 72, textAlignVertical: 'top' }}
            />

            <UniInput
              label="Maksimal Anggota"
              placeholder="50"
              value={maxMembersText}
              onChangeText={setMaxMembersText}
              keyboardType="number-pad"
            />

            {courses.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionLabelRow}>
                  <BookBookmark size={14} color={themeColors.text.secondary} weight="duotone" />
                  <Text style={styles.sectionLabel}>Tautkan Mata Kuliah (Opsional)</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <Pressable
                    onPress={() => setSelectedCourseId(null)}
                    style={[styles.chip, selectedCourseId === null && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedCourseId === null && styles.chipTextActive]}>
                      Lintas Matkul
                    </Text>
                  </Pressable>
                  {courses.map((course) => {
                    const active = selectedCourseId === course.id;
                    return (
                      <Pressable
                        key={course.id}
                        onPress={() => setSelectedCourseId(course.id)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {course.code || course.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Grup Publik</Text>
                <Text style={styles.switchDesc}>
                  Mahasiswa dari kampus lain dapat menemukan dan bergabung dari menu Jelajahi.
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: themeColors.border.default, true: themeColors.brand.primary }}
                thumbColor={themeColors.bg.surface}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <UniButton
              label="Buat Grup & Ruang Obrolan"
              onPress={handleSubmit}
              loading={isSubmitting}
              size="lg"
            />
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
    },
    chipRow: {
      gap: spacing.sm,
      paddingVertical: 2,
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
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
      marginTop: spacing.xs,
    },
    switchTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
      marginBottom: 2,
    },
    switchDesc: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 17,
    },
    footer: {
      paddingTop: spacing.sm,
    },
  });
