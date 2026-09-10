import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Plus,
  CheckSquareOffset,
  GraduationCap,
} from 'phosphor-react-native';
import { colors, radius, spacing, typography } from '@/constants/tokens';
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

/*
<vibe_check>
Screen/Component : TasksScreen (app/tasks.tsx)
Tujuan           : Tracker terpadu untuk tugas dan ujian dengan tap-based date & time pickers, skeleton shimmer, dan on-demand caching
Layout strategy  : Header + Add button -> Primary tab switcher (Tugas / Ujian) -> Sub-filter status tugas -> Vertical scroll cards -> Add Modal -> BottomNav
Color tokens     : bg.base (#0F1117), bg.surface (#171B26), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : FadeInDown header, liquid spring interaction
Typography       : Syne_700Bold untuk judul, SpaceGrotesk untuk body, JetBrainsMono untuk tanggal & progress
Anti-slop check  : Rule #21 (Skeleton loading), Rule #7 (Badge status tanpa emoji), Rule #10 (typography)
</vibe_check>
*/

type MainTab = 'assignments' | 'exams';
type AssignmentFilter = 'all' | 'in_progress' | 'completed';

export default function TasksScreen() {
  const {
    assignments,
    exams,
    courses,
    isTasksLoading,
    isRefreshing,
    fetchTasksAndExams,
    createAssignment,
    updateAssignmentProgress,
    deleteAssignment,
    createExam,
    deleteExam,
  } = useAcademicStore();

  const [activeTab, setActiveTab] = useState<MainTab>('assignments');
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Assignment form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Exam form
  const [examType, setExamType] = useState('UTS');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('08:00');
  const [examLocation, setExamLocation] = useState('');
  const [examTopics, setExamTopics] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // On-demand fetch khusus tugas & ujian
    fetchTasksAndExams();
  }, []);

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'in_progress') return !a.is_completed && a.progress < 100;
    if (filter === 'completed') return a.is_completed || a.progress >= 100;
    return true;
  });

  const handleOpenAddModal = () => {
    if (courses.length === 0) {
      Alert.alert(
        'Perhatian',
        'Anda belum memiliki mata kuliah. Silakan buat mata kuliah terlebih dahulu di menu Kuliah.'
      );
      return;
    }
    setSelectedCourseId(courses[0].id);
    setIsModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!selectedCourseId) {
      Alert.alert('Peringatan', 'Silakan pilih mata kuliah.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'assignments') {
        if (!title.trim()) {
          Alert.alert('Peringatan', 'Silakan isi judul tugas.');
          return;
        }
        await createAssignment(selectedCourseId, {
          title: title.trim(),
          description: description.trim() || undefined,
          deadline: deadline.trim() || undefined,
          priority,
        });
        setTitle('');
        setDescription('');
        setDeadline('');
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
      setIsModalOpen(false);
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Hapus tugas kuliah ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteAssignment(id),
      },
    ]);
  };

  const handleDeleteExam = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Hapus jadwal ujian ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteExam(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(280)}>
          <Text style={styles.title}>Tugas & Ujian</Text>
          <Text style={styles.subtitle}>Tracker target & evaluasi akademik</Text>
        </Animated.View>

        <Pressable
          onPress={handleOpenAddModal}
          style={styles.addButton}
          hitSlop={8}
        >
          <Plus size={18} color={colors.text.inverse} weight="bold" />
          <Text style={styles.addButtonText}>Tambah</Text>
        </Pressable>
      </View>

      {/* Main Tab Switcher */}
      <View style={styles.mainTabContainer}>
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab('assignments')}
            style={[styles.tabItem, activeTab === 'assignments' && styles.tabItemActive]}
          >
            <CheckSquareOffset
              size={18}
              color={activeTab === 'assignments' ? colors.text.inverse : colors.text.muted}
              weight="duotone"
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'assignments' && styles.tabTextActive,
              ]}
            >
              Tugas ({assignments.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('exams')}
            style={[styles.tabItem, activeTab === 'exams' && styles.tabItemActive]}
          >
            <GraduationCap
              size={18}
              color={activeTab === 'exams' ? colors.text.inverse : colors.text.muted}
              weight="duotone"
            />
            <Text style={[styles.tabText, activeTab === 'exams' && styles.tabTextActive]}>
              Ujian ({exams.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Sub-filter for Assignments */}
      {activeTab === 'assignments' && (
        <View style={styles.subFilterRow}>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'in_progress', label: 'Berjalan' },
            { key: 'completed', label: 'Selesai' },
          ].map((item) => {
            const isSelected = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key as AssignmentFilter)}
                style={[styles.subFilterChip, isSelected && styles.subFilterChipActive]}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    isSelected && styles.subFilterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* List Content */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchTasksAndExams(true)}
            tintColor={colors.brand.primary}
          />
        }
      >
        {isTasksLoading && (assignments.length === 0 && exams.length === 0) ? (
          <>
            <AssignmentCardSkeleton />
            <AssignmentCardSkeleton />
            <AssignmentCardSkeleton />
          </>
        ) : activeTab === 'assignments' ? (
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
              icon={<CheckSquareOffset size={32} color={colors.brand.primary} weight="duotone" />}
              title="Tidak Ada Tugas"
              description={
                filter === 'completed'
                  ? 'Belum ada tugas yang selesai.'
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
              icon={<GraduationCap size={32} color={colors.brand.accent} weight="duotone" />}
              title="Belum Ada Ujian"
              description="Belum ada jadwal UTS, UAS, atau kuis yang dicatat."
              actionLabel="Tambah Ujian"
              onAction={handleOpenAddModal}
            />
          )
        )}
      </ScrollView>

      {/* Add Modal */}
      <AcademicModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'assignments' ? 'Tambah Tugas Baru' : 'Tambah Jadwal Ujian'}
        subtitle="Pilih mata kuliah dan lengkapi detail target"
      >
        <View style={styles.modalForm}>
          {/* Select Course */}
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

          {activeTab === 'assignments' ? (
            <>
              <UniInput
                label="Judul Tugas"
                placeholder="Contoh: Makalah Analisis Algoritma"
                value={title}
                onChangeText={setTitle}
              />
              <UniInput
                label="Deskripsi / Catatan (Opsional)"
                placeholder="Detail pengerjaan atau referensi"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {/* Tap-Based Date Picker */}
              <UniDatePicker
                label="Tenggat Waktu"
                value={deadline}
                onChange={setDeadline}
                placeholder="Pilih Tanggal Tenggat"
              />

              <Text style={styles.labelField}>Prioritas Tugas</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high'] as const).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[
                        styles.priorityChip,
                        isSelected && styles.priorityChipActive,
                      ]}
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

              {/* Tap-Based Date & Time Pickers */}
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
              onPress={handleSaveModal}
              loading={isSubmitting}
            />
          </View>
        </View>
      </AcademicModal>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.display.fontFamily,
    fontSize: 24,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
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
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  tabItemActive: {
    backgroundColor: colors.brand.primary,
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
  subFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  subFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  subFilterChipActive: {
    backgroundColor: colors.bg.overlay,
    borderColor: colors.brand.secondary,
  },
  subFilterText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.text.muted,
  },
  subFilterTextActive: {
    color: colors.brand.secondary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: 120,
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
