import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/constants/tokens';

/*
<vibe_check>
Screen/Component : UniButton
Tujuan           : Touch-target primer dan sekunder untuk interaksi mahasiswa yang responsif dan mantap di thumb-zone
Layout strategy  : Flex container dengan padding proporsional, border radius variatif (radius.md: 10)
Color tokens     : brand.primary (#6B7FD7), bg.surface (#171B26), text.primary (#F0F2F8)
Animation plan   : withSpring(0.97) saat ditekan untuk tactile press-down feedback (bukan scale 1.05)
Typography       : SpaceGrotesk_600SemiBold
Anti-slop check  : Rule #28 (No generic scale 1.05), Rule #19 (variasi radius), Rule #3 (no pure white)
</vibe_check>
*/

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface UniButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const UniButton: React.FC<UniButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.base,
        size === 'lg' ? styles.sizeLg : styles.sizeMd,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? colors.bg.base : colors.brand.primary}
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text
            style={[
              styles.text,
              isPrimary && styles.textPrimary,
              (isSecondary || isOutline || isGhost) && styles.textSecondaryVariant,
              textStyle,
            ]}
          >
            {label}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  sizeMd: {
    height: 44,
    paddingHorizontal: spacing.lg,
  },
  sizeLg: {
    height: 52,
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.brand.primary,
  },
  secondary: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border.strong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: typography.h3.fontFamily,
    fontSize: typography.body.fontSize,
    letterSpacing: 0.2,
  },
  textPrimary: {
    color: colors.bg.base,
    fontWeight: '600',
  },
  textSecondaryVariant: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});
