import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight, Easing } from 'react-native-reanimated';
import {
  CaretRight,
  Hash,
  CheckSquareOffset,
  FileText,
  Books,
  ChatsCircle,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Conversation } from '@/types/communication';
import { UniBadge } from '../ui/UniBadge';

/*
<vibe_check>
Screen/Component : CourseChannelCard (components/communication/CourseChannelCard.tsx)
Tujuan           : Menampilkan kartu saluran diskusi kuliah (#general, #tugas, #ujian, #resources) pada tab Diskusi di halaman detail mata kuliah
Layout strategy  : Clean channel row: Tag icon tematik sesuai jenis saluran (kiri), nama saluran JetBrains Mono + deskripsi ringkas (tengah), unread badge + caret kanan (kanan)
Color tokens     : bg.surface (#171B26), border.subtle (#252A3D), brand.primary (#6B7FD7), brand.secondary (#4ECDC4), text.primary (#F0F2F8)
Animation plan   : FadeInRight staggered entry per saluran
Typography       : JetBrainsMono_400Regular (nama saluran #...), SpaceGrotesk_400Regular (deskripsi)
Anti-slop check  : Rule #10 (JetBrains Mono untuk nama saluran teks #), Rule #7 (Badge numerik tanpa emoji), Rule #5 (Offset shadow)
</vibe_check>
*/

interface CourseChannelCardProps {
  channel: Conversation;
  index?: number;
  onPress?: () => void;
}

export const CourseChannelCard: React.FC<CourseChannelCardProps> = ({
  channel,
  index = 0,
  onPress,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(
    () => createStyles(themeColors, themeShadows),
    [themeColors, themeShadows]
  );

  const channelIcon = useMemo(() => {
    const name = (channel.name || '').toLowerCase();
    if (name.includes('tugas')) {
      return <CheckSquareOffset size={20} weight="duotone" color={themeColors.semantic.warning} />;
    }
    if (name.includes('ujian')) {
      return <FileText size={20} weight="duotone" color={themeColors.semantic.danger} />;
    }
    if (name.includes('resource') || name.includes('materi')) {
      return <Books size={20} weight="duotone" color={themeColors.brand.secondary} />;
    }
    if (name.includes('general') || name.includes('umum')) {
      return <ChatsCircle size={20} weight="duotone" color={themeColors.brand.primary} />;
    }
    return <Hash size={20} weight="duotone" color={themeColors.brand.primary} />;
  }, [channel.name, themeColors]);

  const unreadCount = channel.unread_count || 0;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 40)
        .duration(200)
        .easing(Easing.out(Easing.cubic))}
      style={styles.container}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
        ]}
      >
        <View style={styles.iconBox}>{channelIcon}</View>

        <View style={styles.infoWrapper}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channel.name}
          </Text>
          {channel.description ? (
            <Text style={styles.descriptionText} numberOfLines={1}>
              {channel.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightSide}>
          {unreadCount > 0 && (
            <UniBadge
              variant="primary"
              label={String(unreadCount > 99 ? '99+' : unreadCount)}
            />
          )}
          <CaretRight size={16} weight="bold" color={themeColors.text.muted} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing.xs,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
      gap: spacing.md,
      ...shadows.card,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoWrapper: {
      flex: 1,
      gap: 2,
    },
    channelName: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
    },
    descriptionText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    rightSide: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
  });
