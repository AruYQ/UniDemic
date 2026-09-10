import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius, spacing, shadows } from '@/constants/tokens';

/*
<vibe_check>
Screen/Component : UniSkeleton (components/ui/UniSkeleton.tsx)
Tujuan           : Memberikan feedback loading ala Instagram/Linear dengan shimmer wireframe yang meniru persis bentuk kartu
Layout strategy  : ShimmerBox fleksibel + Pre-built Skeletons (Schedule, Course, Assignment, Hero)
Color tokens     : bg.surface (#171B26), bg.elevated (#1E2333), bg.overlay (#252A3D)
Animation plan   : Hardware-accelerated GPU opacity pulse (0.35 -> 0.75 -> 0.35) tanpa membebani JS thread
Typography       : N/A
Anti-slop check  : Rule #21 (Skeleton selalu untuk konten, tanpa ActivityIndicator), Rule #3 (No pure white)
</vibe_check>
*/

interface ShimmerBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const ShimmerBox: React.FC<ShimmerBoxProps> = ({
  width = '100%',
  height = 16,
  borderRadius = radius.md,
  style,
}) => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.shimmerBase,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const ScheduleCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.timeColumnSkeleton}>
        <ShimmerBox width={50} height={14} borderRadius={radius.sm} />
        <ShimmerBox width={2} height={12} style={{ marginVertical: 6 }} />
        <ShimmerBox width={45} height={12} borderRadius={radius.sm} />
      </View>
      <View style={styles.contentColumnSkeleton}>
        <ShimmerBox width={70} height={11} style={{ marginBottom: 8 }} />
        <ShimmerBox width="85%" height={16} style={{ marginBottom: 10 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ShimmerBox width={65} height={20} borderRadius={radius.sm} />
          <ShimmerBox width={100} height={20} borderRadius={radius.sm} />
        </View>
      </View>
    </View>
  );
};

export const CourseCardSkeleton: React.FC = () => {
  return (
    <View style={styles.courseCardSkeleton}>
      <View style={styles.headerRowSkeleton}>
        <ShimmerBox width={60} height={14} borderRadius={radius.sm} />
        <ShimmerBox width={50} height={18} borderRadius={radius.sm} />
      </View>
      <ShimmerBox width="75%" height={20} style={{ marginVertical: 10 }} />
      <ShimmerBox width="50%" height={13} style={{ marginBottom: 14 }} />
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <ShimmerBox width={70} height={14} borderRadius={radius.sm} />
        <ShimmerBox width={70} height={14} borderRadius={radius.sm} />
      </View>
    </View>
  );
};

export const AssignmentCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={{ flex: 1 }}>
        <View style={styles.headerRowSkeleton}>
          <ShimmerBox width={80} height={12} borderRadius={radius.sm} />
          <ShimmerBox width={55} height={18} borderRadius={radius.sm} />
        </View>
        <ShimmerBox width="80%" height={17} style={{ marginVertical: 8 }} />
        <ShimmerBox width="95%" height={12} style={{ marginBottom: 12 }} />
        <ShimmerBox width="100%" height={6} borderRadius={radius.full} style={{ marginBottom: 10 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ShimmerBox width={90} height={14} borderRadius={radius.sm} />
          <ShimmerBox width={90} height={22} borderRadius={radius.md} />
        </View>
      </View>
    </View>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <View style={{ gap: spacing.lg }}>
      {/* Hero Skeleton */}
      <View style={styles.heroSkeleton}>
        <View style={styles.headerRowSkeleton}>
          <ShimmerBox width={120} height={20} borderRadius={radius.sm} />
          <ShimmerBox width={80} height={16} borderRadius={radius.sm} />
        </View>
        <ShimmerBox width={90} height={12} style={{ marginVertical: 10 }} />
        <ShimmerBox width="80%" height={24} style={{ marginBottom: 8 }} />
        <ShimmerBox width="50%" height={14} style={{ marginBottom: 16 }} />
        <ShimmerBox width="100%" height={24} borderRadius={radius.md} />
      </View>

      {/* Bento Grid Skeleton */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={[styles.bentoSkeleton, { flex: 1 }]}>
          <ShimmerBox width={32} height={20} borderRadius={radius.sm} />
          <ShimmerBox width={60} height={32} style={{ marginVertical: 8 }} />
          <ShimmerBox width={80} height={12} />
        </View>
        <View style={[styles.bentoSkeleton, { flex: 1 }]}>
          <ShimmerBox width={32} height={20} borderRadius={radius.sm} />
          <ShimmerBox width={60} height={32} style={{ marginVertical: 8 }} />
          <ShimmerBox width={80} height={12} />
        </View>
      </View>

      {/* Assignment List Skeleton */}
      <View style={{ gap: spacing.sm }}>
        <ShimmerBox width={130} height={18} borderRadius={radius.sm} />
        <AssignmentCardSkeleton />
        <AssignmentCardSkeleton />
      </View>
    </View>
  );
};

export const CourseDetailSkeleton: React.FC = () => {
  return (
    <View style={{ gap: spacing.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
      {/* Hero Card Skeleton */}
      <View style={styles.heroSkeleton}>
        <View style={styles.headerRowSkeleton}>
          <ShimmerBox width={90} height={16} borderRadius={radius.sm} />
          <ShimmerBox width={55} height={18} borderRadius={radius.sm} />
        </View>
        <ShimmerBox width="85%" height={26} style={{ marginVertical: 12 }} />
        <View style={{ gap: 8 }}>
          <ShimmerBox width="50%" height={14} borderRadius={radius.sm} />
          <ShimmerBox width="40%" height={14} borderRadius={radius.sm} />
        </View>
      </View>

      {/* Segmented Tab Bar Skeleton */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: 4, gap: 6 }}>
        <ShimmerBox width="31%" height={36} borderRadius={radius.md} />
        <ShimmerBox width="31%" height={36} borderRadius={radius.md} />
        <ShimmerBox width="31%" height={36} borderRadius={radius.md} />
      </View>

      {/* Cards List Skeleton */}
      <View style={{ gap: spacing.sm }}>
        <ScheduleCardSkeleton />
        <ScheduleCardSkeleton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shimmerBase: {
    backgroundColor: colors.bg.overlay,
  },
  cardSkeleton: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  timeColumnSkeleton: {
    alignItems: 'center',
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border.subtle,
    minWidth: 70,
  },
  contentColumnSkeleton: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  courseCardSkeleton: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  headerRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSkeleton: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xl,
    ...shadows.card,
  },
  bentoSkeleton: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    minHeight: 120,
    justifyContent: 'space-between',
    ...shadows.card,
  },
});
