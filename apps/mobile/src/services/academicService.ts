import api from '../lib/api';
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

export const academicService = {
  // === Semesters ===
  async getSemesters(): Promise<Semester[]> {
    const res = await api.get('/semesters');
    return res.data?.data || [];
  },

  async getActiveSemester(): Promise<Semester | null> {
    const res = await api.get('/semesters/active');
    return res.data?.data || null;
  },

  async createSemester(payload: CreateSemesterPayload): Promise<Semester> {
    const res = await api.post('/semesters', payload);
    return res.data?.data;
  },

  async activateSemester(id: number): Promise<Semester> {
    const res = await api.post(`/semesters/${id}/activate`);
    return res.data?.data;
  },

  async updateSemester(id: number, payload: Partial<CreateSemesterPayload>): Promise<Semester> {
    const res = await api.put(`/semesters/${id}`, payload);
    return res.data?.data;
  },

  async deleteSemester(id: number): Promise<void> {
    await api.delete(`/semesters/${id}`);
  },

  // === Courses ===
  async getCourses(semesterId?: number): Promise<Course[]> {
    const params = semesterId ? { semester_id: semesterId } : {};
    const res = await api.get('/courses', { params });
    return res.data?.data || [];
  },

  async getCourse(id: number): Promise<Course> {
    const res = await api.get(`/courses/${id}`);
    return res.data?.data;
  },

  async createCourse(payload: CreateCoursePayload): Promise<Course> {
    const res = await api.post('/courses', payload);
    return res.data?.data;
  },

  async updateCourse(id: number, payload: Partial<CreateCoursePayload>): Promise<Course> {
    const res = await api.put(`/courses/${id}`, payload);
    return res.data?.data;
  },

  async deleteCourse(id: number): Promise<void> {
    await api.delete(`/courses/${id}`);
  },

  // === Schedules ===
  async getSchedules(): Promise<CourseSchedule[]> {
    const res = await api.get('/schedules');
    return res.data?.data || [];
  },

  async getCourseSchedules(courseId: number): Promise<CourseSchedule[]> {
    const res = await api.get(`/courses/${courseId}/schedules`);
    return res.data?.data || [];
  },

  async createSchedule(courseId: number, payload: CreateSchedulePayload): Promise<CourseSchedule> {
    const res = await api.post(`/courses/${courseId}/schedules`, payload);
    return res.data?.data;
  },

  async updateSchedule(id: number, payload: Partial<CreateSchedulePayload>): Promise<CourseSchedule> {
    const res = await api.put(`/schedules/${id}`, payload);
    return res.data?.data;
  },

  async deleteSchedule(id: number): Promise<void> {
    await api.delete(`/schedules/${id}`);
  },

  // === Assignments ===
  async getAssignments(courseId?: number, isCompleted?: boolean): Promise<Assignment[]> {
    const params: Record<string, any> = {};
    if (courseId) params.course_id = courseId;
    if (typeof isCompleted === 'boolean') params.is_completed = isCompleted ? 1 : 0;
    const res = await api.get('/assignments', { params });
    return res.data?.data || [];
  },

  async createAssignment(courseId: number, payload: CreateAssignmentPayload): Promise<Assignment> {
    const res = await api.post(`/courses/${courseId}/assignments`, payload);
    return res.data?.data;
  },

  async updateAssignment(id: number, payload: Partial<Assignment>): Promise<Assignment> {
    const res = await api.put(`/assignments/${id}`, payload);
    return res.data?.data;
  },

  async deleteAssignment(id: number): Promise<void> {
    await api.delete(`/assignments/${id}`);
  },

  // === Exams ===
  async getExams(courseId?: number): Promise<Exam[]> {
    const params = courseId ? { course_id: courseId } : {};
    const res = await api.get('/exams', { params });
    return res.data?.data || [];
  },

  async createExam(courseId: number, payload: CreateExamPayload): Promise<Exam> {
    const res = await api.post(`/courses/${courseId}/exams`, payload);
    return res.data?.data;
  },

  async updateExam(id: number, payload: Partial<CreateExamPayload>): Promise<Exam> {
    const res = await api.put(`/exams/${id}`, payload);
    return res.data?.data;
  },

  async deleteExam(id: number): Promise<void> {
    await api.delete(`/exams/${id}`);
  },
};
