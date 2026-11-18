import api from '../lib/api';
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

export const trackingService = {
  // === Attendance ===
  async getCourseAttendances(courseId: number): Promise<Attendance[]> {
    const res = await api.get(`/courses/${courseId}/attendances`);
    return res.data?.data || [];
  },

  async getAttendanceSummary(courseId: number): Promise<AttendanceSummary> {
    const res = await api.get(`/courses/${courseId}/attendance-summary`);
    return res.data?.data;
  },

  async createAttendance(courseId: number, payload: CreateAttendancePayload): Promise<Attendance> {
    const res = await api.post(`/courses/${courseId}/attendances`, payload);
    return res.data?.data;
  },

  async updateAttendance(id: number, payload: UpdateAttendancePayload): Promise<Attendance> {
    const res = await api.put(`/attendances/${id}`, payload);
    return res.data?.data;
  },

  async deleteAttendance(id: number): Promise<void> {
    await api.delete(`/attendances/${id}`);
  },

  // === Grade Components ===
  async getGradeComponents(courseId: number): Promise<GradeComponent[]> {
    const res = await api.get(`/courses/${courseId}/grade-components`);
    return res.data?.data || [];
  },

  async createGradeComponent(courseId: number, payload: CreateGradeComponentPayload): Promise<GradeComponent> {
    const res = await api.post(`/courses/${courseId}/grade-components`, payload);
    return res.data?.data;
  },

  async updateGradeComponent(id: number, payload: UpdateGradeComponentPayload): Promise<GradeComponent> {
    const res = await api.put(`/grade-components/${id}`, payload);
    return res.data?.data;
  },

  async deleteGradeComponent(id: number): Promise<void> {
    await api.delete(`/grade-components/${id}`);
  },

  // === Grades ===
  async getCourseGrades(courseId: number): Promise<Grade[]> {
    const res = await api.get(`/courses/${courseId}/grades`);
    return res.data?.data || [];
  },

  async createGrade(courseId: number, payload: CreateGradePayload): Promise<Grade> {
    const res = await api.post(`/courses/${courseId}/grades`, payload);
    return res.data?.data;
  },

  async updateGrade(id: number, payload: UpdateGradePayload): Promise<Grade> {
    const res = await api.put(`/grades/${id}`, payload);
    return res.data?.data;
  },

  async deleteGrade(id: number): Promise<void> {
    await api.delete(`/grades/${id}`);
  },

  // === GPA & Simulator ===
  async getCourseGpa(courseId: number): Promise<CourseGpa> {
    const res = await api.get(`/courses/${courseId}/gpa`);
    return res.data?.data;
  },

  async getSemesterGpa(semesterId: number): Promise<SemesterGpa> {
    const res = await api.get(`/semesters/${semesterId}/gpa`);
    return res.data?.data;
  },

  async getCumulativeGpa(): Promise<CumulativeGpa> {
    const res = await api.get('/gpa/cumulative');
    return res.data?.data;
  },

  async simulateGpa(payload: GpaSimulationPayload): Promise<GpaSimulationResult> {
    const res = await api.post('/gpa-simulator', payload);
    return res.data?.data;
  },
};
