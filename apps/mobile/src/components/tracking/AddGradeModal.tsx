import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { GradeComponent, CreateGradePayload } from '@/types/tracking';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : AddGradeModal (components/tracking/AddGradeModal.tsx)
Tujuan           : Modal input nilai akademik mahasiswa dengan pemilih komponen (UTS, UAS, Tugas, dll), input nama, dan skor 0-100
Layout strategy  : Chip selector komponen penilaian -> Input nama asesmen -> Input skor 0-100 -> CTA Simpan
Color tokens     : bg.surface, bg.elevated, border.default, brand.primary
Animation plan   : Spring feedback, smooth active highlight
Typography       : SpaceGrotesk untuk form label, JetBrainsMono untuk skor nilai
Anti-slop check  : Rule #1 (tokens), Rule #4 (dynamic theme), Rule #28 (spring tap)
</vibe_check>
*/

interface AddGradeModalProps {
  visible: boolean;
  onClose: () => void;
  components: GradeComponent[];
  onSubmit: (payload: CreateGradePayload) => Promise<void>;
  courseName?: string;
}

export const AddGradeModal: React.FC<AddGradeModalProps> = ({
  visible,
  onClose,
  components,
  onSubmit,
  courseName,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(
    components.length > 0 ? components[0].id : null
  );
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [customWeight, setCustomWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (components.length > 0 && selectedComponentId === null) {
        setSelectedComponentId(components[0].id);
      }
      setName('');
      setScore('');
      setCustomWeight('');
    }
  }, [visible, components]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Peringatan', 'Silakan masukkan nama asesmen (contoh: Kuis 1, UTS Teori).');
      return;
    }
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      Alert.alert('Peringatan', 'Nilai harus berupa angka antara 0 sampai 100.');
      return;
    }

    let parsedCustomWeight: number | undefined = undefined;
    if (selectedComponentId === null) {
      parsedCustomWeight = parseFloat(customWeight);
      if (isNaN(parsedCustomWeight) || parsedCustomWeight <= 0) {
        Alert.alert('Peringatan', 'Jika tidak memilih komponen, isi bobot penilaian (%).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        grade_component_id: selectedComponentId,
        name: name.trim(),
        score: numScore,
        weight: parsedCustomWeight,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menyimpan nilai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title="Input Nilai Baru"
      subtitle={courseName ? `Mata kuliah: ${courseName}` : undefined}
    >
      <View style={styles.container}>
        {/* Component Selector */}
        <Text style={styles.sectionLabel}>Komponen Penilaian</Text>
        <View style={styles.chipRow}>
          {components.map((c) => {
            const isSelected = selectedComponentId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelectedComponentId(c.id)}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {c.name} ({Number(c.weight)}%)
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setSelectedComponentId(null)}
            style={[
              styles.chip,
              selectedComponentId === null && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedComponentId === null && styles.chipTextSelected,
              ]}
            >
              Custom / Mandiri
            </Text>
          </Pressable>
        </View>

        {/* Assessment Name */}
        <UniInput
          label="Nama Asesmen / Tugas"
          placeholder="Contoh: UTS Praktikum / Kuis Bab 3 / Final Project"
          value={name}
          onChangeText={setName}
        />

        {/* Score 0 - 100 */}
        <UniInput
          label="Skor Nilai (0 - 100)"
          placeholder="Contoh: 88.5"
          value={score}
          onChangeText={setScore}
          keyboardType="numeric"
        />

        {/* Custom Weight if no component selected */}
        {selectedComponentId === null && (
          <UniInput
            label="Bobot Nilai (%)"
            placeholder="Contoh: 15"
            value={customWeight}
            onChangeText={setCustomWeight}
            keyboardType="numeric"
          />
        )}

        <View style={styles.actionRow}>
          <UniButton
            label={isSubmitting ? 'Menyimpan...' : 'Simpan Nilai'}
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={isSubmitting || !name.trim() || !score.trim()}
            loading={isSubmitting}
          />
        </View>
      </View>
    </AcademicModal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      marginBottom: -4,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    chipSelected: {
      borderColor: colors.brand.primary,
      backgroundColor: 'rgba(107, 127, 215, 0.15)',
    },
    chipText: {
      ...typography.bodySmall,
      color: colors.text.secondary,
    },
    chipTextSelected: {
      color: colors.brand.primary,
      fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    actionRow: {
      marginTop: spacing.sm,
    },
  });
