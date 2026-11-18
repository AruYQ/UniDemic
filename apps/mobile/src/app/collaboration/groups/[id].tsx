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
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  UsersThree,
  Kanban,
  Books,
  ChatCircleDots,
  Key,
  ArrowsClockwise,
  UserPlus,
  Trash,
  NotePencil,
  FileText,
  Plus,
  X,
  SignOut,
  ShieldCheck,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAcademicStore } from '@/store/useAcademicStore';
import { useLearningStore } from '@/store/useLearningStore';
import { useCollaborationStore } from '@/store/useCollaborationStore';
import { UniBadge } from '@/components/ui/UniBadge';
import { UniButton } from '@/components/ui/UniButton';
import { UniInput } from '@/components/ui/UniInput';
import { ShimmerBox } from '@/components/ui/UniSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProjectCard } from '@/components/collaboration/ProjectCard';
import { CreateProjectModal } from '@/components/collaboration/CreateProjectModal';
import { StudyGroupRole } from '@/types/collaboration';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : StudyGroupDetailScreen (app/collaboration/groups/[id].tsx)
Tujuan           : Workspace detail grup belajar lintas kampus: kode undangan, obrolan grup, proyek tim, manajemen anggota & role, serta berbagi catatan/materi
Layout strategy  : Header (Back + Delete/Leave di Dead Zone) -> Hero Group Card (Invite Code + Open Chat) -> 3-Segment Tabs -> Content Panels
Color tokens     : bg.base, bg.surface, bg.elevated, brand.primary, brand.secondary, brand.accent, semantic.danger
Animation plan   : FadeInDown hero & cards, ShimmerBox skeleton loading
Typography       : Syne_700Bold judul & kode invite, SpaceGrotesk body & tabs, JetBrainsMono angka & user IDs
Anti-slop check  : Rule #2 (Phosphor Duotone), Rule #7 (UniBadge), Rule #21 (Skeleton loading), Dead-Zone destructive actions
</vibe_check>
*/

type GroupTab = 'projects' | 'members' | 'resources';

export default function StudyGroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = Number(id);
  const router = useRouter();
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const { user } = useAuthStore();
  const { courses, fetchCoursesAndSemesters } = useAcademicStore();
  const { notes, materials, fetchNotes, fetchMaterials } = useLearningStore();
  const {
    activeStudyGroup,
    myStudyGroups,
    projects,
    isGroupDetailLoading,
    fetchStudyGroupDetail,
    fetchProjects,
    createProject,
    deleteStudyGroup,
    joinStudyGroup,
    regenerateInviteCode,
    addStudyGroupMember,
    updateStudyGroupMemberRole,
    removeStudyGroupMember,
    shareNoteToGroup,
    unshareNoteFromGroup,
    shareMaterialToGroup,
    unshareMaterialFromGroup,
  } = useCollaborationStore();

  const [activeTab, setActiveTab] = useState<GroupTab>('projects');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberUserIdText, setMemberUserIdText] = useState('');
  const [memberRole, setMemberRole] = useState<StudyGroupRole>('member');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareType, setShareType] = useState<'note' | 'material'>('note');

  const loadData = useCallback(async () => {
    if (!groupId || Number.isNaN(groupId)) return;
    await Promise.all([
      fetchStudyGroupDetail(groupId),
      fetchProjects({ forceRefresh: true }),
      fetchCoursesAndSemesters(),
    ]);
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const group = activeStudyGroup?.id === groupId ? activeStudyGroup : null;
  const members = group?.members || [];
  const currentMembership = members.find((m) => m.user_id === user?.id);
  const isMember = Boolean(currentMembership);
  const isCreator = Boolean(group && user && group.creator_id === user.id);
  const isAdmin = isCreator || currentMembership?.role === 'admin';

  const groupProjects = useMemo(
    () => projects.filter((p) => p.study_group_id === groupId),
    [projects, groupId]
  );

  const handleRegenerateInvite = async () => {
    try {
      const code = await regenerateInviteCode(groupId);
      Alert.alert('Kode Diperbarui', `Kode undangan baru: ${code}`);
    } catch (err) {
      Alert.alert('Gagal', formatApiError(err));
    }
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
      await addStudyGroupMember(groupId, uid, memberRole);
      setMemberUserIdText('');
      setShowAddMember(false);
    } catch (err) {
      setMemberError(formatApiError(err));
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleCycleRole = (targetUserId: number, currentRole: StudyGroupRole, name?: string) => {
    if (!isAdmin || targetUserId === group?.creator_id) return;
    const nextRole: StudyGroupRole =
      currentRole === 'member' ? 'moderator' : currentRole === 'moderator' ? 'admin' : 'member';

    Alert.alert(
      'Ubah Peran Anggota',
      `Ubah peran ${name || `User #${targetUserId}`} menjadi ${nextRole.toUpperCase()}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ubah',
          onPress: () =>
            updateStudyGroupMemberRole(groupId, targetUserId, nextRole).catch((e) =>
              Alert.alert('Gagal', formatApiError(e))
            ),
        },
      ]
    );
  };

  const handleRemoveMember = (targetUserId: number, name?: string) => {
    const isSelf = targetUserId === user?.id;
    Alert.alert(
      isSelf ? 'Keluar dari Grup?' : 'Keluarkan Anggota?',
      isSelf
        ? 'Anda akan keluar dari grup belajar dan obrolan grup ini.'
        : `Keluarkan ${name || `User #${targetUserId}`} dari grup?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: isSelf ? 'Keluar' : 'Keluarkan',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeStudyGroupMember(groupId, targetUserId);
              if (isSelf) {
                router.back();
              }
            } catch (e) {
              Alert.alert('Gagal', formatApiError(e));
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Hapus Grup Belajar?',
      'Grup belajar beserta seluruh keanggotaan akan dihapus permanen.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudyGroup(groupId);
              router.back();
            } catch (e) {
              Alert.alert('Gagal Menghapus', formatApiError(e));
            }
          },
        },
      ]
    );
  };

  const handleOpenShareModal = async (type: 'note' | 'material') => {
    setShareType(type);
    setShowShareModal(true);
    if (type === 'note') {
      await fetchNotes();
    } else {
      await fetchMaterials();
    }
  };

  const getRoleVariant = (role: StudyGroupRole): 'primary' | 'warning' | 'neutral' => {
    if (role === 'admin') return 'primary';
    if (role === 'moderator') return 'warning';
    return 'neutral';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={20} color={themeColors.text.primary} weight="bold" />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {group?.name || 'Detail Grup'}
        </Text>

        {isCreator ? (
          <Pressable onPress={handleDeleteGroup} style={styles.iconBtnDanger} hitSlop={8}>
            <Trash size={18} color={themeColors.semantic.danger} weight="duotone" />
          </Pressable>
        ) : isMember && user ? (
          <Pressable
            onPress={() => handleRemoveMember(user.id)}
            style={styles.iconBtnDanger}
            hitSlop={8}
          >
            <SignOut size={18} color={themeColors.semantic.danger} weight="duotone" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
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
        {isGroupDetailLoading && !group ? (
          <View style={{ gap: spacing.md }}>
            <ShimmerBox height={175} borderRadius={radius.xl} />
            <ShimmerBox height={52} borderRadius={radius.lg} />
            <ShimmerBox height={130} borderRadius={radius.lg} />
          </View>
        ) : !group ? (
          <EmptyState
            icon={<UsersThree size={30} color={themeColors.text.muted} weight="duotone" />}
            title="Grup Tidak Ditemukan"
            description="Grup belajar ini mungkin privat atau sudah dihapus."
          />
        ) : (
          <>
            {/* Hero Group Overview Card */}
            <Animated.View entering={FadeInDown.duration(260)} style={styles.heroCard}>
              <View style={styles.heroBadges}>
                <UniBadge label={group.subject || group.course?.code || 'KOLABORASI'} variant="primary" size="sm" />
                <UniBadge
                  label={group.is_public ? 'GRUP PUBLIK' : 'GRUP PRIVAT'}
                  variant={group.is_public ? 'success' : 'neutral'}
                  size="sm"
                />
              </View>

              <Text style={styles.heroTitle}>{group.name}</Text>
              {group.description ? <Text style={styles.heroDesc}>{group.description}</Text> : null}

              {isMember ? (
                <View style={styles.inviteBar}>
                  <View style={styles.inviteLeft}>
                    <Key size={16} color={themeColors.brand.accent} weight="duotone" />
                    <View>
                      <Text style={styles.inviteLabel}>KODE UNDANGAN</Text>
                      <Text style={styles.inviteValue}>{group.invite_code}</Text>
                    </View>
                  </View>

                  {isAdmin ? (
                    <Pressable onPress={handleRegenerateInvite} style={styles.regenBtn} hitSlop={8}>
                      <ArrowsClockwise size={15} color={themeColors.brand.primary} weight="bold" />
                      <Text style={styles.regenText}>Acak</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <UniButton
                  label="Gabung Grup Ini"
                  onPress={() =>
                    joinStudyGroup({ study_group_id: group.id })
                      .then(() => fetchStudyGroupDetail(group.id))
                      .catch((e) => Alert.alert('Gagal', formatApiError(e)))
                  }
                  size="md"
                />
              )}

              {isMember && group.conversation_id ? (
                <UniButton
                  label="Buka Obrolan Grup"
                  variant="secondary"
                  size="md"
                  leftIcon={<ChatCircleDots size={18} color={themeColors.brand.primary} weight="duotone" />}
                  onPress={() => router.push(`/chat/${group.conversation_id}` as any)}
                />
              ) : null}
            </Animated.View>

            {/* 3-Segment Workspace Tabs */}
            <View style={styles.segmentBar}>
              <Pressable
                onPress={() => setActiveTab('projects')}
                style={[styles.segmentTab, activeTab === 'projects' && styles.segmentTabActive]}
              >
                <Kanban
                  size={15}
                  color={activeTab === 'projects' ? themeColors.text.inverse : themeColors.text.secondary}
                  weight="duotone"
                />
                <Text style={[styles.segmentText, activeTab === 'projects' && styles.segmentTextActive]}>
                  Proyek ({groupProjects.length})
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
                  Anggota ({members.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('resources')}
                style={[styles.segmentTab, activeTab === 'resources' && styles.segmentTabActive]}
              >
                <Books
                  size={15}
                  color={activeTab === 'resources' ? themeColors.text.inverse : themeColors.text.secondary}
                  weight="duotone"
                />
                <Text style={[styles.segmentText, activeTab === 'resources' && styles.segmentTextActive]}>
                  Materi
                </Text>
              </Pressable>
            </View>

            {/* Tab 1: Projects */}
            {activeTab === 'projects' ? (
              <View style={styles.sectionBlock}>
                {isMember ? (
                  <UniButton
                    label="Buat Proyek Grup"
                    onPress={() => setShowCreateProject(true)}
                    size="md"
                    leftIcon={<Plus size={16} color={themeColors.text.inverse} weight="bold" />}
                  />
                ) : null}

                {groupProjects.length === 0 ? (
                  <EmptyState
                    icon={<Kanban size={28} color={themeColors.brand.primary} weight="duotone" />}
                    title="Belum Ada Proyek Grup"
                    description="Buat ruang kerja proyek bersama dengan papan Kanban dan target milestone."
                  />
                ) : (
                  <View style={{ gap: spacing.md }}>
                    {groupProjects.map((proj, idx) => (
                      <ProjectCard
                        key={proj.id}
                        project={proj}
                        index={idx}
                        onPress={() => router.push(`/collaboration/projects/${proj.id}` as any)}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {/* Tab 2: Members */}
            {activeTab === 'members' ? (
              <View style={styles.sectionBlock}>
                {isAdmin ? (
                  <UniButton
                    label="Tambah Anggota"
                    onPress={() => setShowAddMember(true)}
                    variant="secondary"
                    size="md"
                    leftIcon={<UserPlus size={16} color={themeColors.brand.primary} weight="duotone" />}
                  />
                ) : null}

                {members.map((m) => (
                  <View key={m.id} style={styles.memberCard}>
                    <View style={styles.memberLeft}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberInitial}>
                          {(m.user?.name || 'U').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{m.user?.name || `User #${m.user_id}`}</Text>
                        <Text style={styles.memberMeta}>
                          {m.user?.university || m.user?.email || `ID: ${m.user_id}`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.memberActions}>
                      <Pressable
                        onPress={() => handleCycleRole(m.user_id, m.role, m.user?.name)}
                        disabled={!isAdmin || m.user_id === group.creator_id}
                      >
                        <UniBadge label={m.role.toUpperCase()} variant={getRoleVariant(m.role)} size="sm" />
                      </Pressable>

                      {isAdmin && m.user_id !== group.creator_id ? (
                        <Pressable
                          onPress={() => handleRemoveMember(m.user_id, m.user?.name)}
                          style={styles.removeMiniBtn}
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

            {/* Tab 3: Shared Notes & Materials */}
            {activeTab === 'resources' ? (
              <View style={styles.sectionBlock}>
                {isMember ? (
                  <View style={styles.shareActionsRow}>
                    <View style={{ flex: 1 }}>
                      <UniButton
                        label="Bagikan Catatan"
                        variant="secondary"
                        size="md"
                        leftIcon={<NotePencil size={16} color={themeColors.brand.primary} weight="duotone" />}
                        onPress={() => handleOpenShareModal('note')}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <UniButton
                        label="Bagikan Materi"
                        variant="secondary"
                        size="md"
                        leftIcon={<FileText size={16} color={themeColors.brand.secondary} weight="duotone" />}
                        onPress={() => handleOpenShareModal('material')}
                      />
                    </View>
                  </View>
                ) : null}

                {/* Shared Notes */}
                <Text style={styles.subSectionTitle}>
                  Catatan Dibagikan ({group.shared_notes?.length || 0})
                </Text>
                {(group.shared_notes || []).length === 0 ? (
                  <View style={styles.emptyMini}>
                    <Text style={styles.emptyMiniText}>Belum ada catatan yang dibagikan di grup ini.</Text>
                  </View>
                ) : (
                  (group.shared_notes || []).map((n) => (
                    <View key={n.id} style={styles.resourceCard}>
                      <NotePencil size={20} color={themeColors.brand.primary} weight="duotone" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resourceTitle}>{n.title}</Text>
                        <Text style={styles.resourceSub} numberOfLines={2}>
                          {n.content}
                        </Text>
                      </View>
                      {isMember ? (
                        <Pressable
                          onPress={() =>
                            unshareNoteFromGroup(groupId, n.id).catch((e) =>
                              Alert.alert('Gagal', formatApiError(e))
                            )
                          }
                          hitSlop={8}
                        >
                          <Trash size={16} color={themeColors.text.muted} weight="duotone" />
                        </Pressable>
                      ) : null}
                    </View>
                  ))
                )}

                {/* Shared Materials */}
                <Text style={styles.subSectionTitle}>
                  Materi Kuliah Dibagikan ({group.shared_materials?.length || 0})
                </Text>
                {(group.shared_materials || []).length === 0 ? (
                  <View style={styles.emptyMini}>
                    <Text style={styles.emptyMiniText}>Belum ada materi kuliah yang dibagikan.</Text>
                  </View>
                ) : (
                  (group.shared_materials || []).map((mat) => (
                    <View key={mat.id} style={styles.resourceCard}>
                      <FileText size={20} color={themeColors.brand.secondary} weight="duotone" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resourceTitle}>{mat.title}</Text>
                        <Text style={styles.resourceSub} numberOfLines={1}>
                          {mat.type.toUpperCase()} {mat.url ? `· ${mat.url}` : ''}
                        </Text>
                      </View>
                      {isMember ? (
                        <Pressable
                          onPress={() =>
                            unshareMaterialFromGroup(groupId, mat.id).catch((e) =>
                              Alert.alert('Gagal', formatApiError(e))
                            )
                          }
                          hitSlop={8}
                        >
                          <Trash size={16} color={themeColors.text.muted} weight="duotone" />
                        </Pressable>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Create Project inside Study Group Modal */}
      <CreateProjectModal
        visible={showCreateProject}
        studyGroups={myStudyGroups}
        courses={courses}
        defaultStudyGroupId={groupId}
        onClose={() => setShowCreateProject(false)}
        onSubmit={async (payload) => {
          const created = await createProject({ ...payload, study_group_id: groupId });
          router.push(`/collaboration/projects/${created.id}` as any);
        }}
      />

      {/* Add Study Group Member Modal */}
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
              <View style={styles.modalTitleRow}>
                <ShieldCheck size={20} color={themeColors.brand.primary} weight="duotone" />
                <Text style={styles.modalTitle}>Tambah Anggota Grup</Text>
              </View>
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
              label="User ID Mahasiswa *"
              placeholder="Contoh: 2"
              value={memberUserIdText}
              onChangeText={setMemberUserIdText}
              keyboardType="number-pad"
            />

            <Text style={styles.rolePickerLabel}>Peran Anggota</Text>
            <View style={styles.roleChipsRow}>
              {(['member', 'moderator', 'admin'] as const).map((r) => (
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
                label="Tambahkan ke Grup"
                onPress={handleAddMember}
                loading={isAddingMember}
                size="lg"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Share Note / Material Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {shareType === 'note' ? 'Pilih Catatan untuk Dibagikan' : 'Pilih Materi untuk Dibagikan'}
              </Text>
              <Pressable onPress={() => setShowShareModal(false)} style={styles.closeBtn} hitSlop={8}>
                <X size={20} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: spacing.sm }}>
              {shareType === 'note' ? (
                notes.length === 0 ? (
                  <Text style={styles.emptyMiniText}>Anda belum memiliki catatan pribadi.</Text>
                ) : (
                  notes.map((n) => (
                    <Pressable
                      key={n.id}
                      onPress={async () => {
                        try {
                          await shareNoteToGroup(groupId, n.id);
                          setShowShareModal(false);
                        } catch (e) {
                          Alert.alert('Gagal', formatApiError(e));
                        }
                      }}
                      style={styles.sharePickItem}
                    >
                      <NotePencil size={18} color={themeColors.brand.primary} weight="duotone" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resourceTitle}>{n.title}</Text>
                        <Text style={styles.resourceSub} numberOfLines={1}>
                          {n.content}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                )
              ) : materials.length === 0 ? (
                <Text style={styles.emptyMiniText}>Anda belum memiliki materi kuliah.</Text>
              ) : (
                materials.map((mat) => (
                  <Pressable
                    key={mat.id}
                    onPress={async () => {
                      try {
                        await shareMaterialToGroup(groupId, mat.id);
                        setShowShareModal(false);
                      } catch (e) {
                        Alert.alert('Gagal', formatApiError(e));
                      }
                    }}
                    style={styles.sharePickItem}
                  >
                    <FileText size={18} color={themeColors.brand.secondary} weight="duotone" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resourceTitle}>{mat.title}</Text>
                      <Text style={styles.resourceSub}>{mat.type.toUpperCase()}</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
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
    headerTitle: {
      flex: 1,
      fontFamily: typography.h2.fontFamily,
      fontSize: 18,
      color: colors.text.primary,
      textAlign: 'center',
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxxl,
      gap: spacing.lg,
    },
    heroCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.xl,
      gap: spacing.md,
      ...shadows.card,
    },
    heroBadges: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    heroTitle: {
      fontFamily: typography.display.fontFamily,
      fontSize: 22,
      color: colors.text.primary,
    },
    heroDesc: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    inviteBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    inviteLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    inviteLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 10,
      color: colors.text.muted,
    },
    inviteValue: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 16,
      color: colors.brand.accent,
      fontWeight: '700',
      letterSpacing: 1.5,
    },
    regenBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.surface,
    },
    regenText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.brand.primary,
    },
    segmentBar: {
      flexDirection: 'row',
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
      gap: 5,
      paddingVertical: 10,
      borderRadius: radius.md,
    },
    segmentTabActive: {
      backgroundColor: colors.brand.primary,
    },
    segmentText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: colors.text.inverse,
    },
    sectionBlock: {
      gap: spacing.md,
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
      gap: spacing.sm,
    },
    memberLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberInitial: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 13,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    memberName: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
    },
    memberMeta: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    memberActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    removeMiniBtn: {
      width: 30,
      height: 30,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareActionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    subSectionTitle: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      marginTop: spacing.xs,
    },
    emptyMini: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      alignItems: 'center',
    },
    emptyMiniText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.muted,
      textAlign: 'center',
    },
    resourceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
    },
    resourceTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    resourceSub: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 2,
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
      fontSize: 17,
      color: colors.text.primary,
      flexShrink: 1,
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
    rolePickerLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    roleChipsRow: {
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
    sharePickItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
    },
  });
