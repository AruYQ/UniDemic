import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Animated as RNAnimated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Trash } from 'phosphor-react-native';
import { radius, spacing } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

interface UniSwipeableProps {
  children: React.ReactNode;
  onDelete?: () => void;
  enabled?: boolean;
}

export const UniSwipeable: React.FC<UniSwipeableProps> = ({
  children,
  onDelete,
  enabled = true,
}) => {
  const { colors: themeColors } = useUniTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const isPromptingRef = useRef(false);

  if (!enabled || !onDelete) {
    return <>{children}</>;
  }

  const handleDelete = () => {
    if (isPromptingRef.current) return;
    isPromptingRef.current = true;
    swipeableRef.current?.close();
    onDelete();
    setTimeout(() => {
      isPromptingRef.current = false;
    }, 600);
  };

  const handleSwipeableOpen = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      handleDelete();
    }
  };

  const renderRightActions = (
    progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-60, -20, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionContainer}>
        <Pressable
          onPress={handleDelete}
          style={[styles.deleteButton, { backgroundColor: themeColors.semantic.danger }]}
        >
          <RNAnimated.View style={{ transform: [{ scale }], opacity }}>
            <Trash size={20} color="#FFFFFF" weight="bold" />
          </RNAnimated.View>
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeableOpen}
      containerStyle={styles.swipeContainer}
    >
      {children}
    </Swipeable>
  );
};


const styles = StyleSheet.create({
  swipeContainer: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  rightActionContainer: {
    width: 68,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  deleteButton: {
    width: 56,
    height: '100%',
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
