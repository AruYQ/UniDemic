import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Key } from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { joinStudyGroupSchema } from '@/types/collaboration';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : JoinStudyGroupModal (components/collaboration/JoinStudyGroupModal.tsx)
Tujuan           : Modal ringkas untuk bergabung ke grup belajar menggunakan kode undangan 8 karakter
Layout strategy  : Bottom sheet modal terfokus dengan input monospace kode undangan dan CTA gabung
Color tokens     : bg.elevated, bg.surface, brand.primary, brand.accent, semantic.danger
Animation plan   : Slide modal + UniButton spring tap
Typography       : SpaceGrotesk header, JetBrainsMono input kode
Anti-slop check  : Rule #3 (no pure white/black), Zod validation
</vibe_check>
*/

export interface JoinStudyGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onJoinByCode: (inviteCode: string) => Promise<void>;
}

export const JoinStudyGroupModal: React.FC<JoinStudyGroupModalProps> = ({
  visible,
  onClose,
  onJoinByCode,
}) => {
  const { colors: themeColors } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoin = async () => {
    setErrorMsg(null);
    const cleaned = inviteCode.trim().toUpperCase();
    const parsed = joinStudyGroupSchema.safeParse({ invite_code: cleaned });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Kode undangan tidak valid');
      return;
    }

    setIsSubmitting(true);
    try {
      await onJoinByCode(parsed.data.invite_code);
      setInviteCode('');
      onClose();
    } catch (err) {
      setErrorMsg(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Key size={22} color={themeColors.brand.accent} weight="duotone" />
              <Text style={styles.title}>Gabung via Kode Undangan</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={20} color={themeColors.text.secondary} weight="bold" />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Masukkan kode undangan unik dari ketua atau anggota grup belajar Anda.
          </Text>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <UniInput
            label="Kode Undangan"
            placeholder="Contoh: AB12CD34"
            value={inviteCode}
            onChangeText={(val) => setInviteCode(val.toUpperCase())}
            autoCapitalize="characters"
            maxLength={16}
            style={{
              fontFamily: typography.mono.fontFamily,
              fontSize: 18,
              letterSpacing: 2,
            }}
          />

          <UniButton
            label="Gabung Grup"
            onPress={handleJoin}
            loading={isSubmitting}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 17, 23, 0.72)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.bg.elevated,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderTopWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 18,
      color: colors.text.primary,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subtitle: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
      marginBottom: spacing.lg,
      lineHeight: 19,
    },
    errorBanner: {
      backgroundColor: 'rgba(224, 91, 91, 0.14)',
      borderWidth: 1,
      borderColor: colors.semantic.danger,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 13,
      color: colors.semantic.danger,
    },
  });
