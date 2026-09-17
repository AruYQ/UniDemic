import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniDatePicker } from '@/components/ui/UniDatePicker';
import { UniButton } from '@/components/ui/UniButton';
import { CreateGoalPayload, GoalType } from '@/types/productivity';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : CreateGoalModal (components/productivity/CreateGoalModal.tsx)
Tujuan           : Dialog modal elegan untuk menetapkan target belajar / produktivitas terukur
Layout strategy  : Goal Type Pill Selector -> Title -> Target Value & Unit Row -> Target Date Picker -> Submit Button
Color tokens     : bg.surface, bg.overlay, brand.primary, brand.secondary, text.primary
Animation plan   : FadeInDown modal transition
Typography       : SpaceGrotesk untuk label, JetBrainsMono untuk numeric input & unit
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface CreateGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateGoalPayload) => Promise<void>;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<GoalType>('weekly');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('Jam');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (selectedType: GoalType) => {
    setType(selectedType);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Peringatan', 'Silakan masukkan judul target.');
      return;
    }

    const parsedTarget = parseFloat(targetValue);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      Alert.alert('Peringatan', 'Masukkan angka target yang valid (lebih dari 0).');
      return;
    }

    if (!unit.trim()) {
      Alert.alert('Peringatan', 'Silakan masukkan satuan target.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        type,
        target_value: parsedTarget,
        unit: unit.trim(),
        end_date: targetDate.trim() || undefined,
      });

      // Reset
      setTitle('');
      setType('weekly');
      setTargetValue('');
      setUnit('Jam');
      setTargetDate('');
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal membuat target belajar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title="Target Belajar Baru"
      subtitle="Tetapkan pencapaian akademik terukur & pantau progresnya"
    >
      <View style={styles.formContainer}>
        {/* Goal Type Selector */}
        <Text style={styles.fieldLabel}>Tipe Target</Text>
        <View style={styles.typeRow}>
          {(
            [
              { key: 'weekly', label: 'Mingguan' },
              { key: 'monthly', label: 'Bulanan' },
              { key: 'semester', label: 'Semester' },
              { key: 'custom', label: 'Kustom' },
            ] as const
          ).map((item) => {
            const isSelected = type === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => handleTypeSelect(item.key)}
                style={[
                  styles.typeChip,
                  isSelected && styles.typeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    isSelected && styles.typeChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Title */}
        <UniInput
          label="Judul Target"
          placeholder={
            type === 'weekly'
              ? 'Contoh: Belajar 15 Jam Pekan Ini'
              : type === 'monthly'
              ? 'Contoh: Selesaikan 10 Tugas Skripsi Bulan Ini'
              : 'Contoh: Membaca 100 Halaman Jurnal'
          }
          value={title}
          onChangeText={setTitle}
        />

        {/* Target Value and Unit Row */}
        <View style={styles.rowInputs}>
          <View style={{ flex: 1.2 }}>
            <UniInput
              label="Nilai Target"
              placeholder="Contoh: 15"
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <UniInput
              label="Satuan"
              placeholder="Jam / Bab / Tugas"
              value={unit}
              onChangeText={setUnit}
            />
          </View>
        </View>

        {/* Target Date Picker */}
        <UniDatePicker
          label="Tenggat Target (Opsional)"
          value={targetDate}
          onChange={setTargetDate}
          placeholder="Pilih Tanggal Batas Target"
        />

        {/* Submit */}
        <View style={{ marginTop: spacing.md }}>
          <UniButton
            label="Simpan Target"
            onPress={handleSubmit}
            loading={isSubmitting}
          />
        </View>
      </View>
    </AcademicModal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    formContainer: {
      gap: spacing.md,
    },
    fieldLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      marginBottom: -4,
    },
    typeRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    typeChip: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    typeChipActive: {
      backgroundColor: 'rgba(107, 127, 215, 0.25)',
      borderColor: colors.brand.primary,
    },
    typeChipText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
      textAlign: 'center',
    },
    typeChipTextActive: {
      color: colors.brand.primary,
      fontWeight: '700',
    },
    rowInputs: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
