import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import {
  PushPin,
  Tag,
  Link,
  GraduationCap,
  CalendarBlank,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { Note } from '@/types/learning';
import { UniSwipeable } from '../ui/UniSwipeable';

/*
<vibe_check>
Screen/Component : NoteCard (components/learning/NoteCard.tsx)
Tujuan           : Menampilkan kartu ringkasan catatan Markdown dengan tag, status pin, indikator linked notes, dan gesture hapus
Layout strategy  : Pin & Matkul header -> Judul Catatan -> Preview teks -> Tag pills & linked notes counter
Color tokens     : bg.surface, brand.primary, brand.secondary, brand.accent, text.primary
Animation plan   : FadeInRight staggered, tactile spring tap
Typography       : SpaceGrotesk_600SemiBold (judul), SpaceGrotesk_400Regular (preview), JetBrainsMono untuk tags
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface NoteCardProps {
  note: Note;
  index?: number;
  onPress: (note: Note) => void;
  onDelete?: (id: number) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  index = 0,
  onPress,
  onDelete,
}) => {
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);

  // Strip Markdown symbols for preview
  const plainPreview = useMemo(() => {
    if (!note.content) return 'Tidak ada isi catatan.';
    return note.content
      .replace(/[#*`_~[\]()]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }, [note.content]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 35).duration(220)}>
      <UniSwipeable
        onDelete={onDelete ? () => onDelete(note.id) : undefined}
      >
        <Pressable
          onPress={() => onPress(note)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          {/* Top Row: Pin Status + Course Tag */}
          <View style={styles.topRow}>
            <View style={styles.headerLeft}>
              {note.is_pinned && (
                <View style={styles.pinBadge}>
                  <PushPin size={12} color={themeColors.brand.accent} weight="fill" />
                  <Text style={styles.pinText}>SEMAT</Text>
                </View>
              )}

              {note.course && (
                <View style={styles.courseTag}>
                  <GraduationCap size={12} color={themeColors.text.secondary} weight="duotone" />
                  <Text style={styles.courseText} numberOfLines={1}>
                    {note.course.code || note.course.name}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.dateText}>{formatDate(note.updated_at || note.created_at)}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>

          {/* Content Preview */}
          <Text style={styles.preview} numberOfLines={2}>
            {plainPreview}
          </Text>

          {/* Bottom Row: Tag Pills & Linked Notes Count */}
          <View style={styles.bottomRow}>
            <View style={styles.tagList}>
              {(note.tags || []).slice(0, 3).map((tag, i) => (
                <View key={i} style={styles.tagPill}>
                  <Tag size={10} color={themeColors.brand.primary} weight="bold" />
                  <Text style={styles.tagText}>{tag.replace(/^#/, '')}</Text>
                </View>
              ))}
              {(note.tags?.length || 0) > 3 && (
                <Text style={styles.moreTagsText}>+{(note.tags?.length || 0) - 3}</Text>
              )}
            </View>

            {note.linked_notes && note.linked_notes.length > 0 && (
              <View style={styles.linkBadge}>
                <Link size={12} color={themeColors.brand.secondary} weight="bold" />
                <Text style={styles.linkCountText}>{note.linked_notes.length}</Text>
              </View>
            )}
          </View>
        </Pressable>
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
    cardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    pinBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.brand.accent + '1A',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.brand.accent + '40',
    },
    pinText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 9,
      fontWeight: '700',
      color: colors.brand.accent,
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
    dateText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.text.muted,
    },
    title: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    preview: {
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 17,
      marginBottom: spacing.sm,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    tagList: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    tagPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.brand.primary + '12',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    tagText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.brand.primary,
    },
    moreTagsText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 10,
      color: colors.text.muted,
    },
    linkBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.brand.secondary + '14',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    linkCountText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: colors.brand.secondary,
    },
  });
