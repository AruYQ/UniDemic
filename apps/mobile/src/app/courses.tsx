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
import { useRouter } from 'expo-router';
import {
  Plus,
  GraduationCap,
  ArrowsClockwise,
  Check,
} from 'phosphor-react-native';
import { colors, radius, spacing, typography, shadows } from '@/constants/tokens';
import { BottomNav } from '@/components/ui/BottomNav';
import { CourseCard } from '@/components/academic/CourseCard';
import { CourseCardSkeleton } from '@/components/ui/UniSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniButton } from '@/components/ui/UniButton';
import { UniInput } from '@/components/ui/UniInput';
import { UniBadge } from '@/components/ui/UniBadge';
import { useAcademicStore } from '@/store/useAcademicStore';

/*
<vibe_check>
Screen/Component : CoursesScreen (app/courses.tsx)
Tujuan           : Manajemen mata kuliah per semester dengan on-demand caching dan skeleton shimmer loading
Layout strategy  : Header + Semester Pill switcher -> Semester info banner -> Course list cards -> Modal Add Course & Semester -> BottomNav
Color tokens     : bg.base (#0F1117), bg.surface (#171B26), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : FadeInDown header, FadeInRight staggered course cards
Typography       : Syne_700Bold untuk judul, SpaceGrotesk untuk body, JetBrainsMono untuk SKS
Anti-slop check  : Rule #21 (Skeleton loading), Rule #6 (Bento banner), Rule #10 (typography), Rule #28 (spring press)
</vibe_check>
*/

export default function CoursesScreen() {
  const router = useRouter();
  const {
    courses,
    semesters,
    activeSemester,
    isCoursesLoading,
    isRefreshing,
    fetchCoursesAndSemesters,
    createSemester,
    activateSemester,
    createCourse,
    deleteCourse,
  } = useAcademicStore();

  const [isSemesterModalVisible, setIsSemesterModalVisible] = useState(false);
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false);

  // Form Semester state
  const [semesterName, setSemesterName] = useState('');
  const [isSubmittingSemester, setIsSubmittingSemester] = useState(false);

  // Form Course state
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [credits, setCredits] = useState('3');
  const [lecturer, setLecturer] = useState('');
  const [classroom, setClassroom] = useState('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  useEffect(() => {
    // On-demand fetch khusus kuliah & semester
    fetchCoursesAndSemesters();
  }, []);

  const handleSaveSemester = async () => {
    if (!semesterName.trim()) {
      Alert.alert('Peringatan', 'Silakan isi nama semester.');
      return;
    }

    setIsSubmittingSemester(true);
    try {
      await createSemester({
        name: semesterName.trim(),
        is_active: true,
      });
      setIsSemesterModalVisible(false);
      setSemesterName('');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal membuat semester.');
    } finally {
      setIsSubmittingSemester(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!activeSemester) {
      Alert.alert('Peringatan', 'Silakan pilih atau buat semester aktif terlebih dahulu.');
      return;
    }
    if (!courseName.trim()) {
      Alert.alert('Peringatan', 'Silakan isi nama mata kuliah.');
      return;
    }

    setIsSubmittingCourse(true);
    try {
      await createCourse({
        semester_id: activeSemester.id,
        name: courseName.trim(),
        code: courseCode.trim() || undefined,
        credits: parseInt(credits, 10) || 3,
        lecturer: lecturer.trim() || undefined,
        classroom: classroom.trim() || undefined,
      });
      setIsCourseModalVisible(false);
      setCourseName('');
      setCourseCode('');
      setCredits('3');
      setLecturer('');
      setClassroom('');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal membuat mata kuliah.');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = (id: number) => {
    Alert.alert(
      'Hapus Mata Kuliah',
      'Menghapus mata kuliah ini akan menghapus semua jadwal, tugas, dan ujian terkait. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteCourse(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(280)}>
          <Text style={styles.title}>Mata Kuliah</Text>
          <Text style={styles.subtitle}>Daftar studi & kelas semester aktif</Text>
        </Animated.View>

        <Pressable
          onPress={() => setIsCourseModalVisible(true)}
          style={styles.addButton}
          hitSlop={8}
        >
          <Plus size={18} color={colors.text.inverse} weight="bold" />
          <Text style={styles.addButtonText}>Tambah</Text>
        </Pressable>
      </View>

      {/* Active Semester Banner & Switcher */}
      <View style={styles.semesterBanner}>
        <View style={styles.semesterLeft}>
          <GraduationCap size={20} color={colors.brand.primary} weight="duotone" />
          <View>
            <Text style={styles.semesterLabel}>SEMESTER AKTIF</Text>
            <Text style={styles.semesterName} numberOfLines={1}>
              {activeSemester?.name || 'Belum Ada Semester Aktif'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setIsSemesterModalVisible(true)}
          style={styles.switchSemesterBtn}
          hitSlop={8}
        >
          <ArrowsClockwise size={15} color={colors.brand.secondary} weight="bold" />
          <Text style={styles.switchSemesterText}>Ganti</Text>
        </Pressable>
      </View>

      {/* Course Cards List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchCoursesAndSemesters(true)}
            tintColor={colors.brand.primary}
          />
        }
      >
        {isCoursesLoading && courses.length === 0 ? (
          <>
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </>
        ) : courses.length > 0 ? (
          courses.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              index={idx}
              onPress={() => router.push(`/course/${course.id}` as any)}
              onDelete={handleDeleteCourse}
            />
          ))
        ) : (
          <EmptyState
            icon={<GraduationCap size={32} color={colors.brand.primary} weight="duotone" />}
            title="Belum Ada Mata Kuliah"
            description="Tambahkan mata kuliah pertama Anda untuk mulai mengisi jadwal, tugas, dan ujian."
            actionLabel="Tambah Mata Kuliah"
            onAction={() => setIsCourseModalVisible(true)}
          />
        )}
      </ScrollView>

      {/* Semester Management Modal */}
      <AcademicModal
        visible={isSemesterModalVisible}
        onClose={() => setIsSemesterModalVisible(false)}
        title="Pilih / Tambah Semester"
        subtitle="Kelola semester aktif untuk perkuliahan Anda"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalSectionLabel}>Daftar Semester</Text>
          <View style={styles.semesterList}>
            {semesters.map((sem) => {
              const isActive = sem.is_active || activeSemester?.id === sem.id;
              return (
                <Pressable
                  key={sem.id}
                  onPress={async () => {
                    await activateSemester(sem.id);
                    setIsSemesterModalVisible(false);
                  }}
                  style={[
                    styles.semesterItem,
                    isActive && styles.semesterItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.semesterItemText,
                      isActive && styles.semesterItemTextActive,
                    ]}
                  >
                    {sem.name}
                  </Text>
                  {isActive ? (
                    <UniBadge label="AKTIF" variant="success" size="sm" />
                  ) : (
                    <Check size={16} color={colors.text.muted} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          <Text style={styles.modalSectionLabel}>Buat Semester Baru</Text>
          <UniInput
            label="Nama Semester"
            placeholder="Contoh: Semester Ganjil 2026/2027"
            value={semesterName}
            onChangeText={setSemesterName}
          />

          <View style={{ marginTop: spacing.md }}>
            <UniButton
              label="Buat & Aktifkan"
              onPress={handleSaveSemester}
              loading={isSubmittingSemester}
            />
          </View>
        </View>
      </AcademicModal>

      {/* Add Course Modal */}
      <AcademicModal
        visible={isCourseModalVisible}
        onClose={() => setIsCourseModalVisible(false)}
        title="Tambah Mata Kuliah"
        subtitle={`Untuk ${activeSemester?.name || 'Semester Aktif'}`}
      >
        <View style={styles.modalContent}>
          <UniInput
            label="Nama Mata Kuliah"
            placeholder="Contoh: Pemrograman Berbasis Objek"
            value={courseName}
            onChangeText={setCourseName}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <UniInput
                label="Kode MK"
                placeholder="Contoh: IF2210"
                value={courseCode}
                onChangeText={setCourseCode}
              />
            </View>
            <View style={{ flex: 1 }}>
              <UniInput
                label="Beban SKS"
                placeholder="3"
                keyboardType="numeric"
                value={credits}
                onChangeText={setCredits}
              />
            </View>
          </View>

          <UniInput
            label="Dosen Pengampu (Opsional)"
            placeholder="Contoh: Prof. Dr. Ir. ..."
            value={lecturer}
            onChangeText={setLecturer}
          />

          <UniInput
            label="Ruang Default (Opsional)"
            placeholder="Contoh: Lab Komputer 2"
            value={classroom}
            onChangeText={setClassroom}
          />

          <View style={{ marginTop: spacing.md }}>
            <UniButton
              label="Simpan Mata Kuliah"
              onPress={handleSaveCourse}
              loading={isSubmittingCourse}
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
  semesterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.card,
  },
  semesterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  semesterLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    color: colors.brand.primary,
    letterSpacing: 0.5,
  },
  semesterName: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  switchSemesterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg.overlay,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  switchSemesterText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.brand.secondary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  modalContent: {
    gap: spacing.md,
  },
  modalSectionLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  semesterList: {
    gap: spacing.sm,
  },
  semesterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.overlay,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  semesterItemActive: {
    borderColor: colors.brand.secondary,
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
  },
  semesterItemText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
  },
  semesterItemTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
