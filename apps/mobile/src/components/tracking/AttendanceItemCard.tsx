import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  CheckCircle,
  FileText,
  Heartbeat,
  ProhibitInset,
  Trash,
} from 'phosphor-react-native';
import { Attendance, AttendanceStatus } from '@/types/tracking';
import { UniBadge } from '@/components/ui/UniBadge';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';

/*
<vibe_check>
Screen/Component : AttendanceItemCard (components/tracking/AttendanceItemCard.tsx)
Tujuan           : Menampilkan kartu catatan riwayat presensi satu pertemuan dengan status, tanggal, dan aksi hapus
Layout strategy  : Horizontal layout dengan indicator bar warna status di sisi kiri, informasi tanggal dan catatan di tengah, delete button di kanan
Color tokens     : bg.surface, bg.elevated, border.subtle, semantic status colors
Animation plan   : FadeInDown duration 220ms
Typography       : SpaceGrotesk untuk tanggal & catatan, SpaceGrotesk_600SemiBold untuk status label
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor icons duotone), Rule #4 (dynamic theme), Rule #28 (spring tap)
</vibe_check>
*/

interface AttendanceItemCardProps {
  item: Attendance;
  onDelete?: (id: number) => void;
}

export const AttendanceItemCard: React.FC<AttendanceItemCardProps> = ({ item, onDelete }) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows), [themeColors, themeShadows]);

  const getStatusConfig = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return {
          label: 'HADIR',
          variant: 'success' as const,
          color: themeColors.semantic.success,
          icon: <CheckCircle size={16} color={themeColors.semantic.success} weight="duotone" />,
        };
      case 'permission':
        return {
          label: 'IZIN',
          variant: 'primary' as const,
          color: themeColors.brand.primary,
          icon: <FileText size={16} color={themeColors.brand.primary} weight="duotone" />,
        };
      case 'sick':
        return {
          label: 'SAKIT',
          variant: 'warning' as const,
          color: themeColors.brand.accent,
          icon: <Heartbeat size={16} color={themeColors.brand.accent} weight="duotone" />,
        };
      case 'absent':
        return {
          label: 'ALPA',
          variant: 'danger' as const,
          color: themeColors.semantic.danger,
          icon: <ProhibitInset size={16} color={themeColors.semantic.danger} weight="duotone" />,
        };
    }
  };

  const config = getStatusConfig(item.status);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={styles.container}
    >
      {/* Vertical Status Accent Stripe */}
      <View style={[styles.statusStripe, { backgroundColor: config.color }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.statusWithIcon}>
            {config.icon}
            <UniBadge label={config.label} variant={config.variant} size="sm" />
          </View>
          {onDelete && (
            <Pressable
              onPress={() => onDelete(item.id)}
              style={styles.deleteButton}
              hitSlop={8}
            >
              <Trash size={16} color={themeColors.text.muted} weight="duotone" />
            </Pressable>
          )}
        </View>

        <Text style={styles.dateText}>{formatDate(item.date)}</Text>

        {item.notes ? (
          <Text style={styles.notesText} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.sm,
      overflow: 'hidden',
      ...shadows.card,
    },
    statusStripe: {
      width: 5,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    statusWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dateText: {
      ...typography.body,
      fontFamily: 'SpaceGrotesk_600SemiBold',
      color: colors.text.primary,
      marginBottom: 2,
    },
    notesText: {
      ...typography.bodySmall,
      color: colors.text.secondary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    deleteButton: {
      padding: spacing.xs,
    },
  });
