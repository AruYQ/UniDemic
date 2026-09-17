import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import {
  CheckCircle,
  CircleIcon,
  Clock,
  Tag,
  Trash,
  CaretDown,
  CaretUp,
  Plus,
  BookmarkSimple,
} from 'phosphor-react-native';
import { ProductivityTask, TaskPriority, TaskSubtask } from '@/types/productivity';
import { UniBadge } from '@/components/ui/UniBadge';
import { UniSwipeable } from '@/components/ui/UniSwipeable';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : TaskItemCard (components/productivity/TaskItemCard.tsx)
Tujuan           : Menampilkan kartu tugas produktivitas dengan subtask checklist interaktif, progress reaktif, dan swipe-to-delete
Layout strategy  : Bento card -> Header (Course & Priority) -> Title & Description -> Progress Bar -> Expandable Subtasks -> Footer Deadline
Color tokens     : bg.surface, bg.elevated, border.subtle, brand.primary, brand.secondary, priority semantic colors
Animation plan   : FadeInDown on mount, Layout.springify() on expand subtasks
Typography       : SpaceGrotesk untuk title, JetBrainsMono untuk subtask counts & progress
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #28 (spring tap)
</vibe_check>
*/

interface TaskItemCardProps {
  task: ProductivityTask;
  onToggleComplete?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggleSubtask?: (taskId: number, subtaskId: number, isDone: boolean) => void;
  onAddSubtask?: (taskId: number, title: string) => void;
  onDeleteSubtask?: (taskId: number, subtaskId: number) => void;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return { label: 'URGENT', variant: 'danger' as const, color: themeColors.semantic.danger };
      case 'high':
        return { label: 'TINGGI', variant: 'danger' as const, color: themeColors.semantic.danger };
      case 'medium':
        return { label: 'SEDANG', variant: 'warning' as const, color: themeColors.brand.accent };
      case 'low':
      default:
        return { label: 'RENDAH', variant: 'neutral' as const, color: themeColors.text.muted };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);

  const handleCreateSubtask = () => {
    if (!newSubtaskTitle.trim() || !onAddSubtask) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const subtasks = task.subtasks || [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.is_done).length;

  return (
    <UniSwipeable onDelete={onDelete ? () => onDelete(task.id) : undefined}>
      <Animated.View
        entering={FadeInDown.duration(240)}
        layout={Layout.springify()}
        style={[
          styles.container,
          task.is_completed && styles.containerCompleted,
        ]}
      >
        {/* Top Header Row: Course / Label & Priority Badge */}
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            {task.course ? (
              <UniBadge
                label={task.course.code || task.course.name.substring(0, 10)}
                variant="primary"
                size="sm"
              />
            ) : null}

            {task.label ? (
              <View style={styles.labelChip}>
                <Tag size={11} color={themeColors.text.secondary} weight="duotone" />
                <Text style={styles.labelText}>{task.label}</Text>
              </View>
            ) : null}

            <UniBadge
              label={priorityConfig.label}
              variant={priorityConfig.variant}
              size="sm"
            />
          </View>

          {/* Complete Checkbox Button */}
          {onToggleComplete && (
            <Pressable
              onPress={() => onToggleComplete(task.id)}
              hitSlop={8}
              style={styles.checkBtn}
            >
              {task.is_completed ? (
                <CheckCircle size={22} color={themeColors.semantic.success} weight="fill" />
              ) : (
                <CircleIcon size={22} color={themeColors.text.muted} weight="duotone" />
              )}
            </Pressable>
          )}
        </View>

        {/* Task Title */}
        <Text
          style={[
            styles.title,
            task.is_completed && styles.titleCompleted,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {/* Description if available */}
        {task.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}

        {/* Progress Bar & Subtask Meta */}
        <View style={styles.progressContainer}>
          <View style={styles.progressMeta}>
            <Text style={styles.progressLabel}>
              {totalSubtasks > 0
                ? `Subtask ${completedSubtasks}/${totalSubtasks}`
                : 'Progress Pengerjaan'}
            </Text>
            <Text style={styles.progressPercent}>{task.progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(Math.max(task.progress, 0), 100)}%`,
                  backgroundColor: task.is_completed
                    ? themeColors.semantic.success
                    : themeColors.brand.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Expand / Collapse Subtasks Toggle */}
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.expandRow}
          hitSlop={6}
        >
          <Text style={styles.expandText}>
            {isExpanded
              ? 'Tutup Rincian Subtask'
              : `Lihat Rincian Subtask (${totalSubtasks})`}
          </Text>
          {isExpanded ? (
            <CaretUp size={14} color={themeColors.brand.primary} weight="bold" />
          ) : (
            <CaretDown size={14} color={themeColors.brand.primary} weight="bold" />
          )}
        </Pressable>

        {/* Expanded Subtasks Checklist */}
        {isExpanded && (
          <View style={styles.subtasksContainer}>
            {subtasks.map((subtask) => (
              <View key={subtask.id} style={styles.subtaskRow}>
                <Pressable
                  onPress={() =>
                    onToggleSubtask &&
                    onToggleSubtask(task.id, subtask.id, !subtask.is_done)
                  }
                  style={styles.subtaskCheckArea}
                  hitSlop={6}
                >
                  {subtask.is_done ? (
                    <CheckCircle size={18} color={themeColors.semantic.success} weight="fill" />
                  ) : (
                    <CircleIcon size={18} color={themeColors.text.muted} weight="regular" />
                  )}
                  <Text
                    style={[
                      styles.subtaskTitle,
                      subtask.is_done && styles.subtaskTitleDone,
                    ]}
                  >
                    {subtask.title}
                  </Text>
                </Pressable>

                {onDeleteSubtask && (
                  <Pressable
                    onPress={() => onDeleteSubtask(task.id, subtask.id)}
                    hitSlop={6}
                    style={styles.subtaskDeleteBtn}
                  >
                    <Trash size={13} color={themeColors.text.muted} weight="duotone" />
                  </Pressable>
                )}
              </View>
            ))}

            {/* Add Subtask Input / Trigger */}
            {isAddingSubtask ? (
              <View style={styles.addSubtaskInputRow}>
                <TextInput
                  style={styles.subtaskInput}
                  placeholder="Nama subtask baru..."
                  placeholderTextColor={themeColors.text.muted}
                  value={newSubtaskTitle}
                  onChangeText={setNewSubtaskTitle}
                  autoFocus
                  onSubmitEditing={handleCreateSubtask}
                />
                <Pressable
                  onPress={handleCreateSubtask}
                  style={styles.subtaskAddSubmitBtn}
                >
                  <Text style={styles.subtaskAddSubmitText}>Simpan</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsAddingSubtask(true)}
                style={styles.addSubtaskTrigger}
              >
                <Plus size={13} color={themeColors.brand.primary} weight="bold" />
                <Text style={styles.addSubtaskTriggerText}>Tambah Subtask</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Footer: Deadline & Recurring info */}
        {task.deadline ? (
          <View style={styles.footerRow}>
            <View style={styles.deadlineContainer}>
              <Clock size={12} color={themeColors.text.muted} weight="duotone" />
              <Text style={styles.deadlineText}>Tenggat: {task.deadline}</Text>
            </View>
            {task.is_recurring ? (
              <View style={styles.recurringBadge}>
                <BookmarkSimple size={11} color={themeColors.brand.secondary} weight="duotone" />
                <Text style={styles.recurringText}>
                  {task.recurrence_pattern || 'Rutin'}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Animated.View>
    </UniSwipeable>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.card,
    },
    containerCompleted: {
      opacity: 0.75,
      borderColor: colors.border.default,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    labelChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.bg.elevated,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    labelText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.text.secondary,
    },
    checkBtn: {
      padding: 2,
    },
    title: {
      fontFamily: typography.body.fontFamily,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 22,
      marginBottom: 2,
    },
    titleCompleted: {
      textDecorationLine: 'line-through',
      color: colors.text.muted,
    },
    description: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    progressContainer: {
      marginVertical: spacing.xs,
    },
    progressMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    progressLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    progressPercent: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    progressTrack: {
      height: 5,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    expandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      marginTop: 2,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    expandText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    subtasksContainer: {
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.xs,
      gap: spacing.xs,
    },
    subtaskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 2,
    },
    subtaskCheckArea: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      paddingRight: spacing.sm,
    },
    subtaskTitle: {
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      color: colors.text.primary,
      flex: 1,
    },
    subtaskTitleDone: {
      textDecorationLine: 'line-through',
      color: colors.text.muted,
    },
    subtaskDeleteBtn: {
      padding: 3,
    },
    addSubtaskInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 4,
    },
    subtaskInput: {
      flex: 1,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      fontSize: 12,
      color: colors.text.primary,
      fontFamily: typography.body.fontFamily,
    },
    subtaskAddSubmitBtn: {
      backgroundColor: colors.brand.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.sm,
    },
    subtaskAddSubmitText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    addSubtaskTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      marginTop: 2,
    },
    addSubtaskTriggerText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.xs,
      marginTop: spacing.xs,
    },
    deadlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    deadlineText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    recurringBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    recurringText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.brand.secondary,
    },
  });
