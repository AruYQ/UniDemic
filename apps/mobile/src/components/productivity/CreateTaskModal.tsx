import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Plus, Trash, Tag } from 'phosphor-react-native';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniDatePicker } from '@/components/ui/UniDatePicker';
import { UniButton } from '@/components/ui/UniButton';
import { Course } from '@/types/academic';
import { CreateTaskPayload, TaskPriority } from '@/types/productivity';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { formatApiError } from '@/lib/api';


/*
<vibe_check>
Screen/Component : CreateTaskModal (components/productivity/CreateTaskModal.tsx)
Tujuan           : Dialog modal elegan untuk membuat tugas produktivitas baru beserta initial subtasks
Layout strategy  : Course horizontal selector -> Title & Description -> Priority Chips -> Deadline Picker -> Inline Subtask Builder -> Submit Button
Color tokens     : bg.surface, bg.overlay, brand.primary, text.primary, text.secondary
Animation plan   : FadeInDown modal transition
Typography       : SpaceGrotesk untuk label, JetBrainsMono untuk subtask counter
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
  courses: Course[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
  courses,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [label, setLabel] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [currentSubtaskInput, setCurrentSubtaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubtask = () => {
    if (!currentSubtaskInput.trim()) return;
    setSubtasks((prev) => [...prev, currentSubtaskInput.trim()]);
    setCurrentSubtaskInput('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Peringatan', 'Silakan masukkan judul tugas produktivitas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        course_id: courseId ?? undefined,
        priority,
        deadline: deadline.trim() || undefined,
        label: label.trim() || undefined,
        subtasks:
          subtasks.length > 0
            ? subtasks.map((st, idx) => ({ title: st, order: idx }))
            : undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCourseId(null);
      setPriority('medium');
      setDeadline('');
      setLabel('');
      setSubtasks([]);
      setCurrentSubtaskInput('');
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Gagal menyimpan tugas.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title="Tugas & To-Do Baru"
      subtitle="Catat target kerjaan pribadi atau keterkaitan matkul"
    >
      <View style={styles.formContainer}>
        {/* Course Picker (Optional) */}
        <Text style={styles.fieldLabel}>Terkait Mata Kuliah (Opsional)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseScroll}
        >
          <Pressable
            onPress={() => setCourseId(null)}
            style={[
              styles.courseChip,
              courseId === null && styles.courseChipActive,
            ]}
          >
            <Text
              style={[
                styles.courseChipText,
                courseId === null && styles.courseChipTextActive,
              ]}
            >
              Tanpa Matkul
            </Text>
          </Pressable>
          {courses.map((c) => {
            const isSelected = courseId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCourseId(c.id)}
                style={[
                  styles.courseChip,
                  isSelected && styles.courseChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.courseChipText,
                    isSelected && styles.courseChipTextActive,
                  ]}
                >
                  {c.code ? `[${c.code}] ` : ''}
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Title */}
        <UniInput
          label="Judul Tugas"
          placeholder="Contoh: Desain Arsitektur Sistem Mobile"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <UniInput
          label="Deskripsi / Catatan"
          placeholder="Rincian spesifikasi atau catatan penting"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Priority Selector */}
        <Text style={styles.fieldLabel}>Tingkat Prioritas</Text>
        <View style={styles.priorityRow}>
          {(
            [
              { key: 'low', label: 'RENDAH' },
              { key: 'medium', label: 'SEDANG' },
              { key: 'high', label: 'TINGGI' },
              { key: 'urgent', label: 'URGENT' },
            ] as const
          ).map((item) => {
            const isSelected = priority === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setPriority(item.key)}
                style={[
                  styles.priorityChip,
                  isSelected && styles.priorityChipActive,
                  isSelected && item.key === 'urgent' && styles.priorityChipUrgent,
                ]}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    isSelected && styles.priorityChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Deadline Picker */}
        <UniDatePicker
          label="Tenggat Waktu (Opsional)"
          value={deadline}
          onChange={setDeadline}
          placeholder="Pilih Tanggal Tenggat"
        />

        {/* Label Tag */}
        <UniInput
          label="Label / Tag (Opsional)"
          placeholder="Contoh: Skripsi, Lab, Projek"
          value={label}
          onChangeText={setLabel}
        />

        {/* Inline Subtasks Builder */}
        <View style={styles.subtaskSection}>
          <Text style={styles.fieldLabel}>Daftar Subtask / Checklist Awal</Text>
          <View style={styles.subtaskInputRow}>
            <View style={{ flex: 1 }}>
              <UniInput
                placeholder="Tambah subtask..."
                value={currentSubtaskInput}
                onChangeText={setCurrentSubtaskInput}
                onSubmitEditing={handleAddSubtask}
              />
            </View>
            <Pressable
              onPress={handleAddSubtask}
              style={styles.addSubtaskBtn}
              hitSlop={8}
            >
              <Plus size={18} color={themeColors.text.inverse} weight="bold" />
            </Pressable>
          </View>

          {subtasks.length > 0 && (
            <View style={styles.subtaskList}>
              {subtasks.map((st, idx) => (
                <View key={idx} style={styles.subtaskItem}>
                  <Text style={styles.subtaskNumber}>{idx + 1}.</Text>
                  <Text style={styles.subtaskText}>{st}</Text>
                  <Pressable
                    onPress={() => handleRemoveSubtask(idx)}
                    hitSlop={8}
                  >
                    <Trash size={15} color={themeColors.semantic.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit */}
        <View style={{ marginTop: spacing.md }}>
          <UniButton
            label="Simpan Tugas"
            onPress={handleSubmit}
            loading={isSubmitting}
          />
        </View>
      </View>
    </AcademicModal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    formContainer: {
      gap: spacing.md,
    },
    fieldLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      marginBottom: -4,
    },
    courseScroll: {
      gap: spacing.sm,
      paddingVertical: 4,
    },
    courseChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.md,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    courseChipActive: {
      backgroundColor: 'rgba(107, 127, 215, 0.2)',
      borderColor: colors.brand.primary,
    },
    courseChipText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    courseChipTextActive: {
      color: colors.brand.primary,
      fontWeight: '600',
    },
    priorityRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    priorityChip: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    priorityChipActive: {
      backgroundColor: 'rgba(107, 127, 215, 0.25)',
      borderColor: colors.brand.primary,
    },
    priorityChipUrgent: {
      backgroundColor: 'rgba(255, 107, 107, 0.2)',
      borderColor: colors.semantic.danger,
    },
    priorityChipText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    priorityChipTextActive: {
      color: colors.brand.primary,
      fontWeight: '700',
    },
    subtaskSection: {
      gap: spacing.xs,
    },
    subtaskInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    addSubtaskBtn: {
      backgroundColor: colors.brand.primary,
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subtaskList: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    subtaskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 4,
    },
    subtaskNumber: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
    },
    subtaskText: {
      flex: 1,
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      color: colors.text.primary,
    },
  });
