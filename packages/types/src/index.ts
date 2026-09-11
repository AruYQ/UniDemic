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
