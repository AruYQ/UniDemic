import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  CheckSquareOffset,
  FileText,
  BookBookmark,
  Notebook,
  Brain,
  CaretRight,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { useAcademicStore } from '@/store/useAcademicStore';
import { useLearningStore } from '@/store/useLearningStore';
import { AcademicReference, AcademicReferenceType } from '@/types/communication';

/*
<vibe_check>
Screen/Component : AcademicAttachmentPickerModal (components/communication/AcademicAttachmentPickerModal.tsx)
Tujuan           : Memungkinkan mahasiswa menyematkan referensi tugas, ujian, materi kuliah, catatan belajar, atau kuis langsung ke dalam obrolan
Layout strategy  : Bottom sheet modal: Kategori tabs di atas (Tugas, Ujian, Materi, Catatan, Kuis), list entitas scrollable dengan icon indikator dan metadata ringkas
Color tokens     : bg.elevated (#1E2333), bg.surface (#171B26), border.subtle (#252A3D), brand.primary (#6B7FD7), brand.secondary (#4ECDC4)
Animation plan   : Slide up bottom sheet entry
Typography       : SpaceGrotesk_600SemiBold (header & nama item), JetBrainsMono_400Regular (deadline/kode), SpaceGrotesk_500Medium (tab label)
Anti-slop check  : Rule #19 (Radius bervariasi), Rule #2 (Phosphor icons duotone), Rule #5 (Offset shadow)
</vibe_check>
*/

interface AcademicAttachmentPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reference: AcademicReference) => void;
}

type TabType = 'assignment' | 'exam' | 'material' | 'note' | 'quiz';

export const AcademicAttachmentPickerModal: React.FC<AcademicAttachmentPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { colors: themeColors, shadows: themeShadows } = useUniTheme();
  const [activeTab, setActiveTab] = useState<TabType>('assignment');

  const assignments = useAcademicStore((s) => s.assignments);
  const exams = useAcademicStore((s) => s.exams);
  const materials = useLearningStore((s) => s.materials);
  const notes = useLearningStore((s) => s.notes);
  const quizzes = useLearningStore((s) => s.quizzes);

  const styles = useMemo(
    () => createStyles(themeColors, themeShadows),
    [themeColors, themeShadows]
  );

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'assignment', label: 'Tugas', icon: CheckSquareOffset },
    { key: 'exam', label: 'Ujian', icon: FileText },
    { key: 'material', label: 'Materi', icon: BookBookmark },
    { key: 'note', label: 'Catatan', icon: Notebook },
    { key: 'quiz', label: 'Kuis', icon: Brain },
  ];

  const handleSelectItem = (type: AcademicReferenceType, id: number, title?: string, subtitle?: string) => {
    onSelect({
      type,
      id,
      title,
      subtitle,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Sematkan Akademik</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <X size={20} weight="bold" color={themeColors.text.muted} />
            </Pressable>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                >
                  <Icon
                    size={16}
                    weight="duotone"
                    color={isActive ? '#FFFFFF' : themeColors.text.secondary}
                  />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* List Content */}
          <ScrollView style={styles.listContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'assignment' && (
              assignments.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada data tugas tersimpan</Text>
              ) : (
                assignments.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      handleSelectItem('assignment', item.id, item.title, item.course?.name)
                    }
                    style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: `${themeColors.semantic.warning}20` }]}>
                      <CheckSquareOffset size={18} weight="duotone" color={themeColors.semantic.warning} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {item.course?.name || 'Tugas'} • Batas: {item.deadline ? item.deadline.substring(0, 10) : '-'}
                      </Text>
                    </View>
                    <CaretRight size={16} color={themeColors.text.muted} />
                  </Pressable>
                ))
              )
            )}

            {activeTab === 'exam' && (
              exams.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada data ujian tersimpan</Text>
              ) : (
                exams.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      handleSelectItem('exam', item.id, `${item.type} - ${item.course?.name || 'Ujian'}`, item.course?.name)
                    }
                    style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: `${themeColors.semantic.danger}20` }]}>
                      <FileText size={18} weight="duotone" color={themeColors.semantic.danger} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.type} {item.course?.name || 'Ujian'}</Text>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {item.location || 'Ruang TBA'} • {item.date ? item.date.substring(0, 10) : '-'}
                      </Text>
                    </View>
                    <CaretRight size={16} color={themeColors.text.muted} />
                  </Pressable>
                ))
              )
            )}

            {activeTab === 'material' && (
              materials.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada data materi tersimpan</Text>
              ) : (
                materials.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      handleSelectItem('material', item.id, item.title, item.course?.name)
                    }
                    style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: `${themeColors.brand.secondary}20` }]}>
                      <BookBookmark size={18} weight="duotone" color={themeColors.brand.secondary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {item.course?.name || 'Materi'}
                      </Text>
                    </View>
                    <CaretRight size={16} color={themeColors.text.muted} />
                  </Pressable>
                ))
              )
            )}

            {activeTab === 'note' && (
              notes.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada catatan tersimpan</Text>
              ) : (
                notes.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      handleSelectItem('note', item.id, item.title, item.course?.name)
                    }
                    style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: `${themeColors.brand.primary}20` }]}>
                      <Notebook size={18} weight="duotone" color={themeColors.brand.primary} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {item.course?.name || 'Catatan'}
                      </Text>
                    </View>
                    <CaretRight size={16} color={themeColors.text.muted} />
                  </Pressable>
                ))
              )
            )}

            {activeTab === 'quiz' && (
              quizzes.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada kuis tersimpan</Text>
              ) : (
                quizzes.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      handleSelectItem('quiz', item.id, item.title, `${item.questions_count || 0} Soal`)
                    }
                    style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: `${themeColors.brand.accent}20` }]}>
                      <Brain size={18} weight="duotone" color={themeColors.brand.accent} />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {item.course?.name || 'Kuis'} • {item.questions_count || 0} Soal
                      </Text>
                    </View>
                    <CaretRight size={16} color={themeColors.text.muted} />
                  </Pressable>
                ))
              )
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, shadows: ThemeShadows) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    backdrop: {
      flex: 1,
    },
    sheetContainer: {
      backgroundColor: colors.bg.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '65%',
      paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      ...shadows.elevated,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerTitle: {
      fontFamily: typography.h2.fontFamily,
      fontSize: 18,
      color: colors.text.primary,
    },
    closeButton: {
      padding: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.bg.elevated,
    },
    tabsContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    tabButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      gap: spacing.xs,
    },
    tabButtonActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    tabLabel: {
      fontFamily: typography.label.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    tabLabelActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xs,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
      gap: spacing.md,
    },
    listItemPressed: {
      opacity: 0.7,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemInfo: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
    itemSubtitle: {
      fontFamily: typography.mono.fontFamily,
      fontSize: 11,
      color: colors.text.muted,
    },
    emptyText: {
      fontFamily: typography.body.fontFamily,
      fontSize: 13,
      color: colors.text.muted,
      textAlign: 'center',
      marginVertical: spacing.xxl,
    },
  });
