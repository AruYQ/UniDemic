import api from '../lib/api';
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
} from '../types/productivity';

export const productivityService = {
  // === Tasks & Subtasks ===
  async getTasks(params?: {
    course_id?: number;
    priority?: string;
    label?: string;
    is_completed?: boolean;
  }): Promise<ProductivityTask[]> {
    const res = await api.get('/tasks', { params });
    return res.data?.data || [];
  },

  async getTask(id: number): Promise<ProductivityTask> {
    const res = await api.get(`/tasks/${id}`);
    return res.data?.data;
  },

  async createTask(payload: CreateTaskPayload): Promise<ProductivityTask> {
    const res = await api.post('/tasks', payload);
    return res.data?.data;
  },

  async updateTask(id: number, payload: UpdateTaskPayload): Promise<ProductivityTask> {
    const res = await api.put(`/tasks/${id}`, payload);
    return res.data?.data;
  },

  async deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async toggleTaskComplete(id: number): Promise<ProductivityTask> {
    const res = await api.patch(`/tasks/${id}/toggle-complete`);
    return res.data?.data;
  },

  async createSubtask(taskId: number, payload: CreateSubtaskPayload): Promise<TaskSubtask> {
    const res = await api.post(`/tasks/${taskId}/subtasks`, payload);
    return res.data?.data;
  },

  async updateSubtask(id: number, payload: UpdateSubtaskPayload): Promise<TaskSubtask> {
    const res = await api.put(`/subtasks/${id}`, payload);
    return res.data?.data;
  },

  async deleteSubtask(id: number): Promise<void> {
    await api.delete(`/subtasks/${id}`);
  },

  // === Study Sessions (Focus Timer) ===
  async getStudySessions(params?: {
    course_id?: number;
    date?: string;
    type?: string;
  }): Promise<StudySession[]> {
    const res = await api.get('/study-sessions', { params });
    return res.data?.data || [];
  },

  async createStudySession(payload: CreateStudySessionPayload): Promise<StudySession> {
    const res = await api.post('/study-sessions', payload);
    return res.data?.data;
  },

  async getStudySessionSummary(): Promise<StudySessionSummary> {
    const res = await api.get('/study-sessions/summary');
    return res.data?.data;
  },

  async deleteStudySession(id: number): Promise<void> {
    await api.delete(`/study-sessions/${id}`);
  },

  // === Goals ===
  async getGoals(params?: {
    is_completed?: boolean;
    type?: string;
  }): Promise<Goal[]> {
    const res = await api.get('/goals', { params });
    return res.data?.data || [];
  },

  async getGoal(id: number): Promise<Goal> {
    const res = await api.get(`/goals/${id}`);
    return res.data?.data;
  },

  async createGoal(payload: CreateGoalPayload): Promise<Goal> {
    const res = await api.post('/goals', payload);
    return res.data?.data;
  },

  async updateGoal(id: number, payload: UpdateGoalPayload): Promise<Goal> {
    const res = await api.put(`/goals/${id}`, payload);
    return res.data?.data;
  },

  async updateGoalProgress(id: number, current_value: number): Promise<Goal> {
    const res = await api.patch(`/goals/${id}/progress`, { current_value });
    return res.data?.data;
  },

  async deleteGoal(id: number): Promise<void> {
    await api.delete(`/goals/${id}`);
  },

  // === Smart Study Planner ===
  async getStudyPlanSuggestions(payload?: StudyPlannerRequest): Promise<StudyPlanSuggestion> {
    const res = await api.post('/study-planner/suggest', payload || {});
    return res.data?.data;
  },
};
