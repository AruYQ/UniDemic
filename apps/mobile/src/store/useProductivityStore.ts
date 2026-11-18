import { create } from 'zustand';
import {
  ProductivityTask,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskSubtask,
  CreateSubtaskPayload,
  UpdateSubtaskPayload,
  StudySession,
  CreateStudySessionPayload,
  StudySessionSummary,
  Goal,
  CreateGoalPayload,
  UpdateGoalPayload,
  StudyPlanSuggestion,
  StudyPlannerRequest,
  StudySessionType,
} from '../types/productivity';
import { productivityService } from '../services/productivityService';
import { formatApiError } from '../lib/api';


const CACHE_TTL_MS = 3 * 60 * 1000; // 3 Menit TTL

export type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'custom' | 'stopwatch';

interface ProductivityState {
  // Data State
  tasks: ProductivityTask[];
  studySessions: StudySession[];
  sessionSummary: StudySessionSummary | null;
  goals: Goal[];
  plannerSuggestion: StudyPlanSuggestion | null;

  // Loading flags
  isTasksLoading: boolean;
  isSessionsLoading: boolean;
  isGoalsLoading: boolean;
  isPlannerLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Cache timestamps
  lastFetched: Record<string, number>;

  // Focus Timer / Pomodoro Local Engine State
  timerMode: TimerMode;
  timerSeconds: number;
  timerInitialSeconds: number;
  isTimerRunning: boolean;
  activeCourseId: number | null;
  activeTaskId: number | null;
  completedPomodoros: number;

  // Actions — Tasks & Subtasks
  fetchTasks: (
    params?: { course_id?: number; priority?: string; label?: string; is_completed?: boolean },
    forceRefresh?: boolean
  ) => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<ProductivityTask>;
  updateTask: (id: number, payload: UpdateTaskPayload) => Promise<ProductivityTask>;
  deleteTask: (id: number) => Promise<void>;
  toggleTaskComplete: (id: number) => Promise<void>;
  createSubtask: (taskId: number, payload: CreateSubtaskPayload) => Promise<TaskSubtask>;
  updateSubtask: (taskId: number, subtaskId: number, payload: UpdateSubtaskPayload) => Promise<TaskSubtask>;
  deleteSubtask: (taskId: number, subtaskId: number) => Promise<void>;

  // Actions — Study Sessions
  fetchStudySessions: (forceRefresh?: boolean) => Promise<void>;
  createStudySession: (payload: CreateStudySessionPayload) => Promise<StudySession>;
  deleteStudySession: (id: number) => Promise<void>;

  // Actions — Goals
  fetchGoals: (forceRefresh?: boolean) => Promise<void>;
  createGoal: (payload: CreateGoalPayload) => Promise<Goal>;
  updateGoal: (id: number, payload: UpdateGoalPayload) => Promise<Goal>;
  updateGoalProgress: (id: number, current_value: number) => Promise<Goal>;
  deleteGoal: (id: number) => Promise<void>;

  // Actions — Smart Study Planner
  fetchStudyPlanSuggestions: (payload?: StudyPlannerRequest, forceRefresh?: boolean) => Promise<void>;

  // Actions — Focus Timer Engine
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  setTimerMode: (mode: TimerMode, customMinutes?: number) => void;
  setActiveCourse: (courseId: number | null) => void;
  setActiveTask: (taskId: number | null) => void;
}

const DEFAULT_POMODORO_SECONDS = 25 * 60;
const DEFAULT_SHORT_BREAK_SECONDS = 5 * 60;
const DEFAULT_LONG_BREAK_SECONDS = 15 * 60;

export const useProductivityStore = create<ProductivityState>((set, get) => ({
  tasks: [],
  studySessions: [],
  sessionSummary: null,
  goals: [],
  plannerSuggestion: null,

  isTasksLoading: false,
  isSessionsLoading: false,
  isGoalsLoading: false,
  isPlannerLoading: false,
  isRefreshing: false,
  error: null,
  lastFetched: {},

  // Timer defaults
  timerMode: 'pomodoro',
  timerSeconds: DEFAULT_POMODORO_SECONDS,
  timerInitialSeconds: DEFAULT_POMODORO_SECONDS,
  isTimerRunning: false,
  activeCourseId: null,
  activeTaskId: null,
  completedPomodoros: 0,

  // === Tasks & Subtasks ===
  fetchTasks: async (params, forceRefresh = false) => {
    const cacheKey = `tasks_${JSON.stringify(params || {})}`;
    const now = Date.now();
    const last = get().lastFetched[cacheKey] || 0;

    if (!forceRefresh && now - last < CACHE_TTL_MS && get().tasks.length > 0) {
      return;
    }

    set({ isTasksLoading: true, error: null });
    try {
      const data = await productivityService.getTasks(params);
      set({
        tasks: data,
        isTasksLoading: false,
        lastFetched: { ...get().lastFetched, [cacheKey]: now },
      });
    } catch (err: any) {
      set({
        isTasksLoading: false,
        error: formatApiError(err, 'Gagal memuat tugas produktivitas.'),
      });
    }
  },

  createTask: async (payload) => {
    set({ error: null });
    try {
      const created = await productivityService.createTask(payload);
      set((state) => ({
        tasks: [created, ...state.tasks],
      }));
      return created;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal menambahkan tugas.') });
      throw err;
    }
  },

  updateTask: async (id, payload) => {
    set({ error: null });
    try {
      const updated = await productivityService.updateTask(id, payload);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal memperbarui tugas.') });
      throw err;
    }
  },

  deleteTask: async (id) => {
    // Optimistic delete
    const previous = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));

    try {
      await productivityService.deleteTask(id);
    } catch (err: any) {
      // Revert if error
      set({
        tasks: previous,
        error: formatApiError(err, 'Gagal menghapus tugas.'),
      });
      throw err;
    }
  },

  toggleTaskComplete: async (id) => {
    // Optimistic toggle
    const previous = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.is_completed;
          return {
            ...t,
            is_completed: nextCompleted,
            progress: nextCompleted ? 100 : t.subtasks && t.subtasks.length > 0 ? 0 : t.progress,
            subtasks: t.subtasks
              ? t.subtasks.map((s) => ({ ...s, is_done: nextCompleted }))
              : t.subtasks,
          };
        }
        return t;
      }),
    }));

    try {
      const updated = await productivityService.toggleTaskComplete(id);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err: any) {
      set({
        tasks: previous,
        error: formatApiError(err, 'Gagal mengubah status tugas.'),
      });
      throw err;
    }
  },

  createSubtask: async (taskId, payload) => {
    try {
      const subtask = await productivityService.createSubtask(taskId, payload);
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === taskId) {
            const nextSubtasks = [...(t.subtasks || []), subtask];
            const doneCount = nextSubtasks.filter((s) => s.is_done).length;
            const progress = Math.round((doneCount / nextSubtasks.length) * 100);
            return {
              ...t,
              subtasks: nextSubtasks,
              subtasks_count: nextSubtasks.length,
              progress,
              is_completed: progress === 100,
            };
          }
          return t;
        }),
      }));
      return subtask;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal menambahkan subtask.') });
      throw err;
    }
  },

  updateSubtask: async (taskId, subtaskId, payload) => {
    // Optimistic update
    const previous = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id === taskId && t.subtasks) {
          const nextSubtasks = t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, ...payload } : s
          );
          const doneCount = nextSubtasks.filter((s) => s.is_done).length;
          const progress = nextSubtasks.length > 0 ? Math.round((doneCount / nextSubtasks.length) * 100) : 0;
          return {
            ...t,
            subtasks: nextSubtasks,
            progress,
            is_completed: progress === 100,
          };
        }
        return t;
      }),
    }));

    try {
      const updated = await productivityService.updateSubtask(subtaskId, payload);
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === taskId && t.subtasks) {
            const nextSubtasks = t.subtasks.map((s) => (s.id === subtaskId ? updated : s));
            const doneCount = nextSubtasks.filter((s) => s.is_done).length;
            const progress = nextSubtasks.length > 0 ? Math.round((doneCount / nextSubtasks.length) * 100) : 0;
            return {
              ...t,
              subtasks: nextSubtasks,
              progress,
              is_completed: progress === 100,
            };
          }
          return t;
        }),
      }));
      return updated;
    } catch (err: any) {
      set({
        tasks: previous,
        error: formatApiError(err, 'Gagal memperbarui subtask.'),
      });
      throw err;
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    const previous = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id === taskId && t.subtasks) {
          const nextSubtasks = t.subtasks.filter((s) => s.id !== subtaskId);
          const doneCount = nextSubtasks.filter((s) => s.is_done).length;
          const progress = nextSubtasks.length > 0 ? Math.round((doneCount / nextSubtasks.length) * 100) : 0;
          return {
            ...t,
            subtasks: nextSubtasks,
            subtasks_count: nextSubtasks.length,
            progress,
            is_completed: progress === 100,
          };
        }
        return t;
      }),
    }));

    try {
      await productivityService.deleteSubtask(subtaskId);
    } catch (err: any) {
      set({
        tasks: previous,
        error: formatApiError(err, 'Gagal menghapus subtask.'),
      });
      throw err;
    }
  },

  // === Study Sessions ===
  fetchStudySessions: async (forceRefresh = false) => {
    const now = Date.now();
    const last = get().lastFetched['study_sessions'] || 0;

    if (!forceRefresh && now - last < CACHE_TTL_MS && get().studySessions.length > 0) {
      return;
    }

    set({ isSessionsLoading: true, error: null });
    try {
      const [sessions, summary] = await Promise.all([
        productivityService.getStudySessions(),
        productivityService.getStudySessionSummary(),
      ]);
      set({
        studySessions: sessions,
        sessionSummary: summary,
        isSessionsLoading: false,
        lastFetched: { ...get().lastFetched, study_sessions: now },
      });
    } catch (err: any) {
      set({
        isSessionsLoading: false,
        error: formatApiError(err, 'Gagal memuat sesi belajar.'),
      });
    }
  },

  createStudySession: async (payload) => {
    set({ error: null });
    try {
      const session = await productivityService.createStudySession(payload);
      set((state) => ({
        studySessions: [session, ...state.studySessions],
      }));
      // Invalidate summary
      get().fetchStudySessions(true).catch(() => {});
      return session;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal menyimpan sesi belajar.') });
      throw err;
    }
  },

  deleteStudySession: async (id) => {
    const previous = get().studySessions;
    set((state) => ({
      studySessions: state.studySessions.filter((s) => s.id !== id),
    }));

    try {
      await productivityService.deleteStudySession(id);
      get().fetchStudySessions(true).catch(() => {});
    } catch (err: any) {
      set({
        studySessions: previous,
        error: formatApiError(err, 'Gagal menghapus sesi belajar.'),
      });
      throw err;
    }
  },

  // === Goals ===
  fetchGoals: async (forceRefresh = false) => {
    const now = Date.now();
    const last = get().lastFetched['goals'] || 0;

    if (!forceRefresh && now - last < CACHE_TTL_MS && get().goals.length > 0) {
      return;
    }

    set({ isGoalsLoading: true, error: null });
    try {
      const goals = await productivityService.getGoals();
      set({
        goals,
        isGoalsLoading: false,
        lastFetched: { ...get().lastFetched, goals: now },
      });
    } catch (err: any) {
      set({
        isGoalsLoading: false,
        error: formatApiError(err, 'Gagal memuat target belajar.'),
      });
    }
  },

  createGoal: async (payload) => {
    set({ error: null });
    try {
      const goal = await productivityService.createGoal(payload);
      set((state) => ({
        goals: [goal, ...state.goals],
      }));
      return goal;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal membuat target.') });
      throw err;
    }
  },

  updateGoal: async (id, payload) => {
    set({ error: null });
    try {
      const updated = await productivityService.updateGoal(id, payload);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal memperbarui target.') });
      throw err;
    }
  },

  updateGoalProgress: async (id, current_value) => {
    try {
      const updated = await productivityService.updateGoalProgress(id, current_value);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updated : g)),
      }));
      return updated;
    } catch (err: any) {
      set({ error: formatApiError(err, 'Gagal memperbarui progres target.') });
      throw err;
    }
  },

  deleteGoal: async (id) => {
    const previous = get().goals;
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));

    try {
      await productivityService.deleteGoal(id);
    } catch (err: any) {
      set({
        goals: previous,
        error: formatApiError(err, 'Gagal menghapus target.'),
      });
      throw err;
    }
  },

  // === Smart Study Planner ===
  fetchStudyPlanSuggestions: async (payload, forceRefresh = false) => {
    const cacheKey = `planner_${JSON.stringify(payload || {})}`;
    const now = Date.now();
    const last = get().lastFetched[cacheKey] || 0;

    if (!forceRefresh && now - last < CACHE_TTL_MS && get().plannerSuggestion) {
      return;
    }

    set({ isPlannerLoading: true, error: null });
    try {
      const suggestion = await productivityService.getStudyPlanSuggestions(payload);
      set({
        plannerSuggestion: suggestion,
        isPlannerLoading: false,
        lastFetched: { ...get().lastFetched, [cacheKey]: now },
      });
    } catch (err: any) {
      set({
        isPlannerLoading: false,
        error: formatApiError(err, 'Gagal memuat jadwal belajar cerdas.'),
      });
    }
  },

  // === Focus Timer Engine Actions ===
  startTimer: () => {
    set({ isTimerRunning: true });
  },

  pauseTimer: () => {
    set({ isTimerRunning: false });
  },

  resetTimer: () => {
    set((state) => ({
      isTimerRunning: false,
      timerSeconds: state.timerInitialSeconds,
    }));
  },

  tickTimer: () => {
    const { timerMode, timerSeconds, isTimerRunning } = get();
    if (!isTimerRunning) return;

    if (timerMode === 'stopwatch') {
      set({ timerSeconds: timerSeconds + 1 });
    } else {
      if (timerSeconds > 0) {
        set({ timerSeconds: timerSeconds - 1 });
      } else {
        // Timer completed!
        set({ isTimerRunning: false });
        if (timerMode === 'pomodoro') {
          set((state) => ({ completedPomodoros: state.completedPomodoros + 1 }));
        }
      }
    }
  },

  setTimerMode: (mode, customMinutes) => {
    let initialSecs = DEFAULT_POMODORO_SECONDS;
    if (mode === 'pomodoro') initialSecs = DEFAULT_POMODORO_SECONDS;
    else if (mode === 'short_break') initialSecs = DEFAULT_SHORT_BREAK_SECONDS;
    else if (mode === 'long_break') initialSecs = DEFAULT_LONG_BREAK_SECONDS;
    else if (mode === 'custom') initialSecs = (customMinutes || 30) * 60;
    else if (mode === 'stopwatch') initialSecs = 0;

    set({
      timerMode: mode,
      timerInitialSeconds: initialSecs,
      timerSeconds: initialSecs,
      isTimerRunning: false,
    });
  },

  setActiveCourse: (courseId) => set({ activeCourseId: courseId }),
  setActiveTask: (taskId) => set({ activeTaskId: taskId }),
}));
