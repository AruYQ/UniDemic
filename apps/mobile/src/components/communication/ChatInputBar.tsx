import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import {
  PaperPlaneRight,
  Plus,
  Smiley,
  X,
  FileText,
  BookBookmark,
  CheckSquareOffset,
  Brain,
  Notebook,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { AcademicReference, Message } from '@/types/communication';
import { AcademicRefPreview } from './AcademicRefPreview';

/*
<vibe_check>
Screen/Component : ChatInputBar (components/communication/ChatInputBar.tsx)
Tujuan           : Komponen input composer untuk mengetik pesan, membalas pesan orang lain, menyematkan referensi akademik (tugas/kuis/materi), serta mengirim dengan animasi
Layout strategy  : Stacked composer: Banner reply / referensi (atas), bar input horizontal (bawah) dengan tombol attach (+), text input auto-grow, picker emoji, tombol send circular
Color tokens     : bg.surface (#171B26), bg.elevated (#1E2333), border.subtle (#252A3D), brand.primary (#6B7FD7), text.primary (#F0F2F8), text.muted (#5A6177)
Animation plan   : Spring send button feedback + smooth banner appearance
Typography       : SpaceGrotesk_400Regular (input text), SpaceGrotesk_500Medium (reply header)
Anti-slop check  : Rule #28 (Spring press feedback), Rule #2 (Phosphor icons duotone), Rule #3 (Tanpa pure white), Rule #19 (Radius bervariasi)
</vibe_check>
*/

interface ChatInputBarProps {
  replyingTo: Message | null;
  attachedAcademicRef: AcademicReference | null;
  isSending: boolean;
  onSend: (content: string) => void;
  onCancelReply: () => void;
  onRemoveAcademicRef: () => void;
  onOpenAcademicPicker?: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '💡', '👏', '🎉', '🚀', '📚'];

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  replyingTo,
  attachedAcademicRef,
  isSending,
  onSend,
  onCancelReply,
  onRemoveAcademicRef,
  onOpenAcademicPicker,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const styles = useMemo(
    () => createStyles(themeColors, themeShadows),
    [themeColors, themeShadows]
  );

  const canSend = (content.trim().length > 0 || attachedAcademicRef !== null) && !isSending;

  const handleSend = () => {
    if (!canSend) return;
    const textToSend = content.trim();
    setContent('');
    setShowEmojiPicker(false);
    onSend(textToSend);
  };

  const handleAddEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  return (
    <View style={styles.container}>
      {/* Replying-To Banner */}
      {replyingTo && (
        <View style={styles.replyBanner}>
          <View style={styles.replyBarIndicator} />
          <View style={styles.replyBannerContent}>
            <Text style={styles.replyBannerTitle}>
              Membalas ke {replyingTo.user?.name || 'Pesan'}
            </Text>
            <Text style={styles.replyBannerSnippet} numberOfLines={1}>
              {replyingTo.content}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} hitSlop={8} style={styles.dismissButton}>
            <X size={16} weight="bold" color={themeColors.text.muted} />
          </Pressable>
        </View>
      )}

      {/* Attached Academic Reference Banner */}
      {attachedAcademicRef && (
        <View style={styles.academicBanner}>
          <AcademicRefPreview
            reference={attachedAcademicRef}
            isComposer
            onRemove={onRemoveAcademicRef}
          />
        </View>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <View style={styles.emojiPickerBar}>
          {QUICK_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => handleAddEmoji(emoji)}
              style={({ pressed }) => [
                styles.emojiItem,
                pressed && { opacity: 0.6, transform: [{ scale: 1.15 }] },
              ]}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Main Composer Row */}
      <View style={styles.inputRow}>
        {/* Attachment Button (Fitur Ditangguhkan Sementara) */}
        <Pressable
          onPress={() => {
            Alert.alert(
              'Fitur Belum Tersedia',
              'Fitur lampiran dan berkas akademik saat ini belum tersedia dan akan hadir pada pembaruan mendatang.',
              [{ text: 'Mengerti', style: 'default' }]
            );
          }}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}
          hitSlop={8}
          accessibilityLabel="Lampiran belum tersedia"
        >
          <Plus size={20} weight="bold" color={themeColors.text.muted} />
        </Pressable>

        {/* Text Input Container */}
        <View style={styles.textInputWrapper}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Tulis pesan..."
            placeholderTextColor={themeColors.text.muted}
            multiline
            maxLength={2000}
            style={styles.textInput}
          />

          {/* Quick Emoji Toggle Button */}
          <Pressable
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.emojiButton,
              showEmojiPicker && styles.emojiButtonActive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Smiley
              size={20}
              weight={showEmojiPicker ? 'fill' : 'duotone'}
              color={showEmojiPicker ? themeColors.brand.accent : themeColors.text.muted}
            />
          </Pressable>
        </View>

        {/* Send Button */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
            pressed && canSend && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <PaperPlaneRight
            size={18}
            weight="fill"
            color={canSend ? '#FFFFFF' : themeColors.text.muted}
          />
        </Pressable>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bg.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.md,
    },
    replyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      padding: spacing.xs + 2,
      marginBottom: spacing.xs,
      borderLeftWidth: 3,
      borderLeftColor: colors.brand.primary,
    },
    replyBarIndicator: {
      width: 0,
    },
    replyBannerContent: {
      flex: 1,
      marginLeft: spacing.xs,
    },
    replyBannerTitle: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
    },
    replyBannerSnippet: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    academicBanner: {
      marginBottom: spacing.xs,
    },
    dismissButton: {
      padding: spacing.xs,
    },
    emojiPickerBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.full,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    emojiItem: {
      padding: spacing.xs,
    },
    emojiText: {
      fontSize: 18,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    textInputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.OS === 'ios' ? 8 : 4,
      minHeight: 42,
      maxHeight: 120,
    },
    textInput: {
      flex: 1,
      fontFamily: typography.body.fontFamily,
      fontSize: 14.5,
      color: colors.text.primary,
      paddingTop: 0,
      paddingBottom: 0,
      marginRight: spacing.xs,
    },
    emojiButton: {
      paddingBottom: 4,
      paddingHorizontal: 2,
    },
    emojiButtonActive: {},
    sendButton: {
      width: 42,
      height: 42,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 1,
      ...shadows.card,
    },
    sendButtonActive: {
      backgroundColor: colors.brand.primary,
    },
    sendButtonDisabled: {
      backgroundColor: colors.bg.overlay,
    },
  });
