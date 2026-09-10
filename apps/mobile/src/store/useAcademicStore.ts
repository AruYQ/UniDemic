import { create } from 'zustand';
import {
  Semester,
  Course,
  CourseSchedule,
  Assignment,
  Exam,
  CreateSemesterPayload,
  CreateCoursePayload,
  CreateSchedulePayload,
  CreateAssignmentPayload,
  CreateExamPayload,
} from '../types/academic';
import { academicService } from '../services/academicService';

// Smart Cache TTL: 3 Menit (180.000 ms)
const CACHE_TTL_MS = 3 * 60 * 1000;

interface CacheTimestamps {
  dashboard: number;
  schedules: number;
  courses: number;
  tasks: number;
}

interface AcademicState {
  semesters: Semester[];
  activeSemester: Semester | null;
  courses: Course[];
  schedules: CourseSchedule[];
  assignments: Assignment[];
  exams: Exam[];

  // Loading states per domain (Mencegah blocking seluruh UI)
  isDashboardLoading: boolean;
  isSchedulesLoading: boolean;
  isCoursesLoading: boolean;
  isTasksLoading: boolean;
  isCourseDetailLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  lastFetched: CacheTimestamps;
  courseDetails: Record<number, { data: Course; timestamp: number }>;

  // On-demand fetching methods (hanya dipanggil saat tab terkait dibuka)
  fetchDashboard: (forceRefresh?: boolean) => Promise<void>;
  fetchSchedules: (forceRefresh?: boolean) => Promise<void>;
  fetchCoursesAndSemesters: (forceRefresh?: boolean) => Promise<void>;
  fetchTasksAndExams: (forceRefresh?: boolean) => Promise<void>;
  fetchCourseDetail: (courseId: number, forceRefresh?: boolean) => Promise<Course | null>;

  // Mutations
  createSemester: (payload: CreateSemesterPayload) => Promise<Semester>;
  activateSemester: (id: number) => Promise<void>;
  deleteSemester: (id: number) => Promise<void>;

  createCourse: (payload: CreateCoursePayload) => Promise<Course>;
  deleteCourse: (id: number) => Promise<void>;

  createSchedule: (courseId: number, payload: CreateSchedulePayload) => Promise<CourseSchedule>;
  deleteSchedule: (id: number) => Promise<void>;

  createAssignment: (courseId: number, payload: CreateAssignmentPayload) => Promise<Assignment>;
  updateAssignmentProgress: (id: number, progress: number) => Promise<void>;
  deleteAssignment: (id: number) => Promise<void>;

  createExam: (courseId: number, payload: CreateExamPayload) => Promise<Exam>;
  deleteExam: (id: number) => Promise<void>;
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  semesters: [],
  activeSemester: null,
  courses: [],
  schedules: [],
  assignments: [],
  exams: [],

  isDashboardLoading: false,
  isSchedulesLoading: false,
  isCoursesLoading: false,
  isTasksLoading: false,
  isCourseDetailLoading: false,
  isRefreshing: false,
  error: null,

  lastFetched: {
    dashboard: 0,
    schedules: 0,
    courses: 0,
    tasks: 0,
  },
  courseDetails: {},

  // 1. Fetch Beranda (Hanya ambil Active Semester & Tugas Belum Selesai)
  fetchDashboard: async (forceRefresh = false) => {
    const now = Date.now();
    const isCacheValid = now - get().lastFetched.dashboard < CACHE_TTL_MS;

    if (!forceRefresh && isCacheValid && get().activeSemester) {
      return; // Gunakan cache lokal, jangan hit server!
    }

    if (forceRefresh) set({ isRefreshing: true });
    else set({ isDashboardLoading: true });

    try {
      const [activeSemRes, assignRes] = await Promise.allSettled([
        academicService.getActiveSemester(),
        academicService.getAssignments(undefined, false),
      ]);

      const active = activeSemRes.status === 'fulfilled' ? activeSemRes.value : null;
      const pendingAssign = assignRes.status === 'fulfilled' ? assignRes.value : [];

      // Extract courses and schedules from active semester if present
      const embeddedCourses = active?.courses || [];
      const embeddedSchedules: CourseSchedule[] = [];
      embeddedCourses.forEach((c) => {
        if (c.schedules) {
          c.schedules.forEach((s) => {
            embeddedSchedules.push({ ...s, course: c });
          });
        }
      });

      set((state) => ({
        activeSemester: active,
        courses: embeddedCourses.length > 0 ? embeddedCourses : state.courses,
        schedules: embeddedSchedules.length > 0 ? embeddedSchedules : state.schedules,
        assignments: pendingAssign,
        lastFetched: { ...state.lastFetched, dashboard: now },
        error: null,
      }));
    } catch (err: any) {
      set({ error: err?.message || 'Gagal memuat dashboard' });
    } finally {
      set({ isDashboardLoading: false, isRefreshing: false });
    }
  },

  // 2. Fetch Jadwal (Hanya dipanggil saat tab Jadwal dibuka)
  fetchSchedules: async (forceRefresh = false) => {
    const now = Date.now();
    const isCacheValid = now - get().lastFetched.schedules < CACHE_TTL_MS;

    if (!forceRefresh && isCacheValid && get().schedules.length > 0) {
      return; // Cache masih valid
    }

    if (forceRefresh) set({ isRefreshing: true });
    else set({ isSchedulesLoading: true });

    try {
      const [schedRes, courseRes] = await Promise.allSettled([
        academicService.getSchedules(),
        academicService.getCourses(),
      ]);

      const schedList = schedRes.status === 'fulfilled' ? schedRes.value : [];
      const courseList = courseRes.status === 'fulfilled' ? courseRes.value : [];

      set((state) => ({
        schedules: schedList,
        courses: courseList.length > 0 ? courseList : state.courses,
        lastFetched: { ...state.lastFetched, schedules: now },
        error: null,
      }));
    } catch (err: any) {
      set({ error: err?.message || 'Gagal memuat jadwal' });
    } finally {
      set({ isSchedulesLoading: false, isRefreshing: false });
    }
  },

  // 3. Fetch Mata Kuliah & Semester (Hanya dipanggil saat tab Kuliah dibuka)
  fetchCoursesAndSemesters: async (forceRefresh = false) => {
    const now = Date.now();
    const isCacheValid = now - get().lastFetched.courses < CACHE_TTL_MS;

    if (!forceRefresh && isCacheValid && get().courses.length > 0) {
      return; // Cache masih valid
    }

    if (forceRefresh) set({ isRefreshing: true });
    else set({ isCoursesLoading: true });

    try {
      const [semestersRes, activeSemRes] = await Promise.allSettled([
        academicService.getSemesters(),
        academicService.getActiveSemester(),
      ]);

      const semesterList = semestersRes.status === 'fulfilled' ? semestersRes.value : [];
      const active = activeSemRes.status === 'fulfilled' ? activeSemRes.value : null;

      let courseList: Course[] = [];
      try {
        courseList = await academicService.getCourses(active?.id);
      } catch {
        courseList = [];
      }

      set((state) => ({
        semesters: semesterList,
        activeSemester: active || state.activeSemester,
        courses: courseList,
        lastFetched: { ...state.lastFetched, courses: now },
        error: null,
      }));
    } catch (err: any) {
      set({ error: err?.message || 'Gagal memuat daftar kuliah' });
    } finally {
      set({ isCoursesLoading: false, isRefreshing: false });
    }
  },

  // 4. Fetch Tugas & Ujian (Hanya dipanggil saat tab Tugas dibuka)
  fetchTasksAndExams: async (forceRefresh = false) => {
    const now = Date.now();
    const isCacheValid = now - get().lastFetched.tasks < CACHE_TTL_MS;

    if (!forceRefresh && isCacheValid && get().assignments.length > 0) {
      return; // Cache masih valid
    }

    if (forceRefresh) set({ isRefreshing: true });
    else set({ isTasksLoading: true });

    try {
      const [assignRes, examRes, courseRes] = await Promise.allSettled([
        academicService.getAssignments(),
        academicService.getExams(),
        academicService.getCourses(),
      ]);

      const assignList = assignRes.status === 'fulfilled' ? assignRes.value : [];
      const examList = examRes.status === 'fulfilled' ? examRes.value : [];
      const courseList = courseRes.status === 'fulfilled' ? courseRes.value : [];

      set((state) => ({
        assignments: assignList,
        exams: examList,
        courses: courseList.length > 0 ? courseList : state.courses,
        lastFetched: { ...state.lastFetched, tasks: now },
        error: null,
      }));
    } catch (err: any) {
      set({ error: err?.message || 'Gagal memuat tugas & ujian' });
    } finally {
      set({ isTasksLoading: false, isRefreshing: false });
    }
  },

  // 5. Fetch Detail Mata Kuliah (Smart In-Memory Caching per courseId)
  fetchCourseDetail: async (courseId: number, forceRefresh = false) => {
    const now = Date.now();
    const cached = get().courseDetails[courseId];
    const isCacheValid = cached && (now - cached.timestamp < CACHE_TTL_MS);

    if (!forceRefresh && isCacheValid) {
      return cached.data; // Instant return dari cache memori tanpa hit network
    }

    set({ isCourseDetailLoading: true });
    try {
      const data = await academicService.getCourse(courseId);
      set((state) => ({
        courseDetails: {
          ...state.courseDetails,
          [courseId]: { data, timestamp: now },
        },
        error: null,
      }));
      return data;
    } catch (err: any) {
      set({ error: err?.message || 'Gagal memuat detail mata kuliah' });
      return null;
    } finally {
      set({ isCourseDetailLoading: false });
    }
  },

  // === Mutations (Auto invalidate cache) ===
  createSemester: async (payload: CreateSemesterPayload) => {
    const newSem = await academicService.createSemester(payload);
    await get().fetchCoursesAndSemesters(true);
    await get().fetchDashboard(true);
    return newSem;
  },

  activateSemester: async (id: number) => {
    await academicService.activateSemester(id);
    await get().fetchCoursesAndSemesters(true);
    await get().fetchDashboard(true);
  },

  deleteSemester: async (id: number) => {
    await academicService.deleteSemester(id);
    await get().fetchCoursesAndSemesters(true);
    await get().fetchDashboard(true);
  },

  createCourse: async (payload: CreateCoursePayload) => {
    const newCourse = await academicService.createCourse(payload);
    await get().fetchCoursesAndSemesters(true);
    await get().fetchDashboard(true);
    return newCourse;
  },

  deleteCourse: async (id: number) => {
    await academicService.deleteCourse(id);
    set((state) => {
      const nextDetails = { ...state.courseDetails };
      delete nextDetails[id];
      return {
        courses: state.courses.filter((c) => c.id !== id),
        courseDetails: nextDetails,
      };
    });
    await get().fetchDashboard(true);
  },

  createSchedule: async (courseId: number, payload: CreateSchedulePayload) => {
    const newSched = await academicService.createSchedule(courseId, payload);
    set((state) => {
      const nextDetails = { ...state.courseDetails };
      delete nextDetails[courseId];
      return { courseDetails: nextDetails };
    });
    await get().fetchSchedules(true);
    await get().fetchDashboard(true);
    return newSched;
  },

  deleteSchedule: async (id: number) => {
    await academicService.deleteSchedule(id);
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
      courseDetails: {}, // invalidate cached details
    }));
    await get().fetchDashboard(true);
  },

  createAssignment: async (courseId: number, payload: CreateAssignmentPayload) => {
    const newAssign = await academicService.createAssignment(courseId, payload);
    set((state) => {
      const nextDetails = { ...state.courseDetails };
      delete nextDetails[courseId];
      return { courseDetails: nextDetails };
    });
    await get().fetchTasksAndExams(true);
    await get().fetchDashboard(true);
    return newAssign;
  },

  updateAssignmentProgress: async (id: number, progress: number) => {
    const is_completed = progress >= 100;
    // Optimistic instant UI update
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === id ? { ...a, progress, is_completed } : a
      ),
      courseDetails: {}, // invalidate cached details
    }));

    try {
      await academicService.updateAssignment(id, { progress, is_completed });
    } catch {
      await get().fetchTasksAndExams(true);
    }
  },

  deleteAssignment: async (id: number) => {
    await academicService.deleteAssignment(id);
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== id),
      courseDetails: {},
    }));
  },

  createExam: async (courseId: number, payload: CreateExamPayload) => {
    const newExam = await academicService.createExam(courseId, payload);
    set((state) => {
      const nextDetails = { ...state.courseDetails };
      delete nextDetails[courseId];
      return { courseDetails: nextDetails };
    });
    await get().fetchTasksAndExams(true);
    return newExam;
  },

  deleteExam: async (id: number) => {
    await academicService.deleteExam(id);
    set((state) => ({
      exams: state.exams.filter((e) => e.id !== id),
      courseDetails: {},
    }));
  },
}));
