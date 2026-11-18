import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  FlagCheckered,
  CheckCircle,
  CircleIcon,
  CalendarBlank,
  Plus,
  X,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniBadge } from '@/components/ui/UniBadge';
import { UniButton } from '@/components/ui/UniButton';
import { UniInput } from '@/components/ui/UniInput';
import { UniDatePicker } from '@/components/ui/UniDatePicker';
import { UniSwipeable } from '@/components/ui/UniSwipeable';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ProjectMilestone,
  CreateMilestonePayload,
  createMilestoneSchema,
} from '@/types/collaboration';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : MilestoneListPanel (components/collaboration/MilestoneListPanel.tsx)
Tujuan           : Melacak milestone capaian proyek tim lengkap dengan progress bar teranimasi, toggle selesai, dan swipe-to-delete
Layout strategy  : Progress hero card -> list milestone cards dengan status toggle & UniSwipeable -> modal buat milestone
Color tokens     : bg.surface, bg.elevated, brand.primary, brand.secondary, brand.accent, border.subtle
Animation plan   : withTiming progress bar fill + FadeInDown cards
Typography       : Syne_700Bold persentase, SpaceGrotesk judul & deskripsi, JetBrainsMono angka & tanggal
Anti-slop check  : Rule #2 (Phosphor Duotone), Rule #7 (UniBadge), UniDatePicker wajib tanpa input manual tanggal
</vibe_check>
*/

export interface MilestoneListPanelProps {
  milestones: ProjectMilestone[];
  onCreateMilestone: (payload: CreateMilestonePayload) => Promise<void>;
  onToggleComplete: (id: number) => Promise<void>;
  onDeleteMilestone: (id: number) => Promise<void>;
}

export const MilestoneListPanel: React.FC<MilestoneListPanelProps> = ({
  milestones,
  onCreateMilestone,
  onToggleComplete,
  onDeleteMilestone,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const completedCount = milestones.filter((m) => m.is_completed).length;
  const totalCount = milestones.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const progressAnim = useSharedValue(0);
  useEffect(() => {
    progressAnim.value = withTiming(pct, {
      duration: 600,
      easing: Easing.out(Easing.exp),
    });
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  const handleCreate = async () => {
    setErrorMsg(null);
    const parsed = createMilestoneSchema.safeParse({
      title,
      description: description || undefined,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Periksa kembali input milestone');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateMilestone({
        title: parsed.data.title,
        description: parsed.data.description || null,
        due_date: dueDate || null,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowCreateModal(false);
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (m: ProjectMilestone) => {
    Alert.alert('Hapus Milestone?', `Hapus milestone "${m.title}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => onDeleteMilestone(m.id).catch((e) => Alert.alert('Gagal', formatApiError(e))),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Progress Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryLabel}>PROGRES MILESTONE</Text>
            <Text style={styles.summaryValue}>
              {completedCount}/{totalCount} Selesai
            </Text>
          </View>
          <Text style={styles.summaryPct}>{pct}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>

        <View style={styles.summaryFooter}>
          <UniButton
            label="Tambah Milestone"
            onPress={() => setShowCreateModal(true)}
            variant="secondary"
            size="md"
            leftIcon={<Plus size={16} color={themeColors.brand.primary} weight="bold" />}
          />
        </View>
      </View>

      {milestones.length === 0 ? (
        <EmptyState
          icon={<FlagCheckered size={28} color={themeColors.brand.secondary} weight="duotone" />}
          title="Belum Ada Milestone"
          description="Tetapkan target tahapan proyek untuk memantau progres penyelesaian tim."
          actionLabel="Buat Milestone"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <View style={styles.list}>
          {milestones.map((m, idx) => (
            <Animated.View
              key={m.id}
              entering={FadeInDown.delay(Math.min(idx * 50, 250)).duration(220)}
            >
              <UniSwipeable onDelete={() => confirmDelete(m)}>
                <View style={styles.milestoneCard}>
                  <Pressable
                    onPress={() =>
                      onToggleComplete(m.id).catch((e) => Alert.alert('Gagal', formatApiError(e)))
                    }
                    style={styles.checkBtn}
                    hitSlop={10}
                  >
                    {m.is_completed ? (
                      <CheckCircle size={26} color={themeColors.brand.secondary} weight="duotone" />
                    ) : (
                      <CircleIcon size={26} color={themeColors.text.muted} weight="duotone" />
                    )}
                  </Pressable>

                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text
                        style={[
                          styles.milestoneTitle,
                          m.is_completed && styles.milestoneTitleDone,
                        ]}
                      >
                        {m.title}
                      </Text>
                      <UniBadge
                        label={m.is_completed ? 'SELESAI' : 'AKTIF'}
                        variant={m.is_completed ? 'success' : 'primary'}
                        size="sm"
                      />
                    </View>

                    {m.description ? (
                      <Text style={styles.milestoneDesc} numberOfLines={2}>
                        {m.description}
                      </Text>
                    ) : null}

                    <View style={styles.metaRow}>
                      {typeof m.tasks_count === 'number' ? (
                        <Text style={styles.metaText}>
                          Task: {m.completed_tasks_count ?? 0}/{m.tasks_count}
                        </Text>
                      ) : null}
                      {m.due_date ? (
                        <View style={styles.dueRow}>
                          <CalendarBlank size={12} color={themeColors.brand.accent} weight="duotone" />
                          <Text style={styles.dueText}>{m.due_date}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </UniSwipeable>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Create Milestone Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <View style={styles.sheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <FlagCheckered size={22} color={themeColors.brand.secondary} weight="duotone" />
                <Text style={styles.modalTitle}>Tambah Milestone</Text>
              </View>
              <Pressable onPress={() => setShowCreateModal(false)} style={styles.closeBtn} hitSlop={8}>
                <X size={20} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
            </View>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <UniInput
              label="Judul Milestone *"
              placeholder="Contoh: Sprint 1 — MVP Backend API"
              value={title}
              onChangeText={setTitle}
            />

            <UniInput
              label="Deskripsi (Opsional)"
              placeholder="Rincian target capaian milestone..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 70, textAlignVertical: 'top' }}
            />

            <UniDatePicker
              label="Target Tanggal"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Pilih tanggal target milestone"
            />

            <View style={{ marginTop: spacing.md }}>
              <UniButton
                label="Simpan Milestone"
                onPress={handleCreate}
                loading={isSubmitting}
                size="lg"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    summaryCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      gap: spacing.md,
      ...shadows.card,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
      letterSpacing: 0.5,
    },
    summaryValue: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 18,
      color: colors.text.primary,
      marginTop: 2,
    },
    summaryPct: {
      fontFamily: typography.display.fontFamily,
      fontSize: 28,
      color: colors.brand.secondary,
    },
    progressTrack: {
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
      backgroundColor: colors.brand.secondary,
    },
    summaryFooter: {
      marginTop: 2,
    },
    list: {
      gap: spacing.md,
    },
    milestoneCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      ...shadows.card,
    },
    checkBtn: {
      paddingTop: 2,
    },
    cardBody: {
      flex: 1,
      gap: 4,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    milestoneTitle: {
      flex: 1,
      fontFamily: typography.h3.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
    },
    milestoneTitleDone: {
      textDecorationLine: 'line-through',
      color: colors.text.muted,
    },
    milestoneDesc: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: 4,
    },
    metaText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    dueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dueText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.brand.accent,
    },
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
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    modalTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    modalTitle: {
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
  });
