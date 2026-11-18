export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Semester {
  id: number;
  user_id: number;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  courses_count?: number;
  courses?: Course[];
  created_at?: string;
  updated_at?: string;
}

export interface CourseSchedule {
  id: number;
  course_id: number;
  day: DayOfWeek;
  start_time: string; // e.g. "08:00"
  end_time: string;   // e.g. "09:40"
  room?: string | null;
  course?: Course;
  created_at?: string;
  updated_at?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface Exam {
  id: number;
  course_id: number;
  type: string; // UTS, UAS, Quiz, Praktikum
  date: string; // YYYY-MM-DD
  time?: string | null; // HH:mm
  location?: string | null;
  topics?: string | null;
  course?: Course;
  created_at?: string;
  updated_at?: string;
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
  created_at?: string;
  updated_at?: string;
}

// Payload DTOs
export interface CreateSemesterPayload {
  name: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface CreateCoursePayload {
  semester_id: number;
  name: string;
  code?: string;
  lecturer?: string;
  credits: number;
  classroom?: string;
  color?: string;
}

export interface CreateSchedulePayload {
  day: DayOfWeek;
  start_time: string;
  end_time: string;
  room?: string;
}

export interface CreateAssignmentPayload {
  title: string;
  description?: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  progress?: number;
}

export interface CreateExamPayload {
  type: string;
  date: string;
  time?: string;
  location?: string;
  topics?: string;
}
