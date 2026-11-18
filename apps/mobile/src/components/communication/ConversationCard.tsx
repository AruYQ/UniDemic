import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight, Easing } from 'react-native-reanimated';
import { UsersThree, GraduationCap, ChatCircleDots } from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Conversation } from '@/types/communication';
import { UniBadge } from '../ui/UniBadge';
import { UniSwipeable } from '../ui/UniSwipeable';

/*
<vibe_check>
Screen/Component : ConversationCard (components/communication/ConversationCard.tsx)
Tujuan           : Menampilkan item percakapan di halaman kotak masuk (Inbox) obrolan langsung maupun grup mahasiswa
Layout strategy  : Horizontal list card: Avatar dengan inisial/icon grup (kiri), nama percakapan + snippet pesan terakhir (tengah), timestamp JetBrains Mono + unread count badge (kanan)
Color tokens     : bg.surface (#171B26), border.subtle (#252A3D), brand.primary (#6B7FD7), text.primary (#F0F2F8), text.muted (#5A6177)
Animation plan   : FadeInRight staggered entry + swipeable to delete
Typography       : SpaceGrotesk_600SemiBold (nama percakapan), SpaceGrotesk_400Regular (snippet pesan), JetBrainsMono_400Regular (timestamp)
Anti-slop check  : Rule #10 (JetBrains Mono untuk waktu), Rule #12 (Initials avatar real), Rule #5 (Offset shadow), Rule #19 (Radius bervariasi)
</vibe_check>
*/

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId?: number;
  index?: number;
  onPress?: () => void;
  onDelete?: (id: number) => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  currentUserId,
  index = 0,
  onPress,
  onDelete,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(
    () => createStyles(themeColors, themeShadows),
    [themeColors, themeShadows]
  );

  // Compute conversation title & avatar initials
  const { displayName, initials, isGroup } = useMemo(() => {
    if (conversation.type === 'course') {
      return {
        displayName: conversation.course?.name
          ? `${conversation.course.name} (${conversation.name || 'Saluran'})`
          : conversation.name || 'Saluran Kuliah',
        initials: 'MK',
        isGroup: true,
      };
    }

    if (conversation.type === 'group') {
      return {
        displayName: conversation.name || 'Grup Diskusi',
        initials: 'GR',
        isGroup: true,
      };
    }

    // Direct message: find other participant
    const otherParticipant = conversation.participants?.find(
      (p) => p.user_id !== currentUserId
    );
    const name = otherParticipant?.user?.name || conversation.name || 'Teman Belajar';
    const parts = name.trim().split(' ');
    const init =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();

    return {
      displayName: name,
      initials: init,
      isGroup: false,
    };
  }, [conversation, currentUserId]);

  // Format last message preview
  const lastMessageSnippet = useMemo(() => {
    const msg = conversation.last_message;
    if (!msg) return 'Belum ada pesan';
    if (msg.deleted_at) return 'Pesan telah dihapus';

    const isOwn = currentUserId && msg.user_id === currentUserId;
    const prefix = isOwn ? 'Anda: ' : conversation.type !== 'direct' && msg.user?.name ? `${msg.user.name.split(' ')[0]}: ` : '';

    if (msg.reference_type) {
      return `${prefix}📎 [Referensi ${msg.reference_type.toUpperCase()}] ${msg.content || ''}`;
    }
    if (msg.type === 'image') return `${prefix}📷 Foto`;
    if (msg.type === 'file') return `${prefix}📄 Dokumen`;

    return `${prefix}${msg.content}`;
  }, [conversation.last_message, currentUserId, conversation.type]);

  // Format timestamp in JetBrains Mono
  const formattedTime = useMemo(() => {
    const rawDate = conversation.last_message_at || conversation.created_at;
    if (!rawDate) return '';
    try {
      const date = new Date(rawDate);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }

      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) {
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        return days[date.getDay()];
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${date.getDate()} ${months[date.getMonth()]}`;
    } catch {
      return '';
    }
  }, [conversation.last_message_at, conversation.created_at]);

  const unreadCount = conversation.unread_count || 0;

  return (
    <UniSwipeable onDelete={onDelete ? () => onDelete(conversation.id) : undefined}>
      <Animated.View
        entering={FadeInRight.delay(index * 40)
          .duration(220)
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
          {/* Avatar Icon / Initials */}
          <View
            style={[
              styles.avatar,
              isGroup ? styles.avatarGroup : styles.avatarDirect,
            ]}
          >
            {conversation.type === 'course' ? (
              <GraduationCap size={20} weight="duotone" color={themeColors.brand.primary} />
            ) : conversation.type === 'group' ? (
              <UsersThree size={20} weight="duotone" color={themeColors.brand.secondary} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>

          {/* Info Center */}
          <View style={styles.infoWrapper}>
            <View style={styles.topRow}>
              <Text style={styles.titleText} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.timeText}>{formattedTime}</Text>
            </View>

            <View style={styles.bottomRow}>
              <Text
                style={[
                  styles.snippetText,
                  unreadCount > 0 && styles.snippetTextUnread,
                ]}
                numberOfLines={1}
              >
                {lastMessageSnippet}
              </Text>

              {unreadCount > 0 && (
                <UniBadge
                  variant="primary"
                  label={String(unreadCount > 99 ? '99+' : unreadCount)}
                />
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </UniSwipeable>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      marginHorizontal: spacing.md,
      marginVertical: spacing.xs,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
      gap: spacing.md,
      ...shadows.card,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    avatarDirect: {
      backgroundColor: `${colors.brand.primary}18`,
      borderColor: `${colors.brand.primary}35`,
    },
    avatarGroup: {
      backgroundColor: `${colors.brand.secondary}18`,
      borderColor: `${colors.brand.secondary}35`,
    },
    avatarText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: colors.brand.primary,
    },
    infoWrapper: {
      flex: 1,
      gap: 4,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 15,
      color: colors.text.primary,
      flex: 1,
      marginRight: spacing.sm,
    },
    timeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    snippetText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      flex: 1,
      marginRight: spacing.sm,
    },
    snippetTextUnread: {
      fontFamily: typography.body.fontFamily,
      color: colors.text.primary,
      fontWeight: '600',
    },
  });
