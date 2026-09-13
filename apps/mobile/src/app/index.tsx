import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  SignOut,
  GraduationCap,
  CalendarCheck,
  Clock,
  BookBookmark,
  CheckSquareOffset,
  ArrowRight,
  MoonStars,
  SunDim,
  Medal,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { UniBadge } from '@/components/ui/UniBadge';
import { BottomNav } from '@/components/ui/BottomNav';
import { DashboardSkeleton } from '@/components/ui/UniSkeleton';
import { AppearanceModal } from '@/components/ui/AppearanceModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useAcademicStore } from '@/store/useAcademicStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useUniTheme } from '@/store/useThemeStore';
import { DayOfWeek } from '@/types/academic';

/*
<vibe_check>
Screen/Component : DashboardScreen (app/index.tsx)
Tujuan           : Menampilkan beranda dengan data akademik nyata, skeleton shimmer loading ala big apps, dan on-demand caching
Layout strategy  : Top header -> Hero card kelas hari ini -> Bento stats -> Urgency stack tugas -> BottomNav
Color tokens     : bg.base (#0F1117), bg.surface (#171B26), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : FadeInDown staggered dengan liquid spring feel
Typography       : Syne_700Bold hero numbers, SpaceGrotesk untuk headers, JetBrainsMono untuk jam & SKS
Anti-slop check  : Rule #21 (Skeleton loading), Rule #6 (Bento grid), Rule #10 (typography stack)
</vibe_check>
*/

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    activeSemester,
    courses,
    schedules,
    assignments,
    isDashboardLoading,
    isRefreshing,
    fetchDashboard,
  } = useAcademicStore();
  const { cumulativeGpa, fetchGpaData } = useTrackingStore();
  const { colors: themeColors, shadows: themeShadows, resolvedTheme } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);

  useEffect(() => {
    // On-demand fetch khusus beranda
    fetchDashboard();
    fetchGpaData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'UD';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getTodayDayOfWeek = (): DayOfWeek => {
    const days: DayOfWeek[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return days[new Date().getDay()];
  };

  const todayDay = getTodayDayOfWeek();
  const todaySchedules = schedules.filter((s) => s.day === todayDay);
  const nextClass = todaySchedules.length > 0 ? todaySchedules[0] : null;

  const totalSks = courses.reduce((acc, c) => acc + (c.credits || 0), 0);

  const pendingAssignments = assignments
    .filter((a) => !a.is_completed && a.progress < 100)
    .slice(0, 2);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              fetchDashboard(true);
              fetchGpaData(undefined, true);
            }}
            tintColor={themeColors.brand.primary}
          />
        }
      >
        {/* Top App Bar */}
        <Animated.View
          entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
          style={styles.topBar}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatarPill}>
              <Text style={styles.avatarText}>
                {getInitials(user?.name)}
              </Text>
            </View>
            <View>
              <Text style={styles.greetingText}>
                {getGreeting()},
              </Text>
              <Text style={styles.userNameText}>
                {user?.name || 'Mahasiswa'}
              </Text>
            </View>
          </View>

          <View style={styles.topActions}>
            <Pressable
              onPress={() => setShowAppearanceModal(true)}
              style={styles.iconButton}
              hitSlop={8}
            >
              {resolvedTheme === 'dark' ? (
                <MoonStars size={20} color={themeColors.brand.primary} weight="duotone" />
              ) : (
                <SunDim size={20} color={themeColors.brand.accent} weight="duotone" />
              )}
            </Pressable>

            <Pressable
              onPress={logout}
              style={styles.iconButton}
              hitSlop={8}
            >
              <SignOut size={20} color={themeColors.text.secondary} weight="duotone" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Loading Shimmer State ala Instagram/Linear */}
        {isDashboardLoading && !activeSemester ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Hero Card: Today's Class */}
            <Animated.View
              entering={FadeInDown.delay(70)
                .duration(300)
                .easing(Easing.out(Easing.cubic))}
              style={styles.heroCard}
            >
              <View style={styles.heroHeader}>
                <UniBadge
                  label={nextClass ? 'KELAS HARI INI' : 'JADWAL HARI INI'}
                  variant="primary"
                  size="sm"
                />
                {nextClass && (
                  <View style={styles.timeBadge}>
                    <Clock size={14} color={themeColors.brand.secondary} weight="duotone" />
                    <Text style={styles.timeText}>
                      {formatTime(nextClass.start_time)} - {formatTime(nextClass.end_time)} WIB
                    </Text>
                  </View>
                )}
              </View>

              {nextClass ? (
                <>
                  <Text style={styles.courseCode}>
                    {nextClass.course?.code || 'KULIAH'} · RUANG{' '}
                    {nextClass.room || nextClass.course?.classroom || 'TBA'}
                  </Text>
                  <Text style={styles.courseTitle}>
                    {nextClass.course?.name || 'Mata Kuliah'}
                  </Text>
                  <Text style={styles.courseLecturer}>
                    {nextClass.course?.lecturer || 'Dosen Pengampu'}
                  </Text>
                </>
              ) : (
                <View style={styles.noClassBox}>
                  <CalendarCheck size={28} color={themeColors.brand.secondary} weight="duotone" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noClassTitle}>
                      Tidak ada jadwal kuliah hari ini
                    </Text>
                    <Text style={styles.noClassSubtitle}>
                      Manfaatkan waktu luang untuk menyelesaikan tugas atau belajar mandiri.
                    </Text>
                  </View>
                </View>
              )}

              <Pressable
                onPress={() => router.replace('/schedule' as any)}
                style={styles.heroFooterAction}
              >
                <Text style={styles.heroFooterActionText}>
                  Lihat Kalender Mingguan
                </Text>
                <ArrowRight size={14} color={themeColors.brand.primary} weight="bold" />
              </Pressable>
            </Animated.View>

            {/* Bento Grid: Academic Stats */}
            <View style={styles.bentoGrid}>
              {/* Card 1: Active Semester */}
              <Animated.View
                entering={FadeInDown.delay(140)
                  .duration(300)
                  .easing(Easing.out(Easing.cubic))}
                style={[styles.bentoCard, styles.bentoCardSpan1]}
              >
                <View style={styles.bentoHeader}>
                  <GraduationCap size={20} color={themeColors.brand.primary} weight="duotone" />
                  <UniBadge
                    label={activeSemester ? 'AKTIF' : 'BELUM AKTIF'}
                    variant={activeSemester ? 'success' : 'neutral'}
                    size="sm"
                  />
                </View>
                <Text style={styles.semesterName} numberOfLines={2}>
                  {activeSemester?.name || 'Semester'}
                </Text>
                <Text style={styles.bentoLabel}>
                  {courses.length} Mata Kuliah Terdaftar
                </Text>
              </Animated.View>

              {/* Card 2: Total SKS */}
              <Animated.View
                entering={FadeInDown.delay(210)
                  .duration(300)
                  .easing(Easing.out(Easing.cubic))}
                style={[styles.bentoCard, styles.bentoCardSpan1]}
              >
                <View style={styles.bentoHeader}>
                  <BookBookmark size={20} color={themeColors.brand.secondary} weight="duotone" />
                  <UniBadge label="SEMESTER INI" variant="neutral" size="sm" />
                </View>
                <Text style={styles.sksNumber}>{totalSks}</Text>
                <Text style={styles.bentoLabel}>Total Beban SKS Kuliah</Text>
              </Animated.View>

              {/* Card 3: Cumulative GPA & Simulator Shortcut */}
              <Animated.View
                entering={FadeInDown.delay(260)
                  .duration(300)
                  .easing(Easing.out(Easing.cubic))}
                style={[styles.bentoCard, styles.bentoCardFull]}
              >
                <Pressable
                  onPress={() => router.push('/gpa' as any)}
                  style={styles.gpaBentoPressable}
                >
                  <View style={styles.gpaBentoLeft}>
                    <View style={styles.bentoHeader}>
                      <Medal size={20} color={themeColors.brand.accent} weight="duotone" />
                      <UniBadge label="IPK & SIMULATOR" variant="primary" size="sm" />
                    </View>
                    <Text style={styles.gpaBentoTitle}>
                      {cumulativeGpa && cumulativeGpa.cumulative_gpa > 0
                        ? `IPK Kumulatif: ${Number(cumulativeGpa.cumulative_gpa).toFixed(2)}`
                        : 'Simulator & Pelacak IPK'}
                    </Text>
                    <Text style={styles.bentoLabel}>
                      Simulasikan target nilai semester depan untuk proyeksi kelulusan
                    </Text>
                  </View>
                  <View style={styles.gpaBentoArrow}>
                    <ArrowRight size={18} color={themeColors.brand.primary} weight="bold" />
                  </View>
                </Pressable>
              </Animated.View>
            </View>

            {/* Urgency Stack: Pending Assignments */}
            <Animated.View
              entering={FadeInDown.delay(280)
                .duration(300)
                .easing(Easing.out(Easing.cubic))}
              style={styles.sectionContainer}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <CheckSquareOffset size={18} color={themeColors.brand.primary} weight="duotone" />
                  <Text style={styles.sectionTitle}>Tugas Mendatang</Text>
                </View>
                <Pressable onPress={() => router.replace('/tasks' as any)}>
                  <Text style={styles.seeAllText}>Lihat Semua</Text>
                </Pressable>
              </View>

              {pendingAssignments.length > 0 ? (
                pendingAssignments.map((assignment) => (
                  <View
                    key={assignment.id}
                    style={styles.taskMiniCard}
                  >
                    <View style={styles.taskMiniLeft}>
                      <Text style={styles.taskCourseName}>
                        {assignment.course?.name || 'Mata Kuliah'}
                      </Text>
                      <Text style={styles.taskTitle}>{assignment.title}</Text>
                    </View>
                    <View style={styles.taskMiniRight}>
                      <UniBadge
                        label={`${assignment.progress}%`}
                        variant={assignment.priority === 'high' ? 'danger' : 'warning'}
                        size="sm"
                      />
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyMiniCard}>
                  <Text style={styles.emptyMiniText}>
                    Semua tugas semester ini telah terselesaikan dengan baik! 🚀
                  </Text>
                </View>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Appearance / Theme Settings Modal */}
      <AppearanceModal
        visible={showAppearanceModal}
        onClose={() => setShowAppearanceModal(false)}
      />

      {/* Floating Bottom Navigation */}
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
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: 110,
      gap: spacing.lg,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatarPill: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 16,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    greetingText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.muted,
    },
    userNameText: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 18,
      color: colors.text.primary,
      fontWeight: '600',
    },
    topActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
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
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    timeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    courseCode: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 12,
      color: colors.brand.primary,
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    courseTitle: {
      fontFamily: typography.h1.fontFamily,
      fontSize: 20,
      color: colors.text.primary,
      lineHeight: 26,
      marginBottom: spacing.xs,
    },
    courseLecturer: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      marginBottom: spacing.md,
    },
    noClassBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    noClassTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
      marginBottom: 2,
    },
    noClassSubtitle: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
      lineHeight: 16,
    },
    heroFooterAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
    },
    heroFooterActionText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    bentoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    bentoCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.lg,
      ...shadows.card,
    },
    bentoCardSpan1: {
      flex: 1,
      minWidth: '45%',
      justifyContent: 'space-between',
      minHeight: 135,
    },
    bentoCardFull: {
      width: '100%',
    },
    gpaBentoPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    gpaBentoLeft: {
      flex: 1,
      paddingRight: spacing.md,
    },
    gpaBentoTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
      lineHeight: 22,
      marginTop: spacing.xs,
      marginBottom: 2,
    },
    gpaBentoArrow: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    bentoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    semesterName: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    sksNumber: {
      fontFamily: typography.display.fontFamily,
      fontSize: 34,
      color: colors.brand.secondary,
      letterSpacing: -1,
      marginTop: spacing.xs,
    },
    bentoLabel: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.muted,
    },
    sectionContainer: {
      gap: spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
      fontWeight: '600',
    },
    seeAllText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.brand.primary,
    },
    taskMiniCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
      ...shadows.card,
    },
    taskMiniLeft: {
      flex: 1,
      marginRight: spacing.sm,
    },
    taskCourseName: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
      marginBottom: 2,
    },
    taskTitle: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
      fontWeight: '500',
    },
    taskMiniRight: {
      alignItems: 'flex-end',
    },
    emptyMiniCard: {
      backgroundColor: colors.bg.overlay,
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
  });
