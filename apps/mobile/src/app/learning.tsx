import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Books,
  FileText,
  PencilSimple,
  Cards,
  Brain,
  Plus,
  GraduationCap,
  Sparkle,
  FolderOpen,
  NotePencil,
} from 'phosphor-react-native';
import { radius, spacing, typography, ThemeColors, ThemeShadows } from '@/constants/tokens';
import { useUniTheme } from '@/store/useThemeStore';
import { useAcademicStore } from '@/store/useAcademicStore';
import { useLearningStore } from '@/store/useLearningStore';
import { BottomNav } from '@/components/ui/BottomNav';
import { ShimmerBox } from '@/components/ui/UniSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MaterialCard } from '@/components/learning/MaterialCard';
import { CreateMaterialModal } from '@/components/learning/CreateMaterialModal';
import { NoteCard } from '@/components/learning/NoteCard';
import { NoteEditorModal } from '@/components/learning/NoteEditorModal';
import { FlashcardDeckCard } from '@/components/learning/FlashcardDeckCard';
import { FlashcardStudyModal } from '@/components/learning/FlashcardStudyModal';
import { CreateDeckModal } from '@/components/learning/CreateDeckModal';
import { ManageCardsModal } from '@/components/learning/ManageCardsModal';
import { QuizCard } from '@/components/learning/QuizCard';
import { QuizPlayModal } from '@/components/learning/QuizPlayModal';
import { QuizResultModal } from '@/components/learning/QuizResultModal';
import { CreateQuizModal } from '@/components/learning/CreateQuizModal';
import { Note, FlashcardDeck, Quiz, QuizAttempt } from '@/types/learning';
import { learningService } from '@/services/learningService';
import { formatApiError } from '@/lib/api';

/*
<vibe_check>
Screen/Component : LearningScreen (app/learning.tsx)
Tujuan           : Hub komprehensif pembelajaran mahasiswa UniDemic: Materi Kuliah, Catatan Terhubung, Flashcard Spaced Repetition (SM-2), dan Kuis Latihan Mandiri
Layout strategy  : Header + Course Filter -> Full-Width 4-Segment Bar (Materi, Catatan, Flashcard, Kuis) -> Content List -> Contextual Floating Action Button -> BottomNav
Color tokens     : bg.base, bg.surface, bg.overlay, brand.primary, brand.secondary, text.primary
Animation plan   : FadeInDown cards, liquid spring tap feedback
Typography       : Syne_700Bold display, SpaceGrotesk untuk headings & labels, JetBrainsMono untuk numeric metrics
Anti-slop check  : Rule #1 (tokens), Rule #2 (Phosphor duotone), Rule #4 (dynamic theme), Rule #21 (skeleton loading), Rule #28 (spring tap)
</vibe_check>
*/

type LearningTab = 'materials' | 'notes' | 'flashcards' | 'quizzes';

export default function LearningScreen() {
  const router = useRouter();
  const { colors: themeColors, shadows: themeShadows, isDark } = useUniTheme();
  const styles = useMemo(() => createStyles(themeColors, themeShadows, isDark), [themeColors, themeShadows, isDark]);

  const { courses, fetchCoursesAndSemesters } = useAcademicStore();
  const {
    materials,
    notes,
    decks,
    activeDeck,
    activeDeckCards,
    quizzes,
    isMaterialsLoading,
    isNotesLoading,
    isDecksLoading,
    isCardsLoading,
    isQuizzesLoading,
    fetchMaterials,
    createMaterial,
    deleteMaterial,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    fetchDecks,
    createDeck,
    deleteDeck,
    fetchDeckCards,
    createCard,
    deleteCard,
    startStudySession,
    submitCardReview,
    studyCards,
    fetchQuizzes,
    createQuiz,
    deleteQuiz,
    submitAttempt,
  } = useLearningStore();

  const [activeTab, setActiveTab] = useState<LearningTab>('materials');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [showManageCards, setShowManageCards] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [showStudySession, setShowStudySession] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [showQuizPlay, setShowQuizPlay] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizAttemptResult, setQuizAttemptResult] = useState<QuizAttempt | null>(null);

  // Initial load
  useEffect(() => {
    fetchCoursesAndSemesters().catch(() => {});
    loadData();
  }, [selectedCourseId]);

  const loadData = useCallback(
    async (force = false) => {
      const param = selectedCourseId ? { course_id: selectedCourseId } : undefined;
      await Promise.allSettled([
        fetchMaterials(param, force),
        fetchNotes(param, force),
        fetchDecks(param, force),
        fetchQuizzes(param, force),
      ]);
    },
    [selectedCourseId]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(true);
    setIsRefreshing(false);
  };

  // Handlers
  const handleOpenStudy = async (deck: FlashcardDeck) => {
    setSelectedDeck(deck);
    try {
      await startStudySession(deck.id);
      setShowStudySession(true);
    } catch {
      Alert.alert('Gagal', 'Gagal memuat sesi belajar flashcard.');
    }
  };

  const handleOpenManageCards = async (deck: FlashcardDeck) => {
    setSelectedDeck(deck);
    await fetchDeckCards(deck.id);
    setShowManageCards(true);
  };

  const handleOpenQuizPlay = async (quiz: Quiz) => {
    try {
      let targetQuiz = quiz;
      if (!targetQuiz.questions || targetQuiz.questions.length === 0) {
        targetQuiz = await learningService.getQuiz(quiz.id);
      }
      if (!targetQuiz.questions || targetQuiz.questions.length === 0) {
        Alert.alert('Perhatian', 'Kuis ini belum memiliki butir soal latihan.');
        return;
      }
      setSelectedQuiz(targetQuiz);
      setShowQuizPlay(true);
    } catch (err: any) {
      Alert.alert('Gagal', formatApiError(err, 'Gagal memuat kuis latihan.'));
    }
  };

  const handleShowQuizResult = (attempt: QuizAttempt, quiz: Quiz) => {
    setQuizAttemptResult(attempt);
    setSelectedQuiz(quiz);
    setShowQuizResult(true);
  };

  const handleFABPress = () => {
    switch (activeTab) {
      case 'materials':
        setShowCreateMaterial(true);
        break;
      case 'notes':
        setNoteToEdit(null);
        setShowNoteEditor(true);
        break;
      case 'flashcards':
        setShowCreateDeck(true);
        break;
      case 'quizzes':
        setShowCreateQuiz(true);
        break;
    }
  };

  const isLoading =
    activeTab === 'materials'
      ? isMaterialsLoading
      : activeTab === 'notes'
      ? isNotesLoading
      : activeTab === 'flashcards'
      ? isDecksLoading
      : isQuizzesLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(200)} style={styles.header}>
          <View>
            <View style={styles.heroRow}>
              <Books size={22} color={themeColors.brand.primary} weight="duotone" />
              <Text style={styles.heroTitle}>Pusat Belajar</Text>
            </View>
            <Text style={styles.heroSubtitle}>
              Materi kuliah, catatan terhubung, flashcard & kuis latihan
            </Text>
          </View>
        </Animated.View>

        {/* Course Filter Chips */}
        <View style={styles.courseFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courseFilterScroll}
          >
            <Pressable
              onPress={() => setSelectedCourseId(null)}
              style={[
                styles.courseFilterChip,
                selectedCourseId === null && styles.courseFilterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.courseFilterText,
                  selectedCourseId === null && styles.courseFilterTextActive,
                ]}
              >
                Semua Matkul
              </Text>
            </Pressable>

            {courses.map((c) => {
              const isSelected = selectedCourseId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCourseId(c.id)}
                  style={[
                    styles.courseFilterChip,
                    isSelected && styles.courseFilterChipActive,
                  ]}
                >
                  <GraduationCap
                    size={13}
                    color={isSelected ? themeColors.text.primary : themeColors.text.secondary}
                    weight={isSelected ? 'fill' : 'duotone'}
                  />
                  <Text
                    style={[
                      styles.courseFilterText,
                      isSelected && styles.courseFilterTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {c.code || c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 4-Segment Responsive Tab Bar (Zero Clipped Text) */}
        <View style={styles.segmentBarContainer}>
          <View style={styles.segmentBar}>
            <Pressable
              onPress={() => setActiveTab('materials')}
              style={[styles.segmentItem, activeTab === 'materials' && styles.segmentItemActive]}
            >
              <FileText
                size={14}
                color={activeTab === 'materials' ? themeColors.brand.primary : themeColors.text.secondary}
                weight={activeTab === 'materials' ? 'fill' : 'duotone'}
              />
              <Text style={[styles.segmentLabel, activeTab === 'materials' && styles.segmentLabelActive]}>
                Materi
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('notes')}
              style={[styles.segmentItem, activeTab === 'notes' && styles.segmentItemActive]}
            >
              <PencilSimple
                size={14}
                color={activeTab === 'notes' ? themeColors.brand.primary : themeColors.text.secondary}
                weight={activeTab === 'notes' ? 'fill' : 'duotone'}
              />
              <Text style={[styles.segmentLabel, activeTab === 'notes' && styles.segmentLabelActive]}>
                Catatan
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('flashcards')}
              style={[styles.segmentItem, activeTab === 'flashcards' && styles.segmentItemActive]}
            >
              <Cards
                size={14}
                color={activeTab === 'flashcards' ? themeColors.brand.primary : themeColors.text.secondary}
                weight={activeTab === 'flashcards' ? 'fill' : 'duotone'}
              />
              <Text style={[styles.segmentLabel, activeTab === 'flashcards' && styles.segmentLabelActive]}>
                Flashcard
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('quizzes')}
              style={[styles.segmentItem, activeTab === 'quizzes' && styles.segmentItemActive]}
            >
              <Brain
                size={14}
                color={activeTab === 'quizzes' ? themeColors.brand.primary : themeColors.text.secondary}
                weight={activeTab === 'quizzes' ? 'fill' : 'duotone'}
              />
              <Text style={[styles.segmentLabel, activeTab === 'quizzes' && styles.segmentLabelActive]}>
                Kuis
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content Area */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={themeColors.brand.primary}
            />
          }
        >
          {isLoading && !isRefreshing ? (
            <View style={styles.skeletonWrap}>
              <ShimmerBox width="100%" height={80} borderRadius={radius.md} />
              <ShimmerBox width="100%" height={80} borderRadius={radius.md} />
              <ShimmerBox width="100%" height={80} borderRadius={radius.md} />
            </View>
          ) : activeTab === 'materials' ? (
            materials.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={40} color={themeColors.brand.primary} weight="duotone" />}
                title="Belum Ada Materi Kuliah"
                description="Simpan slide presentasi, dokumen PDF, atau tautan bahan ajar untuk belajar lebih terstruktur."
                actionLabel="Tambah Materi Baru"
                onAction={() => setShowCreateMaterial(true)}
              />
            ) : (
              materials.map((m, idx) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  index={idx}
                  onDelete={deleteMaterial}
                />
              ))
            )
          ) : activeTab === 'notes' ? (
            notes.length === 0 ? (
              <EmptyState
                icon={<NotePencil size={40} color={themeColors.brand.primary} weight="duotone" />}
                title="Belum Ada Catatan"
                description="Tulis ringkasan kuliah dalam Markdown dan hubungkan konsep antar-catatan secara timbal balik."
                actionLabel="Tulis Catatan Baru"
                onAction={() => {
                  setNoteToEdit(null);
                  setShowNoteEditor(true);
                }}
              />
            ) : (
              notes.map((n, idx) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  index={idx}
                  onPress={(note) => {
                    setNoteToEdit(note);
                    setShowNoteEditor(true);
                  }}
                  onDelete={deleteNote}
                />
              ))
            )
          ) : activeTab === 'flashcards' ? (
            decks.length === 0 ? (
              <EmptyState
                icon={<Cards size={40} color={themeColors.brand.primary} weight="duotone" />}
                title="Belum Ada Dek Flashcard"
                description="Buat kartu tanya-jawab untuk memperkuat hafalan dengan interval algoritma SuperMemo SM-2."
                actionLabel="Buat Dek Pertama"
                onAction={() => setShowCreateDeck(true)}
              />
            ) : (
              decks.map((d, idx) => (
                <FlashcardDeckCard
                  key={d.id}
                  deck={d}
                  index={idx}
                  onStartStudy={handleOpenStudy}
                  onManageCards={handleOpenManageCards}
                  onDelete={deleteDeck}
                />
              ))
            )
          ) : quizzes.length === 0 ? (
            <EmptyState
              icon={<Brain size={40} color={themeColors.brand.primary} weight="duotone" />}
              title="Belum Ada Kuis Latihan"
              description="Uji kesiapan ujian dengan kuis mandiri pilihan ganda, benar/salah, atau isian singkat."
              actionLabel="Buat Kuis Baru"
              onAction={() => setShowCreateQuiz(true)}
            />
          ) : (
            quizzes.map((q, idx) => (
              <QuizCard
                key={q.id}
                quiz={q}
                index={idx}
                onStart={handleOpenQuizPlay}
                onDelete={deleteQuiz}
              />
            ))
          )}
        </ScrollView>

        {/* Contextual Floating Action Button */}
        <Pressable
          onPress={handleFABPress}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          hitSlop={10}
        >
          <Plus size={24} color="#FFF" weight="bold" />
        </Pressable>

        {/* Modals Suite */}
        <CreateMaterialModal
          visible={showCreateMaterial}
          onClose={() => setShowCreateMaterial(false)}
          courses={courses}
          initialCourseId={selectedCourseId}
          onSubmit={createMaterial}
        />

        <NoteEditorModal
          visible={showNoteEditor}
          onClose={() => {
            setShowNoteEditor(false);
            setNoteToEdit(null);
          }}
          noteToEdit={noteToEdit}
          courses={courses}
          allNotes={notes}
          onSave={async (payload, noteId) => {
            if (noteId) {
              await updateNote(noteId, payload);
            } else {
              await createNote(payload as any);
            }
          }}
        />

        <CreateDeckModal
          visible={showCreateDeck}
          onClose={() => setShowCreateDeck(false)}
          courses={courses}
          initialCourseId={selectedCourseId}
          onSubmit={createDeck}
        />

        <ManageCardsModal
          visible={showManageCards}
          onClose={() => {
            setShowManageCards(false);
            setSelectedDeck(null);
          }}
          deck={selectedDeck}
          cards={activeDeckCards}
          onAddCard={createCard}
          onDeleteCard={deleteCard}
        />

        <FlashcardStudyModal
          visible={showStudySession}
          deck={selectedDeck}
          cards={studyCards}
          onClose={() => {
            setShowStudySession(false);
            setSelectedDeck(null);
          }}
          onSubmitReview={submitCardReview}
        />

        <CreateQuizModal
          visible={showCreateQuiz}
          onClose={() => setShowCreateQuiz(false)}
          courses={courses}
          initialCourseId={selectedCourseId}
          onSubmit={createQuiz}
        />

        <QuizPlayModal
          visible={showQuizPlay}
          quiz={selectedQuiz}
          onClose={() => {
            setShowQuizPlay(false);
            setSelectedQuiz(null);
          }}
          onSubmit={submitAttempt}
          onShowResult={handleShowQuizResult}
        />

        <QuizResultModal
          visible={showQuizResult}
          attempt={quizAttemptResult}
          quiz={selectedQuiz}
          onClose={() => {
            setShowQuizResult(false);
            setQuizAttemptResult(null);
            setSelectedQuiz(null);
          }}
        />

        {/* Global Bottom Navigation */}
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, shadows: ThemeShadows, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    container: {
      flex: 1,
      position: 'relative',
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    heroTitle: {
      fontFamily: typography.display.fontFamily,
      fontSize: 22,
      fontWeight: '700',
      color: colors.text.primary,
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 2,
    },
    courseFilterContainer: {
      paddingVertical: spacing.xs,
    },
    courseFilterScroll: {
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    courseFilterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.bg.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    courseFilterChipActive: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },
    courseFilterText: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    courseFilterTextActive: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    segmentBarContainer: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    segmentBar: {
      flexDirection: 'row',
      backgroundColor: colors.bg.surface,
      borderRadius: radius.md,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    segmentItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      borderRadius: radius.sm,
    },
    segmentItemActive: {
      backgroundColor: colors.bg.overlay,
      borderWidth: 1,
      borderColor: colors.brand.primary + '30',
    },
    segmentLabel: {
      fontFamily: typography.h3.fontFamily,
      fontSize: 12,
      color: colors.text.secondary,
    },
    segmentLabelActive: {
      color: colors.brand.primary,
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: 110, // Space for BottomNav
    },
    skeletonWrap: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    fab: {
      position: 'absolute',
      right: spacing.md,
      bottom: 84, // Above BottomNav
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.elevated,
      zIndex: 10,
    },
    fabPressed: {
      transform: [{ scale: 0.94 }],
      opacity: 0.85,
    },
  });
