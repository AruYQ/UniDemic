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
import { useRouter } from 'expo-router';
import {
  CaretLeft,
  GraduationCap,
  Calculator,
  Plus,
  Trash,
  TrendUp,
  ArrowClockwise,
  Medal,
  CheckCircle,
  BookOpen,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { UniBadge } from '@/components/ui/UniBadge';
import { UniButton } from '@/components/ui/UniButton';
import { UniInput } from '@/components/ui/UniInput';
import { GpaSimulationItem } from '@/types/tracking';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : GpaScreen (app/gpa.tsx)
Tujuan           : Pelacak IPK kumulatif, breakdown IPS semester, dan Simulator Proyeksi IPK interaktif
Layout strategy  : Top header -> Hero Bento IPK kumulatif -> Semester IPS list -> Interactive GPA Simulator suite
Color tokens     : bg.base, bg.surface, bg.elevated, brand.primary, brand.secondary, status semantic colors
Animation plan   : FadeInDown on mount, spring feedback on simulator grade selection
Typography       : Syne_700Bold display hero, SpaceGrotesk untuk headings, JetBrainsMono untuk IPK/SKS
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #10 (typography), Rule #28 (spring)
</vibe_check>
*/

const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E'];
const SKS_OPTIONS = [1, 2, 3, 4, 6];

export default function GpaScreen() {
  const router = useRouter();
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const {
    cumulativeGpa,
    isGpaLoading,
    fetchGpaData,
    simulateGpa,
    simulationResult,
    resetSimulation,
    isSimulating,
  } = useTrackingStore();

  // Local state for simulation inputs
  const [simulationItems, setSimulationItems] = useState<GpaSimulationItem[]>([
    { course_name: 'Mata Kuliah Pilihan 1', credits: 3, target_grade: 'A' },
    { course_name: 'Mata Kuliah Pilihan 2', credits: 3, target_grade: 'A-' },
  ]);

  useEffect(() => {
    fetchGpaData();
  }, []);

  const handleAddSimulationItem = () => {
    setSimulationItems((prev) => [
      ...prev,
      {
        course_name: `Mata Kuliah ${prev.length + 1}`,
        credits: 3,
        target_grade: 'A',
      },
    ]);
  };

  const handleRemoveSimulationItem = (index: number) => {
    if (simulationItems.length <= 1) {
      Alert.alert('Info', 'Minimal sertakan 1 mata kuliah untuk simulasi.');
      return;
    }
    setSimulationItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof GpaSimulationItem,
    val: any
  ) => {
    setSimulationItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRunSimulation = async () => {
    if (simulationItems.length === 0) {
      Alert.alert('Peringatan', 'Tambahkan minimal 1 mata kuliah simulasi.');
      return;
    }

    try {
      await simulateGpa({
        current_gpa: cumulativeGpa?.cumulative_gpa,
        current_credits: cumulativeGpa?.total_credits,
        simulations: simulationItems,
      });
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menghitung simulasi.');
    }
  };

  const gpaVal = cumulativeGpa?.cumulative_gpa ?? 0;
  const creditsEarned = cumulativeGpa?.total_credits ?? 0;

  const getPredicate = (gpa: number) => {
    if (gpa >= 3.51) return { label: 'Dengan Pujian (Cumlaude)', variant: 'success' as const };
    if (gpa >= 3.0) return { label: 'Sangat Memuaskan', variant: 'primary' as const };
    if (gpa >= 2.75) return { label: 'Memuaskan', variant: 'warning' as const };
    return { label: 'Cukup', variant: 'neutral' as const };
  };

  const predicate = getPredicate(gpaVal);

  const delta = simulationResult
    ? Math.round((simulationResult.simulated_gpa - simulationResult.current_gpa) * 100) / 100
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <CaretLeft size={20} color={themeColors.text.primary} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>GPA Tracker & Simulator</Text>
        <Pressable
          onPress={() => fetchGpaData(undefined, true)}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <ArrowClockwise size={20} color={themeColors.text.primary} weight="bold" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isGpaLoading}
            onRefresh={() => fetchGpaData(undefined, true)}
            tintColor={themeColors.brand.primary}
          />
        }
      >
        {/* Cumulative GPA Bento Hero */}
        <Animated.View
          entering={FadeInDown.duration(280)}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTitleRow}>
              <GraduationCap size={22} color={themeColors.brand.primary} weight="duotone" />
              <Text style={styles.heroSubTitle}>Indeks Prestasi Kumulatif</Text>
            </View>
            <UniBadge label={predicate.label} variant={predicate.variant} size="sm" />
          </View>

          <View style={styles.gpaDisplayRow}>
            <Text style={styles.gpaBigNumber}>{gpaVal.toFixed(2)}</Text>
            <View style={styles.scaleBox}>
              <Text style={styles.scaleMax}>/ 4.00</Text>
              <Text style={styles.creditsTotal}>{creditsEarned} SKS Lulus</Text>
            </View>
          </View>

          {/* SKS Graduation Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Target Kelulusan (Estimasi 144 SKS)</Text>
              <Text style={styles.progressPercent}>
                {Math.min(Math.round((creditsEarned / 144) * 100), 100)}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min((creditsEarned / 144) * 100, 100)}%`,
                    backgroundColor: themeColors.brand.primary,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        {/* Semester IPS Breakdown List */}
        {cumulativeGpa && cumulativeGpa.semesters && cumulativeGpa.semesters.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Riwayat Semester</Text>
            <View style={styles.semesterList}>
              {cumulativeGpa.semesters.map((sem) => (
                <View key={sem.semester_id} style={styles.semesterCard}>
                  <View style={styles.semLeft}>
                    <BookOpen size={18} color={themeColors.brand.secondary} weight="duotone" />
                    <View>
                      <Text style={styles.semName}>{sem.name}</Text>
                      <Text style={styles.semCredits}>{sem.credits} SKS Terdaftar</Text>
                    </View>
                  </View>
                  <View style={styles.semRight}>
                    <Text style={styles.semGpa}>{Number(sem.gpa).toFixed(2)}</Text>
                    <Text style={styles.semGpaLabel}>IPS</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interactive GPA Simulator Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.simTitleRow}>
            <Calculator size={22} color={themeColors.brand.accent} weight="duotone" />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>Simulator Proyeksi IPK</Text>
              <Text style={styles.sectionSubHeading}>
                Kalkulasi perkiraan kenaikan atau penurunan IPK berdasarkan target nilai semester depan.
              </Text>
            </View>
          </View>

          {/* Simulation Result Comparison Card */}
          {simulationResult && (
            <Animated.View
              entering={FadeInDown.duration(260)}
              style={styles.simResultCard}
            >
              <View style={styles.simResultTop}>
                <View style={styles.simScoreCol}>
                  <Text style={styles.simScoreLabel}>IPK Saat Ini</Text>
                  <Text style={styles.simScoreCurrent}>
                    {Number(simulationResult.current_gpa).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.simArrowCol}>
                  <TrendUp
                    size={24}
                    color={delta >= 0 ? themeColors.semantic.success : themeColors.semantic.danger}
                    weight="bold"
                  />
                  <View
                    style={[
                      styles.deltaBadge,
                      {
                        backgroundColor:
                          delta >= 0 ? 'rgba(78, 205, 196, 0.15)' : 'rgba(224, 91, 91, 0.15)',
                        borderColor: delta >= 0 ? themeColors.semantic.success : themeColors.semantic.danger,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deltaText,
                        {
                          color: delta >= 0 ? themeColors.semantic.success : themeColors.semantic.danger,
                        },
                      ]}
                    >
                      {delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.simScoreCol}>
                  <Text style={styles.simScoreLabel}>Proyeksi IPK</Text>
                  <Text
                    style={[
                      styles.simScoreProjected,
                      {
                        color: delta >= 0 ? themeColors.semantic.success : themeColors.brand.accent,
                      },
                    ]}
                  >
                    {Number(simulationResult.simulated_gpa).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.simResultMetaRow}>
                <Text style={styles.simResultMetaText}>
                  Beban Tambahan: +{simulationResult.additional_credits} SKS · Total:{' '}
                  {simulationResult.total_credits} SKS
                </Text>
                <Pressable onPress={resetSimulation} hitSlop={8}>
                  <Text style={styles.resetText}>Reset</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Simulation Items Form List */}
          <View style={styles.simItemsList}>
            {simulationItems.map((item, index) => (
              <View key={index} style={styles.simItemBox}>
                <View style={styles.simItemHeader}>
                  <Text style={styles.simItemNumber}>Mata Kuliah #{index + 1}</Text>
                  <Pressable
                    onPress={() => handleRemoveSimulationItem(index)}
                    hitSlop={8}
                    style={styles.deleteSimItemBtn}
                  >
                    <Trash size={16} color={themeColors.text.muted} weight="duotone" />
                  </Pressable>
                </View>

                <UniInput
                  label="Nama Mata Kuliah"
                  placeholder="Contoh: Pemrograman Mobile Lanjut"
                  value={item.course_name}
                  onChangeText={(val) => handleUpdateItem(index, 'course_name', val)}
                />

                {/* SKS Selector */}
                <Text style={styles.pickerLabel}>Jumlah SKS</Text>
                <View style={styles.sksRow}>
                  {SKS_OPTIONS.map((sks) => {
                    const isSelected = item.credits === sks;
                    return (
                      <Pressable
                        key={sks}
                        onPress={() => handleUpdateItem(index, 'credits', sks)}
                        style={[
                          styles.sksPill,
                          isSelected && styles.sksPillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sksPillText,
                            isSelected && styles.sksPillTextSelected,
                          ]}
                        >
                          {sks} SKS
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Target Letter Grade Selector */}
                <Text style={styles.pickerLabel}>Target Huruf Mutu</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.gradesRow}
                >
                  {GRADE_OPTIONS.map((grade) => {
                    const isSelected = item.target_grade === grade;
                    return (
                      <Pressable
                        key={grade}
                        onPress={() => handleUpdateItem(index, 'target_grade', grade)}
                        style={[
                          styles.gradePill,
                          isSelected && styles.gradePillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.gradePillText,
                            isSelected && styles.gradePillTextSelected,
                          ]}
                        >
                          {grade}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </View>

          {/* Add Row Button */}
          <Pressable
            onPress={handleAddSimulationItem}
            style={styles.addSimBtn}
          >
            <Plus size={16} color={themeColors.brand.primary} weight="bold" />
            <Text style={styles.addSimBtnText}>Tambah Mata Kuliah Simulasi</Text>
          </Pressable>

          {/* Simulation CTA */}
          <View style={styles.ctaContainer}>
            <UniButton
              label={isSimulating ? 'Menghitung...' : 'Hitung Proyeksi IPK'}
              variant="primary"
              size="lg"
              onPress={handleRunSimulation}
              loading={isSimulating}
              leftIcon={<Calculator size={18} color="#FFFFFF" weight="bold" />}
            />
          </View>
        </View>
      </ScrollView>
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
    iconBtn: {
      padding: spacing.xs,
    },
    headerTitle: {
      ...typography.h3,
      color: colors.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxxl,
      gap: spacing.xl,
    },
    heroCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.card,
    },
    heroHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    heroTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    heroSubTitle: {
      ...typography.label,
      color: colors.text.secondary,
    },
    gpaDisplayRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    gpaBigNumber: {
      fontFamily: 'Syne_700Bold',
      fontSize: 52,
      letterSpacing: -1.5,
      color: colors.text.primary,
      lineHeight: 56,
    },
    scaleBox: {
      gap: 2,
    },
    scaleMax: {
      ...typography.mono,
      fontSize: 16,
      color: colors.text.muted,
      fontWeight: '600',
    },
    creditsTotal: {
      ...typography.label,
      color: colors.brand.primary,
      fontSize: 13,
    },
    progressContainer: {
      gap: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      paddingTop: spacing.md,
    },
    progressLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressLabel: {
      ...typography.bodySmall,
      color: colors.text.muted,
    },
    progressPercent: {
      ...typography.mono,
      fontSize: 12,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    progressBarBg: {
      height: 6,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    sectionContainer: {
      gap: spacing.md,
    },
    sectionHeading: {
      ...typography.h3,
      color: colors.text.primary,
    },
    sectionSubHeading: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      marginTop: 2,
    },
    semesterList: {
      gap: spacing.sm,
    },
    semesterCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.card,
    },
    semLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    semName: {
      ...typography.body,
      fontFamily: 'SpaceGrotesk_600SemiBold',
      color: colors.text.primary,
    },
    semCredits: {
      ...typography.bodySmall,
      color: colors.text.muted,
      marginTop: 2,
    },
    semRight: {
      alignItems: 'flex-end',
    },
    semGpa: {
      fontFamily: 'Syne_700Bold',
      fontSize: 20,
      color: colors.brand.primary,
    },
    semGpaLabel: {
      ...typography.label,
      fontSize: 10,
      color: colors.text.muted,
    },
    simTitleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    simResultCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1.5,
      borderColor: colors.brand.primary,
      ...shadows.card,
      gap: spacing.md,
    },
    simResultTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    simScoreCol: {
      alignItems: 'center',
      gap: 2,
    },
    simScoreLabel: {
      ...typography.label,
      fontSize: 11,
      color: colors.text.muted,
    },
    simScoreCurrent: {
      fontFamily: 'Syne_700Bold',
      fontSize: 28,
      color: colors.text.secondary,
    },
    simScoreProjected: {
      fontFamily: 'Syne_700Bold',
      fontSize: 32,
    },
    simArrowCol: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    deltaBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    deltaText: {
      ...typography.mono,
      fontSize: 12,
      fontWeight: '700',
    },
    simResultMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      paddingTop: spacing.sm,
    },
    simResultMetaText: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      fontSize: 12,
    },
    resetText: {
      ...typography.label,
      color: colors.semantic.danger,
      fontSize: 12,
    },
    simItemsList: {
      gap: spacing.md,
    },
    simItemBox: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: spacing.sm,
      ...shadows.card,
    },
    simItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: -4,
    },
    simItemNumber: {
      ...typography.label,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    deleteSimItemBtn: {
      padding: spacing.xs,
    },
    pickerLabel: {
      ...typography.label,
      color: colors.text.secondary,
      marginTop: 2,
    },
    sksRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    sksPill: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    sksPillSelected: {
      borderColor: colors.brand.primary,
      backgroundColor: 'rgba(107, 127, 215, 0.15)',
    },
    sksPillText: {
      ...typography.mono,
      fontSize: 12,
      color: colors.text.secondary,
    },
    sksPillTextSelected: {
      color: colors.brand.primary,
      fontWeight: '700',
    },
    gradesRow: {
      gap: spacing.xs,
      paddingVertical: 2,
    },
    gradePill: {
      width: 44,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    gradePillSelected: {
      borderColor: colors.brand.secondary,
      backgroundColor: 'rgba(78, 205, 196, 0.15)',
    },
    gradePillText: {
      ...typography.mono,
      fontSize: 13,
      color: colors.text.secondary,
    },
    gradePillTextSelected: {
      color: colors.brand.secondary,
      fontWeight: '700',
    },
    addSimBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.brand.primary,
      backgroundColor: 'rgba(107, 127, 215, 0.08)',
    },
    addSimBtnText: {
      ...typography.label,
      color: colors.brand.primary,
      fontSize: 13,
    },
    ctaContainer: {
      marginTop: spacing.xs,
    },
  });
