import api from '../lib/api';
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
  FlashcardReviewPayload,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  CreateQuizPayload,
  UpdateQuizPayload,
  CreateQuizQuestionPayload,
  SubmitQuizAttemptPayload,
} from '../types/learning';

export const learningService = {
  // ==========================================
  // 1. Course Materials
  // ==========================================
  async getMaterials(params?: { course_id?: number; type?: string }): Promise<Material[]> {
    const res = await api.get('/materials', { params });
    return res.data?.data || [];
  },

  async getCourseMaterials(courseId: number): Promise<Material[]> {
    const res = await api.get(`/courses/${courseId}/materials`);
    return res.data?.data || [];
  },

  async getMaterial(id: number): Promise<Material> {
    const res = await api.get(`/materials/${id}`);
    return res.data?.data;
  },

  async createMaterial(payload: CreateMaterialPayload): Promise<Material> {
    const res = await api.post('/materials', payload);
    return res.data?.data;
  },

  async updateMaterial(id: number, payload: UpdateMaterialPayload): Promise<Material> {
    const res = await api.put(`/materials/${id}`, payload);
    return res.data?.data;
  },

  async deleteMaterial(id: number): Promise<void> {
    await api.delete(`/materials/${id}`);
  },

  async uploadMaterialFile(formData: FormData): Promise<Material> {
    const res = await api.post('/materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data;
  },

  // ==========================================
  // 2. Markdown & Networked Notes
  // ==========================================
  async getNotes(params?: { course_id?: number; tag?: string; search?: string }): Promise<Note[]> {
    const res = await api.get('/notes', { params });
    return res.data?.data || [];
  },

  async getNote(id: number): Promise<Note> {
    const res = await api.get(`/notes/${id}`);
    return res.data?.data;
  },

  async createNote(payload: CreateNotePayload): Promise<Note> {
    const res = await api.post('/notes', payload);
    return res.data?.data;
  },

  async updateNote(id: number, payload: UpdateNotePayload): Promise<Note> {
    const res = await api.put(`/notes/${id}`, payload);
    return res.data?.data;
  },

  async deleteNote(id: number): Promise<void> {
    await api.delete(`/notes/${id}`);
  },

  async linkNote(id: number, targetId: number): Promise<Note> {
    const res = await api.post(`/notes/${id}/link/${targetId}`);
    return res.data?.data;
  },

  async unlinkNote(id: number, targetId: number): Promise<Note> {
    const res = await api.delete(`/notes/${id}/link/${targetId}`);
    return res.data?.data;
  },

  // ==========================================
  // 3. Spaced Repetition Flashcards (SM-2)
  // ==========================================
  async getDecks(params?: { course_id?: number }): Promise<FlashcardDeck[]> {
    const res = await api.get('/flashcard-decks', { params });
    return res.data?.data || [];
  },

  async getDeck(id: number): Promise<FlashcardDeck> {
    const res = await api.get(`/flashcard-decks/${id}`);
    return res.data?.data;
  },

  async createDeck(payload: CreateDeckPayload): Promise<FlashcardDeck> {
    const res = await api.post('/flashcard-decks', payload);
    return res.data?.data;
  },

  async updateDeck(id: number, payload: UpdateDeckPayload): Promise<FlashcardDeck> {
    const res = await api.put(`/flashcard-decks/${id}`, payload);
    return res.data?.data;
  },

  async deleteDeck(id: number): Promise<void> {
    await api.delete(`/flashcard-decks/${id}`);
  },

  async getDueCards(deckId: number): Promise<Flashcard[]> {
    const res = await api.get(`/flashcard-decks/${deckId}/due-cards`);
    return res.data?.data || [];
  },

  async createCard(deckId: number, payload: CreateFlashcardPayload): Promise<Flashcard> {
    const res = await api.post(`/flashcard-decks/${deckId}/cards`, payload);
    return res.data?.data;
  },

  async updateCard(id: number, payload: UpdateFlashcardPayload): Promise<Flashcard> {
    const res = await api.put(`/flashcards/${id}`, payload);
    return res.data?.data;
  },

  async deleteCard(id: number): Promise<void> {
    await api.delete(`/flashcards/${id}`);
  },

  async reviewCard(id: number, payload: FlashcardReviewPayload): Promise<Flashcard> {
    const res = await api.post(`/flashcards/${id}/review`, payload);
    return res.data?.data;
  },

  // ==========================================
  // 4. Interactive Quizzes & Practice Tests
  // ==========================================
  async getQuizzes(params?: { course_id?: number }): Promise<Quiz[]> {
    const res = await api.get('/quizzes', { params });
    return res.data?.data || [];
  },

  async getQuiz(id: number): Promise<Quiz> {
    const res = await api.get(`/quizzes/${id}`);
    return res.data?.data;
  },

  async createQuiz(payload: CreateQuizPayload): Promise<Quiz> {
    const res = await api.post('/quizzes', payload);
    return res.data?.data;
  },

  async updateQuiz(id: number, payload: UpdateQuizPayload): Promise<Quiz> {
    const res = await api.put(`/quizzes/${id}`, payload);
    return res.data?.data;
  },

  async deleteQuiz(id: number): Promise<void> {
    await api.delete(`/quizzes/${id}`);
  },

  async createQuestion(quizId: number, payload: CreateQuizQuestionPayload): Promise<QuizQuestion> {
    const res = await api.post(`/quizzes/${quizId}/questions`, payload);
    return res.data?.data;
  },

  async deleteQuestion(id: number): Promise<void> {
    await api.delete(`/quiz-questions/${id}`);
  },

  async submitAttempt(quizId: number, payload: SubmitQuizAttemptPayload): Promise<QuizAttempt> {
    const res = await api.post(`/quizzes/${quizId}/attempt`, payload);
    return res.data?.data;
  },

  async getAttempts(quizId: number): Promise<QuizAttempt[]> {
    const res = await api.get(`/quizzes/${quizId}/attempts`);
    return res.data?.data || [];
  },

  async getAttempt(quizId: number, attemptId: number): Promise<QuizAttempt> {
    const res = await api.get(`/quizzes/${quizId}/attempts/${attemptId}`);
    return res.data?.data;
  },
};
