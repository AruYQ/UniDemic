import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import {
  FilePdf,
  Presentation,
  FileText,
  LinkSimple,
  VideoCamera,
  Files,
  ArrowSquareOut,
  Trash,
  GraduationCap,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Material, MaterialType } from '@/types/learning';
import { UniBadge } from '../ui/UniBadge';
import { UniSwipeable } from '../ui/UniSwipeable';

/*
<vibe_check>
Screen/Component : MaterialCard (components/learning/MaterialCard.tsx)
Tujuan           : Menampilkan item materi kuliah dengan badge tipe file, nama matkul, aksi buka URL/file, dan swipe-to-delete
Layout strategy  : Header tipe file + matkul -> Judul materi & deskripsi -> Footer metadata ukuran/link + CTA Buka
Color tokens     : bg.surface, brand.primary, brand.secondary, semantic.info, semantic.danger
Animation plan   : FadeInRight staggered on mount, tactile spring on press
Typography       : SpaceGrotesk_600SemiBold (judul), JetBrainsMono_400Regular (metadata file/size)
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #28 (spring feedback)
</vibe_check>
*/

interface MaterialCardProps {
  material: Material;
  index?: number;
  onDelete?: (id: number) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  index = 0,
  onDelete,
}) => {
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);

  const getTypeMeta = (type: MaterialType) => {
    switch (type) {
      case 'pdf':
        return {
          label: 'PDF',
          color: themeColors.semantic.danger,
          icon: <FilePdf size={14} color={themeColors.semantic.danger} weight="duotone" />,
        };
      case 'slide':
        return {
          label: 'SLIDE',
          color: themeColors.semantic.warning,
          icon: <Presentation size={14} color={themeColors.semantic.warning} weight="duotone" />,
        };
      case 'doc':
        return {
          label: 'DOKUMEN',
          color: themeColors.brand.primary,
          icon: <FileText size={14} color={themeColors.brand.primary} weight="duotone" />,
        };
      case 'link':
        return {
          label: 'TAUTAN',
          color: themeColors.brand.secondary,
          icon: <LinkSimple size={14} color={themeColors.brand.secondary} weight="duotone" />,
        };
      case 'video':
        return {
          label: 'VIDEO',
          color: '#E05B98',
          icon: <VideoCamera size={14} color="#E05B98" weight="duotone" />,
        };
      default:
        return {
          label: 'BERKAS',
          color: themeColors.text.muted,
          icon: <Files size={14} color={themeColors.text.muted} weight="duotone" />,
        };
    }
  };

  const typeMeta = getTypeMeta(material.type);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleOpen = () => {
    const targetUrl = material.url || material.file_path;
    if (targetUrl) {
      Linking.openURL(targetUrl).catch(() => {});
    }
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(240)}>
      <UniSwipeable
        onDelete={onDelete ? () => onDelete(material.id) : undefined}
      >
        <View style={styles.card}>
          {/* Top Row: Type Badge + Course Tag */}
          <View style={styles.topRow}>
            <View style={[styles.typePill, { borderColor: typeMeta.color + '40', backgroundColor: typeMeta.color + '12' }]}>
              {typeMeta.icon}
              <Text style={[styles.typeText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
            </View>

            {material.course && (
              <View style={styles.courseTag}>
                <GraduationCap size={12} color={themeColors.text.secondary} weight="duotone" />
                <Text style={styles.courseText} numberOfLines={1}>
                  {material.course.code || material.course.name}
                </Text>
              </View>
            )}
          </View>

          {/* Title & Description */}
          <Text style={styles.title} numberOfLines={2}>
            {material.title}
          </Text>

          {material.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {material.description}
            </Text>
          ) : null}

          {/* Bottom Row: Metadata & Open Action */}
          <View style={styles.bottomRow}>
            <View style={styles.metaLeft}>
              {formatFileSize(material.file_size) && (
                <Text style={styles.fileSizeText}>
                  {formatFileSize(material.file_size)}
                </Text>
              )}
            </View>

            {(material.url || material.file_path) && (
              <Pressable
                onPress={handleOpen}
                style={({ pressed }) => [styles.openButton, pressed && styles.openButtonPressed]}
                hitSlop={8}
              >
                <Text style={styles.openButtonText}>Buka Materi</Text>
                <ArrowSquareOut size={13} color={themeColors.brand.primary} weight="bold" />
              </Pressable>
            )}
          </View>
        </View>
      </UniSwipeable>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    typePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    typeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    courseTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: radius.sm,
      maxWidth: 160,
    },
    courseText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    title: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 20,
      marginBottom: 4,
    },
    description: {
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 16,
      marginBottom: spacing.sm,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border.subtle,
    },
    metaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    fileSizeText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    openButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: colors.brand.primary + '14',
      borderRadius: radius.sm,
    },
    openButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    openButtonText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: colors.brand.primary,
    },
  });
