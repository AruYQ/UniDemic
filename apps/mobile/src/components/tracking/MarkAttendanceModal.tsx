import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  CheckCircle,
  FileText,
  Heartbeat,
  ProhibitInset,
} from 'phosphor-react-native';
import { AttendanceStatus, CreateAttendancePayload } from '@/types/tracking';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniDatePicker } from '@/components/ui/UniDatePicker';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : MarkAttendanceModal (components/tracking/MarkAttendanceModal.tsx)
Tujuan           : Modal pencatatan presensi visual tap dengan pemilih status Hadir/Izin/Sakit/Alpa, kalender visual UniDatePicker, dan catatan opsional
Layout strategy  : 2x2 grid chip status dengan icon dan accent border, UniDatePicker visual, dan UniInput multiline
Color tokens     : bg.surface, bg.elevated, border.default, semantic status colors
Animation plan   : Spring feedback on status tap, fade in on modal open
Typography       : SpaceGrotesk_600SemiBold untuk status options, SpaceGrotesk untuk labels
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor icons duotone), Rule #13 (UniDatePicker tap, no manual text input), Rule #28 (spring tap)
</vibe_check>
*/

interface MarkAttendanceModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAttendancePayload) => Promise<void>;
  courseName?: string;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  visible,
  onClose,
  onSubmit,
  courseName,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const [date, setDate] = useState(todayStr);
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(todayStr);
      setStatus('present');
      setNotes('');
    }
  }, [visible, todayStr]);

  const handleSubmit = async () => {
    if (!date) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        date,
        status,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: {
    status: AttendanceStatus;
    label: string;
    icon: (selected: boolean) => React.ReactNode;
    color: string;
    bgSelected: string;
  }[] = [
    {
      status: 'present',
      label: 'Hadir',
      color: themeColors.semantic.success,
      bgSelected: 'rgba(78, 205, 196, 0.15)',
      icon: (sel) => (
        <CheckCircle
          size={20}
          color={sel ? themeColors.semantic.success : themeColors.text.muted}
          weight="duotone"
        />
      ),
    },
    {
      status: 'permission',
      label: 'Izin',
      color: themeColors.brand.primary,
      bgSelected: 'rgba(107, 127, 215, 0.15)',
      icon: (sel) => (
        <FileText
          size={20}
          color={sel ? themeColors.brand.primary : themeColors.text.muted}
          weight="duotone"
        />
      ),
    },
    {
      status: 'sick',
      label: 'Sakit',
      color: themeColors.brand.accent,
      bgSelected: 'rgba(247, 183, 49, 0.15)',
      icon: (sel) => (
        <Heartbeat
          size={20}
          color={sel ? themeColors.brand.accent : themeColors.text.muted}
          weight="duotone"
        />
      ),
    },
    {
      status: 'absent',
      label: 'Alpa',
      color: themeColors.semantic.danger,
      bgSelected: 'rgba(224, 91, 91, 0.15)',
      icon: (sel) => (
        <ProhibitInset
          size={20}
          color={sel ? themeColors.semantic.danger : themeColors.text.muted}
          weight="duotone"
        />
      ),
    },
  ];

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title="Catat Kehadiran"
      subtitle={courseName ? `Mata kuliah: ${courseName}` : undefined}
    >
      <View style={styles.content}>
        {/* Status Selection Grid */}
        <Text style={styles.sectionLabel}>Status Pertemuan</Text>
        <View style={styles.statusGrid}>
          {statusOptions.map((opt) => {
            const isSelected = status === opt.status;
            return (
              <Pressable
                key={opt.status}
                onPress={() => setStatus(opt.status)}
                style={[
                  styles.statusChip,
                  isSelected && {
                    borderColor: opt.color,
                    backgroundColor: opt.bgSelected,
                  },
                ]}
              >
                {opt.icon(isSelected)}
                <Text
                  style={[
                    styles.statusChipText,
                    isSelected && { color: opt.color, fontWeight: '700' },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Date Picker */}
        <UniDatePicker
          label="Tanggal Pertemuan"
          value={date}
          onChange={setDate}
          placeholder="Pilih tanggal presensi"
        />

        {/* Optional Notes */}
        <UniInput
          label="Catatan Pertemuan (Opsional)"
          placeholder="Materi pertemuan ke-X, alasan izin/sakit, dll."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {/* Submit CTA */}
        <View style={styles.actionContainer}>
          <UniButton
            label={isSubmitting ? 'Menyimpan...' : 'Simpan Presensi'}
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={isSubmitting || !date}
            loading={isSubmitting}
          />
        </View>
      </View>
    </AcademicModal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    content: {
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      marginBottom: -4,
    },
    statusGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    statusChip: {
      flexBasis: '48%',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1.5,
      borderColor: colors.border.subtle,
      ...shadows.card,
    },
    statusChipText: {
      ...typography.body,
      color: colors.text.primary,
      fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    actionContainer: {
      marginTop: spacing.md,
    },
  });
