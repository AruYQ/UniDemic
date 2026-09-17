import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Plus,
  CheckSquareOffset,
  GraduationCap,
  Timer,
  Target,
  Sparkle,
  ArrowClockwise,
  Clock,
  Trash,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { BottomNav } from '@/components/ui/BottomNav';
import { AssignmentCard } from '@/components/academic/AssignmentCard';
import { ExamCard } from '@/components/academic/ExamCard';
import { AssignmentCardSkeleton } from '@/components/ui/UniSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniDatePicker } from '@/components/ui/UniDatePicker';
import { UniTimePicker } from '@/components/ui/UniTimePicker';
import { UniButton } from '@/components/ui/UniButton';
import { useAcademicStore } from '@/store/useAcademicStore';
import { useProductivityStore } from '@/store/useProductivityStore';
import { useUniTheme } from '@/store/useThemeStore';
import { TaskItemCard } from '@/components/productivity/TaskItemCard';
import { FocusTimerWidget } from '@/components/productivity/FocusTimerWidget';
import { StudySessionSummaryCard } from '@/components/productivity/StudySessionSummaryCard';
import { GoalCard } from '@/components/productivity/GoalCard';
import { StudyPlannerCard } from '@/components/productivity/StudyPlannerCard';
import { CreateTaskModal } from '@/components/productivity/CreateTaskModal';
import { CreateGoalModal } from '@/components/productivity/CreateGoalModal';
import { StudyPlanItem } from '@/types/productivity';

/*
<vibe_check>
Screen/Component : TasksScreen (app/tasks.tsx)
Tujuan           : Hub produktivitas & akademik terpadu: Tugas Kuliah, To-Do & Subtasks reaktif, Pomodoro Focus Timer, Goals target tracker, dan Smart Study Planner
Layout strategy  : Header + Contextual Add Button -> 4-Tab Switcher (Kuliah, To-Do, Fokus, Target) -> Sub-filters -> Content ScrollView -> Modals -> BottomNav
Color tokens     : bg.base, bg.surface, bg.overlay, brand.primary, brand.secondary, brand.accent
Animation plan   : FadeInDown header & cards, liquid spring switchers
Typography       : Syne_700Bold display, SpaceGrotesk untuk headings/labels, JetBrainsMono untuk numeric/time metrics
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #21 (skeleton loading)
</vibe_check>
*/

type MainTab = 'academic' | 'tasks' | 'focus' | 'goals';
type AcademicSubTab = 'assignments' | 'exams';
type AssignmentFilter = 'all' | 'in_progress' | 'completed';
type TaskFilter = 'all' | 'high_priority' | 'in_progress' | 'completed';

export default function TasksScreen() {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  // Academic Store (Phase 2 Core)
  const {
    assignments,
    exams,
    courses,
    isTasksLoading: isAcademicLoading,
    isRefreshing: isAcademicRefreshing,
    fetchTasksAndExams,
    createAssignment,
    updateAssignmentProgress,
    deleteAssignment,
    createExam,
    deleteExam,
  } = useAcademicStore();

  // Productivity Store (Phase 4 Suite)
  const {
    tasks,
    studySessions,
    sessionSummary,
    goals,
    plannerSuggestion,
    isTasksLoading,
    isSessionsLoading,
    isGoalsLoading,
    isPlannerLoading,
    isRefreshing: isProductivityRefreshing,
    fetchTasks,
    createTask,
    deleteTask,
    toggleTaskComplete,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    fetchStudySessions,
    deleteStudySession,
    fetchGoals,
    createGoal,
    updateGoalProgress,
    deleteGoal,
    fetchStudyPlanSuggestions,
    setActiveCourse,
    setTimerMode,
    startTimer,
  } = useProductivityStore();

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<MainTab>('academic');
  const [academicSubTab, setAcademicSubTab] = useState<AcademicSubTab>('assignments');
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');

  // Modals state
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Form state for Academic Modal
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [assignmentPriority, setAssignmentPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const [examType, setExamType] = useState('UTS');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('08:00');
  const [examLocation, setExamLocation] = useState('');
  const [examTopics, setExamTopics] = useState('');
  const [isSubmittingAcademic, setIsSubmittingAcademic] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchTasksAndExams();
    fetchTasks();
    fetchStudySessions();
    fetchGoals();
    fetchStudyPlanSuggestions();
  }, []);

  // Combined Refresh Handler
  const handleRefresh = async () => {
    await Promise.all([
      fetchTasksAndExams(true),
      fetchTasks({}, true),
      fetchStudySessions(true),
      fetchGoals(true),
      fetchStudyPlanSuggestions(undefined, true),
    ]);
  };

  const isRefreshing = isAcademicRefreshing || isProductivityRefreshing;

  // Filtered Academic Assignments
  const filteredAssignments = assignments.filter((a) => {
    if (assignmentFilter === 'in_progress') return !a.is_completed && a.progress < 100;
    if (assignmentFilter === 'completed') return a.is_completed || a.progress >= 100;
    return true;
  });

  // Filtered Productivity Tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'high_priority') return t.priority === 'urgent' || t.priority === 'high';
    if (taskFilter === 'in_progress') return !t.is_completed;
    if (taskFilter === 'completed') return t.is_completed;
    return true;
  });

  // Action Add Button Click
  const handleOpenAddModal = () => {
    if (activeTab === 'academic') {
      if (courses.length === 0) {
        Alert.alert(
          'Perhatian',
          'Anda belum memiliki mata kuliah. Silakan buat mata kuliah terlebih dahulu di menu Kuliah.'
        );
        return;
      }
      setSelectedCourseId(courses[0].id);
      setIsAcademicModalOpen(true);
    } else if (activeTab === 'tasks') {
      setIsTaskModalOpen(true);
    } else if (activeTab === 'goals') {
      setIsGoalModalOpen(true);
    }
  };

  // Academic Modal Save
  const handleSaveAcademicModal = async () => {
    if (!selectedCourseId) {
      Alert.alert('Peringatan', 'Silakan pilih mata kuliah.');
      return;
    }

    setIsSubmittingAcademic(true);
    try {
      if (academicSubTab === 'assignments') {
        if (!assignmentTitle.trim()) {
          Alert.alert('Peringatan', 'Silakan isi judul tugas.');
          return;
        }
        await createAssignment(selectedCourseId, {
          title: assignmentTitle.trim(),
          description: assignmentDescription.trim() || undefined,
          deadline: assignmentDeadline.trim() || undefined,
          priority: assignmentPriority,
        });
        setAssignmentTitle('');
        setAssignmentDescription('');
        setAssignmentDeadline('');
      } else {
        if (!examDate.trim()) {
          Alert.alert('Peringatan', 'Silakan tentukan tanggal ujian.');
          return;
        }
        await createExam(selectedCourseId, {
          type: examType.trim() || 'UTS',
          date: examDate.trim(),
          time: examTime.trim() || undefined,
          location: examLocation.trim() || undefined,
          topics: examTopics.trim() || undefined,
        });
        setExamDate('');
        setExamTime('08:00');
        setExamLocation('');
        setExamTopics('');
      }
      setIsAcademicModalOpen(false);
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setIsSubmittingAcademic(false);
    }
  };

  const handleDeleteAssignment = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Hapus tugas kuliah ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteAssignment(id) },
    ]);
  };

  const handleDeleteExam = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Hapus jadwal ujian ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteExam(id) },
    ]);
  };

  const handleDeleteProductivityTask = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Hapus to-do produktivitas ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  };

  const handleDeleteGoal = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Hapus target belajar ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  const handleDeleteSession = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Hapus riwayat sesi belajar ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteStudySession(id) },
    ]);
  };

  // Start study session directly from Smart Planner recommendation
  const handleStartSessionFromPlanner = (item: StudyPlanItem) => {
    if (item.course_id) {
      setActiveCourse(item.course_id);
    }
    setTimerMode('custom', item.duration_minutes);
    setActiveTab('focus');
    startTimer();
    Alert.alert(
      'Sesi Dimulai',
      `Sesi fokus untuk "${item.title}" (${item.duration_minutes} menit) telah disiapkan!`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(260)}>
          <Text style={styles.title}>Produktivitas & Tugas</Text>
          <Text style={styles.subtitle}>Target, To-Do, Fokus Belajar & Rekomendasi AI</Text>
        </Animated.View>

        {activeTab !== 'focus' && (
          <Pressable onPress={handleOpenAddModal} style={styles.addButton} hitSlop={8}>
            <Plus size={16} color={themeColors.text.inverse} weight="bold" />
            <Text style={styles.addButtonText}>
              {activeTab === 'academic' ? 'Tambah' : activeTab === 'tasks' ? 'To-Do' : 'Target'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* 4-Tab Main Switcher */}
      <View style={styles.mainTabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {/* Tab 1: Kuliah */}
          <Pressable
            onPress={() => setActiveTab('academic')}
            style={[styles.tabItem, activeTab === 'academic' && styles.tabItemActive]}
          >
            <GraduationCap
              size={17}
              color={activeTab === 'academic' ? themeColors.text.inverse : themeColors.text.muted}
              weight="duotone"
            />
            <Text style={[styles.tabText, activeTab === 'academic' && styles.tabTextActive]}>
              Kuliah ({assignments.length + exams.length})
            </Text>
          </Pressable>

          {/* Tab 2: To-Do & Subtasks */}
          <Pressable
            onPress={() => setActiveTab('tasks')}
            style={[styles.tabItem, activeTab === 'tasks' && styles.tabItemActive]}
          >
            <CheckSquareOffset
              size={17}
              color={activeTab === 'tasks' ? themeColors.text.inverse : themeColors.text.muted}
              weight="duotone"
            />
            <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>
              To-Do ({tasks.length})
            </Text>
          </Pressable>

          {/* Tab 3: Fokus Pomodoro */}
          <Pressable
            onPress={() => setActiveTab('focus')}
            style={[styles.tabItem, activeTab === 'focus' && styles.tabItemActive]}
          >
            <Timer
              size={17}
              color={activeTab === 'focus' ? themeColors.text.inverse : themeColors.text.muted}
              weight="duotone"
            />
            <Text style={[styles.tabText, activeTab === 'focus' && styles.tabTextActive]}>
              Fokus Timer
            </Text>
          </Pressable>

          {/* Tab 4: Target & Saran AI */}
          <Pressable
            onPress={() => setActiveTab('goals')}
            style={[styles.tabItem, activeTab === 'goals' && styles.tabItemActive]}
          >
            <Target
              size={17}
              color={activeTab === 'goals' ? themeColors.text.inverse : themeColors.text.muted}
              weight="duotone"
            />
            <Text style={[styles.tabText, activeTab === 'goals' && styles.tabTextActive]}>
              Target ({goals.length})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Sub-Filters per Active Tab */}
      {activeTab === 'academic' && (
        <View style={styles.academicSubFilterSection}>
          {/* Sub Tab: Tugas vs Ujian */}
          <View style={styles.subTabRow}>
            <Pressable
              onPress={() => setAcademicSubTab('assignments')}
              style={[
                styles.subTabBtn,
                academicSubTab === 'assignments' && styles.subTabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.subTabText,
                  academicSubTab === 'assignments' && styles.subTabTextActive,
                ]}
              >
                Tugas Kuliah ({assignments.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAcademicSubTab('exams')}
              style={[styles.subTabBtn, academicSubTab === 'exams' && styles.subTabBtnActive]}
            >
              <Text
                style={[
                  styles.subTabText,
                  academicSubTab === 'exams' && styles.subTabTextActive,
                ]}
              >
                Jadwal Ujian ({exams.length})
              </Text>
            </Pressable>
          </View>

          {/* Sub filter status for assignments */}
          {academicSubTab === 'assignments' && (
            <View style={styles.filterChipRow}>
              {[
                { key: 'all', label: 'Semua' },
                { key: 'in_progress', label: 'Berjalan' },
                { key: 'completed', label: 'Selesai' },
              ].map((item) => {
                const isSelected = assignmentFilter === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setAssignmentFilter(item.key as AssignmentFilter)}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      {activeTab === 'tasks' && (
        <View style={styles.filterChipRow}>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'high_priority', label: 'Prioritas Tinggi' },
            { key: 'in_progress', label: 'Belum Selesai' },
            { key: 'completed', label: 'Selesai' },
          ].map((item) => {
            const isSelected = taskFilter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTaskFilter(item.key as TaskFilter)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Main List Scroll Content */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.brand.primary}
          />
        }
      >
        {/* TAB 1: ACADEMIC CORE */}
        {activeTab === 'academic' && (
          isAcademicLoading && assignments.length === 0 && exams.length === 0 ? (
            <>
              <AssignmentCardSkeleton />
              <AssignmentCardSkeleton />
              <AssignmentCardSkeleton />
            </>
          ) : academicSubTab === 'assignments' ? (
            filteredAssignments.length > 0 ? (
              filteredAssignments.map((assign, idx) => (
                <AssignmentCard
                  key={assign.id}
                  assignment={assign}
                  index={idx}
                  onUpdateProgress={updateAssignmentProgress}
                  onDelete={handleDeleteAssignment}
                />
              ))
            ) : (
              <EmptyState
                icon={<CheckSquareOffset size={32} color={themeColors.brand.primary} weight="duotone" />}
                title="Tidak Ada Tugas"
                description={
                  assignmentFilter === 'completed'
                    ? 'Belum ada tugas kuliah yang selesai.'
                    : 'Belum ada tugas kuliah yang terdaftar.'
                }
                actionLabel="Tambah Tugas"
                onAction={handleOpenAddModal}
              />
            )
          ) : (
            exams.length > 0 ? (
              exams.map((exam, idx) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  index={idx}
                  onDelete={handleDeleteExam}
                />
              ))
            ) : (
              <EmptyState
                icon={<GraduationCap size={32} color={themeColors.brand.accent} weight="duotone" />}
                title="Belum Ada Ujian"
                description="Belum ada jadwal UTS, UAS, atau kuis yang dicatat."
                actionLabel="Tambah Ujian"
                onAction={handleOpenAddModal}
              />
            )
          )
        )}

        {/* TAB 2: PRODUCTIVITY TASKS & SUBTASKS */}
        {activeTab === 'tasks' && (
          isTasksLoading && tasks.length === 0 ? (
            <>
              <AssignmentCardSkeleton />
              <AssignmentCardSkeleton />
            </>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((t) => (
              <TaskItemCard
                key={t.id}
                task={t}
                onToggleComplete={toggleTaskComplete}
                onDelete={handleDeleteProductivityTask}
                onToggleSubtask={(taskId, subtaskId, isDone) =>
                  updateSubtask(taskId, subtaskId, { is_done: isDone })
                }
                onAddSubtask={(taskId, subtaskTitle) =>
                  createSubtask(taskId, { title: subtaskTitle })
                }
                onDeleteSubtask={deleteSubtask}
              />
            ))
          ) : (
            <EmptyState
              icon={<CheckSquareOffset size={32} color={themeColors.brand.secondary} weight="duotone" />}
              title="Tidak Ada To-Do"
              description={
                taskFilter === 'completed'
                  ? 'Belum ada tugas produktivitas yang diselesaikan.'
                  : 'Catat tugas mandiri, projek, atau skripsi beserta subtask checklist-nya.'
              }
              actionLabel="Tambah To-Do"
              onAction={() => setIsTaskModalOpen(true)}
            />
          )
        )}

        {/* TAB 3: FOCUS TIMER & SESSIONS */}
        {activeTab === 'focus' && (
          <View style={styles.focusContainer}>
            {/* Interactive Timer & Pomodoro Engine */}
            <FocusTimerWidget />

            {/* Study Session Summary Bento */}
            {sessionSummary && <StudySessionSummaryCard summary={sessionSummary} />}

            {/* Recent Session History */}
            <View style={styles.recentSessionsSection}>
              <View style={styles.sectionHeaderRow}>
                <Clock size={16} color={themeColors.brand.primary} weight="duotone" />
                <Text style={styles.sectionTitle}>Riwayat Sesi Terkini</Text>
              </View>

              {studySessions.length > 0 ? (
                studySessions.slice(0, 8).map((session) => {
                  const sessionCourse = courses.find((c) => c.id === session.course_id);
                  const formattedDate = new Date(session.started_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View key={session.id} style={styles.sessionHistoryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionCourseText}>
                          {sessionCourse ? sessionCourse.name : session.type.toUpperCase()}
                        </Text>
                        <Text style={styles.sessionDateText}>{formattedDate}</Text>
                        {session.notes ? (
                          <Text style={styles.sessionNotesText} numberOfLines={1}>
                            "{session.notes}"
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.sessionDurationBadge}>
                        <Text style={styles.sessionDurationText}>
                          {session.duration_minutes} mnt
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleDeleteSession(session.id)}
                        hitSlop={8}
                        style={{ marginLeft: spacing.sm }}
                      >
                        <Trash size={16} color={themeColors.text.muted} />
                      </Pressable>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptySessionText}>
                  Belum ada rekaman sesi belajar. Gunakan tombol simpan di atas setelah fokus!
                </Text>
              )}
            </View>
          </View>
        )}

        {/* TAB 4: GOALS & SMART STUDY PLANNER */}
        {activeTab === 'goals' && (
          <View style={styles.goalsContainer}>
            {/* Goals Tracker Header */}
            <View style={styles.sectionHeaderRow}>
              <Target size={18} color={themeColors.brand.primary} weight="duotone" />
              <Text style={styles.sectionTitle}>Target Belajar ({goals.length})</Text>
            </View>

            {isGoalsLoading && goals.length === 0 ? (
              <AssignmentCardSkeleton />
            ) : goals.length > 0 ? (
              goals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onIncrement={(id, nextVal) => updateGoalProgress(id, nextVal)}
                  onDelete={handleDeleteGoal}
                />
              ))
            ) : (
              <EmptyState
                icon={<Target size={32} color={themeColors.brand.primary} weight="duotone" />}
                title="Belum Ada Target"
                description="Tetapkan target kuantitatif seperti jumlah jam belajar atau bab tugas."
                actionLabel="Buat Target"
                onAction={() => setIsGoalModalOpen(true)}
              />
            )}

            {/* Smart Study Planner AI Recommendations */}
            <View style={styles.plannerSection}>
              <View style={styles.plannerHeaderRow}>
                <View style={styles.sectionHeaderRow}>
                  <Sparkle size={18} color={themeColors.brand.accent} weight="fill" />
                  <Text style={styles.sectionTitle}>Rekomendasi Waktu Belajar</Text>
                </View>
                <Pressable
                  onPress={() => fetchStudyPlanSuggestions(undefined, true)}
                  style={styles.refreshPlannerBtn}
                  hitSlop={8}
                >
                  <ArrowClockwise size={14} color={themeColors.brand.primary} weight="bold" />
                  <Text style={styles.refreshPlannerText}>Segarkan</Text>
                </Pressable>
              </View>

              <Text style={styles.plannerDescription}>
                Algoritma UniDemic menganalisis jadwal kuliah, tenggat tugas, dan ujian untuk
                menemukan slot belajar optimal tanpa bentrok.
              </Text>

              {isPlannerLoading ? (
                <AssignmentCardSkeleton />
              ) : plannerSuggestion && plannerSuggestion.schedule.length > 0 ? (
                plannerSuggestion.schedule.map((item, idx) => (
                  <StudyPlannerCard
                    key={idx}
                    item={item}
                    onStartSession={handleStartSessionFromPlanner}
                  />
                ))
              ) : (
                <View style={styles.plannerEmptyBox}>
                  <Text style={styles.plannerEmptyText}>
                    Tidak ada jadwal mendesak atau semua slot belajar saat ini sudah terpenuhi.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Academic Add Modal (Assignments & Exams) */}
      <AcademicModal
        visible={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        title={academicSubTab === 'assignments' ? 'Tambah Tugas Kuliah' : 'Tambah Jadwal Ujian'}
        subtitle="Pilih mata kuliah dan lengkapi detail evaluasi"
      >
        <View style={styles.modalForm}>
          <Text style={styles.labelField}>Pilih Mata Kuliah</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courseScroll}
          >
            {courses.map((c) => {
              const isSelected = selectedCourseId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCourseId(c.id)}
                  style={[styles.courseChip, isSelected && styles.courseChipActive]}
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

          {academicSubTab === 'assignments' ? (
            <>
              <UniInput
                label="Judul Tugas"
                placeholder="Contoh: Makalah Analisis Algoritma"
                value={assignmentTitle}
                onChangeText={setAssignmentTitle}
              />
              <UniInput
                label="Deskripsi / Catatan (Opsional)"
                placeholder="Detail pengerjaan atau referensi"
                value={assignmentDescription}
                onChangeText={setAssignmentDescription}
                multiline
              />
              <UniDatePicker
                label="Tenggat Waktu"
                value={assignmentDeadline}
                onChange={setAssignmentDeadline}
                placeholder="Pilih Tanggal Tenggat"
              />

              <Text style={styles.labelField}>Prioritas Tugas</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high'] as const).map((p) => {
                  const isSelected = assignmentPriority === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setAssignmentPriority(p)}
                      style={[styles.priorityChip, isSelected && styles.priorityChipActive]}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          isSelected && styles.priorityChipTextActive,
                        ]}
                      >
                        {p.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <UniInput
                label="Tipe Ujian"
                placeholder="Contoh: UTS / UAS / Kuis 2"
                value={examType}
                onChangeText={setExamType}
              />
              <UniDatePicker
                label="Tanggal Ujian"
                value={examDate}
                onChange={setExamDate}
                placeholder="Pilih Tanggal Ujian"
              />
              <UniTimePicker
                label="Jam Ujian"
                value={examTime}
                onChange={setExamTime}
                placeholder="Pilih Jam Ujian"
              />
              <UniInput
                label="Ruang / Lokasi (Opsional)"
                placeholder="Contoh: Lab Komputer 1"
                value={examLocation}
                onChangeText={setExamLocation}
              />
              <UniInput
                label="Topik / Kisi-kisi (Opsional)"
                placeholder="Contoh: Bab 1 hingga Bab 5"
                value={examTopics}
                onChangeText={setExamTopics}
                multiline
              />
            </>
          )}

          <View style={{ marginTop: spacing.md }}>
            <UniButton
              label="Simpan Data"
              onPress={handleSaveAcademicModal}
              loading={isSubmittingAcademic}
            />
          </View>
        </View>
      </AcademicModal>

      {/* Productivity Task Modal */}
      <CreateTaskModal
        visible={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={async (payload) => {
          await createTask(payload);
        }}
        courses={courses}
      />

      {/* Goal Modal */}
      <CreateGoalModal
        visible={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={async (payload) => {
          await createGoal(payload);
        }}
      />

      <BottomNav />
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    title: {
      fontFamily: typography.display.fontFamily,
      fontSize: 22,
      color: colors.text.primary,
    },
    subtitle: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 2,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.brand.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
    addButtonText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.inverse,
      fontWeight: '700',
    },
    mainTabContainer: {
      marginVertical: spacing.xs,
    },
    tabBarScroll: {
      paddingHorizontal: spacing.xl,
      gap: spacing.xs,
      paddingVertical: 4,
    },
    tabItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    tabItemActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    tabText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
    },
    tabTextActive: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    academicSubFilterSection: {
      paddingHorizontal: spacing.xl,
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    subTabRow: {
      flexDirection: 'row',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    subTabBtn: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    subTabBtnActive: {
      backgroundColor: colors.bg.elevated,
    },
    subTabText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    subTabTextActive: {
      color: colors.text.primary,
      fontWeight: '700',
    },
    filterChipRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.xl,
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: radius.full,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    filterChipActive: {
      backgroundColor: colors.bg.overlay,
      borderColor: colors.brand.secondary,
    },
    filterChipText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    filterChipTextActive: {
      color: colors.brand.secondary,
      fontWeight: '600',
    },
    listContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xs,
      paddingBottom: 120,
      gap: spacing.sm,
    },
    focusContainer: {
      gap: spacing.lg,
    },
    recentSessionsSection: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: spacing.sm,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sectionTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    sessionHistoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    sessionCourseText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      color: colors.text.primary,
      fontWeight: '600',
    },
    sessionDateText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
      marginTop: 2,
    },
    sessionNotesText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    sessionDurationBadge: {
      backgroundColor: 'rgba(78, 205, 196, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    sessionDurationText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.brand.secondary,
      fontWeight: '700',
    },
    emptySessionText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    goalsContainer: {
      gap: spacing.lg,
    },
    plannerSection: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    plannerHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    refreshPlannerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(107, 127, 215, 0.15)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.sm,
    },
    refreshPlannerText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    plannerDescription: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 17,
    },
    plannerEmptyBox: {
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    plannerEmptyText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
      textAlign: 'center',
    },
    modalForm: {
      gap: spacing.md,
    },
    labelField: {
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
    priorityChipText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    priorityChipTextActive: {
      color: colors.brand.primary,
      fontWeight: '700',
    },
  });
