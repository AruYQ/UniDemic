export type AttendanceStatus = 'present' | 'absent' | 'permission' | 'sick';

export interface Attendance {
  id: number;
  course_id: number;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface Grade {
  id: number;
  course_id: number;
  grade_component_id?: number | null;
  name: string;
  score: number; // 0 - 100
  weight?: number | null;
  component?: GradeComponent | null;
  created_at?: string;
  updated_at?: string;
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
}

// Payloads
export interface CreateAttendancePayload {
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendancePayload {
  date?: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface CreateGradeComponentPayload {
  name: string;
  weight: number;
}

export interface UpdateGradeComponentPayload {
  name?: string;
  weight?: number;
}

export interface CreateGradePayload {
  grade_component_id?: number | null;
  name: string;
  score: number;
  weight?: number | null;
}

export interface UpdateGradePayload {
  grade_component_id?: number | null;
  name?: string;
  score?: number;
  weight?: number | null;
}
