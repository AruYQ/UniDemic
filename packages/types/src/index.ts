/**
 * Core User entity definition across UniDemic apps
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  [key: string]: unknown;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  university?: string | null;
  major?: string | null;
  student_id?: string | null;
  phone?: string | null;
  preferences: UserPreferences;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserToken {
  id: number;
  name: string;
  last_used_at?: string | null;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  university?: string;
  major?: string;
  student_id?: string;
  phone?: string;
  device_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  university?: string | null;
  major?: string | null;
  student_id?: string | null;
  phone?: string | null;
  preferences?: Partial<UserPreferences>;
}

export interface UpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/**
 * Academic Entities
 */

export interface Semester {
  id: number;
  user_id: number;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  courses_count?: number;
  courses?: Course[];
  created_at: string;
  updated_at: string;
}

export interface CourseSchedule {
  id: number;
  course_id: number;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time: string; // HH:mm:ss or HH:mm
  end_time: string;   // HH:mm:ss or HH:mm
  room?: string | null;
  course?: Course;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority: 'low' | 'medium' | 'high';
  progress: number; // 0 - 100
  is_completed: boolean;
  course?: Course;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: number;
  course_id: number;
  type: string; // 'UTS' | 'UAS' | 'quiz' | string
  date: string;
  time?: string | null;
  location?: string | null;
  topics?: string | null;
  course?: Course;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  semester_id: number;
  name: string;
  code?: string | null;
  lecturer?: string | null;
  credits: number;
  classroom?: string | null;
  color?: string | null;
  schedules?: CourseSchedule[];
  assignments?: Assignment[];
  exams?: Exam[];
  schedules_count?: number;
  assignments_count?: number;
  exams_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Academic Tracking Entities (Attendance, Grades, GPA)
 */

export type AttendanceStatus = 'present' | 'absent' | 'permission' | 'sick';

export interface Attendance {
  id: number;
  course_id: number;
  date: string;
  status: AttendanceStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total_classes: number;
  present_count: number;
  absent_count: number;
  permission_count: number;
  attendance_percentage: number;
  minimum_percentage: number;
  warning: boolean;
  remaining_safe_absences: number;
}

export interface GradeComponent {
  id: number;
  course_id: number;
  name: string;
  weight: number; // e.g. 20 for 20%
  grades_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: number;
  course_id: number;
  grade_component_id?: number | null;
  name: string;
  score: number; // 0 - 100
  weight?: number | null;
  component?: GradeComponent | null;
  created_at: string;
  updated_at: string;
}

export interface CourseGpa {
  course_id: number;
  course_name: string;
  credits: number;
  final_score: number;
  letter_grade: string;
  grade_point: number;
}

export interface SemesterGpa {
  semester_id: number;
  semester_name: string;
  total_credits: number;
  gpa: number;
  courses: CourseGpa[];
}

export interface CumulativeGpa {
  total_credits: number;
  cumulative_gpa: number;
  semesters: {
    semester_id: number;
    name: string;
    credits: number;
    gpa: number;
  }[];
}

export interface GpaSimulationItem {
  course_id?: number;
  course_name?: string;
  credits: number;
  target_grade: string; // 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'E'
}

export interface GpaSimulationPayload {
  current_gpa?: number;
  current_credits?: number;
  simulations: GpaSimulationItem[];
}

export interface GpaSimulationResult {
  current_gpa: number;
  simulated_gpa: number;
  current_credits: number;
  additional_credits: number;
  total_credits: number;
  details: {
    course_name: string;
    credits: number;
    target_grade: string;
    grade_point: number;
  }[];
}

/**
 * Phase 4 — Productivity Entities
 */

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskSubtask {
  id: number;
  task_id: number;
  title: string;
  is_done: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductivityTask {
  id: number;
  user_id: number;
  course_id?: number | null;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  deadline?: string | null;
  label?: string | null;
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | null;
  progress: number;
  is_completed: boolean;
  completed_at?: string | null;
  subtasks_count?: number;
  subtasks?: TaskSubtask[];
  course?: Course | null;
  created_at: string;
  updated_at: string;
}

export type StudySessionType = 'pomodoro' | 'custom' | 'stopwatch';

export interface StudySession {
  id: number;
  user_id: number;
  course_id?: number | null;
  task_id?: number | null;
  type: StudySessionType;
  duration_minutes: number;
  started_at: string;
  ended_at?: string | null;
  notes?: string | null;
  is_completed: boolean;
  course?: Course | null;
  task?: ProductivityTask | null;
  created_at: string;
  updated_at: string;
}

export interface StudySessionSummary {
  today_minutes: number;
  week_minutes: number;
  total_sessions: number;
  by_course: {
    course_id: number | null;
    course_name: string;
    minutes: number;
  }[];
}

export type GoalType = 'weekly' | 'monthly' | 'semester' | 'custom';

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  type: GoalType;
  target_value: number;
  current_value: number;
  unit: string;
  start_date?: string | null;
  end_date?: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudyPlanItem {
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  course_id?: number | null;
  course_name?: string | null;
  task_id?: number | null;
  assignment_id?: number | null;
  duration_minutes: number;
  reason: string;
}

export interface StudyPlanSuggestion {
  start_date: string;
  end_date: string;
  total_study_hours: number;
  schedule: StudyPlanItem[];
}

export interface CreateTaskPayload {
  title: string;
  course_id?: number | null;
  description?: string | null;
  priority?: TaskPriority;
  deadline?: string | null;
  label?: string | null;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | null;
  subtasks?: { title: string; order?: number }[];
}

export interface UpdateTaskPayload {
  title?: string;
  course_id?: number | null;
  description?: string | null;
  priority?: TaskPriority;
  deadline?: string | null;
  label?: string | null;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | null;
  progress?: number;
  is_completed?: boolean;
}

export interface CreateSubtaskPayload {
  title: string;
  order?: number;
}

export interface UpdateSubtaskPayload {
  title?: string;
  is_done?: boolean;
  order?: number;
}

export interface CreateStudySessionPayload {
  course_id?: number | null;
  task_id?: number | null;
  type?: StudySessionType;
  duration_minutes: number;
  started_at: string;
  ended_at?: string | null;
  notes?: string | null;
}

export interface CreateGoalPayload {
  title: string;
  description?: string | null;
  type?: GoalType;
  target_value: number;
  current_value?: number;
  unit?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface UpdateGoalPayload {
  title?: string;
  description?: string | null;
  type?: GoalType;
  target_value?: number;
  current_value?: number;
  unit?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_completed?: boolean;
}

export interface StudyPlannerRequest {
  start_date?: string;
  days_ahead?: number;
  max_hours_per_day?: number;
}

/**
 * Phase 5 — Learning Entities
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

export interface SubmitQuizAttemptPayload {
  answers: Record<string, any>; // question_id -> user answer
}

/**
 * Phase 6 — Communication Entities
 */

export type ConversationType = 'direct' | 'group' | 'course';
export type ParticipantRole = 'admin' | 'member';
export type MessageType = 'text' | 'image' | 'file' | 'academic_ref' | 'system';
export type AcademicReferenceType = 'course' | 'assignment' | 'exam' | 'material' | 'note' | 'task' | 'quiz';

export interface ConversationParticipant {
  id: number;
  conversation_id: number;
  user_id: number;
  role: ParticipantRole;
  joined_at: string;
  last_read_at?: string | null;
  user?: User;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  created_at: string;
}

export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  user?: User;
  created_at: string;
}

export interface AcademicReference {
  type: AcademicReferenceType;
  id: number;
  title?: string;
  subtitle?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  user_id: number;
  content: string;
  type: MessageType;
  reply_to_id?: number | null;
  reply_to?: Message | null;
  reference_type?: AcademicReferenceType | null;
  reference_id?: number | null;
  reference_data?: any;
  user?: User;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  is_read?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  name?: string | null;
  description?: string | null;
  course_id?: number | null;
  avatar_url?: string | null;
  created_by: number;
  course?: Course | null;
  participants?: ConversationParticipant[];
  last_message?: Message | null;
  last_message_at?: string | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationPayload {
  type: ConversationType;
  participant_ids: number[];
  name?: string | null;
  description?: string | null;
  course_id?: number | null;
}

export interface UpdateConversationPayload {
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
}

export interface SendMessagePayload {
  content: string;
  type?: MessageType;
  reply_to_id?: number | null;
  reference_type?: AcademicReferenceType | null;
  reference_id?: number | null;
}

export interface UpdateMessagePayload {
  content: string;
}

export interface ToggleReactionPayload {
  emoji: string;
}

export interface AddParticipantPayload {
  user_ids: number[];
  role?: ParticipantRole;
}

export interface CreateCourseChannelPayload {
  name: string;
  description?: string | null;
}



