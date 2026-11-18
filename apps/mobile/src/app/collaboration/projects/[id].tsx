import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import {
  ArrowLeft,
  Kanban,
  FlagCheckered,
  GitBranch,
  UsersThree,
  Trash,
  Plus,
  UserPlus,
  X,
  CalendarBlank,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollaborationStore } from '@/store/useCollaborationStore';
import { UniBadge } from '@/components/ui/UniBadge';
import { UniButton } from '@/components/ui/UniButton';
import { UniInput } from '@/components/ui/UniInput';
import { ShimmerBox } from '@/components/ui/UniSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { KanbanBoard } from '@/components/collaboration/KanbanBoard';
import { ProjectTaskModal } from '@/components/collaboration/ProjectTaskModal';
import { MilestoneListPanel } from '@/components/collaboration/MilestoneListPanel';
import { GithubActivityPanel } from '@/components/collaboration/GithubActivityPanel';
import {
  KanbanTaskStatus,
  ProjectMemberRole,
  ProjectStatus,
  ProjectTask,
  CreateProjectTaskPayload,
} from '@/types/collaboration';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : ProjectWorkspaceScreen (app/collaboration/projects/[id].tsx)
Tujuan           : Ruang kerja proyek mahasiswa terpadu dengan papan Kanban, Milestone tracker, feed GitHub, dan kolaborator tim
Layout strategy  : Header -> Project Info Strip -> 4-Segment Tab Bar (Kanban, Milestone, GitHub, Anggota) -> Workspace Content -> Contextual FAB
Color tokens     : bg.base, bg.surface, bg.elevated, brand.primary, brand.secondary, brand.accent, semantic.danger
Animation plan   : FadeInDown header, ShimmerBox skeleton loading, spring FAB press feedback
Typography       : Syne_700Bold judul, SpaceGrotesk headings & tabs, JetBrainsMono tanggal & counts
Anti-slop check  : Rule #2 (Phosphor Duotone), Rule #7 (UniBadge), Rule #21 (Skeleton loading), Dead-Zone delete action
</vibe_check>
*/

type WorkspaceTab = 'kanban' | 'milestones' | 'github' | 'members';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; variant: 'primary' | 'success' | 'warning' | 'neutral' }
> = {
  active: { label: 'AKTIF', variant: 'primary' },
  planning: { label: 'RENCANA', variant: 'warning' },
  completed: { label: 'SELESAI', variant: 'success' },
  archived: { label: 'ARSIP', variant: 'neutral' },
};

export default function ProjectWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Number(id);
  const router = useRouter();
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const { user } = useAuthStore();
  const {
    activeProject,
    milestones,
    tasks,
    githubActivities,
    isProjectDetailLoading,
    isSyncingGithub,
    fetchProjectDetail,
    deleteProject,
    addProjectMember,
    removeProjectMember,
    createMilestone,
    toggleMilestoneComplete,
    deleteMilestone,
    createProjectTask,
    updateProjectTask,
    moveProjectTask,
    deleteProjectTask,
    connectGithubRepo,
    disconnectGithubRepo,
    syncGithubRepo,
  } = useCollaborationStore();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('kanban');
  const [activeKanbanColumn, setActiveKanbanColumn] = useState<KanbanTaskStatus>('todo');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ProjectTask | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<KanbanTaskStatus>('todo');

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberUserIdText, setMemberUserIdText] = useState('');
  const [memberRole, setMemberRole] = useState<ProjectMemberRole>('editor');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const loadProject = useCallback(async () => {
    if (!projectId || Number.isNaN(projectId)) return;
    await fetchProjectDetail(projectId);
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProject();
    setIsRefreshing(false);
  };

  const project = activeProject?.id === projectId ? activeProject : null;
  const members = project?.members || [];
  const isManager = Boolean(
    project &&
      user &&
      (project.creator_id === user.id ||
        members.some((m) => m.user_id === user.id && m.role === 'owner'))
  );

  const handleSaveTask = async (payload: CreateProjectTaskPayload, editId?: number) => {
    if (editId) {
      await updateProjectTask(editId, payload);
    } else {
      await createProjectTask(projectId, payload);
    }
    await fetchProjectDetail(projectId);
  };

  const handleDeleteProject = () => {
    Alert.alert('Hapus Proyek?', `Proyek "${project?.name}" beserta seluruh tugasnya akan dihapus.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(projectId);
            router.back();
          } catch (e) {
            Alert.alert('Gagal', formatApiError(e));
          }
        },
      },
    ]);
  };

  const handleAddMember = async () => {
    setMemberError(null);
    const uid = Number(memberUserIdText.trim());
    if (!uid || Number.isNaN(uid) || uid <= 0) {
      setMemberError('Masukkan User ID numerik yang valid');
      return;
    }

    setIsAddingMember(true);
    try {
      await addProjectMember(projectId, uid, memberRole);
      setMemberUserIdText('');
      setShowAddMember(false);
    } catch (err) {
      setMemberError(formatApiError(err));
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = (targetUserId: number, name?: string) => {
    Alert.alert('Hapus Kolaborator?', `Keluarkan ${name || `User #${targetUserId}`} dari proyek?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluarkan',
        style: 'destructive',
        onPress: () =>
          removeProjectMember(projectId, targetUserId).catch((e) =>
            Alert.alert('Gagal', formatApiError(e))
          ),
      },
    ]);
  };

  const statusMeta = project
    ? PROJECT_STATUS_META[project.status] || PROJECT_STATUS_META.active
    : PROJECT_STATUS_META.active;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={20} color={themeColors.text.primary} weight="bold" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project?.name || 'Workspace Proyek'}
          </Text>
          {project?.study_group ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              Grup: {project.study_group.name}
            </Text>
          ) : null}
        </View>

        {isManager ? (
          <Pressable onPress={handleDeleteProject} style={styles.iconBtnDanger} hitSlop={8}>
            <Trash size={18} color={themeColors.semantic.danger} weight="duotone" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Full-Width 4-Segment Workspace Tabs */}
      <View style={styles.segmentBar}>
        <Pressable
          onPress={() => setActiveTab('kanban')}
          style={[styles.segmentTab, activeTab === 'kanban' && styles.segmentTabActive]}
        >
          <Kanban
            size={15}
            color={activeTab === 'kanban' ? themeColors.text.inverse : themeColors.text.secondary}
            weight="duotone"
          />
          <Text style={[styles.segmentText, activeTab === 'kanban' && styles.segmentTextActive]}>
            Kanban
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('milestones')}
          style={[styles.segmentTab, activeTab === 'milestones' && styles.segmentTabActive]}
        >
          <FlagCheckered
            size={15}
            color={activeTab === 'milestones' ? themeColors.text.inverse : themeColors.text.secondary}
            weight="duotone"
          />
          <Text style={[styles.segmentText, activeTab === 'milestones' && styles.segmentTextActive]}>
            Milestone
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('github')}
          style={[styles.segmentTab, activeTab === 'github' && styles.segmentTabActive]}
        >
          <GitBranch
            size={15}
            color={activeTab === 'github' ? themeColors.text.inverse : themeColors.text.secondary}
            weight="duotone"
          />
          <Text style={[styles.segmentText, activeTab === 'github' && styles.segmentTextActive]}>
            GitHub
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('members')}
          style={[styles.segmentTab, activeTab === 'members' && styles.segmentTabActive]}
        >
          <UsersThree
            size={15}
            color={activeTab === 'members' ? themeColors.text.inverse : themeColors.text.secondary}
            weight="duotone"
          />
          <Text style={[styles.segmentText, activeTab === 'members' && styles.segmentTextActive]}>
            Tim
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.brand.primary}
          />
        }
      >
        {isProjectDetailLoading && !project ? (
          <View style={{ gap: spacing.md }}>
            <ShimmerBox height={96} borderRadius={radius.lg} />
            <ShimmerBox height={140} borderRadius={radius.lg} />
            <ShimmerBox height={140} borderRadius={radius.lg} />
          </View>
        ) : !project ? (
          <EmptyState
            icon={<Kanban size={30} color={themeColors.text.muted} weight="duotone" />}
            title="Proyek Tidak Ditemukan"
            description="Anda tidak memiliki akses atau proyek telah dihapus."
          />
        ) : (
          <>
            {/* Compact Project Meta Card */}
            <Animated.View entering={FadeInDown.duration(220)} style={styles.metaStrip}>
              <View style={styles.metaLeft}>
                <UniBadge label={statusMeta.label} variant={statusMeta.variant} size="sm" />
                {project.due_date ? (
                  <View style={styles.duePill}>
                    <CalendarBlank size={12} color={themeColors.brand.accent} weight="duotone" />
                    <Text style={styles.dueText}>{project.due_date}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.metaCounts}>
                {tasks.length} Task · {milestones.length} Milestone
              </Text>
            </Animated.View>

            {activeTab === 'kanban' ? (
              <KanbanBoard
                tasks={tasks}
                activeColumn={activeKanbanColumn}
                onChangeColumn={setActiveKanbanColumn}
                onMoveTask={moveProjectTask}
                onEditTask={(t) => {
                  setTaskToEdit(t);
                  setDefaultTaskStatus(t.status);
                  setShowTaskModal(true);
                }}
                onDeleteTask={deleteProjectTask}
                onAddTaskInColumn={(col) => {
                  setTaskToEdit(null);
                  setDefaultTaskStatus(col);
                  setShowTaskModal(true);
                }}
              />
            ) : null}

            {activeTab === 'milestones' ? (
              <MilestoneListPanel
                milestones={milestones}
                onCreateMilestone={async (payload) => {
                  await createMilestone(projectId, payload);
                }}
                onToggleComplete={toggleMilestoneComplete}
                onDeleteMilestone={deleteMilestone}
              />
            ) : null}

            {activeTab === 'github' ? (
              <GithubActivityPanel
                repo={project.github_repo}
                activities={githubActivities}
                isSyncing={isSyncingGithub}
                isManager={isManager}
                onConnect={async (payload) => {
                  await connectGithubRepo(projectId, payload);
                }}
                onDisconnect={() => disconnectGithubRepo(projectId)}
                onSync={() => syncGithubRepo(projectId)}
              />
            ) : null}

            {activeTab === 'members' ? (
              <View style={styles.membersSection}>
                {project.study_group ? (
                  <View style={styles.groupBanner}>
                    <UsersThree size={18} color={themeColors.brand.secondary} weight="duotone" />
                    <Text style={styles.groupBannerText}>
                      Proyek terhubung ke grup belajar "{project.study_group.name}". Seluruh anggota grup otomatis dapat berkolaborasi di sini.
                    </Text>
                  </View>
                ) : null}

                {isManager ? (
                  <UniButton
                    label="Undang Kolaborator Proyek"
                    variant="secondary"
                    size="md"
                    leftIcon={<UserPlus size={16} color={themeColors.brand.primary} weight="duotone" />}
                    onPress={() => setShowAddMember(true)}
                  />
                ) : null}

                {members.map((mem) => (
                  <View key={mem.id} style={styles.memberCard}>
                    <View style={styles.memberLeft}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberInitial}>
                          {(mem.user?.name || 'U').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{mem.user?.name || `User #${mem.user_id}`}</Text>
                        <Text style={styles.memberEmail}>{mem.user?.email || `ID: ${mem.user_id}`}</Text>
                      </View>
                    </View>

                    <View style={styles.memberRight}>
                      <UniBadge
                        label={mem.role.toUpperCase()}
                        variant={mem.role === 'owner' ? 'primary' : mem.role === 'editor' ? 'success' : 'neutral'}
                        size="sm"
                      />
                      {isManager && mem.user_id !== project.creator_id ? (
                        <Pressable
                          onPress={() => handleRemoveMember(mem.user_id, mem.user?.name)}
                          style={styles.removeBtn}
                          hitSlop={8}
                        >
                          <Trash size={15} color={themeColors.semantic.danger} weight="duotone" />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Natural-Zone FAB for Kanban Tasks */}
      {activeTab === 'kanban' && project ? (
        <AnimatedPressable
          onPress={() => {
            setTaskToEdit(null);
            setDefaultTaskStatus(activeKanbanColumn);
            setShowTaskModal(true);
          }}
          onPressIn={() => {
            fabScale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
          }}
          onPressOut={() => {
            fabScale.value = withSpring(1, { damping: 15, stiffness: 200 });
          }}
          style={[styles.fab, fabAnimStyle]}
        >
          <Plus size={20} color={themeColors.text.inverse} weight="bold" />
          <Text style={styles.fabLabel}>Tugas Kanban</Text>
        </AnimatedPressable>
      ) : null}

      {/* Task Modal */}
      <ProjectTaskModal
        visible={showTaskModal}
        taskToEdit={taskToEdit}
        defaultStatus={defaultTaskStatus}
        milestones={milestones}
        members={members}
        onClose={() => setShowTaskModal(false)}
        onSubmit={handleSaveTask}
      />

      {/* Add Project Member Modal */}
      <Modal
        visible={showAddMember}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddMember(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <View style={styles.sheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Kolaborator Proyek</Text>
              <Pressable onPress={() => setShowAddMember(false)} style={styles.closeBtn} hitSlop={8}>
                <X size={20} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
            </View>

            {memberError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{memberError}</Text>
              </View>
            ) : null}

            <UniInput
              label="User ID Kolaborator *"
              placeholder="Contoh: 2"
              value={memberUserIdText}
              onChangeText={setMemberUserIdText}
              keyboardType="number-pad"
            />

            <Text style={styles.roleLabel}>Peran Kolaborator</Text>
            <View style={styles.roleChips}>
              {(['editor', 'viewer', 'owner'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setMemberRole(r)}
                  style={[styles.roleChip, memberRole === r && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipText, memberRole === r && styles.roleChipTextActive]}>
                    {r.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <UniButton
                label="Tambahkan Kolaborator"
                onPress={handleAddMember}
                loading={isAddingMember}
                size="lg"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnDanger: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: 'rgba(224, 91, 91, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 18,
      color: colors.text.primary,
    },
    headerSub: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    segmentBar: {
      flexDirection: 'row',
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: 4,
      gap: 4,
    },
    segmentTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      borderRadius: radius.md,
    },
    segmentTabActive: {
      backgroundColor: colors.brand.primary,
    },
    segmentText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: colors.text.inverse,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: 110,
      gap: spacing.md,
    },
    metaStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    metaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    duePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dueText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.brand.accent,
    },
    metaCounts: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    membersSection: {
      gap: spacing.md,
    },
    groupBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: spacing.md,
    },
    groupBannerText: {
      flex: 1,
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
    },
    memberLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    memberAvatar: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberInitial: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    memberName: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
    },
    memberEmail: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    memberRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    removeBtn: {
      width: 30,
      height: 30,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: spacing.xxl,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.brand.primary,
      paddingHorizontal: spacing.lg,
      height: 52,
      borderRadius: radius.full,
      ...shadows.elevated,
    },
    fabLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 14,
      color: colors.text.inverse,
      fontWeight: '600',
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
    roleLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    roleChips: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    roleChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.default,
      alignItems: 'center',
    },
    roleChipActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    roleChipText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    roleChipTextActive: {
      color: colors.text.inverse,
      fontWeight: '600',
    },
  });
