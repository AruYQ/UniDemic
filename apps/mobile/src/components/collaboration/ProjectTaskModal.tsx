import React, { useState, useEffect, useMemo } from 'react';
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
import { X, Kanban, Flag, UserCircle } from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { UniDatePicker } from '@/components/ui/UniDatePicker';
import {
  KanbanTaskStatus,
  ProjectTaskPriority,
  ProjectMilestone,
  ProjectMember,
  ProjectTask,
  CreateProjectTaskPayload,
  createProjectTaskSchema,
} from '@/types/collaboration';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : ProjectTaskModal (components/collaboration/ProjectTaskModal.tsx)
Tujuan           : Modal buat/edit tugas papan Kanban dengan pemilih status kolom, prioritas, milestone, assignee, label, dan UniDatePicker
Layout strategy  : Bottom sheet modal dengan header -> scrollable form controls -> primary CTA di thumb zone
Color tokens     : bg.elevated, bg.surface, brand.primary, border.subtle, semantic.danger
Animation plan   : Native slide modal + UniButton spring feedback
Typography       : SpaceGrotesk untuk headings & pills, JetBrainsMono untuk tanggal & label
Anti-slop check  : Rule #3 (no pure white/black), UniDatePicker wajib tanpa input teks manual, Zod validation
</vibe_check>
*/

export interface ProjectTaskModalProps {
  visible: boolean;
  taskToEdit?: ProjectTask | null;
  defaultStatus?: KanbanTaskStatus;
  milestones: ProjectMilestone[];
  members: ProjectMember[];
  onClose: () => void;
  onSubmit: (payload: CreateProjectTaskPayload, editId?: number) => Promise<void>;
}

const STATUS_OPTIONS: { value: KanbanTaskStatus; label: string }[] = [
  { value: 'todo', label: 'TODO' },
  { value: 'in_progress', label: 'IN PROGRESS' },
  { value: 'done', label: 'DONE' },
];

const PRIORITY_OPTIONS: { value: ProjectTaskPriority; label: string }[] = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
  { value: 'urgent', label: 'Mendesak' },
];

export const ProjectTaskModal: React.FC<ProjectTaskModalProps> = ({
  visible,
  taskToEdit = null,
  defaultStatus = 'todo',
  milestones,
  members,
  onClose,
  onSubmit,
}) => {
  const { colors: themeColors } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<KanbanTaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<ProjectTaskPriority>('medium');
  const [milestoneId, setMilestoneId] = useState<number | null>(null);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [labelsText, setLabelsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setMilestoneId(taskToEdit.milestone_id ?? null);
      setAssigneeId(taskToEdit.assignee_id ?? null);
      setDueDate(taskToEdit.due_date || '');
      setLabelsText((taskToEdit.labels || []).join(', '));
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setMilestoneId(null);
      setAssigneeId(null);
      setDueDate('');
      setLabelsText('');
    }
    setErrorMsg(null);
  }, [visible, taskToEdit, defaultStatus]);

  const handleSave = async () => {
    setErrorMsg(null);
    const parsed = createProjectTaskSchema.safeParse({
      title,
      description: description || undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Periksa kembali input tugas Anda');
      return;
    }

    const labels = labelsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          title: parsed.data.title,
          description: parsed.data.description || null,
          status,
          priority,
          milestone_id: milestoneId,
          assignee_id: assigneeId,
          due_date: dueDate || null,
          labels,
        },
        taskToEdit?.id
      );
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
              <Text style={styles.title}>
                {taskToEdit ? 'Edit Tugas Kanban' : 'Tambah Tugas Kanban'}
              </Text>
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
              label="Judul Tugas *"
              placeholder="Contoh: Implementasi API Autentikasi"
              value={title}
              onChangeText={setTitle}
            />

            <UniInput
              label="Deskripsi"
              placeholder="Catatan teknis, acceptance criteria..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 70, textAlignVertical: 'top' }}
            />

            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>Kolom Kanban</Text>
              <View style={styles.chipRowWrap}>
                {STATUS_OPTIONS.map((opt) => {
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

            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>Prioritas</Text>
              <View style={styles.chipRowWrap}>
                {PRIORITY_OPTIONS.map((opt) => {
                  const active = priority === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setPriority(opt.value)}
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
              label="Tenggat Waktu (Opsional)"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Pilih tanggal deadline tugas"
            />

            {milestones.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionLabelRow}>
                  <Flag size={14} color={themeColors.text.secondary} weight="duotone" />
                  <Text style={styles.sectionLabel}>Milestone Terkait</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <Pressable
                    onPress={() => setMilestoneId(null)}
                    style={[styles.chip, milestoneId === null && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, milestoneId === null && styles.chipTextActive]}>
                      Tanpa Milestone
                    </Text>
                  </Pressable>
                  {milestones.map((m) => {
                    const active = milestoneId === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setMilestoneId(m.id)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {m.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {members.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionLabelRow}>
                  <UserCircle size={14} color={themeColors.text.secondary} weight="duotone" />
                  <Text style={styles.sectionLabel}>Penanggung Jawab (Assignee)</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <Pressable
                    onPress={() => setAssigneeId(null)}
                    style={[styles.chip, assigneeId === null && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, assigneeId === null && styles.chipTextActive]}>
                      Belum Ditugaskan
                    </Text>
                  </Pressable>
                  {members.map((mem) => {
                    const active = assigneeId === mem.user_id;
                    return (
                      <Pressable
                        key={mem.user_id}
                        onPress={() => setAssigneeId(mem.user_id)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {mem.user?.name || `User #${mem.user_id}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <UniInput
              label="Label / Tag (pisahkan koma)"
              placeholder="Contoh: backend, api, urgent"
              value={labelsText}
              onChangeText={setLabelsText}
            />
          </ScrollView>

          <View style={styles.footer}>
            <UniButton
              label={taskToEdit ? 'Simpan Perubahan' : 'Tambahkan ke Kanban'}
              onPress={handleSave}
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
      maxHeight: '90%',
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
      fontSize: 18,
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
      marginBottom: spacing.xs,
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
