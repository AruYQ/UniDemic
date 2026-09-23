import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  GraduationCap,
  CheckSquareOffset,
  FileText,
  BookBookmark,
  Notebook,
  CheckCircle,
  Brain,
  ArrowSquareOut,
  X,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { AcademicReference, AcademicReferenceType } from '@/types/communication';

/*
<vibe_check>
Screen/Component : AcademicRefPreview (components/communication/AcademicRefPreview.tsx)
Tujuan           : Menampilkan preview card interaktif dari entitas akademik (tugas, kuis, materi, catatan, ujian) yang disematkan dalam pesan obrolan
Layout strategy  : Compact horizontal card: Icon entitas (kiri), info teks judul & tipe (tengah), icon navigasi/hapus (kanan)
Color tokens     : bg.surface (#171B26), border.subtle (#252A3D), brand.primary (#6B7FD7), brand.secondary (#4ECDC4), brand.accent (#F7B731)
Animation plan   : Press scale feedback 0.98
Typography       : SpaceGrotesk_600SemiBold (judul), SpaceGrotesk_500Medium (badge tipe), JetBrainsMono_400Regular (subtitle)
Anti-slop check  : Rule #7 (Badge geometris tanpa emoji), Rule #10 (Space Grotesk + JetBrains Mono), Rule #5 (Offset shadow)
</vibe_check>
*/

interface AcademicRefPreviewProps {
  reference: AcademicReference;
  isComposer?: boolean;
  onRemove?: () => void;
}

export const AcademicRefPreview: React.FC<AcademicRefPreviewProps> = ({
  reference,
  isComposer = false,
  onRemove,
}) => {
  const router = useRouter();
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const styles = useMemo(
    () => createStyles(themeColors, themeShadows, isComposer),
    [themeColors, themeShadows, isComposer]
  );

  const getEntityConfig = (type: AcademicReferenceType) => {
    switch (type) {
      case 'course':
        return {
          label: 'MATA KULIAH',
          color: themeColors.brand.primary,
          icon: <GraduationCap size={18} weight="duotone" color={themeColors.brand.primary} />,
          route: `/course/${reference.id}`,
        };
      case 'assignment':
        return {
          label: 'TUGAS',
          color: themeColors.semantic.warning,
          icon: <CheckSquareOffset size={18} weight="duotone" color={themeColors.semantic.warning} />,
          route: `/tasks`,
        };
      case 'exam':
        return {
          label: 'UJIAN',
          color: themeColors.semantic.danger,
          icon: <FileText size={18} weight="duotone" color={themeColors.semantic.danger} />,
          route: `/schedule`,
        };
      case 'material':
        return {
          label: 'MATERI',
          color: themeColors.brand.secondary,
          icon: <BookBookmark size={18} weight="duotone" color={themeColors.brand.secondary} />,
          route: `/learning`,
        };
      case 'note':
        return {
          label: 'CATATAN',
          color: themeColors.brand.primary,
          icon: <Notebook size={18} weight="duotone" color={themeColors.brand.primary} />,
          route: `/learning`,
        };
      case 'quiz':
        return {
          label: 'KUIS',
          color: themeColors.brand.accent,
          icon: <Brain size={18} weight="duotone" color={themeColors.brand.accent} />,
          route: `/learning`,
        };
      case 'task':
      default:
        return {
          label: 'AKTIVITAS',
          color: themeColors.brand.secondary,
          icon: <CheckCircle size={18} weight="duotone" color={themeColors.brand.secondary} />,
          route: `/tasks`,
        };
    }
  };

  const config = getEntityConfig(reference.type);

  const handlePress = () => {
    if (isComposer) return;
    if (config.route) {
      router.push(config.route as any);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isComposer}
      style={({ pressed }) => [
        styles.container,
        pressed && !isComposer && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: `${config.color}20` }]}>
        {config.icon}
      </View>

      <View style={styles.textContainer}>
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { borderColor: `${config.color}40` }]}>
            <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
          </View>
          {reference.subtitle && (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {reference.subtitle}
            </Text>
          )}
        </View>

        <Text style={styles.titleText} numberOfLines={1}>
          {reference.title || `Referensi ${config.label} #${reference.id}`}
        </Text>
      </View>

      {isComposer && onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.actionButton}
        >
          <X size={16} weight="bold" color={themeColors.text.muted} />
        </Pressable>
      ) : (
        <View style={styles.actionButton}>
          <ArrowSquareOut size={16} weight="duotone" color={themeColors.text.secondary} />
        </View>
      )}
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows, isComposer: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isComposer ? colors.bg.surface : colors.bg.elevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginVertical: isComposer ? 0 : spacing.xs,
      gap: spacing.sm,
      ...shadows.card,
    },
    iconWrapper: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
      gap: 2,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    typeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    typeText: {
      fontFamily: typography.label.fontFamily,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    subtitleText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
      flexShrink: 1,
    },
    titleText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 13,
      color: colors.text.primary,
    },
    actionButton: {
      padding: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
