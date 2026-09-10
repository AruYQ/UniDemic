import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Check,
  X,
} from 'phosphor-react-native';
import { colors, radius, spacing, typography, shadows } from '@/constants/tokens';
import { UniButton } from './UniButton';

/*
<vibe_check>
Screen/Component : UniDatePicker (components/ui/UniDatePicker.tsx)
Tujuan           : Memilih tanggal secara visual dengan tap dan preset cerdas tanpa repot mengetik string YYYY-MM-DD
Layout strategy  : Trigger field (label + value pill) + Modal kalender mini dengan quick preset chips
Color tokens     : bg.surface (#171B26), bg.elevated (#1E2333), brand.primary (#6B7FD7), text.primary (#F0F2F8)
Animation plan   : Liquid spring physics (mass: 0.6, damping: 18, stiffness: 180)
Typography       : SpaceGrotesk untuk headers, JetBrainsMono untuk nomor tanggal
Anti-slop check  : Rule #7 (Badge tanpa emoji), Rule #10 (typography), Rule #28 (spring feedback)
</vibe_check>
*/

interface UniDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const UniDatePicker: React.FC<UniDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Pilih Tanggal',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Current calendar view year & month
  const initialDate = value ? new Date(value) : new Date();
  const validInitialDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [viewYear, setViewYear] = useState(validInitialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(validInitialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(value || '');

  // Format YYYY-MM-DD helper
  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = formatDateString(viewYear, viewMonth, day);
    setSelectedDate(formatted);
  };

  const handleApplyPreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const formatted = formatDateString(d.getFullYear(), d.getMonth(), d.getDate());
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(formatted);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onChange(selectedDate);
    }
    setIsOpen(false);
  };

  // Generate calendar grid
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const formattedDisplay = value
    ? new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.triggerBox,
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
      >
        <CalendarBlank size={18} color={colors.brand.primary} weight="duotone" />
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {formattedDisplay || placeholder}
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
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{label}</Text>
                <Text style={styles.modalSubtitle}>Pilih tanggal target</Text>
              </View>
              <Pressable
                onPress={() => setIsOpen(false)}
                hitSlop={10}
                style={styles.closeBtn}
              >
                <X size={18} color={colors.text.muted} weight="bold" />
              </Pressable>
            </View>

            {/* Quick Preset Chips */}
            <View style={styles.presetsRow}>
              {[
                { label: 'Hari Ini', offset: 0 },
                { label: 'Besok', offset: 1 },
                { label: '+3 Hari', offset: 3 },
                { label: 'Minggu Depan', offset: 7 },
              ].map((p) => (
                <Pressable
                  key={p.label}
                  onPress={() => handleApplyPreset(p.offset)}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetChipText}>{p.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Month & Year Bar */}
            <View style={styles.monthNavRow}>
              <Pressable onPress={handlePrevMonth} hitSlop={10} style={styles.navArrow}>
                <CaretLeft size={16} color={colors.text.primary} weight="bold" />
              </Pressable>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <Pressable onPress={handleNextMonth} hitSlop={10} style={styles.navArrow}>
                <CaretRight size={16} color={colors.text.primary} weight="bold" />
              </Pressable>
            </View>

            {/* Day Names Row */}
            <View style={styles.dayNamesRow}>
              {DAY_NAMES.map((d) => (
                <Text key={d} style={styles.dayNameCell}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Day Grid */}
            <View style={styles.grid}>
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCellEmpty} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const cellDateStr = formatDateString(viewYear, viewMonth, day);
                const isSelected = selectedDate === cellDateStr;

                return (
                  <Pressable
                    key={`day-${day}`}
                    onPress={() => handleSelectDay(day)}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        isSelected && styles.dayCellTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Confirm CTA */}
            <View style={styles.footer}>
              <UniButton
                label="Terapkan Tanggal"
                onPress={handleConfirm}
                disabled={!selectedDate}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(15, 17, 23, 0.85)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
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
    marginBottom: spacing.md,
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
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.bg.overlay,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  presetChipText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.brand.secondary,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.overlay,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  navArrow: {
    padding: 4,
  },
  monthTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayNameCell: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.mono.fontFamily,
    fontSize: 11,
    color: colors.text.muted,
    paddingVertical: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  dayCellSelected: {
    backgroundColor: colors.brand.primary,
  },
  dayCellText: {
    fontFamily: typography.mono.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
  },
  dayCellTextSelected: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  footer: {
    marginTop: spacing.xs,
  },
});
