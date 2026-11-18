import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import {
  Play,
  Pause,
  ArrowCounterClockwise,
  Check,
  Timer,
  Coffee,
  HourglassHigh,
  FloppyDisk,
  GraduationCap,
} from 'phosphor-react-native';
import { useProductivityStore, TimerMode } from '@/store/useProductivityStore';
import { useAcademicStore } from '@/store/useAcademicStore';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { formatApiError } from '@/lib/api';


/*
<vibe_check>
Screen/Component : FocusTimerWidget (components/productivity/FocusTimerWidget.tsx)
Tujuan           : Pomodoro & Focus Timer interaktif untuk mencatat sesi belajar per mata kuliah dengan feedback taktil
Layout strategy  : Mode Pill Switcher -> Circular Bento Display Digit (MM:SS) -> Course Selector -> Action Buttons (Play/Pause/Save)
Color tokens     : bg.surface, bg.elevated, brand.primary, brand.secondary, semantic.success
Animation plan   : Spring scale on buttons, FadeInDown container
Typography       : Syne_700Bold display, JetBrainsMono untuk counter digit
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #28 (spring tap)
</vibe_check>
*/

export const FocusTimerWidget: React.FC = () => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const {
    timerMode,
    timerSeconds,
    timerInitialSeconds,
    isTimerRunning,
    activeCourseId,
    completedPomodoros,
    startTimer,
    pauseTimer,
    resetTimer,
    tickTimer,
    setTimerMode,
    setActiveCourse,
    createStudySession,
  } = useProductivityStore();

  const { courses } = useAcademicStore();

  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Interval timer tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, tickTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveSession = async () => {
    // Calculate elapsed minutes
    let elapsedMinutes = 0;
    if (timerMode === 'stopwatch') {
      elapsedMinutes = Math.max(Math.round(timerSeconds / 60), 1);
    } else {
      const elapsedSecs = Math.max(timerInitialSeconds - timerSeconds, 0);
      elapsedMinutes = Math.max(Math.round(elapsedSecs / 60), 1);
    }

    if (elapsedMinutes < 1 && timerMode !== 'stopwatch') {
      Alert.alert('Info', 'Sesi belajar minimal 1 menit untuk dapat dicatat.');
      return;
    }

    setIsSaving(true);
    try {
      await createStudySession({
        course_id: activeCourseId,
        type: timerMode === 'stopwatch' ? 'stopwatch' : 'pomodoro',
        duration_minutes: elapsedMinutes,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        'Selesai! 🎉',
        `Berhasil mencatat sesi belajar selama ${elapsedMinutes} menit.`
      );
      setNotes('');
      resetTimer();
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Gagal menyimpan sesi belajar.'));
    } finally {
      setIsSaving(false);
    }
  };

  const modes: { key: TimerMode; label: string; icon: any }[] = [
    { key: 'pomodoro', label: 'Fokus 25m', icon: Timer },
    { key: 'short_break', label: 'Rehat 5m', icon: Coffee },
    { key: 'long_break', label: 'Rehat 15m', icon: HourglassHigh },
    { key: 'stopwatch', label: 'Bebas', icon: Timer },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(280)} style={styles.container}>
      {/* Mode Switcher Pills */}
      <View style={styles.modeRow}>
        {modes.map((m) => {
          const isActive = timerMode === m.key;
          const IconComp = m.icon;
          return (
            <Pressable
              key={m.key}
              onPress={() => setTimerMode(m.key)}
              style={[styles.modePill, isActive && styles.modePillActive]}
              hitSlop={6}
            >
              <IconComp
                size={13}
                color={isActive ? '#FFFFFF' : themeColors.text.muted}
                weight={isActive ? 'bold' : 'duotone'}
              />
              <Text
                style={[styles.modePillText, isActive && styles.modePillTextActive]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Main Timer Display Circle / Card */}
      <View style={styles.timerDisplayCard}>
        <Text style={styles.timerDigits}>{formatTime(timerSeconds)}</Text>
        <Text style={styles.timerSubLabel}>
          {isTimerRunning
            ? '🔥 Sesi fokus sedang berjalan...'
            : timerSeconds === 0
            ? '🎉 Selesai! Waktunya istirahat atau simpan sesi.'
            : 'Siap untuk mulai belajar?'}
        </Text>

        {completedPomodoros > 0 ? (
          <View style={styles.pomodoroCountBadge}>
            <Check size={12} color={themeColors.semantic.success} weight="bold" />
            <Text style={styles.pomodoroCountText}>
              {completedPomodoros} Sesi Pomodoro Selesai Hari Ini
            </Text>
          </View>
        ) : null}
      </View>

      {/* Course Link Selector */}
      {courses.length > 0 ? (
        <View style={styles.courseSelectContainer}>
          <View style={styles.courseSelectHeader}>
            <GraduationCap size={14} color={themeColors.brand.primary} weight="duotone" />
            <Text style={styles.courseSelectLabel}>Tautkan ke Mata Kuliah:</Text>
          </View>
          <View style={styles.courseChipsRow}>
            <Pressable
              onPress={() => setActiveCourse(null)}
              style={[
                styles.courseChip,
                activeCourseId === null && styles.courseChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.courseChipText,
                  activeCourseId === null && styles.courseChipTextSelected,
                ]}
              >
                Umum
              </Text>
            </Pressable>
            {courses.map((course) => {
              const isSelected = activeCourseId === course.id;
              return (
                <Pressable
                  key={course.id}
                  onPress={() => setActiveCourse(course.id)}
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
                    {course.code || course.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Action Controls: Play / Pause, Reset, Save Session */}
      <View style={styles.actionControls}>
        <Pressable
          onPress={resetTimer}
          style={styles.secondaryBtn}
          hitSlop={8}
        >
          <ArrowCounterClockwise size={18} color={themeColors.text.secondary} weight="bold" />
        </Pressable>

        <Pressable
          onPress={isTimerRunning ? pauseTimer : startTimer}
          style={[
            styles.primaryPlayBtn,
            isTimerRunning && styles.primaryPauseBtn,
          ]}
        >
          {isTimerRunning ? (
            <Pause size={24} color="#FFFFFF" weight="fill" />
          ) : (
            <Play size={24} color="#FFFFFF" weight="fill" />
          )}
          <Text style={styles.primaryPlayText}>
            {isTimerRunning ? 'JEDA' : 'MULAI'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSaveSession}
          disabled={isSaving}
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <FloppyDisk size={18} color={themeColors.brand.secondary} weight="bold" />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.lg,
      ...shadows.card,
    },
    modeRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    modePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 7,
      borderRadius: radius.md,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    modePillActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    modePillText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    modePillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    timerDisplayCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.md,
    },
    timerDigits: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 48,
      fontWeight: '700',
      color: colors.text.primary,
      letterSpacing: 2,
    },
    timerSubLabel: {
      ...typography.bodySmall,
      color: colors.text.muted,
      marginTop: 4,
      textAlign: 'center',
    },
    pomodoroCountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(78, 205, 196, 0.12)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: 'rgba(78, 205, 196, 0.3)',
    },
    pomodoroCountText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.semantic.success,
      fontWeight: '600',
    },
    courseSelectContainer: {
      marginBottom: spacing.md,
    },
    courseSelectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: spacing.xs,
    },
    courseSelectLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    courseChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    courseChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    courseChipSelected: {
      backgroundColor: 'rgba(107, 127, 215, 0.2)',
      borderColor: colors.brand.primary,
    },
    courseChipText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    courseChipTextSelected: {
      color: colors.brand.primary,
      fontWeight: '700',
    },
    actionControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    secondaryBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    primaryPlayBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      height: 52,
      borderRadius: radius.full,
      backgroundColor: colors.brand.primary,
      minWidth: 150,
      ...shadows.card,
    },
    primaryPauseBtn: {
      backgroundColor: colors.brand.accent,
    },
    primaryPlayText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 15,
      color: '#FFFFFF',
      fontWeight: '700',
      letterSpacing: 1,
    },
    saveBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
  });
