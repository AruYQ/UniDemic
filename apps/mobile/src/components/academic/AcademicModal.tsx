import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, Easing } from 'react-native-reanimated';
import { X } from 'phosphor-react-native';
import { colors, radius, spacing, typography, shadows } from '@/constants/tokens';

/*
<vibe_check>
Screen/Component : AcademicModal (components/academic/AcademicModal.tsx)
Tujuan           : Dialog modal yang rapi dan elegan untuk menambahkan entitas akademik (Semester, Matkul, Jadwal, Tugas, Ujian)
Layout strategy  : Overlay semi-transparan dengan card elevated terpusat, scrollable form, tombol dismiss X di kanan atas
Color tokens     : bg.elevated (#1E2333), border.default (#2E3450), text.primary (#F0F2F8), brand.primary (#6B7FD7)
Animation plan   : FadeIn backdrop + FadeInDown modal container
Typography       : SpaceGrotesk_600SemiBold untuk judul modal, SpaceGrotesk_400Regular untuk subtitle
Anti-slop check  : Rule #3 (no pure white/black), Rule #5 (Offset shadow elevated), Rule #19 (varied radius)
</vibe_check>
*/

interface AcademicModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AcademicModal: React.FC<AcademicModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(250).easing(Easing.out(Easing.cubic))}
          style={styles.modalCard}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <X size={20} color={colors.text.secondary} weight="bold" />
            </Pressable>
          </View>

          {/* Body content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 17, 23, 0.85)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.xl,
    ...shadows.elevated,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.overlay,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
});
