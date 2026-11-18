import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import {
  Kanban,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CalendarBlank,
  Trash,
  PencilSimple,
  Flag,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniBadge } from '@/components/ui/UniBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { KanbanTaskStatus, ProjectTask, ProjectTaskPriority } from '@/types/collaboration';

/*
<vibe_check>
Screen/Component : KanbanBoard (components/collaboration/KanbanBoard.tsx)
Tujuan           : Papan Kanban mobile-native 3 kolom (TODO, IN PROGRESS, DONE) dengan gestur swipe pindah kolom & kontrol urutan posisi
Layout strategy  : Full-width 3-Column Pill Switcher -> FlashList virtualized task cards -> tactile move/reorder controls
Color tokens     : bg.surface, bg.overlay, brand.primary, brand.secondary, brand.accent, semantic.danger
Animation plan   : Gesture.Pan() horizontal tactile drag feedback + withSpring snapback + FadeInDown entrance
Typography       : SpaceGrotesk untuk card titles & column tabs, JetBrainsMono untuk count badges, posisi, dan tanggal
Anti-slop check  : Rule #2 (Phosphor Duotone), Rule #6 (mobile-first switcher bukan 3-col sempit terpotong), FlashList virtualization
</vibe_check>
*/

export interface KanbanBoardProps {
  tasks: ProjectTask[];
  activeColumn: KanbanTaskStatus;
  onChangeColumn: (col: KanbanTaskStatus) => void;
  onMoveTask: (taskId: number, targetStatus: KanbanTaskStatus, targetPosition: number) => Promise<void>;
  onEditTask: (task: ProjectTask) => void;
  onDeleteTask: (taskId: number) => Promise<void>;
  onAddTaskInColumn: (col: KanbanTaskStatus) => void;
}

const COLUMNS: { key: KanbanTaskStatus; label: string }[] = [
  { key: 'todo', label: 'TODO' },
  { key: 'in_progress', label: 'PROSES' },
  { key: 'done', label: 'SELESAI' },
];

const PRIORITY_META: Record<ProjectTaskPriority, { label: string; variant: 'neutral' | 'primary' | 'warning' | 'danger' }> = {
  low: { label: 'RENDAH', variant: 'neutral' },
  medium: { label: 'SEDANG', variant: 'primary' },
  high: { label: 'TINGGI', variant: 'warning' },
  urgent: { label: 'URGENT', variant: 'danger' },
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
};

const KanbanTaskCard: React.FC<{
  task: ProjectTask;
  index: number;
  totalInColumn: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}> = React.memo(
  ({
    task,
    index,
    totalInColumn,
    canMoveLeft,
    canMoveRight,
    onMoveLeft,
    onMoveRight,
    onMoveUp,
    onMoveDown,
    onEdit,
    onDelete,
    colors,
    styles,
  }) => {
    const translateX = useSharedValue(0);

    const panGesture = Gesture.Pan()
      .activeOffsetX([-18, 18])
      .failOffsetY([-12, 12])
      .onUpdate((e) => {
        const clamped = Math.max(-72, Math.min(72, e.translationX));
        if ((clamped < 0 && !canMoveLeft) || (clamped > 0 && !canMoveRight)) {
          translateX.value = clamped * 0.25;
        } else {
          translateX.value = clamped;
        }
      })
      .onEnd((e) => {
        if (e.translationX > 48 && canMoveRight) {
          runOnJS(onMoveRight)();
        } else if (e.translationX < -48 && canMoveLeft) {
          runOnJS(onMoveLeft)();
        }
        translateX.value = withSpring(0, { damping: 16, stiffness: 200 });
      });

    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    const prio = PRIORITY_META[task.priority] || PRIORITY_META.medium;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index * 45, 250)).duration(220)}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.taskCard, animatedCardStyle]}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardBadges}>
                <UniBadge label={prio.label} variant={prio.variant} size="sm" />
                {task.milestone ? (
                  <View style={styles.milestoneChip}>
                    <Flag size={11} color={colors.brand.secondary} weight="duotone" />
                    <Text style={styles.milestoneText} numberOfLines={1}>
                      {task.milestone.title}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardTopActions}>
                <Pressable onPress={onEdit} hitSlop={8} style={styles.miniIconBtn}>
                  <PencilSimple size={15} color={colors.text.secondary} weight="duotone" />
                </Pressable>
                <Pressable onPress={onDelete} hitSlop={8} style={styles.miniIconBtn}>
                  <Trash size={15} color={colors.semantic.danger} weight="duotone" />
                </Pressable>
              </View>
            </View>

            <Text style={styles.taskTitle}>{task.title}</Text>
            {task.description ? (
              <Text style={styles.taskDesc} numberOfLines={2}>
                {task.description}
              </Text>
            ) : null}

            {task.labels && task.labels.length > 0 ? (
              <View style={styles.labelsRow}>
                {task.labels.slice(0, 4).map((lbl, idx) => (
                  <View key={`${lbl}_${idx}`} style={styles.labelPill}>
                    <Text style={styles.labelPillText}>#{lbl}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.cardMetaRow}>
              <View style={styles.assigneeRow}>
                {task.assignee ? (
                  <>
                    <View style={styles.assigneeAvatar}>
                      <Text style={styles.assigneeInitial}>
                        {getInitials(task.assignee.name)}
                      </Text>
                    </View>
                    <Text style={styles.assigneeName} numberOfLines={1}>
                      {task.assignee.name}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.unassignedText}>Belum ditugaskan</Text>
                )}
              </View>

              {task.due_date ? (
                <View style={styles.dueBadge}>
                  <CalendarBlank size={12} color={colors.brand.accent} weight="duotone" />
                  <Text style={styles.dueText}>{task.due_date}</Text>
                </View>
              ) : null}
            </View>

            {/* Tactile Column Move & Reorder Action Strip */}
            <View style={styles.moveStrip}>
              <View style={styles.reorderGroup}>
                <Pressable
                  onPress={onMoveUp}
                  disabled={index === 0}
                  style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}
                  hitSlop={6}
                >
                  <ArrowUp size={13} color={colors.text.secondary} weight="bold" />
                </Pressable>
                <Pressable
                  onPress={onMoveDown}
                  disabled={index >= totalInColumn - 1}
                  style={[styles.moveBtn, index >= totalInColumn - 1 && styles.moveBtnDisabled]}
                  hitSlop={6}
                >
                  <ArrowDown size={13} color={colors.text.secondary} weight="bold" />
                </Pressable>
              </View>

              <View style={styles.columnMoveGroup}>
                {canMoveLeft ? (
                  <Pressable onPress={onMoveLeft} style={styles.columnMoveBtn} hitSlop={6}>
                    <ArrowLeft size={13} color={colors.brand.primary} weight="bold" />
                    <Text style={styles.columnMoveText}>
                      {task.status === 'in_progress' ? 'TODO' : 'PROSES'}
                    </Text>
                  </Pressable>
                ) : null}
                {canMoveRight ? (
                  <Pressable onPress={onMoveRight} style={styles.columnMoveBtnPrimary} hitSlop={6}>
                    <Text style={styles.columnMoveTextPrimary}>
                      {task.status === 'todo' ? 'PROSES' : 'SELESAI'}
                    </Text>
                    <ArrowRight size={13} color={colors.text.inverse} weight="bold" />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    );
  }
);

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  activeColumn,
  onChangeColumn,
  onMoveTask,
  onEditTask,
  onDeleteTask,
  onAddTaskInColumn,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const counts = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  }, [tasks]);

  const columnTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === activeColumn)
      .sort((a, b) => a.position - b.position || a.id - b.id);
  }, [tasks, activeColumn]);

  const handleConfirmDelete = (task: ProjectTask) => {
    Alert.alert('Hapus Tugas Kanban?', `Tugas "${task.title}" akan dihapus dari papan proyek.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          onDeleteTask(task.id).catch((err) =>
            Alert.alert('Gagal Menghapus', err?.message || 'Tidak dapat menghapus tugas')
          );
        },
      },
    ]);
  };

  const getAdjacentStatus = (status: KanbanTaskStatus, dir: 'left' | 'right'): KanbanTaskStatus | null => {
    if (dir === 'left') {
      if (status === 'in_progress') return 'todo';
      if (status === 'done') return 'in_progress';
      return null;
    }
    if (status === 'todo') return 'in_progress';
    if (status === 'in_progress') return 'done';
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Full-width 3-Segment Kanban Column Switcher */}
      <View style={styles.columnBar}>
        {COLUMNS.map((col) => {
          const active = activeColumn === col.key;
          return (
            <Pressable
              key={col.key}
              onPress={() => onChangeColumn(col.key)}
              style={[styles.columnTab, active && styles.columnTabActive]}
            >
              <Text style={[styles.columnTabLabel, active && styles.columnTabLabelActive]}>
                {col.label}
              </Text>
              <View style={[styles.countPill, active && styles.countPillActive]}>
                <Text style={[styles.countText, active && styles.countTextActive]}>
                  {counts[col.key]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hintText}>
        Geser kartu ke kiri/kanan atau gunakan tombol aksi untuk memindahkan kolom Kanban.
      </Text>

      {columnTasks.length === 0 ? (
        <EmptyState
          icon={<Kanban size={28} color={themeColors.brand.primary} weight="duotone" />}
          title="Kolom Kanban Kosong"
          description={`Belum ada tugas di kolom ${COLUMNS.find((c) => c.key === activeColumn)?.label}.`}
          actionLabel="Tambah Tugas"
          onAction={() => onAddTaskInColumn(activeColumn)}
        />
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={columnTasks}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item, index }) => {
              const leftStatus = getAdjacentStatus(item.status, 'left');
              const rightStatus = getAdjacentStatus(item.status, 'right');

              return (
                <KanbanTaskCard
                  task={item}
                  index={index}
                  totalInColumn={columnTasks.length}
                  canMoveLeft={leftStatus !== null}
                  canMoveRight={rightStatus !== null}
                  onMoveLeft={() => {
                    if (leftStatus) {
                      onMoveTask(item.id, leftStatus, counts[leftStatus]);
                    }
                  }}
                  onMoveRight={() => {
                    if (rightStatus) {
                      onMoveTask(item.id, rightStatus, counts[rightStatus]);
                    }
                  }}
                  onMoveUp={() => {
                    if (index > 0) {
                      onMoveTask(item.id, item.status, index - 1);
                    }
                  }}
                  onMoveDown={() => {
                    if (index < columnTasks.length - 1) {
                      onMoveTask(item.id, item.status, index + 1);
                    }
                  }}
                  onEdit={() => onEditTask(item)}
                  onDelete={() => handleConfirmDelete(item)}
                  colors={themeColors}
                  styles={styles}
                />
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    columnBar: {
      flexDirection: 'row',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: 4,
      gap: 4,
    },
    columnTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: radius.md,
    },
    columnTabActive: {
      backgroundColor: colors.brand.primary,
    },
    columnTabLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    columnTabLabelActive: {
      color: colors.text.inverse,
    },
    countPill: {
      minWidth: 20,
      height: 20,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    countPillActive: {
      backgroundColor: 'rgba(15, 17, 23, 0.22)',
    },
    countText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.primary,
      fontWeight: '700',
    },
    countTextActive: {
      color: colors.text.inverse,
    },
    hintText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
    },
    listContainer: {
      minHeight: 120,
    },
    taskCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      gap: spacing.sm,
      ...shadows.card,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    cardBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      flexWrap: 'wrap',
    },
    milestoneChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radius.sm,
      maxWidth: 140,
    },
    milestoneText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.brand.secondary,
    },
    cardTopActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    miniIconBtn: {
      width: 30,
      height: 30,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
      lineHeight: 22,
    },
    taskDesc: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    labelsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    labelPill: {
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    labelPillText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    cardMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    assigneeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    assigneeAvatar: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    assigneeInitial: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    assigneeName: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    unassignedText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
    },
    dueBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dueText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.brand.accent,
    },
    moveStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      marginTop: 2,
    },
    reorderGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    moveBtn: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moveBtnDisabled: {
      opacity: 0.3,
    },
    columnMoveGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    columnMoveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    columnMoveText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    columnMoveBtnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.brand.primary,
    },
    columnMoveTextPrimary: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.inverse,
      fontWeight: '600',
    },
  });
