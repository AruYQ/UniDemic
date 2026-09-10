import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CaretLeft,
  BookOpen,
  CalendarCheck,
  CheckSquareOffset,
  GraduationCap,
  MapPin,
  Plus,
  User,
} from 'phosphor-react-native';
import { colors, radius, spacing, typography, shadows } from '@/constants/tokens';
import { Course } from '@/types/academic';
import { ScheduleCard } from '@/components/academic/ScheduleCard';
import { AssignmentCard } from '@/components/academic/AssignmentCard';
import { ExamCard } from '@/components/academic/ExamCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { UniBadge } from '@/components/ui/UniBadge';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniDatePicker } from '@/components/ui/UniDatePicker';
import { UniTimePicker } from '@/components/ui/UniTimePicker';
import { UniButton } from '@/components/ui/UniButton';
import { CourseDetailSkeleton } from '@/components/ui/UniSkeleton';
import { useAcademicStore } from '@/store/useAcademicStore';

/*
<vibe_check>
Screen/Component : CourseDetailScreen (app/course/[id].tsx)
Tujuan           : Menampilkan detail komprehensif suatu mata kuliah dengan tab interaktif Jadwal, Tugas, dan Ujian
Layout strategy  : Back button header -> Hero card identitas matkul -> Segmented tabs (Jadwal/Tugas/Ujian) -> Content list -> Modal add
Color tokens     : bg.base (#0F1117), bg.surface (#171B26), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : FadeInDown hero card, tab switch transition, liquid spring feel
Typography       : Syne_700Bold display, SpaceGrotesk untuk headers, JetBrainsMono untuk kode MK & SKS
Anti-slop check  : Rule #6 (Bento hero), Rule #10 (typography), Rule #21 (Skeleton shimmer), Rule #28 (spring feedback)
</vibe_check>
*/

type TabType = 'schedules' | 'assignments' | 'exams';

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = parseInt(id, 10);

  const {
    fetchCourseDetail,
    isCourseDetailLoading,
    updateAssignmentProgress,
    deleteAssignment,
    deleteSchedule,
    deleteExam,
    createAssignment,
    createExam,
  } = useAcademicStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('schedules');

  // Modal states for creating items in this course
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for assignment
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Form states for exam
  const [examType, setExamType] = useState('UTS');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('08:00');
  const [examLocation, setExamLocation] = useState('');
  const [examTopics, setExamTopics] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async (force = false) => {
    if (!courseId) return;
    const res = await fetchCourseDetail(courseId, force);
    if (res) setCourse(res);
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleUpdateAssignmentProgress = async (assignId: number, progress: number) => {
    try {
      await updateAssignmentProgress(assignId, progress);
      loadData(true);
    } catch {
      Alert.alert('Error', 'Gagal memperbarui progress tugas.');
    }
  };

  const handleDeleteAssignment = async (assignId: number) => {
    try {
      await deleteAssignment(assignId);
      loadData(true);
    } catch {
      Alert.alert('Error', 'Gagal menghapus tugas.');
    }
  };

  const handleDeleteSchedule = async (schedId: number) => {
    try {
      await deleteSchedule(schedId);
      loadData(true);
    } catch {
      Alert.alert('Error', 'Gagal menghapus jadwal.');
    }
  };

  const handleDeleteExam = async (examId: number) => {
    try {
      await deleteExam(examId);
      loadData(true);
    } catch {
      Alert.alert('Error', 'Gagal menghapus ujian.');
    }
  };

  const handleSaveModal = async () => {
    if (activeTab === 'assignments') {
      if (!taskTitle.trim()) {
        Alert.alert('Peringatan', 'Silakan isi judul tugas.');
        return;
      }
      setIsSubmitting(true);
      try {
        await createAssignment(courseId, {
          title: taskTitle.trim(),
          description: taskDesc.trim() || undefined,
          deadline: taskDeadline.trim() || undefined,
          priority: taskPriority,
        });
        setIsModalOpen(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskDeadline('');
        loadData(true);
      } catch (err: any) {
        Alert.alert('Gagal', err?.response?.data?.message || 'Gagal membuat tugas.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (activeTab === 'exams') {
      if (!examDate.trim()) {
        Alert.alert('Peringatan', 'Silakan pilih tanggal ujian.');
        return;
      }
      setIsSubmitting(true);
      try {
        await createExam(courseId, {
          type: examType.trim() || 'UTS',
          date: examDate.trim(),
          time: examTime.trim() || undefined,
          location: examLocation.trim() || undefined,
          topics: examTopics.trim() || undefined,
        });
        setIsModalOpen(false);
        setExamDate('');
        setExamTime('08:00');
        setExamLocation('');
        setExamTopics('');
        loadData(true);
      } catch (err: any) {
        Alert.alert('Gagal', err?.response?.data?.message || 'Gagal membuat ujian.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isCourseDetailLoading && !course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <CaretLeft size={22} color={colors.text.primary} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Detail Perkuliahan
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <CourseDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!course && !isCourseDetailLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Mata kuliah tidak ditemukan.</Text>
          <UniButton label="Kembali" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const schedulesList = course?.schedules || [];
  const assignmentsList = course?.assignments || [];
  const examsList = course?.exams || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <CaretLeft size={22} color={colors.text.primary} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detail Perkuliahan
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isCourseDetailLoading}
            onRefresh={() => loadData(true)}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* Course Hero Card */}
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <View style={styles.codeBadge}>
              <BookOpen size={16} color={colors.brand.primary} weight="duotone" />
              <Text style={styles.codeText}>{course?.code || 'KULIAH'}</Text>
            </View>
            <UniBadge
              label={`${course?.credits || 0} SKS`}
              variant="neutral"
              size="sm"
            />
          </View>

          <Text style={styles.courseName}>{course?.name}</Text>

          <View style={styles.metaRow}>
            {course?.lecturer ? (
              <View style={styles.metaItem}>
                <User size={14} color={colors.text.secondary} weight="duotone" />
                <Text style={styles.metaText}>{course.lecturer}</Text>
              </View>
            ) : null}

            {course?.classroom ? (
              <View style={styles.metaItem}>
                <MapPin size={14} color={colors.brand.secondary} weight="duotone" />
                <Text style={styles.metaText}>{course.classroom}</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {/* Tab Segmented Switcher */}
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab('schedules')}
            style={[styles.tabItem, activeTab === 'schedules' && styles.tabItemActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'schedules' && styles.tabTextActive,
              ]}
            >
              Jadwal ({schedulesList.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('assignments')}
            style={[styles.tabItem, activeTab === 'assignments' && styles.tabItemActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'assignments' && styles.tabTextActive,
              ]}
            >
              Tugas ({assignmentsList.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('exams')}
            style={[styles.tabItem, activeTab === 'exams' && styles.tabItemActive]}
          >
            <Text
              style={[styles.tabText, activeTab === 'exams' && styles.tabTextActive]}
            >
              Ujian ({examsList.length})
            </Text>
          </Pressable>
        </View>

        {/* Quick Add Action for Assignments and Exams */}
        {activeTab !== 'schedules' && (
          <View style={styles.addStrip}>
            <Pressable
              onPress={() => setIsModalOpen(true)}
              style={styles.addStripButton}
            >
              <Plus size={16} color={colors.brand.primary} weight="bold" />
              <Text style={styles.addStripButtonText}>
                {activeTab === 'assignments' ? 'Tambah Tugas' : 'Tambah Ujian'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Tab Contents */}
        {activeTab === 'schedules' && (
          <View>
            {schedulesList.length > 0 ? (
              schedulesList.map((sched, idx) => (
                <ScheduleCard
                  key={sched.id}
                  schedule={{ ...sched, course: course || undefined }}
                  index={idx}
                  onDelete={handleDeleteSchedule}
                />
              ))
            ) : (
              <EmptyState
                icon={<CalendarCheck size={32} color={colors.brand.primary} weight="duotone" />}
                title="Belum Ada Jadwal"
                description="Tambahkan slot jadwal mingguan untuk kelas ini melalui menu Jadwal."
                actionLabel="Ke Menu Jadwal"
                onAction={() => router.push('/schedule' as any)}
              />
            )}
          </View>
        )}

        {activeTab === 'assignments' && (
          <View>
            {assignmentsList.length > 0 ? (
              assignmentsList.map((assign, idx) => (
                <AssignmentCard
                  key={assign.id}
                  assignment={{ ...assign, course: course || undefined }}
                  index={idx}
                  onUpdateProgress={handleUpdateAssignmentProgress}
                  onDelete={handleDeleteAssignment}
                />
              ))
            ) : (
              <EmptyState
                icon={<CheckSquareOffset size={32} color={colors.brand.primary} weight="duotone" />}
                title="Tidak Ada Tugas"
                description="Belum ada tugas kuliah yang dicatat untuk mata kuliah ini."
                actionLabel="Tambah Tugas"
                onAction={() => setIsModalOpen(true)}
              />
            )}
          </View>
        )}

        {activeTab === 'exams' && (
          <View>
            {examsList.length > 0 ? (
              examsList.map((exam, idx) => (
                <ExamCard
                  key={exam.id}
                  exam={{ ...exam, course: course || undefined }}
                  index={idx}
                  onDelete={handleDeleteExam}
                />
              ))
            ) : (
              <EmptyState
                icon={<GraduationCap size={32} color={colors.brand.accent} weight="duotone" />}
                title="Belum Ada Ujian"
                description="Catat jadwal UTS, UAS, atau kuis mendatang agar Anda dapat bersiap lebih awal."
                actionLabel="Tambah Ujian"
                onAction={() => setIsModalOpen(true)}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <AcademicModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'assignments' ? 'Tambah Tugas Baru' : 'Tambah Jadwal Ujian'}
        subtitle={`Untuk mata kuliah ${course?.name}`}
      >
        <View style={styles.formContent}>
          {activeTab === 'assignments' ? (
            <>
              <UniInput
                label="Judul Tugas"
                placeholder="Contoh: Tugas 1 - Desain ERD"
                value={taskTitle}
                onChangeText={setTaskTitle}
              />
              <UniInput
                label="Deskripsi / Catatan (Opsional)"
                placeholder="Petunjuk tugas, link referensi, dll."
                value={taskDesc}
                onChangeText={setTaskDesc}
                multiline
              />
              <UniDatePicker
                label="Tenggat Waktu Tugas"
                value={taskDeadline}
                onChange={setTaskDeadline}
                placeholder="Pilih tanggal tenggat tugas"
              />

              <Text style={styles.labelSelect}>Prioritas Tugas</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high'] as const).map((p) => {
                  const isSelected = taskPriority === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setTaskPriority(p)}
                      style={[
                        styles.priorityChip,
                        isSelected && styles.priorityChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          isSelected && styles.priorityChipTextSelected,
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
                placeholder="Contoh: UTS / UAS / Kuis 1"
                value={examType}
                onChangeText={setExamType}
              />
              <UniDatePicker
                label="Tanggal Ujian"
                value={examDate}
                onChange={setExamDate}
                placeholder="Pilih tanggal ujian"
              />
              <UniTimePicker
                label="Waktu Ujian (Opsional)"
                value={examTime}
                onChange={setExamTime}
                placeholder="Pilih waktu ujian"
              />
              <UniInput
                label="Ruang / Lokasi (Opsional)"
                placeholder="Contoh: Gedung A Ruang 302"
                value={examLocation}
                onChangeText={setExamLocation}
              />
              <UniInput
                label="Materi / Topik Ujian (Opsional)"
                placeholder="Contoh: Modul 1 sampai Modul 4"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xl,
    ...shadows.card,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 13,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  courseName: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 22,
    color: colors.text.primary,
    lineHeight: 28,
    marginVertical: spacing.xs,
  },
  metaRow: {
    gap: 6,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
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
  addStrip: {
    alignItems: 'flex-end',
    marginBottom: -8,
  },
  addStripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(107, 127, 215, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(107, 127, 215, 0.3)',
  },
  addStripButtonText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  formContent: {
    gap: spacing.md,
  },
  labelSelect: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: -4,
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
  priorityChipSelected: {
    backgroundColor: 'rgba(107, 127, 215, 0.25)',
    borderColor: colors.brand.primary,
  },
  priorityChipText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.text.muted,
  },
  priorityChipTextSelected: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
});
