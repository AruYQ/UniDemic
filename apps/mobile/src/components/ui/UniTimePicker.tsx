import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Clock, X } from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { UniButton } from './UniButton';

/*
<vibe_check>
Screen/Component : UniTimePicker (components/ui/UniTimePicker.tsx)
Tujuan           : Memilih waktu kuliah dengan tap dan slot jam perkuliahan populer tanpa mengetik keyboard
Layout strategy  : Trigger field + Modal pemilihan jam dengan quick preset perkuliahan + selector jam & menit
Color tokens     : bg.surface (#171B26), bg.elevated (#1E2333), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : Liquid spring physics (mass: 0.6, damping: 18, stiffness: 180)
Typography       : JetBrainsMono untuk angka jam & menit, SpaceGrotesk untuk headers
Anti-slop check  : Rule #10 (Mono + Space Grotesk), Rule #28 (spring feedback)
</vibe_check>
*/

interface UniTimePickerProps {
  label: string;
  value: string; // HH:mm e.g. "08:00"
  onChange: (timeStr: string) => void;
  placeholder?: string;
}

const COLLEGE_SLOTS = [
  '07:00', '08:00', '09:40', '10:30',
  '12:00', '13:00', '14:40', '15:30', '17:00', '19:00',
];

const HOURS = Array.from({ length: 16 }, (_, i) => String(i + 7).padStart(2, '0')); // 07 to 22
const MINUTES = ['00', '15', '30', '40', '45', '50'];

export const UniTimePicker: React.FC<UniTimePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Pilih Jam',
}) => {
  const { colors, shadows } = useUniTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial hour & minute
  const parseTime = (str: string) => {
    if (!str) return { hour: '08', minute: '00' };
    const parts = str.split(':');
    return {
      hour: parts[0]?.padStart(2, '0') || '08',
      minute: parts[1]?.padStart(2, '0') || '00',
    };
  };

  const initial = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState(initial.minute);

  const handleApplySlot = (slot: string) => {
    const { hour, minute } = parseTime(slot);
    setSelectedHour(hour);
    setSelectedMinute(minute);
  };

  const handleConfirm = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => {
          const current = parseTime(value);
          setSelectedHour(current.hour);
          setSelectedMinute(current.minute);
          setIsOpen(true);
        }}
        style={({ pressed }) => [
          styles.triggerBox,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
      >
        <Clock size={18} color={colors.brand.secondary} weight="duotone" />
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {value ? `${value} WIB` : placeholder}
        </Text>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.overlay}>
          <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsOpen(false)} />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(240)}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{label}</Text>
                <Text style={styles.modalSubtitle}>Pilih jam & menit perkuliahan</Text>
              </View>
              <Pressable
                onPress={() => setIsOpen(false)}
                hitSlop={10}
                style={styles.closeBtn}
              >
                <X size={18} color={colors.text.muted} weight="bold" />
              </Pressable>
            </View>

            {/* Current Selected Big Time Display */}
            <View style={styles.displayBox}>
              <Text style={styles.displayTime}>
                {selectedHour}:{selectedMinute} <Text style={styles.displayTz}>WIB</Text>
              </Text>
            </View>

            {/* Quick College Slot Chips */}
            <Text style={styles.sectionHeading}>Slot Perkuliahan Umum</Text>
            <View style={styles.slotsRow}>
              {COLLEGE_SLOTS.map((slot) => {
                const isSelected = `${selectedHour}:${selectedMinute}` === slot;
                return (
                  <Pressable
                    key={slot}
                    onPress={() => handleApplySlot(slot)}
                    style={[
                      styles.slotChip,
                      isSelected && styles.slotChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotChipText,
                        isSelected && styles.slotChipTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Hour & Minute Picker Grid */}
            <View style={styles.pickerRow}>
              {/* Hours Column */}
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerColHeader}>Jam</Text>
                <ScrollView
                  style={styles.scrollCol}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.chipGrid}>
                    {HOURS.map((h) => {
                      const isSel = selectedHour === h;
                      return (
                        <Pressable
                          key={h}
                          onPress={() => setSelectedHour(h)}
                          style={[styles.numChip, isSel && styles.numChipSelected]}
                        >
                          <Text style={[styles.numText, isSel && styles.numTextSelected]}>
                            {h}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Minutes Column */}
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerColHeader}>Menit</Text>
                <ScrollView
                  style={styles.scrollCol}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.chipGrid}>
                    {MINUTES.map((m) => {
                      const isSel = selectedMinute === m;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => setSelectedMinute(m)}
                          style={[styles.numChip, isSel && styles.numChipSelected]}
                        >
                          <Text style={[styles.numText, isSel && styles.numTextSelected]}>
                            {m}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Confirm CTA */}
            <View style={styles.footer}>
              <UniButton label="Terapkan Jam" onPress={handleConfirm} />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    label: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    triggerBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      minHeight: 50,
    },
    triggerText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    triggerPlaceholder: {
      color: colors.text.muted,
    },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    modalContent: {
      width: '100%',
      maxWidth: 380,
      maxHeight: '88%',
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: spacing.xl,
      ...shadows.elevated,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    modalTitle: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 16,
      color: colors.text.primary,
      fontWeight: '600',
    },
    modalSubtitle: {
      fontFamily: typography.bodySmall.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    closeBtn: {
      padding: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
    },
    displayBox: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg.overlay,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      marginVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    displayTime: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 28,
      color: colors.brand.primary,
      fontWeight: '700',
      letterSpacing: 1,
    },
    displayTz: {
      fontSize: 14,
      color: colors.brand.secondary,
      fontWeight: '400',
    },
    sectionHeading: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
      textTransform: 'uppercase',
      marginTop: spacing.xs,
      marginBottom: 6,
    },
    slotsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: spacing.md,
    },
    slotChip: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    slotChipSelected: {
      backgroundColor: 'rgba(78, 205, 196, 0.18)',
      borderColor: colors.brand.secondary,
    },
    slotChipText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    slotChipTextSelected: {
      color: colors.brand.secondary,
      fontWeight: '700',
    },
    pickerRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    pickerColHeader: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
      marginBottom: 4,
      textAlign: 'center',
    },
    scrollCol: {
      maxHeight: 120,
      backgroundColor: colors.bg.overlay,
      borderRadius: radius.md,
      padding: 6,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      justifyContent: 'center',
    },
    numChip: {
      width: 38,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    numChipSelected: {
      backgroundColor: colors.brand.primary,
    },
    numText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 13,
      color: colors.text.secondary,
    },
    numTextSelected: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    footer: {
      marginTop: spacing.xs,
    },
  });
