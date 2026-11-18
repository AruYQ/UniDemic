import { Course } from './academic';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskSubtask {
  id: number;
  task_id: number;
  title: string;
  is_done: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
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
