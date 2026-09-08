import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import {
  SignOut,
  GraduationCap,
  CalendarCheck,
  Clock,
  BookBookmark,
  Sparkle,
  TrendUp,
} from 'phosphor-react-native';
import { colors, radius, spacing, typography, shadows } from '@/constants/tokens';
import { UniBadge } from '@/components/ui/UniBadge';
import { UniButton } from '@/components/ui/UniButton';
import { useAuthStore } from '@/store/useAuthStore';

/*
<vibe_check>
Screen/Component : DashboardScreen (app/index.tsx)
Tujuan           : Menampilkan beranda akademik terintegrasi bagi mahasiswa setelah login, dengan status kehadiran, ringkasan jadwal, dan profil terautentikasi
Layout strategy  : Bento-style asimetris (Hero card jadwal kelas teratas + 2-col bento stats di bawahnya), thumb-friendly navigation
Color tokens     : bg.base (#0F1117), bg.surface (#171B26), brand.primary (#6B7FD7), brand.secondary (#4ECDC4), semantic.success (#4ECDC4)
Animation plan   : FadeInDown staggered enter pada kartu-kartu bento
Typography       : Syne_700Bold display, SpaceGrotesk untuk headers & body, JetBrainsMono untuk kode mata kuliah & angka metrik
Anti-slop check  : Rule #6 (Bento asimetris), Rule #10 (Syne + Space Grotesk + Mono), Rule #12 (real user initials), Rule #20 (indigo-slate palette)
</vibe_check>
*/

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar */}
        <Animated.View
          entering={FadeInDown.duration(300).easing(Easing.out(Easing.cubic))}
          style={styles.topBar}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatarPill}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userNameText}>{user?.name || 'Mahasiswa'}</Text>
            </View>
          </View>

          <Pressable onPress={logout} style={styles.logoutButton} hitSlop={12}>
            <SignOut size={20} color={colors.text.secondary} weight="duotone" />
          </Pressable>
        </Animated.View>

        {/* Hero Card: Upcoming Class */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(300).easing(Easing.out(Easing.cubic))}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <UniBadge label="KELAS BERIKUTNYA" variant="primary" size="sm" />
            <View style={styles.timeBadge}>
              <Clock size={14} color={colors.brand.secondary} weight="duotone" />
              <Text style={styles.timeText}>08:00 - 09:40 WIB</Text>
            </View>
          </View>

          <Text style={styles.courseCode}>IF3110 · RUANG 7602</Text>
          <Text style={styles.courseTitle}>Pengembangan Aplikasi Berbasis Web & Mobile</Text>
          <Text style={styles.courseLecturer}>Dr. Eng. Ir. Dosen Pengampu, M.T.</Text>

          <View style={styles.attendanceBar}>
            <View style={styles.attendanceInfo}>
              <Text style={styles.attendanceLabel}>Kehadiran Semester</Text>
              <Text style={styles.attendanceValue}>100% (Aman)</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>
        </Animated.View>

        {/* Bento Grid: Academic Stats */}
        <View style={styles.bentoGrid}>
          {/* Card 1: IPK */}
          <Animated.View
            entering={FadeInDown.delay(160).duration(300).easing(Easing.out(Easing.cubic))}
            style={[styles.bentoCard, styles.bentoCardSpan1]}
          >
            <View style={styles.bentoHeader}>
              <TrendUp size={20} color={colors.brand.primary} weight="duotone" />
              <UniBadge label="SEMESTER 6" variant="neutral" size="sm" />
            </View>
            <Text style={styles.gpaHeroNumber}>3.85</Text>
            <Text style={styles.bentoLabel}>Indeks Prestasi Kumulatif</Text>
          </Animated.View>

          {/* Card 2: SKS & Status */}
          <Animated.View
            entering={FadeInDown.delay(240).duration(300).easing(Easing.out(Easing.cubic))}
            style={[styles.bentoCard, styles.bentoCardSpan1]}
          >
            <View style={styles.bentoHeader}>
              <BookBookmark size={20} color={colors.brand.secondary} weight="duotone" />
              <UniBadge label="AKTIF" variant="success" size="sm" />
            </View>
            <Text style={styles.sksNumber}>108</Text>
            <Text style={styles.bentoLabel}>Total SKS Diselesaikan</Text>
          </Animated.View>
        </View>

        {/* Action Tile / AI Companion teaser */}
        <Animated.View
          entering={FadeInDown.delay(320).duration(300).easing(Easing.out(Easing.cubic))}
          style={styles.aiTeaserCard}
        >
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBadge}>
              <Sparkle size={20} color={colors.brand.primary} weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>UniDemic Intelligence Engine</Text>
              <Text style={styles.aiDescription}>
                Backend terhubung secara aman ke REST API Laravel dengan Sanctum Auth.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
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
  logoutButton: {
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
  },
  timeText: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 12,
    color: colors.brand.secondary,
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
    marginBottom: spacing.lg,
  },
  attendanceBar: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  attendanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  attendanceValue: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 11,
    color: colors.semantic.success,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bg.overlay,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.secondary,
    borderRadius: radius.full,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    ...shadows.card,
  },
  bentoCardSpan1: {
    justifyContent: 'space-between',
    minHeight: 130,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gpaHeroNumber: {
    fontFamily: typography.display.fontFamily,
    fontSize: 34,
    color: colors.brand.primary,
    letterSpacing: -1,
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
    color: colors.text.secondary,
  },
  aiTeaserCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  aiIconBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(107, 127, 215, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(107, 127, 215, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  aiDescription: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});
