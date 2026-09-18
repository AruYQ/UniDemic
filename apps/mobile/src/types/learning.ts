import { Course } from './academic';

/**
 * Phase 5 — Learning Entities Types & Payloads
 */

export type MaterialType = 'pdf' | 'slide' | 'doc' | 'link' | 'video' | 'other';

export interface Material {
  id: number;
  course_id: number;
  title: string;
  type: MaterialType;
  file_path?: string | null;
  file_size?: number | null;
  url?: string | null;
  description?: string | null;
  course?: Course | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialPayload {
  course_id: number;
  title: string;
  type: MaterialType;
  url?: string | null;
  description?: string | null;
}

export interface UpdateMaterialPayload {
  title?: string;
  type?: MaterialType;
  url?: string | null;
  description?: string | null;
}

export interface Note {
  id: number;
  user_id: number;
  course_id?: number | null;
  title: string;
  content: string;
  tags?: string[];
  is_pinned: boolean;
  color?: string | null;
  course?: Course | null;
  linked_notes?: Note[];
  created_at: string;
  updated_at: string;
}

export interface CreateNotePayload {
  course_id?: number | null;
  title: string;
  content: string;
  tags?: string[];
  is_pinned?: boolean;
  color?: string | null;
  linked_note_ids?: number[];
}

export interface UpdateNotePayload {
  course_id?: number | null;
  title?: string;
  content?: string;
  tags?: string[];
  is_pinned?: boolean;
  color?: string | null;
  linked_note_ids?: number[];
}

export interface FlashcardDeck {
  id: number;
  user_id: number;
  course_id?: number | null;
  name: string;
  description?: string | null;
  cards_count?: number;
  due_cards_count?: number;
  course?: Course | null;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: number;
  deck_id: number;
  question: string;
  answer: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_at?: string | null;
  last_reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeckPayload {
  course_id?: number | null;
  name: string;
  description?: string | null;
}

export interface UpdateDeckPayload {
  course_id?: number | null;
  name?: string;
  description?: string | null;
}

export interface CreateFlashcardPayload {
  question: string;
  answer: string;
}

export interface UpdateFlashcardPayload {
  question?: string;
  answer?: string;
}

export interface FlashcardReviewPayload {
  rating: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
}

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  type: QuizQuestionType;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: number;
  user_id: number;
  course_id?: number | null;
  title: string;
  description?: string | null;
  time_limit_minutes?: number | null;
  questions_count?: number;
  questions?: QuizQuestion[];
  attempts_count?: number;
  highest_score?: number | null;
  course?: Course | null;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  answers: Record<string, any>;
  completed_at: string;
  created_at: string;
}

export interface CreateQuizPayload {
  course_id?: number | null;
  title: string;
  description?: string | null;
  time_limit_minutes?: number | null;
  questions?: {
    type: QuizQuestionType;
    question: string;
    options?: string[];
    correct_answer: string;
    explanation?: string | null;
    order?: number;
  }[];
}

export interface UpdateQuizPayload {
  course_id?: number | null;
  title?: string;
  description?: string | null;
  time_limit_minutes?: number | null;
}

export interface CreateQuizQuestionPayload {
  type: QuizQuestionType;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string | null;
  order?: number;
}

export interface QuizAnswerSubmission {
  question_id: number;
  user_answer: string;
}

export interface SubmitQuizAttemptPayload {
  answers: QuizAnswerSubmission[];
}
