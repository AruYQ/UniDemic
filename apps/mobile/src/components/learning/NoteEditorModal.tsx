import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  PushPin,
  Tag,
  Eye,
  PencilSimple,
  TextHOne,
  TextHTwo,
  TextB,
  ListBullets,
  Code,
  Quotes,
  Plus,
  Trash,
  Link,
  GraduationCap,
} from 'phosphor-react-native';
import { AcademicModal } from '@/components/academic/AcademicModal';
import { UniInput } from '@/components/ui/UniInput';
import { UniButton } from '@/components/ui/UniButton';
import { Course } from '@/types/academic';
import { Note, CreateNotePayload, UpdateNotePayload } from '@/types/learning';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : NoteEditorModal (components/learning/NoteEditorModal.tsx)
Tujuan           : Editor & penampil Markdown catatan terhubung dengan toolbar format, pratinjau live, tag, dan link notes
Layout strategy  : Tab Tulis vs Preview -> Toolbar Markdown -> Title -> Content multiline -> Tag & Pin -> Simpan
Color tokens     : bg.surface, bg.elevated, brand.primary, brand.secondary, text.primary
Animation plan   : FadeInDown modal transition
Typography       : SpaceGrotesk untuk UI, JetBrainsMono untuk kode & tags
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme)
</vibe_check>
*/

interface NoteEditorModalProps {
  visible: boolean;
  onClose: () => void;
  noteToEdit?: Note | null;
  courses: Course[];
  allNotes: Note[];
  onSave: (payload: CreateNotePayload | UpdateNotePayload, noteId?: number) => Promise<any>;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  visible,
  onClose,
  noteToEdit,
  courses,
  allNotes,
  onSave,
}) => {
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = React.useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [linkedNoteIds, setLinkedNoteIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content || '');
      setCourseId(noteToEdit.course_id || null);
      setTags(noteToEdit.tags || []);
      setIsPinned(noteToEdit.is_pinned || false);
      setLinkedNoteIds(noteToEdit.linked_notes?.map((n) => n.id) || []);
      setMode('edit');
    } else {
      setTitle('');
      setContent('');
      setCourseId(courses[0]?.id || null);
      setTags([]);
      setTagInput('');
      setIsPinned(false);
      setLinkedNoteIds([]);
      setMode('edit');
    }
  }, [noteToEdit, visible, courses]);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    setContent((prev) => prev + `${prefix}Teks${suffix}`);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const toggleLinkedNote = (id: number) => {
    if (linkedNoteIds.includes(id)) {
      setLinkedNoteIds(linkedNoteIds.filter((nid) => nid !== id));
    } else {
      setLinkedNoteIds([...linkedNoteIds, id]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Perhatian', 'Judul catatan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateNotePayload = {
        title: title.trim(),
        content: content.trim(),
        course_id: courseId,
        tags,
        is_pinned: isPinned,
        linked_note_ids: linkedNoteIds,
      };

      await onSave(payload, noteToEdit?.id);
      onClose();
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Gagal menyimpan catatan.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple Markdown renderer for preview
  const renderMarkdownPreview = () => {
    if (!content.trim()) {
      return (
        <Text style={styles.emptyPreviewText}>
          Belum ada isi catatan untuk dipratinjau.
        </Text>
      );
    }

    const lines = content.split('\n');
    return (
      <View style={styles.previewContainer}>
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <Text key={idx} style={styles.mdH1}>
                {line.replace('# ', '')}
              </Text>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <Text key={idx} style={styles.mdH2}>
                {line.replace('## ', '')}
              </Text>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <View key={idx} style={styles.mdListItem}>
                <Text style={styles.mdBullet}>•</Text>
                <Text style={styles.mdListText}>{line.substring(2)}</Text>
              </View>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <View key={idx} style={styles.mdQuoteBox}>
                <Text style={styles.mdQuoteText}>{line.replace('> ', '')}</Text>
              </View>
            );
          }
          if (line.startsWith('```')) {
            return null;
          }
          return (
            <Text key={idx} style={styles.mdParagraph}>
              {line}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <AcademicModal
      visible={visible}
      onClose={onClose}
      title={noteToEdit ? 'Edit Catatan' : 'Catatan Baru'}
      subtitle="Catatan terhubung berbasis Markdown dengan graf relasi"
    >
      <View style={styles.container}>
        {/* Mode Switcher Tabs */}
        <View style={styles.modeTabs}>
          <Pressable
            onPress={() => setMode('edit')}
            style={[styles.modeTabButton, mode === 'edit' && styles.modeTabButtonActive]}
          >
            <PencilSimple
              size={14}
              color={mode === 'edit' ? themeColors.brand.primary : themeColors.text.secondary}
              weight="bold"
            />
            <Text style={[styles.modeTabText, mode === 'edit' && styles.modeTabTextActive]}>
              Tulis
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode('preview')}
            style={[styles.modeTabButton, mode === 'preview' && styles.modeTabButtonActive]}
          >
            <Eye
              size={14}
              color={mode === 'preview' ? themeColors.brand.primary : themeColors.text.secondary}
              weight="bold"
            />
            <Text style={[styles.modeTabText, mode === 'preview' && styles.modeTabTextActive]}>
              Pratinjau
            </Text>
          </Pressable>
        </View>

        {mode === 'edit' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Course Picker */}
            <Text style={styles.sectionLabel}>Mata Kuliah (Opsional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseScroll}>
              <Pressable
                onPress={() => setCourseId(null)}
                style={[styles.coursePill, courseId === null && styles.coursePillActive]}
              >
                <Text style={[styles.coursePillText, courseId === null && styles.coursePillTextActive]}>
                  Umum (Tanpa Matkul)
                </Text>
              </Pressable>
              {courses.map((c) => {
                const isSelected = courseId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCourseId(c.id)}
                    style={[styles.coursePill, isSelected && styles.coursePillActive]}
                  >
                    <GraduationCap size={13} color={isSelected ? themeColors.text.primary : themeColors.text.secondary} />
                    <Text style={[styles.coursePillText, isSelected && styles.coursePillTextActive]}>
                      {c.code || c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Title & Pin Toggle */}
            <View style={styles.titleRow}>
              <View style={styles.titleInputWrap}>
                <UniInput
                  label="Judul Catatan"
                  placeholder="Contoh: Normalisasi Basis Data 1NF-3NF"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <Pressable
                onPress={() => setIsPinned(!isPinned)}
                style={[styles.pinToggle, isPinned && styles.pinToggleActive]}
              >
                <PushPin size={18} color={isPinned ? themeColors.brand.accent : themeColors.text.muted} weight={isPinned ? 'fill' : 'duotone'} />
              </Pressable>
            </View>

            {/* Markdown Toolbar */}
            <Text style={styles.sectionLabel}>Isi Catatan (Markdown)</Text>
            <View style={styles.toolbar}>
              <Pressable onPress={() => insertMarkdown('# ')} style={styles.toolBtn}>
                <TextHOne size={16} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
              <Pressable onPress={() => insertMarkdown('## ')} style={styles.toolBtn}>
                <TextHTwo size={16} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
              <Pressable onPress={() => insertMarkdown('**', '**')} style={styles.toolBtn}>
                <TextB size={16} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
              <Pressable onPress={() => insertMarkdown('- ')} style={styles.toolBtn}>
                <ListBullets size={16} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
              <Pressable onPress={() => insertMarkdown('`', '`')} style={styles.toolBtn}>
                <Code size={16} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
              <Pressable onPress={() => insertMarkdown('> ')} style={styles.toolBtn}>
                <Quotes size={16} color={themeColors.text.secondary} weight="bold" />
              </Pressable>
            </View>

            {/* Content Input */}
            <TextInput
              style={styles.contentInput}
              placeholder="Tulis catatan di sini... (Mendukung format Markdown)"
              placeholderTextColor={themeColors.text.muted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            {/* Tags Builder */}
            <Text style={styles.sectionLabel}>Tag / Kategori</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagField}
                placeholder="Tambah tag (misal: praktikum)"
                placeholderTextColor={themeColors.text.muted}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
              />
              <Pressable onPress={handleAddTag} style={styles.addTagButton}>
                <Plus size={14} color="#FFF" weight="bold" />
              </Pressable>
            </View>

            <View style={styles.tagsPillContainer}>
              {tags.map((t, i) => (
                <View key={i} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{t}</Text>
                  <Pressable onPress={() => handleRemoveTag(i)}>
                    <Trash size={12} color={themeColors.semantic.danger} weight="bold" />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Networked Notes Linker */}
            {allNotes.filter((n) => !noteToEdit || n.id !== noteToEdit.id).length > 0 && (
              <View style={styles.linkedSection}>
                <Text style={styles.sectionLabel}>Tautkan dengan Catatan Lain (Graph Link)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linkNotesScroll}>
                  {allNotes
                    .filter((n) => !noteToEdit || n.id !== noteToEdit.id)
                    .map((other) => {
                      const isLinked = linkedNoteIds.includes(other.id);
                      return (
                        <Pressable
                          key={other.id}
                          onPress={() => toggleLinkedNote(other.id)}
                          style={[styles.linkNotePill, isLinked && styles.linkNotePillActive]}
                        >
                          <Link size={12} color={isLinked ? themeColors.brand.secondary : themeColors.text.muted} weight="bold" />
                          <Text
                            style={[styles.linkNoteText, isLinked && styles.linkNoteTextActive]}
                            numberOfLines={1}
                          >
                            {other.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                </ScrollView>
              </View>
            )}

            {/* Submit Button */}
            <View style={styles.submitWrap}>
              <UniButton
                label={noteToEdit ? 'Perbarui Catatan' : 'Simpan Catatan'}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              />
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.previewScroll}>
            <Text style={styles.previewHeaderTitle}>{title || 'Tanpa Judul'}</Text>
            {renderMarkdownPreview()}
          </ScrollView>
        )}
      </View>
    </AcademicModal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows, isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingBottom: spacing.lg,
      maxHeight: 520,
    },
    modeTabs: {
      flexDirection: 'row',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.sm,
      padding: 3,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    modeTabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
      borderRadius: radius.sm,
    },
    modeTabButtonActive: {
      backgroundColor: colors.bg.overlay,
    },
    modeTabText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    modeTabTextActive: {
      color: colors.brand.primary,
      fontWeight: '700',
    },
    scrollContent: {
      paddingBottom: spacing.md,
    },
    sectionLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.secondary,
      marginBottom: spacing.xs,
      marginTop: spacing.xs,
    },
    courseScroll: {
      gap: spacing.xs,
      paddingVertical: 4,
      marginBottom: spacing.xs,
    },
    coursePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.bg.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    coursePillActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    coursePillText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    coursePillTextActive: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    titleInputWrap: {
      flex: 1,
    },
    pinToggle: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.default,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    pinToggleActive: {
      backgroundColor: colors.brand.accent + '20',
      borderColor: colors.brand.accent,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.bg.surface,
      padding: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: 6,
    },
    toolBtn: {
      padding: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.bg.overlay,
    },
    contentInput: {
      backgroundColor: colors.bg.surface,
      borderRadius: radius.sm,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
      color: colors.text.primary,
      fontFamily: typography.mono.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      minHeight: 120,
      marginBottom: spacing.sm,
    },
    tagInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 6,
    },
    tagField: {
      flex: 1,
      backgroundColor: colors.bg.surface,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      color: colors.text.primary,
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    addTagButton: {
      backgroundColor: colors.brand.primary,
      padding: 8,
      borderRadius: radius.sm,
    },
    tagsPillContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: spacing.sm,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.brand.primary + '18',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    tagChipText: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.brand.primary,
    },
    linkedSection: {
      marginTop: spacing.xs,
    },
    linkNotesScroll: {
      gap: spacing.xs,
      paddingVertical: 4,
    },
    linkNotePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.bg.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
      maxWidth: 160,
    },
    linkNotePillActive: {
      backgroundColor: colors.brand.secondary + '20',
      borderColor: colors.brand.secondary,
    },
    linkNoteText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 11,
      color: colors.text.secondary,
    },
    linkNoteTextActive: {
      color: colors.brand.secondary,
      fontWeight: '600',
    },
    submitWrap: {
      marginTop: spacing.md,
    },
    previewScroll: {
      paddingVertical: spacing.sm,
    },
    previewHeaderTitle: {
      fontFamily: typography.display.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    emptyPreviewText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      color: colors.text.muted,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: spacing.md,
    },
    previewContainer: {
      gap: 8,
    },
    mdH1: {
      fontFamily: typography.display.fontFamily,
      fontSize: 17,
      fontWeight: '700',
      color: colors.brand.primary,
      marginTop: 6,
    },
    mdH2: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      color: colors.brand.secondary,
      marginTop: 4,
    },
    mdParagraph: {
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      color: colors.text.primary,
      lineHeight: 19,
    },
    mdListItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginLeft: 4,
    },
    mdBullet: {
      color: colors.brand.primary,
      fontSize: 14,
    },
    mdListText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      color: colors.text.primary,
      flex: 1,
    },
    mdQuoteBox: {
      borderLeftWidth: 3,
      borderLeftColor: colors.brand.accent,
      paddingLeft: spacing.sm,
      marginVertical: 4,
    },
    mdQuoteText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      fontStyle: 'italic',
    },
  });
