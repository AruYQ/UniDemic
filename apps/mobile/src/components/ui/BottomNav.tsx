import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import {
  House,
  CalendarDots,
  GraduationCap,
  CheckSquareOffset,
} from 'phosphor-react-native';
import { colors, radius, spacing, typography, shadows } from '@/constants/tokens';

/*
<vibe_check>
Screen/Component : BottomNav (components/ui/BottomNav.tsx)
Tujuan           : Navigasi thumb-reach zone dengan transisi liquid spring elastis dan pergantian tab berbasis router.replace tanpa penumpukan stack
Layout strategy  : Fixed horizontal bar, background surface elevated dengan border subtle di atas
Color tokens     : bg.surface (#171B26), brand.primary (#6B7FD7), text.primary (#F0F2F8), text.muted (#5A6177)
Animation plan   : Liquid spring physics (mass: 0.6, damping: 18, stiffness: 180) pada icon & pill
Typography       : SpaceGrotesk_500Medium untuk label navigasi
Anti-slop check  : Rule #2 (Phosphor duotone), Rule #5 (Offset shadow), Rule #28 (Spring feedback)
</vibe_check>
*/

interface TabItem {
  name: string;
  route: string;
  label: string;
  icon: (color: string) => React.ReactNode;
}

const SPRING_CONFIG = {
  mass: 0.6,
  damping: 18,
  stiffness: 180,
};

const TabButton: React.FC<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}> = ({ tab, isActive, onPress }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.88, SPRING_CONFIG),
      withSpring(1, SPRING_CONFIG)
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const activeColor = colors.brand.primary;
  const inactiveColor = colors.text.muted;
  const iconColor = isActive ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tabButton}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          isActive && styles.iconWrapperActive,
          animatedStyle,
        ]}
      >
        {tab.icon(iconColor)}
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isActive ? colors.text.primary : colors.text.muted },
          isActive && styles.tabLabelActive,
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
};

export const BottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs: TabItem[] = [
    {
      name: 'home',
      route: '/',
      label: 'Beranda',
      icon: (color) => <House size={22} color={color} weight="duotone" />,
    },
    {
      name: 'schedule',
      route: '/schedule',
      label: 'Jadwal',
      icon: (color) => <CalendarDots size={22} color={color} weight="duotone" />,
    },
    {
      name: 'courses',
      route: '/courses',
      label: 'Kuliah',
      icon: (color) => <GraduationCap size={22} color={color} weight="duotone" />,
    },
    {
      name: 'tasks',
      route: '/tasks',
      label: 'Tugas',
      icon: (color) => <CheckSquareOffset size={22} color={color} weight="duotone" />,
    },
  ];

  const handleNavigate = (route: string) => {
    if (pathname === route) return;
    // Menggunakan replace agar root tab tidak menumpuk stack bertingkat yang bikin animasi swipe kaku
    router.replace(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive =
            tab.route === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.route);

          return (
            <TabButton
              key={tab.name}
              tab={tab}
              isActive={isActive}
              onPress={() => handleNavigate(tab.route)}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
    ...shadows.elevated,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flex: 1,
    minHeight: 48,
  },
  iconWrapper: {
    padding: 6,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(107, 127, 215, 0.15)',
  },
  tabLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: '600',
    color: colors.brand.primary,
  },
});
