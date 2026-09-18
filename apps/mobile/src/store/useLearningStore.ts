import { create } from 'zustand';
import {
  Material,
  CreateMaterialPayload,
  UpdateMaterialPayload,
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  FlashcardDeck,
  Flashcard,
  CreateDeckPayload,
  UpdateDeckPayload,
  CreateFlashcardPayload,
  UpdateFlashcardPayload,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  CreateQuizPayload,
  UpdateQuizPayload,
  CreateQuizQuestionPayload,
  SubmitQuizAttemptPayload,
} from '../types/learning';
import { learningService } from '../services/learningService';
import { formatApiError } from '../lib/api';

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 Menit Cache

interface LearningState {
  // Collections
  materials: Material[];
  notes: Note[];
  activeNote: Note | null;
  decks: FlashcardDeck[];
  activeDeck: FlashcardDeck | null;
  activeDeckCards: Flashcard[];
  quizzes: Quiz[];
  activeQuiz: Quiz | null;
  activeAttempt: QuizAttempt | null;

  // Loading & Error States
  isMaterialsLoading: boolean;
  isNotesLoading: boolean;
  isDecksLoading: boolean;
  isCardsLoading: boolean;
  isQuizzesLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Cache
  lastFetched: Record<string, number>;

  // === Flashcard Study Session (SM-2) ===
  studyDeckId: number | null;
  studyCards: Flashcard[];
  currentCardIndex: number;
  isCardFlipped: boolean;
  reviewedCount: number;

  startStudySession: (deckId: number) => Promise<void>;
  flipCard: () => void;
  submitCardReview: (cardId: number, rating: number) => Promise<void>;
  resetStudySession: () => void;

  // === Interactive Quiz Play Session ===
  playingQuiz: Quiz | null;
  currentQuestionIndex: number;
  userAnswers: Record<string, any>;
  timeRemainingSeconds: number;
  quizResult: QuizAttempt | null;

  startQuiz: (quizId: number) => Promise<void>;
  setAnswer: (questionId: number, answer: any) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  tickTimer: () => void;
  finishQuiz: () => Promise<QuizAttempt>;
  resetQuiz: () => void;

  // === CRUD Actions — Materials ===
  fetchMaterials: (params?: { course_id?: number; type?: string }, forceRefresh?: boolean) => Promise<void>;
  createMaterial: (payload: CreateMaterialPayload) => Promise<Material>;
  updateMaterial: (id: number, payload: UpdateMaterialPayload) => Promise<Material>;
  deleteMaterial: (id: number) => Promise<void>;
  uploadMaterialFile: (formData: FormData) => Promise<Material>;

  // === CRUD Actions — Notes ===
  fetchNotes: (params?: { course_id?: number; tag?: string; search?: string }, forceRefresh?: boolean) => Promise<void>;
  fetchNote: (id: number) => Promise<Note>;
  createNote: (payload: CreateNotePayload) => Promise<Note>;
  updateNote: (id: number, payload: UpdateNotePayload) => Promise<Note>;
  deleteNote: (id: number) => Promise<void>;
  linkNote: (id: number, targetId: number) => Promise<Note>;
  unlinkNote: (id: number, targetId: number) => Promise<Note>;

  // === CRUD Actions — Flashcards ===
  fetchDecks: (params?: { course_id?: number }, forceRefresh?: boolean) => Promise<void>;
  fetchDeck: (id: number) => Promise<FlashcardDeck>;
  createDeck: (payload: CreateDeckPayload) => Promise<FlashcardDeck>;
  updateDeck: (id: number, payload: UpdateDeckPayload) => Promise<FlashcardDeck>;
  deleteDeck: (id: number) => Promise<void>;
  fetchDeckCards: (deckId: number) => Promise<void>;
  createCard: (deckId: number, payload: CreateFlashcardPayload) => Promise<Flashcard>;
  updateCard: (id: number, payload: UpdateFlashcardPayload) => Promise<Flashcard>;
  deleteCard: (id: number) => Promise<void>;

  // === CRUD Actions — Quizzes ===
  fetchQuizzes: (params?: { course_id?: number }, forceRefresh?: boolean) => Promise<void>;
  fetchQuiz: (id: number) => Promise<Quiz>;
  createQuiz: (payload: CreateQuizPayload) => Promise<Quiz>;
  updateQuiz: (id: number, payload: UpdateQuizPayload) => Promise<Quiz>;
  deleteQuiz: (id: number) => Promise<void>;
  createQuestion: (quizId: number, payload: CreateQuizQuestionPayload) => Promise<QuizQuestion>;
  deleteQuestion: (id: number) => Promise<void>;
  submitAttempt: (quizId: number, payload: SubmitQuizAttemptPayload) => Promise<QuizAttempt>;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  materials: [],
  notes: [],
  activeNote: null,
  decks: [],
  activeDeck: null,
  activeDeckCards: [],
  quizzes: [],
  activeQuiz: null,
  activeAttempt: null,

  isMaterialsLoading: false,
  isNotesLoading: false,
  isDecksLoading: false,
  isCardsLoading: false,
  isQuizzesLoading: false,
  isSubmitting: false,
  error: null,
  lastFetched: {},

  // Flashcard Study defaults
  studyDeckId: null,
  studyCards: [],
  currentCardIndex: 0,
  isCardFlipped: false,
  reviewedCount: 0,

  // Quiz play defaults
  playingQuiz: null,
  currentQuestionIndex: 0,
  userAnswers: {},
  timeRemainingSeconds: 0,
  quizResult: null,

  // ==========================================
  // Flashcard Study Session (SM-2)
  // ==========================================
  startStudySession: async (deckId: number) => {
    set({ isCardsLoading: true, error: null });
    try {
      const dueCards = await learningService.getDueCards(deckId);
      set({
        studyDeckId: deckId,
        studyCards: dueCards,
        currentCardIndex: 0,
        isCardFlipped: false,
        reviewedCount: 0,
        isCardsLoading: false,
      });
    } catch (err: any) {
      set({
        isCardsLoading: false,
        error: formatApiError(err, 'Gagal memuat kartu belajar.'),
      });
      throw err;
    }
  },

  flipCard: () => {
    set((state) => ({ isCardFlipped: !state.isCardFlipped }));
  },

  submitCardReview: async (cardId: number, rating: number) => {
    const { studyCards, currentCardIndex, studyDeckId } = get();

    try {
      await learningService.reviewCard(cardId, { rating });
      const nextIndex = currentCardIndex + 1;
      set((state) => ({
        currentCardIndex: nextIndex,
        isCardFlipped: false,
        reviewedCount: state.reviewedCount + 1,
      }));

      // If finished, refresh decks
      if (nextIndex >= studyCards.length && studyDeckId) {
        get().fetchDecks({ course_id: undefined }, true).catch(() => {});
      }
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal menyimpan hasil review.') });
      throw err;
    }
  },

  resetStudySession: () => {
    set({
      studyDeckId: null,
      studyCards: [],
      currentCardIndex: 0,
      isCardFlipped: false,
      reviewedCount: 0,
    });
  },

  // ==========================================
  // Interactive Quiz Play Session
  // ==========================================
  startQuiz: async (quizId: number) => {
    set({ isQuizzesLoading: true, error: null });
    try {
      const quiz = await learningService.getQuiz(quizId);
      const limitSeconds = (quiz.time_limit_minutes || 15) * 60;
      set({
        playingQuiz: quiz,
        currentQuestionIndex: 0,
        userAnswers: {},
        timeRemainingSeconds: limitSeconds,
        quizResult: null,
        isQuizzesLoading: false,
      });
    } catch (err: any) {
      set({
        isQuizzesLoading: false,
        error: formatApiError(err, 'Gagal memulai kuis.'),
      });
      throw err;
    }
  },

  setAnswer: (questionId: number, answer: any) => {
    set((state) => ({
      userAnswers: { ...state.userAnswers, [questionId]: answer },
    }));
  },

  nextQuestion: () => {
    const { playingQuiz, currentQuestionIndex } = get();
    if (!playingQuiz?.questions) return;
    if (currentQuestionIndex < playingQuiz.questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  tickTimer: () => {
    const { timeRemainingSeconds } = get();
    if (timeRemainingSeconds > 0) {
      set({ timeRemainingSeconds: timeRemainingSeconds - 1 });
    }
  },

  finishQuiz: async () => {
    const { playingQuiz, userAnswers } = get();
    if (!playingQuiz) throw new Error('Kuis tidak aktif');

    set({ isSubmitting: true, error: null });
    try {
      const formattedAnswers = Object.entries(userAnswers).map(([qId, ans]) => ({
        question_id: Number(qId),
        user_answer: String(ans ?? ''),
      }));
      const attempt = await learningService.submitAttempt(playingQuiz.id, {
        answers: formattedAnswers,
      });
      set({
        quizResult: attempt,
        isSubmitting: false,
      });
      // Refresh quizzes list to update attempts count & highest score
      get().fetchQuizzes(undefined, true).catch(() => {});
      return attempt;
    } catch (err: any) {
      set({
        isSubmitting: false,
        error: formatApiError(err, 'Gagal mengumpulkan kuis.'),
      });
      throw err;
    }
  },

  resetQuiz: () => {
    set({
      playingQuiz: null,
      currentQuestionIndex: 0,
      userAnswers: {},
      timeRemainingSeconds: 0,
      quizResult: null,
    });
  },

  // ==========================================
  // Materials Actions
  // ==========================================
  fetchMaterials: async (params, forceRefresh = false) => {
    const cacheKey = `materials_${JSON.stringify(params || {})}`;
    const now = Date.now();
    const last = get().lastFetched[cacheKey] || 0;

    if (!forceRefresh && now - last < CACHE_TTL_MS && get().materials.length > 0) {
      return;
    }

    set({ isMaterialsLoading: true, error: null });
    try {
      const data = await learningService.getMaterials(params);
      set({
        materials: data,
        isMaterialsLoading: false,
        lastFetched: { ...get().lastFetched, [cacheKey]: now },
      });
    } catch (err: any) {
      set({
        isMaterialsLoading: false,
        error: formatApiError(err, 'Gagal memuat materi kuliah.'),
      });
    }
  },

  createMaterial: async (payload) => {
    set({ error: null });
    try {
      const created = await learningService.createMaterial(payload);
      set((state) => ({
        materials: [created, ...state.materials],
      }));
      return created;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal menambahkan materi.') });
      throw err;
    }
  },

  updateMaterial: async (id, payload) => {
    set({ error: null });
    try {
      const updated = await learningService.updateMaterial(id, payload);
      set((state) => ({
        materials: state.materials.map((m) => (m.id === id ? updated : m)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal memperbarui materi.') });
      throw err;
    }
  },

  deleteMaterial: async (id) => {
    const previous = get().materials;
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== id),
    }));

    try {
      await learningService.deleteMaterial(id);
    } catch (err: any) {
      set({
        materials: previous,
        error: formatApiError(err, 'Gagal menghapus materi.'),
      });
      throw err;
    }
  },

  uploadMaterialFile: async (formData) => {
    set({ isSubmitting: true, error: null });
    try {
      const uploaded = await learningService.uploadMaterialFile(formData);
      set((state) => ({
        materials: [uploaded, ...state.materials],
        isSubmitting: false,
      }));
      return uploaded;
    } catch (err: any) {
      set({
        isSubmitting: false,
        error: formatApiError(err, 'Gagal mengunggah berkas materi.'),
      });
      throw err;
    }
  },

  // ==========================================
  // Notes Actions
  // ==========================================
  fetchNotes: async (params, forceRefresh = false) => {
    const cacheKey = `notes_${JSON.stringify(params || {})}`;
    const now = Date.now();
    const last = get().lastFetched[cacheKey] || 0;

    if (!forceRefresh && now - last < CACHE_TTL_MS && get().notes.length > 0) {
      return;
    }

    set({ isNotesLoading: true, error: null });
    try {
      const data = await learningService.getNotes(params);
      set({
        notes: data,
        isNotesLoading: false,
        lastFetched: { ...get().lastFetched, [cacheKey]: now },
      });
    } catch (err: any) {
      set({
        isNotesLoading: false,
        error: formatApiError(err, 'Gagal memuat catatan.'),
      });
    }
  },

  fetchNote: async (id) => {
    try {
      const note = await learningService.getNote(id);
      set({ activeNote: note });
      return note;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal membuka catatan.') });
      throw err;
    }
  },

  createNote: async (payload) => {
    set({ error: null });
    try {
      const created = await learningService.createNote(payload);
      set((state) => ({
        notes: [created, ...state.notes],
      }));
      return created;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal membuat catatan.') });
      throw err;
    }
  },

  updateNote: async (id, payload) => {
    set({ error: null });
    try {
      const updated = await learningService.updateNote(id, payload);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updated : n)),
        activeNote: state.activeNote?.id === id ? updated : state.activeNote,
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal memperbarui catatan.') });
      throw err;
    }
  },

  deleteNote: async (id) => {
    const previous = get().notes;
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      activeNote: state.activeNote?.id === id ? null : state.activeNote,
    }));

    try {
      await learningService.deleteNote(id);
    } catch (err: any) {
      set({
        notes: previous,
        error: formatApiError(err, 'Gagal menghapus catatan.'),
      });
      throw err;
    }
  },

  linkNote: async (id, targetId) => {
    try {
      const updated = await learningService.linkNote(id, targetId);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updated : n)),
        activeNote: state.activeNote?.id === id ? updated : state.activeNote,
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal menghubungkan catatan.') });
      throw err;
    }
  },

  unlinkNote: async (id, targetId) => {
    try {
      const updated = await learningService.unlinkNote(id, targetId);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updated : n)),
        activeNote: state.activeNote?.id === id ? updated : state.activeNote,
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal memutuskan tautan catatan.') });
      throw err;
    }
  },

  // ==========================================
  // Flashcard Decks & Cards Actions
  // ==========================================
  fetchDecks: async (params, forceRefresh = false) => {
    const cacheKey = `decks_${JSON.stringify(params || {})}`;
    const now = Date.now();
    const last = get().lastFetched[cacheKey] || 0;

    if (!forceRefresh && now - last < CACHE_TTL_MS && get().decks.length > 0) {
      return;
    }

    set({ isDecksLoading: true, error: null });
    try {
      const data = await learningService.getDecks(params);
      set({
        decks: data,
        isDecksLoading: false,
        lastFetched: { ...get().lastFetched, [cacheKey]: now },
      });
    } catch (err: any) {
      set({
        isDecksLoading: false,
        error: formatApiError(err, 'Gagal memuat dek flashcard.'),
      });
    }
  },

  fetchDeck: async (id) => {
    try {
      const deck = await learningService.getDeck(id);
      set({ activeDeck: deck });
      return deck;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal mengambil detail dek.') });
      throw err;
    }
  },

  createDeck: async (payload) => {
    set({ error: null });
    try {
      const created = await learningService.createDeck(payload);
      set((state) => ({
        decks: [created, ...state.decks],
      }));
      return created;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal membuat dek.') });
      throw err;
    }
  },

  updateDeck: async (id, payload) => {
    set({ error: null });
    try {
      const updated = await learningService.updateDeck(id, payload);
      set((state) => ({
        decks: state.decks.map((d) => (d.id === id ? updated : d)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal memperbarui dek.') });
      throw err;
    }
  },

  deleteDeck: async (id) => {
    const previous = get().decks;
    set((state) => ({
      decks: state.decks.filter((d) => d.id !== id),
    }));

    try {
      await learningService.deleteDeck(id);
    } catch (err: any) {
      set({
        decks: previous,
        error: formatApiError(err, 'Gagal menghapus dek.'),
      });
      throw err;
    }
  },

  fetchDeckCards: async (deckId) => {
    set({ isCardsLoading: true, error: null });
    try {
      const deck = await learningService.getDeck(deckId);
      set({
        activeDeck: deck,
        activeDeckCards: (deck as any).cards || [],
        isCardsLoading: false,
      });
    } catch (err: any) {
      set({
        isCardsLoading: false,
        error: formatApiError(err, 'Gagal memuat kartu.'),
      });
    }
  },

  createCard: async (deckId, payload) => {
    set({ error: null });
    try {
      const created = await learningService.createCard(deckId, payload);
      set((state) => ({
        activeDeckCards: [...state.activeDeckCards, created],
        decks: state.decks.map((d) =>
          d.id === deckId
            ? { ...d, cards_count: (d.cards_count || 0) + 1, due_cards_count: (d.due_cards_count || 0) + 1 }
            : d
        ),
      }));
      return created;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal menambahkan kartu.') });
      throw err;
    }
  },

  updateCard: async (id, payload) => {
    set({ error: null });
    try {
      const updated = await learningService.updateCard(id, payload);
      set((state) => ({
        activeDeckCards: state.activeDeckCards.map((c) => (c.id === id ? updated : c)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal memperbarui kartu.') });
      throw err;
    }
  },

  deleteCard: async (id) => {
    const previous = get().activeDeckCards;
    set((state) => ({
      activeDeckCards: state.activeDeckCards.filter((c) => c.id !== id),
    }));

    try {
      await learningService.deleteCard(id);
    } catch (err: any) {
      set({
        activeDeckCards: previous,
        error: formatApiError(err, 'Gagal menghapus kartu.'),
      });
      throw err;
    }
  },

  // ==========================================
  // Quizzes Actions
  // ==========================================
  fetchQuizzes: async (params, forceRefresh = false) => {
    const cacheKey = `quizzes_${JSON.stringify(params || {})}`;
    const now = Date.now();
    const last = get().lastFetched[cacheKey] || 0;

    if (!forceRefresh && now - last < CACHE_TTL_MS && get().quizzes.length > 0) {
      return;
    }

    set({ isQuizzesLoading: true, error: null });
    try {
      const data = await learningService.getQuizzes(params);
      set({
        quizzes: data,
        isQuizzesLoading: false,
        lastFetched: { ...get().lastFetched, [cacheKey]: now },
      });
    } catch (err: any) {
      set({
        isQuizzesLoading: false,
        error: formatApiError(err, 'Gagal memuat daftar kuis.'),
      });
    }
  },

  fetchQuiz: async (id) => {
    try {
      const quiz = await learningService.getQuiz(id);
      set({ activeQuiz: quiz });
      return quiz;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal membuka kuis.') });
      throw err;
    }
  },

  createQuiz: async (payload) => {
    set({ error: null });
    try {
      const created = await learningService.createQuiz(payload);
      set((state) => ({
        quizzes: [created, ...state.quizzes],
      }));
      return created;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal membuat kuis.') });
      throw err;
    }
  },

  updateQuiz: async (id, payload) => {
    set({ error: null });
    try {
      const updated = await learningService.updateQuiz(id, payload);
      set((state) => ({
        quizzes: state.quizzes.map((q) => (q.id === id ? updated : q)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal memperbarui kuis.') });
      throw err;
    }
  },

  deleteQuiz: async (id) => {
    const previous = get().quizzes;
    set((state) => ({
      quizzes: state.quizzes.filter((q) => q.id !== id),
    }));

    try {
      await learningService.deleteQuiz(id);
    } catch (err: any) {
      set({
        quizzes: previous,
        error: formatApiError(err, 'Gagal menghapus kuis.'),
      });
      throw err;
    }
  },

  createQuestion: async (quizId, payload) => {
    set({ error: null });
    try {
      const created = await learningService.createQuestion(quizId, payload);
      set((state) => ({
        quizzes: state.quizzes.map((q) =>
          q.id === quizId
            ? { ...q, questions_count: (q.questions_count || 0) + 1, questions: [...(q.questions || []), created] }
            : q
        ),
      }));
      return created;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal menambahkan soal kuis.') });
      throw err;
    }
  },

  deleteQuestion: async (id) => {
    try {
      await learningService.deleteQuestion(id);
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal menghapus soal kuis.') });
      throw err;
    }
  },

  submitAttempt: async (quizId, payload) => {
    set({ error: null });
    try {
      const attempt = await learningService.submitAttempt(quizId, payload);
      get().fetchQuizzes(undefined, true).catch(() => {});
      return attempt;
    } catch (err: any) {
      const formatted = formatApiError(err, 'Gagal mengirimkan jawaban kuis.');
      set({ error: formatted });
      throw new Error(formatted);
    }
  },
}));
