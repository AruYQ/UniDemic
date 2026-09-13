import React, { useEffect, useState, useMemo } from 'react';
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
  ClockCounterClockwise,
  Medal,
  SlidersHorizontal,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { Course } from '@/types/academic';
import {
  CreateAttendancePayload,
  CreateGradeComponentPayload,
  CreateGradePayload,
} from '@/types/tracking';
import { ScheduleCard } from '@/components/academic/ScheduleCard';
import { AssignmentCard } from '@/components/academic/AssignmentCard';
import { ExamCard } from '@/components/academic/ExamCard';
import { AttendanceSummaryCard } from '@/components/tracking/AttendanceSummaryCard';
import { AttendanceItemCard } from '@/components/tracking/AttendanceItemCard';
import { MarkAttendanceModal } from '@/components/tracking/MarkAttendanceModal';
import { GradeComponentModal } from '@/components/tracking/GradeComponentModal';
import { GradeItemCard } from '@/components/tracking/GradeItemCard';
import { AddGradeModal } from '@/components/tracking/AddGradeModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { UniBadge } from '@/components/ui/UniBadge';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniDatePicker } from '@/components/ui/UniDatePicker';
import { UniTimePicker } from '@/components/ui/UniTimePicker';
import { UniButton } from '@/components/ui/UniButton';
import { CourseDetailSkeleton } from '@/components/ui/UniSkeleton';
import { useAcademicStore } from '@/store/useAcademicStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : CourseDetailScreen (app/course/[id].tsx)
Tujuan           : Menampilkan detail komprehensif suatu mata kuliah dengan 5 tab interaktif: Jadwal, Tugas, Ujian, Presensi, dan Nilai
Layout strategy  : Header back -> Hero identitas matkul -> Horizontal segmented tabs -> Dynamic tab content -> Modals
Color tokens     : bg.base, bg.surface, bg.elevated, brand.primary, brand.secondary, status semantic colors
Animation plan   : FadeInDown hero card, tab transitions, spring interaction
Typography       : Syne_700Bold display, SpaceGrotesk untuk headers, JetBrainsMono untuk kode MK, SKS, dan nilai
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #10 (typography), Rule #21 (Skeleton)
</vibe_check>
*/

type TabType = 'schedules' | 'assignments' | 'exams' | 'attendance' | 'grades';

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const courseId = parseInt(id, 10);

  const {
    fetchCourseDetail,
    isCourseDetailLoading,
    deleteCourse,
    deleteSchedule,
    updateAssignmentProgress,
    deleteAssignment,
    deleteExam,
    createAssignment,
    createExam,
  } = useAcademicStore();

  const {
    attendances,
    attendanceSummaries,
    gradeComponents,
    grades,
    courseGpas,
    fetchCourseAttendance,
    createAttendance,
    deleteAttendance,
    fetchCourseGrades,
    createGradeComponent,
    deleteGradeComponent,
    createGrade,
    deleteGrade,
  } = useTrackingStore();

  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('schedules');

  // Modal states for creating items in this course
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [isAddGradeModalOpen, setIsAddGradeModalOpen] = useState(false);

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

    if (activeTab === 'attendance') {
      fetchCourseAttendance(courseId, force);
    } else if (activeTab === 'grades') {
      fetchCourseGrades(courseId, force);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;
    if (activeTab === 'attendance') {
      fetchCourseAttendance(courseId);
    } else if (activeTab === 'grades') {
      fetchCourseGrades(courseId);
    }
  }, [activeTab, courseId]);

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

  // Tracking Action Handlers
  const handleCreateAttendance = async (payload: CreateAttendancePayload) => {
    try {
      await createAttendance(courseId, payload);
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal mencatat kehadiran.');
    }
  };

  const handleDeleteAttendance = (attId: number) => {
    Alert.alert('Hapus Presensi', 'Yakin ingin menghapus catatan presensi ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAttendance(courseId, attId);
          } catch (err: any) {
            Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menghapus presensi.');
          }
        },
      },
    ]);
  };

  const handleCreateComponent = async (payload: CreateGradeComponentPayload) => {
    await createGradeComponent(courseId, payload);
  };

  const handleDeleteComponent = async (compId: number) => {
    await deleteGradeComponent(courseId, compId);
    fetchCourseGrades(courseId, true);
  };

  const handleCreateGrade = async (payload: CreateGradePayload) => {
    await createGrade(courseId, payload);
  };

  const handleDeleteGrade = (gradeId: number) => {
    Alert.alert('Hapus Nilai', 'Yakin ingin menghapus catatan nilai ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGrade(courseId, gradeId);
          } catch (err: any) {
            Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menghapus nilai.');
          }
        },
      },
    ]);
  };

  const handleDeleteCourse = () => {
    Alert.alert(
      'Hapus Mata Kuliah',
      `Yakin ingin menghapus mata kuliah "${course?.name}"? Semua data jadwal, tugas, ujian, dan presensi akan terhapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourse(courseId);
              router.replace('/courses' as any);
            } catch (err: any) {
              Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menghapus mata kuliah.');
            }
          },
        },
      ]
    );
  };

  if (isCourseDetailLoading && !course) {
    return <CourseDetailSkeleton />;
  }

  const schedulesList = course?.schedules || [];
  const assignmentsList = course?.assignments || [];
  const examsList = course?.exams || [];
  const courseAttendances = attendances[courseId] || [];
  const courseSummary = attendanceSummaries[courseId];
  const courseComponents = gradeComponents[courseId] || [];
  const courseGradesList = grades[courseId] || [];
  const courseGpa = courseGpas[courseId];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <CaretLeft size={20} color={themeColors.text.primary} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detail Mata Kuliah
        </Text>
        <Pressable
          onPress={handleDeleteCourse}
          style={styles.deleteCourseBtn}
          hitSlop={8}
        >
          <Text style={styles.deleteCourseBtnText}>Hapus</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isCourseDetailLoading}
            onRefresh={() => loadData(true)}
            tintColor={themeColors.brand.primary}
          />
        }
      >
        {/* Course Identity Hero Card */}
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.codePill}>
              <Text style={styles.codeText}>{course?.code || 'MK'}</Text>
            </View>
            <UniBadge
              label={`${course?.credits || 0} SKS`}
              variant="primary"
              size="sm"
            />
          </View>

          <Text style={styles.courseName}>{course?.name || 'Mata Kuliah'}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <User size={15} color={themeColors.text.muted} weight="duotone" />
              <Text style={styles.metaText}>{course?.lecturer || 'Dosen Belum Diatur'}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={15} color={themeColors.text.muted} weight="duotone" />
              <Text style={styles.metaText}>{course?.classroom || 'Ruang TBA'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Horizontal Segmented Tabs (5 Tabs) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
          style={styles.tabBarContainer}
        >
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

          <Pressable
            onPress={() => setActiveTab('attendance')}
            style={[styles.tabItem, activeTab === 'attendance' && styles.tabItemActive]}
          >
            <Text
              style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}
            >
              Presensi ({courseAttendances.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('grades')}
            style={[styles.tabItem, activeTab === 'grades' && styles.tabItemActive]}
          >
            <Text
              style={[styles.tabText, activeTab === 'grades' && styles.tabTextActive]}
            >
              Nilai ({courseGradesList.length})
            </Text>
          </Pressable>
        </ScrollView>

        {/* Action Strips per Tab */}
        {activeTab === 'assignments' && (
          <View style={styles.addStrip}>
            <Pressable
              onPress={() => setIsModalOpen(true)}
              style={styles.addStripButton}
            >
              <Plus size={16} color={themeColors.brand.primary} weight="bold" />
              <Text style={styles.addStripButtonText}>Tambah Tugas</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'exams' && (
          <View style={styles.addStrip}>
            <Pressable
              onPress={() => setIsModalOpen(true)}
              style={styles.addStripButton}
            >
              <Plus size={16} color={themeColors.brand.primary} weight="bold" />
              <Text style={styles.addStripButtonText}>Tambah Ujian</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'attendance' && (
          <View style={styles.addStrip}>
            <Pressable
              onPress={() => setIsAttendanceModalOpen(true)}
              style={styles.addStripButton}
            >
              <Plus size={16} color={themeColors.brand.secondary} weight="bold" />
              <Text style={[styles.addStripButtonText, { color: themeColors.brand.secondary }]}>
                Catat Kehadiran
              </Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'grades' && (
          <View style={styles.gradesActionStrip}>
            <Pressable
              onPress={() => setIsComponentModalOpen(true)}
              style={styles.actionOutlineBtn}
            >
              <SlidersHorizontal size={15} color={themeColors.text.secondary} weight="duotone" />
              <Text style={styles.actionOutlineText}>Kelola Bobot</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsAddGradeModalOpen(true)}
              style={styles.addStripButton}
            >
              <Plus size={16} color={themeColors.brand.primary} weight="bold" />
              <Text style={styles.addStripButtonText}>Tambah Nilai</Text>
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
                icon={<CalendarCheck size={32} color={themeColors.brand.primary} weight="duotone" />}
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
                icon={<CheckSquareOffset size={32} color={themeColors.brand.primary} weight="duotone" />}
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
                icon={<GraduationCap size={32} color={themeColors.brand.accent} weight="duotone" />}
                title="Belum Ada Ujian"
                description="Catat jadwal UTS, UAS, atau kuis mendatang agar Anda dapat bersiap lebih awal."
                actionLabel="Tambah Ujian"
                onAction={() => setIsModalOpen(true)}
              />
            )}
          </View>
        )}

        {activeTab === 'attendance' && (
          <View>
            {courseSummary && <AttendanceSummaryCard summary={courseSummary} />}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>
                Riwayat Pertemuan ({courseAttendances.length})
              </Text>
            </View>

            {courseAttendances.length > 0 ? (
              courseAttendances.map((att) => (
                <AttendanceItemCard
                  key={att.id}
                  item={att}
                  onDelete={handleDeleteAttendance}
                />
              ))
            ) : (
              <EmptyState
                icon={<ClockCounterClockwise size={32} color={themeColors.brand.secondary} weight="duotone" />}
                title="Belum Ada Catatan Presensi"
                description="Mulai catat kehadiran setiap pertemuan kuliah untuk memantau toleransi alpa."
                actionLabel="Catat Kehadiran"
                onAction={() => setIsAttendanceModalOpen(true)}
              />
            )}
          </View>
        )}

        {activeTab === 'grades' && (
          <View>
            {/* Course GPA Hero Card */}
            {courseGpa ? (
              <Animated.View entering={FadeInDown.duration(260)} style={styles.gpaHeroCard}>
                <View style={styles.gpaHeroTop}>
                  <View>
                    <Text style={styles.gpaHeroLabel}>Nilai Akhir Terhitung</Text>
                    <Text style={styles.gpaHeroScore}>
                      {Math.round(courseGpa.final_score * 10) / 10}
                    </Text>
                  </View>
                  <View style={styles.gpaHeroBadgeCol}>
                    <View style={styles.letterGradePill}>
                      <Text style={styles.letterGradeText}>{courseGpa.letter_grade}</Text>
                    </View>
                    <Text style={styles.gradePointText}>
                      Mutu: {Number(courseGpa.grade_point).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ) : null}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>
                Daftar Nilai Asesmen ({courseGradesList.length})
              </Text>
            </View>

            {courseGradesList.length > 0 ? (
              courseGradesList.map((g) => (
                <GradeItemCard
                  key={g.id}
                  grade={g}
                  onDelete={handleDeleteGrade}
                />
              ))
            ) : (
              <EmptyState
                icon={<Medal size={32} color={themeColors.brand.primary} weight="duotone" />}
                title="Belum Ada Nilai"
                description="Atur komponen penilaian berbobot lalu masukkan nilai untuk kalkulasi IPK otomatis."
                actionLabel="Tambah Nilai"
                onAction={() => setIsAddGradeModalOpen(true)}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Assignment / Exam Modal */}
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
                placeholder="Contoh: Makalah Sistem Informasi"
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
                placeholder="Contoh: Lab Komputer 3"
                value={examLocation}
                onChangeText={setExamLocation}
              />
              <UniInput
                label="Kisi-kisi / Materi (Opsional)"
                placeholder="Bab 1-4, Teori & Praktek"
                value={examTopics}
                onChangeText={setExamTopics}
                multiline
              />
            </>
          )}

          <View style={{ marginTop: spacing.md }}>
            <UniButton
              label={isSubmitting ? 'Menyimpan...' : 'Simpan'}
              variant="primary"
              size="lg"
              onPress={handleSaveModal}
              disabled={isSubmitting}
              loading={isSubmitting}
            />
          </View>
        </View>
      </AcademicModal>

      {/* Tracking Modals */}
      <MarkAttendanceModal
        visible={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSubmit={handleCreateAttendance}
        courseName={course?.name}
      />

      <GradeComponentModal
        visible={isComponentModalOpen}
        onClose={() => setIsComponentModalOpen(false)}
        components={courseComponents}
        onCreate={handleCreateComponent}
        onDelete={handleDeleteComponent}
        courseName={course?.name}
      />

      <AddGradeModal
        visible={isAddGradeModalOpen}
        onClose={() => setIsAddGradeModalOpen(false)}
        components={courseComponents}
        onSubmit={handleCreateGrade}
        courseName={course?.name}
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
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    backButton: {
      padding: spacing.xs,
    },
    headerTitle: {
      ...typography.h3,
      color: colors.text.primary,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: spacing.sm,
    },
    deleteCourseBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    deleteCourseBtnText: {
      ...typography.label,
      color: colors.semantic.danger,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxxl,
      gap: spacing.lg,
    },
    heroCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.card,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    codePill: {
      backgroundColor: colors.bg.elevated,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    codeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: colors.brand.primary,
    },
    courseName: {
      fontFamily: typography.display.fontFamily,
      fontSize: 22,
      lineHeight: 28,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      paddingTop: spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    metaText: {
      ...typography.bodySmall,
      color: colors.text.secondary,
    },
    tabBarContainer: {
      marginBottom: -4,
    },
    tabBarScroll: {
      flexDirection: 'row',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: 4,
    },
    tabItem: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
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
    gradesActionStrip: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: -8,
    },
    actionOutlineBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.bg.elevated,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    actionOutlineText: {
      ...typography.label,
      fontSize: 12,
      color: colors.text.secondary,
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
    sectionHeaderRow: {
      marginTop: spacing.xs,
      marginBottom: -4,
    },
    sectionHeading: {
      ...typography.label,
      color: colors.text.secondary,
      textTransform: 'uppercase',
    },
    gpaHeroCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.card,
      marginBottom: spacing.xs,
    },
    gpaHeroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    gpaHeroLabel: {
      ...typography.label,
      color: colors.text.secondary,
      marginBottom: 2,
    },
    gpaHeroScore: {
      fontFamily: 'Syne_700Bold',
      fontSize: 36,
      color: colors.text.primary,
    },
    gpaHeroBadgeCol: {
      alignItems: 'flex-end',
    },
    letterGradePill: {
      backgroundColor: 'rgba(78, 205, 196, 0.15)',
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.semantic.success,
      marginBottom: 4,
    },
    letterGradeText: {
      fontFamily: 'Syne_700Bold',
      fontSize: 20,
      color: colors.semantic.success,
    },
    gradePointText: {
      ...typography.mono,
      fontSize: 12,
      color: colors.text.muted,
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
