import { create } from 'zustand';
import {
  Attendance,
  AttendanceSummary,
  CreateAttendancePayload,
  UpdateAttendancePayload,
  GradeComponent,
  CreateGradeComponentPayload,
  UpdateGradeComponentPayload,
  Grade,
  CreateGradePayload,
  UpdateGradePayload,
  CourseGpa,
  SemesterGpa,
  CumulativeGpa,
  GpaSimulationPayload,
  GpaSimulationResult,
} from '../types/tracking';
import { trackingService } from '../services/trackingService';

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 Menit TTL

interface TrackingState {
  // Course-specific tracking data
  attendances: Record<number, Attendance[]>;
  attendanceSummaries: Record<number, AttendanceSummary>;
  gradeComponents: Record<number, GradeComponent[]>;
  grades: Record<number, Grade[]>;
  courseGpas: Record<number, CourseGpa>;

  // Global / Academic GPA
  semesterGpa: SemesterGpa | null;
  cumulativeGpa: CumulativeGpa | null;
  simulationResult: GpaSimulationResult | null;

  // Loading flags
  isAttendanceLoading: Record<number, boolean>;
  isGradesLoading: Record<number, boolean>;
  isGpaLoading: boolean;
  isSimulating: boolean;
  error: string | null;

  // Cache timestamps: "att_<courseId>", "grd_<courseId>", "gpa_global"
  lastFetched: Record<string, number>;

  // Actions — Attendance
  fetchCourseAttendance: (courseId: number, forceRefresh?: boolean) => Promise<void>;
  createAttendance: (courseId: number, payload: CreateAttendancePayload) => Promise<Attendance>;
  updateAttendance: (courseId: number, id: number, payload: UpdateAttendancePayload) => Promise<Attendance>;
  deleteAttendance: (courseId: number, id: number) => Promise<void>;

  // Actions — Grade Components
  fetchGradeComponents: (courseId: number, forceRefresh?: boolean) => Promise<GradeComponent[]>;
  createGradeComponent: (courseId: number, payload: CreateGradeComponentPayload) => Promise<GradeComponent>;
  updateGradeComponent: (courseId: number, id: number, payload: UpdateGradeComponentPayload) => Promise<GradeComponent>;
  deleteGradeComponent: (courseId: number, id: number) => Promise<void>;

  // Actions — Grades & Course GPA
  fetchCourseGrades: (courseId: number, forceRefresh?: boolean) => Promise<void>;
  createGrade: (courseId: number, payload: CreateGradePayload) => Promise<Grade>;
  updateGrade: (courseId: number, id: number, payload: UpdateGradePayload) => Promise<Grade>;
  deleteGrade: (courseId: number, id: number) => Promise<void>;

  // Actions — GPA & Simulation
  fetchGpaData: (semesterId?: number, forceRefresh?: boolean) => Promise<void>;
  simulateGpa: (payload: GpaSimulationPayload) => Promise<GpaSimulationResult>;
  resetSimulation: () => void;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  attendances: {},
  attendanceSummaries: {},
  gradeComponents: {},
  grades: {},
  courseGpas: {},

  semesterGpa: null,
  cumulativeGpa: null,
  simulationResult: null,

  isAttendanceLoading: {},
  isGradesLoading: {},
  isGpaLoading: false,
  isSimulating: false,
  error: null,

  lastFetched: {},

  // === Attendance ===
  fetchCourseAttendance: async (courseId: number, forceRefresh = false) => {
    const key = `att_${courseId}`;
    const now = Date.now();
    const lastTime = get().lastFetched[key] || 0;

    if (!forceRefresh && now - lastTime < CACHE_TTL_MS && get().attendances[courseId]) {
      return;
    }

    set((state) => ({
      isAttendanceLoading: { ...state.isAttendanceLoading, [courseId]: true },
      error: null,
    }));

    try {
      const [list, summary] = await Promise.all([
        trackingService.getCourseAttendances(courseId),
        trackingService.getAttendanceSummary(courseId),
      ]);

      set((state) => ({
        attendances: { ...state.attendances, [courseId]: list },
        attendanceSummaries: { ...state.attendanceSummaries, [courseId]: summary },
        lastFetched: { ...state.lastFetched, [key]: now },
        isAttendanceLoading: { ...state.isAttendanceLoading, [courseId]: false },
      }));
    } catch (err: any) {
      set((state) => ({
        error: err.message || 'Gagal memuat data presensi',
        isAttendanceLoading: { ...state.isAttendanceLoading, [courseId]: false },
      }));
    }
  },

  createAttendance: async (courseId: number, payload: CreateAttendancePayload) => {
    const newAtt = await trackingService.createAttendance(courseId, payload);
    // Refresh list and summary
    const [list, summary] = await Promise.all([
      trackingService.getCourseAttendances(courseId),
      trackingService.getAttendanceSummary(courseId),
    ]);

    set((state) => ({
      attendances: { ...state.attendances, [courseId]: list },
      attendanceSummaries: { ...state.attendanceSummaries, [courseId]: summary },
      lastFetched: { ...state.lastFetched, [`att_${courseId}`]: Date.now() },
    }));

    return newAtt;
  },

  updateAttendance: async (courseId: number, id: number, payload: UpdateAttendancePayload) => {
    const updated = await trackingService.updateAttendance(id, payload);
    const [list, summary] = await Promise.all([
      trackingService.getCourseAttendances(courseId),
      trackingService.getAttendanceSummary(courseId),
    ]);

    set((state) => ({
      attendances: { ...state.attendances, [courseId]: list },
      attendanceSummaries: { ...state.attendanceSummaries, [courseId]: summary },
      lastFetched: { ...state.lastFetched, [`att_${courseId}`]: Date.now() },
    }));

    return updated;
  },

  deleteAttendance: async (courseId: number, id: number) => {
    await trackingService.deleteAttendance(id);
    const [list, summary] = await Promise.all([
      trackingService.getCourseAttendances(courseId),
      trackingService.getAttendanceSummary(courseId),
    ]);

    set((state) => ({
      attendances: { ...state.attendances, [courseId]: list },
      attendanceSummaries: { ...state.attendanceSummaries, [courseId]: summary },
      lastFetched: { ...state.lastFetched, [`att_${courseId}`]: Date.now() },
    }));
  },

  // === Grade Components ===
  fetchGradeComponents: async (courseId: number, forceRefresh = false) => {
    const components = await trackingService.getGradeComponents(courseId);
    set((state) => ({
      gradeComponents: { ...state.gradeComponents, [courseId]: components },
    }));
    return components;
  },

  createGradeComponent: async (courseId: number, payload: CreateGradeComponentPayload) => {
    const newComp = await trackingService.createGradeComponent(courseId, payload);
    const components = await trackingService.getGradeComponents(courseId);
    set((state) => ({
      gradeComponents: { ...state.gradeComponents, [courseId]: components },
    }));
    return newComp;
  },

  updateGradeComponent: async (courseId: number, id: number, payload: UpdateGradeComponentPayload) => {
    const updated = await trackingService.updateGradeComponent(id, payload);
    const components = await trackingService.getGradeComponents(courseId);
    set((state) => ({
      gradeComponents: { ...state.gradeComponents, [courseId]: components },
    }));
    return updated;
  },

  deleteGradeComponent: async (courseId: number, id: number) => {
    await trackingService.deleteGradeComponent(id);
    const components = await trackingService.getGradeComponents(courseId);
    set((state) => ({
      gradeComponents: { ...state.gradeComponents, [courseId]: components },
    }));
  },

  // === Grades & Course GPA ===
  fetchCourseGrades: async (courseId: number, forceRefresh = false) => {
    const key = `grd_${courseId}`;
    const now = Date.now();
    const lastTime = get().lastFetched[key] || 0;

    if (!forceRefresh && now - lastTime < CACHE_TTL_MS && get().grades[courseId]) {
      return;
    }

    set((state) => ({
      isGradesLoading: { ...state.isGradesLoading, [courseId]: true },
      error: null,
    }));

    try {
      const [components, grades, courseGpa] = await Promise.all([
        trackingService.getGradeComponents(courseId),
        trackingService.getCourseGrades(courseId),
        trackingService.getCourseGpa(courseId).catch(() => null),
      ]);

      set((state) => ({
        gradeComponents: { ...state.gradeComponents, [courseId]: components },
        grades: { ...state.grades, [courseId]: grades },
        courseGpas: courseGpa ? { ...state.courseGpas, [courseId]: courseGpa } : state.courseGpas,
        lastFetched: { ...state.lastFetched, [key]: now },
        isGradesLoading: { ...state.isGradesLoading, [courseId]: false },
      }));
    } catch (err: any) {
      set((state) => ({
        error: err.message || 'Gagal memuat data nilai',
        isGradesLoading: { ...state.isGradesLoading, [courseId]: false },
      }));
    }
  },

  createGrade: async (courseId: number, payload: CreateGradePayload) => {
    const newGrade = await trackingService.createGrade(courseId, payload);
    const [grades, courseGpa] = await Promise.all([
      trackingService.getCourseGrades(courseId),
      trackingService.getCourseGpa(courseId).catch(() => null),
    ]);

    set((state) => ({
      grades: { ...state.grades, [courseId]: grades },
      courseGpas: courseGpa ? { ...state.courseGpas, [courseId]: courseGpa } : state.courseGpas,
      lastFetched: { ...state.lastFetched, [`grd_${courseId}`]: Date.now() },
    }));

    return newGrade;
  },

  updateGrade: async (courseId: number, id: number, payload: UpdateGradePayload) => {
    const updated = await trackingService.updateGrade(id, payload);
    const [grades, courseGpa] = await Promise.all([
      trackingService.getCourseGrades(courseId),
      trackingService.getCourseGpa(courseId).catch(() => null),
    ]);

    set((state) => ({
      grades: { ...state.grades, [courseId]: grades },
      courseGpas: courseGpa ? { ...state.courseGpas, [courseId]: courseGpa } : state.courseGpas,
      lastFetched: { ...state.lastFetched, [`grd_${courseId}`]: Date.now() },
    }));

    return updated;
  },

  deleteGrade: async (courseId: number, id: number) => {
    await trackingService.deleteGrade(id);
    const [grades, courseGpa] = await Promise.all([
      trackingService.getCourseGrades(courseId),
      trackingService.getCourseGpa(courseId).catch(() => null),
    ]);

    set((state) => ({
      grades: { ...state.grades, [courseId]: grades },
      courseGpas: courseGpa ? { ...state.courseGpas, [courseId]: courseGpa } : state.courseGpas,
      lastFetched: { ...state.lastFetched, [`grd_${courseId}`]: Date.now() },
    }));
  },

  // === GPA & Simulation ===
  fetchGpaData: async (semesterId?: number, forceRefresh = false) => {
    const now = Date.now();
    const lastTime = get().lastFetched['gpa_global'] || 0;

    if (!forceRefresh && now - lastTime < CACHE_TTL_MS && get().cumulativeGpa) {
      return;
    }

    set({ isGpaLoading: true, error: null });

    try {
      const cumulative = await trackingService.getCumulativeGpa();
      let semGpa: SemesterGpa | null = null;
      if (semesterId) {
        semGpa = await trackingService.getSemesterGpa(semesterId).catch(() => null);
      }

      set({
        cumulativeGpa: cumulative,
        semesterGpa: semGpa,
        lastFetched: { ...get().lastFetched, gpa_global: now },
        isGpaLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Gagal memuat data IPK',
        isGpaLoading: false,
      });
    }
  },

  simulateGpa: async (payload: GpaSimulationPayload) => {
    set({ isSimulating: true, error: null });
    try {
      const result = await trackingService.simulateGpa(payload);
      set({ simulationResult: result, isSimulating: false });
      return result;
    } catch (err: any) {
      set({
        error: err.message || 'Gagal menjalankan simulasi IPK',
        isSimulating: false,
      });
      throw err;
    }
  },

  resetSimulation: () => {
    set({ simulationResult: null });
  },
}));
