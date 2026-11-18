import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, Easing } from 'react-native-reanimated';
import {
  X,
  MoonStars,
  SunDim,
  SlidersHorizontal,
  CheckCircle,
} from 'phosphor-react-native';
import { radius, spacing, typography, shadows } from '@/constants/tokens';
import { useUniTheme, ThemeMode } from '@/store/useThemeStore';
import { UniBadge } from './UniBadge';

/*
<vibe_check>
Screen/Component : AppearanceModal (components/ui/AppearanceModal.tsx)
Tujuan           : Pengaturan tema (Dark Mode / Light Mode / System) yang responsif, visual, dan taktil
Layout strategy  : Card list terstruktur dengan preview ikon, judul, deskripsi, dan radio selector
Color tokens     : Dinamis sesuai tema aktif (theme.bg.elevated, theme.border.default, theme.brand.primary)
Animation plan   : FadeIn backdrop, FadeInDown modal card, tactile press feedback
Typography       : SpaceGrotesk_600SemiBold untuk judul, SpaceGrotesk_400Regular untuk deskripsi
Anti-slop check  : Rule #2 (Phosphor duotone icons), Rule #7 (geometric badge), Rule #19 (varied radius)
</vibe_check>
*/

interface AppearanceModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ThemeOption {
  id: ThemeMode;
  title: string;
  subtitle: string;
  icon: (color: string) => React.ReactNode;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  visible,
  onClose,
}) => {
  const { themeMode, resolvedTheme, colors, isDark, setThemeMode } = useUniTheme();

  if (!visible) return null;

  const options: ThemeOption[] = [
    {
      id: 'dark',
      title: 'Mode Gelap (Dark Mode)',
      subtitle: 'Palet gelap standar UniDemic, nyaman di mata dan hemat daya baterai.',
      icon: (color) => <MoonStars size={24} color={color} weight="duotone" />,
    },
    {
      id: 'light',
      title: 'Mode Terang (Light Mode)',
      subtitle: 'Tampilan bersih dengan latar slate hangat dan kontras tinggi.',
      icon: (color) => <SunDim size={24} color={color} weight="duotone" />,
    },
    {
      id: 'system',
      title: 'Ikuti Pengaturan Sistem',
      subtitle: 'Menyesuaikan otomatis dengan tema gelap/terang pada perangkat Anda.',
      icon: (color) => <SlidersHorizontal size={24} color={color} weight="duotone" />,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(250).easing(Easing.out(Easing.cubic))}
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.bg.elevated,
              borderColor: colors.border.default,
              ...shadows.elevated,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.text.primary }]}>
                  Pengaturan Tema
                </Text>
                <UniBadge
                  label={resolvedTheme === 'dark' ? 'DARK ACTIVE' : 'LIGHT ACTIVE'}
                  variant={resolvedTheme === 'dark' ? 'primary' : 'warning'}
                  size="sm"
                />
              </View>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                Pilih tampilan antarmuka sesuai kenyamanan Anda
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: colors.bg.surface, borderColor: colors.border.subtle }]}
            >
              <X size={18} color={colors.text.secondary} weight="bold" />
            </Pressable>
          </View>

          {/* Theme Options */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.optionsList}>
            {options.map((opt) => {
              const isSelected = themeMode === opt.id;
              const activeColor = isSelected ? colors.brand.primary : colors.text.secondary;

              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setThemeMode(opt.id)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(107, 127, 215, 0.12)'
                          : 'rgba(80, 99, 191, 0.08)'
                        : colors.bg.surface,
                      borderColor: isSelected ? colors.brand.primary : colors.border.subtle,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(107, 127, 215, 0.2)'
                          : colors.bg.overlay,
                      },
                    ]}
                  >
                    {opt.icon(activeColor)}
                  </View>

                  <View style={styles.optionInfo}>
                    <View style={styles.optionTitleRow}>
                      <Text
                        style={[
                          styles.optionTitle,
                          {
                            color: isSelected ? colors.text.primary : colors.text.secondary,
                            fontWeight: isSelected ? '600' : '500',
                          },
                        ]}
                      >
                        {opt.title}
                      </Text>
                    </View>
                    <Text style={[styles.optionSubtitle, { color: colors.text.muted }]}>
                      {opt.subtitle}
                    </Text>
                  </View>

                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected
                            ? colors.brand.primary
                            : colors.border.strong,
                        },
                      ]}
                    >
                      {isSelected ? (
                        <View
                          style={[
                            styles.radioDot,
                            { backgroundColor: colors.brand.primary },
                          ]}
                        />
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer note */}
          <View style={[styles.footer, { borderTopColor: colors.border.subtle }]}>
            <Text style={[styles.footerText, { color: colors.text.muted }]}>
              Preferensi tema langsung diterapkan dan disimpan di perangkat Anda.
            </Text>
          </View>
        </Animated.View>
      </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: typography.h2.fontSize,
  },
  subtitle: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: typography.bodySmall.fontSize,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  optionsList: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 3,
  },
  optionTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 15,
  },
  optionSubtitle: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 12,
    lineHeight: 16,
  },
  radioContainer: {
    paddingLeft: spacing.xs,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.bodySmall.fontFamily,
    fontSize: 11,
    textAlign: 'center',
  },
});
