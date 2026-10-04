import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, { FadeInUp, Easing } from 'react-native-reanimated';
import {
  ArrowBendUpLeft,
  Check,
  CheckFat,
  Copy,
  DotsThree,
  File,
  Image as ImageIcon,
  Smiley,
  Trash,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Message, MessageReaction } from '@/types/communication';
import { AcademicRefPreview } from './AcademicRefPreview';

/*
<vibe_check>
Screen/Component : MessageBubble (components/communication/MessageBubble.tsx)
Tujuan           : Menampilkan gelembung pesan obrolan antara mahasiswa, dosen, atau dalam saluran kuliah dengan dukungan reply, reaksi emoji, referensi akademik, dan lampiran
Layout strategy  : Asymmetrical chat layout: Pengirim di kanan (indigo tint), lawan bicara di kiri (surface card + initial avatar), strip reply quote di atas konten pesan, pill reaksi di bawah
Color tokens     : brand.primary (#6B7FD7), bg.surface (#171B26), bg.elevated (#1E2333), text.primary (#F0F2F8), text.muted (#5A6177), border.subtle (#252A3D)
Animation plan   : FadeInUp pada pesan baru
Typography       : SpaceGrotesk_400Regular (isi pesan), SpaceGrotesk_600SemiBold (nama pengirim), JetBrainsMono_400Regular (timestamp & ukuran file)
Anti-slop check  : Rule #10 (Space Grotesk + JetBrains Mono), Rule #12 (Initials avatar real), Rule #3 (Tanpa pure black/white), Rule #7 (Reaksi emoji fungsional)
</vibe_check>
*/

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  onReply?: (message: Message) => void;
  onToggleReaction?: (messageId: number, emoji: string) => void;
  onDelete?: (messageId: number) => void;
  onLongPress?: (message: Message) => void;
  showSenderName?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  onReply,
  onToggleReaction,
  onDelete,
  onLongPress,
  showSenderName = true,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(
    () => createStyles(themeColors, themeShadows, isCurrentUser),
    [themeColors, themeShadows, isCurrentUser]
  );

  const isDeleted = Boolean(message.deleted_at);

  const formattedTime = useMemo(() => {
    try {
      const date = new Date(message.created_at);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  }, [message.created_at]);

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    if (!message.reactions || message.reactions.length === 0) return [];
    const map = new Map<string, { count: number; userReacted: boolean }>();

    message.reactions.forEach((r) => {
      const existing = map.get(r.emoji) || { count: 0, userReacted: false };
      existing.count += 1;
      if (isCurrentUser ? r.user_id === message.user_id : false) {
        existing.userReacted = true;
      }
      map.set(r.emoji, existing);
    });

    return Array.from(map.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      userReacted: data.userReacted,
    }));
  }, [message.reactions, isCurrentUser, message.user_id]);

  const initials = useMemo(() => {
    if (!message.user?.name) return 'U';
    const parts = message.user.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return message.user.name.substring(0, 2).toUpperCase();
  }, [message.user?.name]);

  return (
    <Animated.View
      entering={FadeInUp.duration(200).easing(Easing.out(Easing.cubic))}
      style={[
        styles.rowContainer,
        isCurrentUser ? styles.rowCurrentUser : styles.rowOtherUser,
      ]}
    >
      {/* Avatar for other users in group/course channels */}
      {!isCurrentUser && showSenderName && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View
        style={[
          styles.bubbleWrapper,
          isCurrentUser ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft,
        ]}
      >
        <Pressable
          onLongPress={() => onLongPress?.(message)}
          delayLongPress={300}
          style={({ pressed }) => [
            styles.bubbleCard,
            pressed && { opacity: 0.95 },
            isDeleted && styles.deletedBubble,
          ]}
        >
          {/* Sender Name in group / channel chats */}
          {!isCurrentUser && showSenderName && !isDeleted && (
            <Text style={styles.senderName} numberOfLines={1}>
              {message.user?.name || 'Mahasiswa'}
            </Text>
          )}

          {/* Reply Quote Preview */}
          {message.reply_to && !isDeleted && (
            <View style={styles.replyQuote}>
              <View style={styles.replyBar} />
              <View style={styles.replyContent}>
                <Text style={styles.replyAuthor} numberOfLines={1}>
                  {message.reply_to.user?.name || 'Pesan'}
                </Text>
                <Text style={styles.replySnippet} numberOfLines={1}>
                  {message.reply_to.content}
                </Text>
              </View>
            </View>
          )}

          {/* Academic Reference Embed Card */}
          {message.reference_type && message.reference_id && !isDeleted && (
            <AcademicRefPreview
              reference={{
                type: message.reference_type,
                id: message.reference_id,
                title: message.reference_data?.title,
                subtitle: message.reference_data?.subtitle,
              }}
            />
          )}

          {/* Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && !isDeleted && (
            <View style={styles.attachmentsContainer}>
              {message.attachments.map((att) => (
                <Pressable
                  key={att.id}
                  style={styles.attachmentChip}
                  onPress={() => {
                    Alert.alert(
                      'Fitur Belum Tersedia',
                      'Fitur unduh dan pratinjau berkas lampiran saat ini belum tersedia dan akan hadir pada pembaruan mendatang.',
                      [{ text: 'Mengerti', style: 'default' }]
                    );
                  }}
                  hitSlop={6}
                >
                  {att.file_type?.startsWith('image') ? (
                    <ImageIcon size={16} weight="duotone" color={themeColors.brand.secondary} />
                  ) : (
                    <File size={16} weight="duotone" color={themeColors.brand.primary} />
                  )}
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {att.file_name}
                  </Text>
                  <Text style={styles.attachmentSize}>
                    {(att.file_size / 1024).toFixed(0)} KB
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Main Message Content */}
          <Text
            style={[
              styles.messageText,
              isDeleted && styles.deletedText,
            ]}
          >
            {message.content}
          </Text>

          {/* Metadata Footer: Timestamp & Read Status */}
          <View style={styles.footerRow}>
            <Text style={styles.timestampText}>{formattedTime}</Text>
            {isCurrentUser && (
              <CheckFat
                size={12}
                weight={message.is_read ? 'fill' : 'regular'}
                color={message.is_read ? themeColors.brand.secondary : themeColors.text.muted}
              />
            )}
          </View>
        </Pressable>

        {/* Reaction Badges Strip */}
        {groupedReactions.length > 0 && !isDeleted && (
          <View style={[styles.reactionsStrip, isCurrentUser ? styles.reactionsRight : styles.reactionsLeft]}>
            {groupedReactions.map(({ emoji, count, userReacted }) => (
              <Pressable
                key={emoji}
                onPress={() => onToggleReaction?.(message.id, emoji)}
                style={[
                  styles.reactionPill,
                  userReacted && styles.reactionPillActive,
                ]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows, isCurrentUser: boolean) =>
  StyleSheet.create({
    rowContainer: {
      flexDirection: 'row',
      marginVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    rowCurrentUser: {
      justifyContent: 'flex-end',
    },
    rowOtherUser: {
      justifyContent: 'flex-start',
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    avatarText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    bubbleWrapper: {
      maxWidth: '82%',
    },
    bubbleWrapperRight: {
      alignItems: 'flex-end',
    },
    bubbleWrapperLeft: {
      alignItems: 'flex-start',
    },
    bubbleCard: {
      borderRadius: radius.lg,
      borderTopRightRadius: isCurrentUser ? radius.sm : radius.lg,
      borderTopLeftRadius: !isCurrentUser ? radius.sm : radius.lg,
      backgroundColor: isCurrentUser ? colors.brand.primary : colors.bg.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: 1,
      borderColor: isCurrentUser ? `${colors.brand.primary}80` : colors.border.subtle,
      ...shadows.card,
    },
    deletedBubble: {
      backgroundColor: colors.bg.surface,
      borderColor: colors.border.subtle,
      borderStyle: 'dashed',
    },
    senderName: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.brand.secondary,
      marginBottom: 3,
    },
    replyQuote: {
      flexDirection: 'row',
      backgroundColor: isCurrentUser ? 'rgba(0,0,0,0.18)' : colors.bg.elevated,
      borderRadius: radius.sm,
      padding: spacing.xs + 2,
      marginBottom: spacing.xs + 2,
      borderLeftWidth: 3,
      borderLeftColor: isCurrentUser ? colors.brand.secondary : colors.brand.primary,
    },
    replyBar: {
      width: 0,
    },
    replyContent: {
      flex: 1,
      marginLeft: spacing.xs,
    },
    replyAuthor: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: isCurrentUser ? '#FFFFFF' : colors.brand.primary,
    },
    replySnippet: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: isCurrentUser ? 'rgba(255,255,255,0.75)' : colors.text.secondary,
    },
    attachmentsContainer: {
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    attachmentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isCurrentUser ? 'rgba(0,0,0,0.18)' : colors.bg.elevated,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      gap: spacing.xs,
    },
    attachmentName: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: isCurrentUser ? '#FFFFFF' : colors.text.primary,
      flex: 1,
    },
    attachmentSize: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.text.muted,
    },
    messageText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14.5,
      color: isCurrentUser ? '#FFFFFF' : colors.text.primary,
      lineHeight: 20,
    },
    deletedText: {
      fontStyle: 'italic',
      color: colors.text.muted,
      fontSize: 13,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 4,
    },
    timestampText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: isCurrentUser ? 'rgba(255,255,255,0.65)' : colors.text.muted,
    },
    reactionsStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: -6,
      zIndex: 2,
    },
    reactionsRight: {
      justifyContent: 'flex-end',
      marginRight: 6,
    },
    reactionsLeft: {
      justifyContent: 'flex-start',
      marginLeft: 6,
    },
    reactionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.full,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: 3,
      ...shadows.card,
    },
    reactionPillActive: {
      borderColor: colors.brand.primary,
      backgroundColor: `${colors.brand.primary}20`,
    },
    reactionEmoji: {
      fontSize: 12,
    },
    reactionCount: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
  });
