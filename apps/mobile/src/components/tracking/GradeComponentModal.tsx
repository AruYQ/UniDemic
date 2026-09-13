import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import {
  Percent,
  Plus,
  Trash,
  CheckCircle,
  WarningCircle,
} from 'phosphor-react-native';
import { GradeComponent, CreateGradeComponentPayload } from '@/types/tracking';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : GradeComponentModal (components/tracking/GradeComponentModal.tsx)
Tujuan           : Mengelola komponen penilaian berbobot suatu mata kuliah dengan akumulasi progress bar 100%
Layout strategy  : Header status bar akumulasi bobot -> List komponen yang tersimpan -> Inline form tambah komponen baru
Color tokens     : bg.surface, bg.elevated, border.subtle, brand.primary, semantic.success / warning / danger
Animation plan   : Spring feedback, list transitions
Typography       : SpaceGrotesk untuk form label, JetBrainsMono untuk bobot %
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor icons duotone), Rule #4 (dynamic theme), Rule #10 (typography)
</vibe_check>
*/

interface GradeComponentModalProps {
  visible: boolean;
  onClose: () => void;
  components: GradeComponent[];
  onCreate: (payload: CreateGradeComponentPayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  courseName?: string;
}

export const GradeComponentModal: React.FC<GradeComponentModalProps> = ({
  visible,
  onClose,
  components,
  onCreate,
  onDelete,
  courseName,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total weight calculation
  const totalWeight = useMemo(() => {
    return components.reduce((sum, c) => sum + Number(c.weight), 0);
  }, [components]);

  const isExact100 = Math.abs(totalWeight - 100) < 0.01;
  const isOver100 = totalWeight > 100;

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Peringatan', 'Silakan isi nama komponen penilaian.');
      return;
    }
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight <= 0) {
      Alert.alert('Peringatan', 'Bobot harus berupa angka positif.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        weight: numWeight,
      });
      setName('');
      setWeight('');
    } catch (err: any) {
      Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menambahkan komponen penilaian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number, compName: string) => {
    Alert.alert(
      'Hapus Komponen',
      `Yakin ingin menghapus komponen "${compName}"? Nilai terkait komponen ini juga akan terhapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(id);
            } catch (err: any) {
              Alert.alert('Gagal', err?.response?.data?.message || 'Gagal menghapus komponen.');
            }
          },
        },
      ]
    );
  };

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title="Komponen Penilaian"
      subtitle={courseName ? `Mata kuliah: ${courseName}` : undefined}
    >
      <View style={styles.container}>
        {/* Weight Total Bar */}
        <View style={styles.weightCard}>
          <View style={styles.weightHeader}>
            <View style={styles.weightTitleRow}>
              <Percent size={18} color={themeColors.brand.primary} weight="duotone" />
              <Text style={styles.weightTitle}>Total Alokasi Bobot</Text>
            </View>
            <View style={styles.weightBadgeRow}>
              {isExact100 ? (
                <CheckCircle size={16} color={themeColors.semantic.success} weight="fill" />
              ) : (
                <WarningCircle
                  size={16}
                  color={isOver100 ? themeColors.semantic.danger : themeColors.semantic.warning}
                  weight="fill"
                />
              )}
              <Text
                style={[
                  styles.weightPercentText,
                  {
                    color: isExact100
                      ? themeColors.semantic.success
                      : isOver100
                      ? themeColors.semantic.danger
                      : themeColors.semantic.warning,
                  },
                ]}
              >
                {Math.round(totalWeight)}% / 100%
              </Text>
            </View>
          </View>

          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(totalWeight, 100)}%`,
                  backgroundColor: isExact100
                    ? themeColors.semantic.success
                    : isOver100
                    ? themeColors.semantic.danger
                    : themeColors.brand.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Existing Components List */}
        <Text style={styles.sectionTitle}>Daftar Komponen ({components.length})</Text>
        {components.length > 0 ? (
          <View style={styles.componentList}>
            {components.map((c) => (
              <View key={c.id} style={styles.componentItem}>
                <View style={styles.compInfo}>
                  <Text style={styles.compName}>{c.name}</Text>
                  <Text style={styles.compWeight}>{Number(c.weight)}%</Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(c.id, c.name)}
                  style={styles.deleteButton}
                  hitSlop={8}
                >
                  <Trash size={16} color={themeColors.semantic.danger} weight="duotone" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            Belum ada komponen penilaian. Tambahkan UTS, UAS, Tugas, Kuis, dll.
          </Text>
        )}

        {/* Add New Component Form */}
        <View style={styles.addForm}>
          <Text style={styles.sectionTitle}>Tambah Komponen Baru</Text>
          <UniInput
            label="Nama Komponen"
            placeholder="Contoh: Tugas / UTS / Kuis / Praktikum"
            value={name}
            onChangeText={setName}
          />
          <UniInput
            label="Bobot Persentase (%)"
            placeholder="Contoh: 30"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <UniButton
            label={isSubmitting ? 'Menambahkan...' : 'Tambah Komponen'}
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} color="#FFFFFF" weight="bold" />}
            onPress={handleAdd}
            disabled={isSubmitting || !name.trim() || !weight.trim()}
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
    weightCard: {
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.card,
    },
    weightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    weightTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    weightTitle: {
      ...typography.label,
      color: colors.text.secondary,
    },
    weightBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    weightPercentText: {
      ...typography.mono,
      fontSize: 14,
      fontWeight: '700',
    },
    barBg: {
      height: 8,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    sectionTitle: {
      ...typography.label,
      color: colors.text.secondary,
      textTransform: 'uppercase',
    },
    componentList: {
      gap: spacing.xs,
    },
    componentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    compInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    compName: {
      ...typography.body,
      color: colors.text.primary,
      fontFamily: 'SpaceGrotesk_600SemiBold',
    },
    compWeight: {
      ...typography.mono,
      fontSize: 13,
      color: colors.brand.primary,
      fontWeight: '700',
    },
    deleteButton: {
      padding: spacing.xs,
    },
    emptyText: {
      ...typography.bodySmall,
      color: colors.text.muted,
      fontStyle: 'italic',
    },
    addForm: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
  });
