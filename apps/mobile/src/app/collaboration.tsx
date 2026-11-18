import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import {
  ArrowLeft,
  UsersThree,
  Kanban,
  Key,
  MagnifyingGlass,
  Plus,
  GlobeHemisphereWest,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { useAcademicStore } from '@/store/useAcademicStore';
import { useCollaborationStore } from '@/store/useCollaborationStore';
import { ShimmerBox } from '@/components/ui/UniSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StudyGroupCard } from '@/components/collaboration/StudyGroupCard';
import { CreateStudyGroupModal } from '@/components/collaboration/CreateStudyGroupModal';
import { JoinStudyGroupModal } from '@/components/collaboration/JoinStudyGroupModal';
import { ProjectCard } from '@/components/collaboration/ProjectCard';
import { CreateProjectModal } from '@/components/collaboration/CreateProjectModal';
import { ProjectStatus } from '@/types/collaboration';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : CollaborationHubScreen (app/collaboration.tsx)
Tujuan           : Hub kolaborasi mahasiswa untuk mengelola Grup Belajar lintas kampus & Workspace Proyek Tim Kanban
Layout strategy  : Top Header (Back + Join Kode) -> 2-Segment Bar (Grup Belajar | Proyek Tim) -> Sub-filter & Search -> FlashList -> Natural-zone FAB
Color tokens     : bg.base, bg.surface, bg.overlay, brand.primary, brand.secondary, text.primary
Animation plan   : FadeInDown header, ShimmerBox skeleton loading, spring FAB press-down
Typography       : Syne_700Bold screen title, SpaceGrotesk tabs & cards, JetBrainsMono angka & kode
Anti-slop check  : Rule #2 (Phosphor Duotone), Rule #21 (Skeleton loading), FlashList virtualization, Debounced search
</vibe_check>
*/

type CollabTab = 'groups' | 'projects';
type GroupMode = 'mine' | 'discover';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CollaborationHubScreen() {
  const router = useRouter();
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const { courses, fetchCoursesAndSemesters } = useAcademicStore();
  const {
    myStudyGroups,
    publicStudyGroups,
    projects,
    isGroupsLoading,
    isProjectsLoading,
    fetchStudyGroups,
    createStudyGroup,
    joinStudyGroup,
    fetchProjects,
    createProject,
  } = useCollaborationStore();

  const [activeTab, setActiveTab] = useState<CollabTab>('groups');
  const [groupMode, setGroupMode] = useState<GroupMode>('mine');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCoursesAndSemesters();
    fetchStudyGroups({ discover: false });
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeTab === 'groups') {
      fetchStudyGroups({
        discover: groupMode === 'discover',
        search: debouncedSearch || undefined,
        forceRefresh: Boolean(debouncedSearch),
      });
    }
  }, [activeTab, groupMode, debouncedSearch]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (activeTab === 'groups') {
      await fetchStudyGroups({
        discover: groupMode === 'discover',
        search: debouncedSearch || undefined,
        forceRefresh: true,
      });
    } else {
      await fetchProjects({ forceRefresh: true });
    }
    setIsRefreshing(false);
  }, [activeTab, groupMode, debouncedSearch]);

  const displayedGroups = useMemo(() => {
    const base = groupMode === 'discover' ? publicStudyGroups : myStudyGroups;
    if (!debouncedSearch) return base;
    const q = debouncedSearch.toLowerCase();
    return base.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.subject || '').toLowerCase().includes(q) ||
        (g.description || '').toLowerCase().includes(q)
    );
  }, [groupMode, myStudyGroups, publicStudyGroups, debouncedSearch]);

  const myGroupIds = useMemo(() => new Set(myStudyGroups.map((g) => g.id)), [myStudyGroups]);

  const displayedProjects = useMemo(() => {
    if (projectStatusFilter === 'all') return projects;
    return projects.filter((p) => p.status === projectStatusFilter);
  }, [projects, projectStatusFilter]);

  const handleJoinPublic = async (groupId: number) => {
    try {
      const joined = await joinStudyGroup({ study_group_id: groupId });
      Alert.alert('Berhasil Bergabung', `Anda sekarang menjadi anggota "${joined.name}".`);
      router.push(`/collaboration/groups/${joined.id}` as any);
    } catch (err) {
      Alert.alert('Gagal Bergabung', formatApiError(err));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <Animated.View entering={FadeInDown.duration(260)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={20} color={themeColors.text.primary} weight="bold" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Kolaborasi</Text>
          <Text style={styles.headerSubtitle}>Grup Belajar & Workspace Tim</Text>
        </View>

        <Pressable onPress={() => setShowJoinGroup(true)} style={styles.joinCodeBtn} hitSlop={8}>
          <Key size={16} color={themeColors.brand.accent} weight="duotone" />
          <Text style={styles.joinCodeText}>Kode</Text>
        </Pressable>
      </Animated.View>

      {/* Full-Width 2-Segment Tab Bar */}
      <View style={styles.segmentWrapper}>
        <Pressable
          onPress={() => setActiveTab('groups')}
          style={[styles.segmentBtn, activeTab === 'groups' && styles.segmentBtnActive]}
        >
          <UsersThree
            size={18}
            color={activeTab === 'groups' ? themeColors.text.inverse : themeColors.text.secondary}
            weight="duotone"
          />
          <Text style={[styles.segmentText, activeTab === 'groups' && styles.segmentTextActive]}>
            Grup Belajar ({myStudyGroups.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('projects')}
          style={[styles.segmentBtn, activeTab === 'projects' && styles.segmentBtnActive]}
        >
          <Kanban
            size={18}
            color={activeTab === 'projects' ? themeColors.text.inverse : themeColors.text.secondary}
            weight="duotone"
          />
          <Text style={[styles.segmentText, activeTab === 'projects' && styles.segmentTextActive]}>
            Proyek Tim ({projects.length})
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
        {activeTab === 'groups' ? (
          <>
            {/* Mode Switch & Search */}
            <View style={styles.controlsGroup}>
              <View style={styles.subFilterRow}>
                <Pressable
                  onPress={() => setGroupMode('mine')}
                  style={[styles.subPill, groupMode === 'mine' && styles.subPillActive]}
                >
                  <UsersThree
                    size={14}
                    color={groupMode === 'mine' ? themeColors.brand.primary : themeColors.text.secondary}
                    weight="duotone"
                  />
                  <Text style={[styles.subPillText, groupMode === 'mine' && styles.subPillTextActive]}>
                    Grup Saya
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setGroupMode('discover')}
                  style={[styles.subPill, groupMode === 'discover' && styles.subPillActive]}
                >
                  <GlobeHemisphereWest
                    size={14}
                    color={groupMode === 'discover' ? themeColors.brand.secondary : themeColors.text.secondary}
                    weight="duotone"
                  />
                  <Text style={[styles.subPillText, groupMode === 'discover' && styles.subPillTextActive]}>
                    Jelajahi Publik
                  </Text>
                </Pressable>
              </View>

              <View style={styles.searchBar}>
                <MagnifyingGlass size={18} color={themeColors.text.muted} weight="duotone" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari nama grup atau topik studi..."
                  placeholderTextColor={themeColors.text.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {isGroupsLoading && displayedGroups.length === 0 ? (
              <View style={{ gap: spacing.md }}>
                <ShimmerBox height={138} borderRadius={radius.lg} />
                <ShimmerBox height={138} borderRadius={radius.lg} />
              </View>
            ) : displayedGroups.length === 0 ? (
              <EmptyState
                icon={<UsersThree size={30} color={themeColors.brand.primary} weight="duotone" />}
                title={groupMode === 'discover' ? 'Belum Ada Grup Publik' : 'Belum Bergabung Grup'}
                description={
                  groupMode === 'discover'
                    ? 'Tidak ada grup publik yang cocok dengan pencarian Anda saat ini.'
                    : 'Buat grup belajar baru atau bergabung memakai kode undangan teman.'
                }
                actionLabel="Buat Grup Belajar"
                onAction={() => setShowCreateGroup(true)}
              />
            ) : (
              <View style={styles.listWrapper}>
                <FlashList
                  data={displayedGroups}
                  keyExtractor={(item) => String(item.id)}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
                  renderItem={({ item, index }) => (
                    <StudyGroupCard
                      group={item}
                      index={index}
                      isMember={myGroupIds.has(item.id)}
                      onPress={() => router.push(`/collaboration/groups/${item.id}` as any)}
                      onJoinPublic={
                        !myGroupIds.has(item.id) ? () => handleJoinPublic(item.id) : undefined
                      }
                    />
                  )}
                />
              </View>
            )}
          </>
        ) : (
          <>
            {/* Project Status Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsRow}
            >
              {(
                [
                  { key: 'all', label: 'Semua' },
                  { key: 'active', label: 'Aktif' },
                  { key: 'planning', label: 'Perencanaan' },
                  { key: 'completed', label: 'Selesai' },
                ] as const
              ).map((st) => {
                const active = projectStatusFilter === st.key;
                return (
                  <Pressable
                    key={st.key}
                    onPress={() => setProjectStatusFilter(st.key)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {st.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {isProjectsLoading && displayedProjects.length === 0 ? (
              <View style={{ gap: spacing.md }}>
                <ShimmerBox height={140} borderRadius={radius.lg} />
                <ShimmerBox height={140} borderRadius={radius.lg} />
              </View>
            ) : displayedProjects.length === 0 ? (
              <EmptyState
                icon={<Kanban size={30} color={themeColors.brand.primary} weight="duotone" />}
                title="Belum Ada Proyek Tim"
                description="Buat workspace proyek dengan papan Kanban, milestone, dan integrasi repositori GitHub."
                actionLabel="Buat Proyek Baru"
                onAction={() => setShowCreateProject(true)}
              />
            ) : (
              <View style={styles.listWrapper}>
                <FlashList
                  data={displayedProjects}
                  keyExtractor={(item) => String(item.id)}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
                  renderItem={({ item, index }) => (
                    <ProjectCard
                      project={item}
                      index={index}
                      onPress={() => router.push(`/collaboration/projects/${item.id}` as any)}
                    />
                  )}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Natural Thumb-Zone FAB */}
      <AnimatedPressable
        onPress={() => (activeTab === 'groups' ? setShowCreateGroup(true) : setShowCreateProject(true))}
        onPressIn={() => {
          fabScale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
        }}
        onPressOut={() => {
          fabScale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }}
        style={[styles.fab, fabAnimStyle]}
      >
        <Plus size={20} color={themeColors.text.inverse} weight="bold" />
        <Text style={styles.fabLabel}>
          {activeTab === 'groups' ? 'Buat Grup' : 'Buat Proyek'}
        </Text>
      </AnimatedPressable>

      {/* Modals */}
      <CreateStudyGroupModal
        visible={showCreateGroup}
        courses={courses}
        onClose={() => setShowCreateGroup(false)}
        onSubmit={async (payload) => {
          const created = await createStudyGroup(payload);
          router.push(`/collaboration/groups/${created.id}` as any);
        }}
      />

      <JoinStudyGroupModal
        visible={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        onJoinByCode={async (code) => {
          const joined = await joinStudyGroup({ invite_code: code });
          router.push(`/collaboration/groups/${joined.id}` as any);
        }}
      />

      <CreateProjectModal
        visible={showCreateProject}
        studyGroups={myStudyGroups}
        courses={courses}
        onClose={() => setShowCreateProject(false)}
        onSubmit={async (payload) => {
          const created = await createProject(payload);
          router.push(`/collaboration/projects/${created.id}` as any);
        }}
      />
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
    headerCenter: {
      flex: 1,
    },
    headerTitle: {
      fontFamily: typography.display.fontFamily,
      fontSize: 22,
      color: colors.text.primary,
    },
    headerSubtitle: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    joinCodeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    joinCodeText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.primary,
      fontWeight: '600',
    },
    segmentWrapper: {
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
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 11,
      borderRadius: radius.md,
    },
    segmentBtnActive: {
      backgroundColor: colors.brand.primary,
    },
    segmentText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: colors.text.inverse,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: 100,
      gap: spacing.md,
    },
    controlsGroup: {
      gap: spacing.sm,
    },
    subFilterRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    subPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    subPillActive: {
      backgroundColor: colors.bg.overlay,
      borderColor: colors.brand.primary,
    },
    subPillText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    subPillTextActive: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      paddingHorizontal: spacing.md,
      minHeight: 46,
    },
    searchInput: {
      flex: 1,
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    filterChipsRow: {
      gap: spacing.sm,
      paddingVertical: 2,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    filterChipActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    filterChipText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    filterChipTextActive: {
      color: colors.text.inverse,
      fontWeight: '600',
    },
    listWrapper: {
      minHeight: 160,
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
      fontSize: 15,
      color: colors.text.inverse,
      fontWeight: '600',
    },
  });
