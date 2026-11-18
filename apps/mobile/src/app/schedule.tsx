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
import { Plus, CalendarDots } from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { BottomNav } from '@/components/ui/BottomNav';
import { ScheduleCard } from '@/components/academic/ScheduleCard';
import { ScheduleCardSkeleton } from '@/components/ui/UniSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniButton } from '@/components/ui/UniButton';
import { UniInput } from '@/components/ui/UniInput';
import { UniTimePicker } from '@/components/ui/UniTimePicker';
import { useAcademicStore } from '@/store/useAcademicStore';
import { useUniTheme } from '@/store/useThemeStore';
import { DayOfWeek } from '@/types/academic';

/*
<vibe_check>
Screen/Component : ScheduleScreen (app/schedule.tsx)
Tujuan           : Menampilkan jadwal kuliah mingguan dengan on-demand caching, skeleton shimmer loading, dan UniTimePicker berbasis tap
Layout strategy  : Top header -> Horizontal day selector -> Cards / Skeleton list -> Modal tambah dengan UniTimePicker -> BottomNav
Color tokens     : bg.base (#0F1117), bg.surface (#171B26), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : FadeInDown untuk header & tabs, liquid spring interaction
Typography       : Syne_700Bold display, SpaceGrotesk untuk body, JetBrainsMono untuk jam
Anti-slop check  : Rule #21 (Skeleton loading), Rule #6 (Day tabs), Rule #10 (typography), Rule #28 (spring feedback)
</vibe_check>
*/

interface DayTab {
  key: DayOfWeek;
  label: string;
}

const DAYS: DayTab[] = [
  { key: 'monday', label: 'Senin' },
  { key: 'tuesday', label: 'Selasa' },
  { key: 'wednesday', label: 'Rabu' },
  { key: 'thursday', label: 'Kamis' },
  { key: 'friday', label: 'Jumat' },
  { key: 'saturday', label: 'Sabtu' },
  { key: 'sunday', label: 'Minggu' },
];

export default function ScheduleScreen() {
  const {
    schedules,
    courses,
    isSchedulesLoading,
    isRefreshing,
    fetchSchedules,
    createSchedule,
    deleteSchedule,
  } = useAcademicStore();
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Form states
  const [courseId, setCourseId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:40');
  const [room, setRoom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // On-demand fetch khusus jadwal
    fetchSchedules();
  }, []);

  // Filter schedules for the selected day
  const filteredSchedules = schedules
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const handleOpenAddModal = () => {
    if (courses.length === 0) {
      Alert.alert(
        'Perhatian',
        'Anda belum memiliki mata kuliah. Silakan buat mata kuliah terlebih dahulu di menu Kuliah.'
      );
      return;
    }
    setCourseId(courses[0].id);
    setIsModalVisible(true);
  };

  const handleSaveSchedule = async () => {
    if (!courseId) {
      Alert.alert('Peringatan', 'Silakan pilih mata kuliah.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSchedule(courseId, {
        day: selectedDay,
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        room: room.trim() || undefined,
      });
      setIsModalVisible(false);
      setRoom('');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menyimpan jadwal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Yakin ingin menghapus slot jadwal kuliah ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteSchedule(id),
      },
    ]);
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <View style={styles.header}>
        <Animated.View entering={FadeInDown.duration(280)}>
          <Text style={styles.title}>Jadwal Kuliah</Text>
          <Text style={styles.subtitle}>Atur jadwal dan ruangan kelas mingguan</Text>
        </Animated.View>

        <Pressable
          onPress={handleOpenAddModal}
          style={styles.addButton}
          hitSlop={8}
        >
          <Plus size={18} color={themeColors.text.inverse} weight="bold" />
          <Text style={styles.addButtonText}>Tambah</Text>
        </Pressable>
      </View>

      {/* Horizontal Day Tabs */}
      <View style={styles.dayTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayTabsScroll}
        >
          {DAYS.map((day) => {
            const isSelected = selectedDay === day.key;
            const count = schedules.filter((s) => s.day === day.key).length;

            return (
              <Pressable
                key={day.key}
                onPress={() => setSelectedDay(day.key)}
                style={[
                  styles.dayTab,
                  isSelected && styles.dayTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayTabLabel,
                    isSelected && styles.dayTabLabelActive,
                  ]}
                >
                  {day.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.dayTabBadge,
                      isSelected && styles.dayTabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayTabBadgeText,
                        isSelected && styles.dayTabBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Schedule Items List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchSchedules(true)}
            tintColor={themeColors.brand.primary}
          />
        }
      >
        {isSchedulesLoading && schedules.length === 0 ? (
          <>
            <ScheduleCardSkeleton />
            <ScheduleCardSkeleton />
            <ScheduleCardSkeleton />
          </>
        ) : filteredSchedules.length > 0 ? (
          filteredSchedules.map((schedule, idx) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              index={idx}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <EmptyState
            icon={<CalendarDots size={32} color={themeColors.brand.primary} weight="duotone" />}
            title="Tidak Ada Jadwal"
            description={`Belum ada jadwal kuliah pada hari ${
              DAYS.find((d) => d.key === selectedDay)?.label
            }.`}
            actionLabel="Tambah Jadwal"
            onAction={handleOpenAddModal}
          />
        )}
      </ScrollView>

      {/* Add Schedule Modal */}
      <AcademicModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title="Tambah Jadwal Kuliah"
        subtitle={`Untuk hari ${DAYS.find((d) => d.key === selectedDay)?.label}`}
      >
        <View style={styles.formGap}>
          {/* Select Course */}
          <Text style={styles.inputLabel}>Pilih Mata Kuliah</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courseSelectRow}
          >
            {courses.map((c) => {
              const isSelected = courseId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCourseId(c.id)}
                  style={[
                    styles.courseChip,
                    isSelected && styles.courseChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.courseChipText,
                      isSelected && styles.courseChipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {c.code ? `[${c.code}] ` : ''}
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Tap-Based Time Pickers */}
          <View style={styles.timeInputsRow}>
            <View style={{ flex: 1 }}>
              <UniTimePicker
                label="Jam Mulai"
                value={startTime}
                onChange={setStartTime}
              />
            </View>
            <View style={{ flex: 1 }}>
              <UniTimePicker
                label="Jam Selesai"
                value={endTime}
                onChange={setEndTime}
              />
            </View>
          </View>

          <UniInput
            label="Ruang Kuliah (Opsional)"
            placeholder="Contoh: Lab 7602 / R.301"
            value={room}
            onChangeText={setRoom}
          />

          <View style={{ marginTop: spacing.md }}>
            <UniButton
              label="Simpan Jadwal"
              onPress={handleSaveSchedule}
              loading={isSubmitting}
            />
          </View>
        </View>
      </AcademicModal>

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
    dayTabsContainer: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    dayTabsScroll: {
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    dayTab: {
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
    dayTabActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    dayTabLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    dayTabLabelActive: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    dayTabBadge: {
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.full,
    },
    dayTabBadgeActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    dayTabBadgeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.text.secondary,
    },
    dayTabBadgeTextActive: {
      color: colors.text.inverse,
    },
    listContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: 120,
    },
    formGap: {
      gap: spacing.md,
    },
    inputLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      marginBottom: -4,
    },
    courseSelectRow: {
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
      maxWidth: 200,
    },
    courseChipSelected: {
      backgroundColor: 'rgba(107, 127, 215, 0.2)',
      borderColor: colors.brand.primary,
    },
    courseChipText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    courseChipTextSelected: {
      color: colors.brand.primary,
      fontWeight: '600',
    },
    timeInputsRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
  });
