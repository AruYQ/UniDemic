import api from '../lib/api';
import {
  StudyGroup,
  StudyGroupRole,
  CreateStudyGroupPayload,
  UpdateStudyGroupPayload,
  JoinStudyGroupPayload,
  Project,
  ProjectStatus,
  ProjectMemberRole,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectMilestone,
  CreateMilestonePayload,
  UpdateMilestonePayload,
  ProjectTask,
  KanbanTaskStatus,
  CreateProjectTaskPayload,
  UpdateProjectTaskPayload,
  MoveProjectTaskPayload,
  ReorderProjectTasksPayload,
  ProjectGithubRepo,
  ProjectGithubActivity,
  GithubActivityType,
  ConnectGithubRepoPayload,
} from '../types/collaboration';

export const collaborationService = {
  // === Study Groups ===
  async getStudyGroups(params?: { discover?: boolean; search?: string; course_id?: number }): Promise<StudyGroup[]> {
    const res = await api.get('/study-groups', { params });
    return res.data?.data || [];
  },

  async createStudyGroup(payload: CreateStudyGroupPayload): Promise<StudyGroup> {
    const res = await api.post('/study-groups', payload);
    return res.data?.data;
  },

  async getStudyGroup(id: number): Promise<StudyGroup> {
    const res = await api.get(`/study-groups/${id}`);
    return res.data?.data;
  },

  async updateStudyGroup(id: number, payload: UpdateStudyGroupPayload): Promise<StudyGroup> {
    const res = await api.put(`/study-groups/${id}`, payload);
    return res.data?.data;
  },

  async deleteStudyGroup(id: number): Promise<void> {
    await api.delete(`/study-groups/${id}`);
  },

  async joinStudyGroup(payload: JoinStudyGroupPayload): Promise<StudyGroup> {
    const res = await api.post('/study-groups/join', payload);
    return res.data?.data;
  },

  async regenerateInviteCode(id: number): Promise<string> {
    const res = await api.post(`/study-groups/${id}/regenerate-invite`);
    return res.data?.data?.invite_code;
  },

  async addStudyGroupMember(id: number, userId: number, role: StudyGroupRole = 'member'): Promise<StudyGroup> {
    const res = await api.post(`/study-groups/${id}/members`, { user_id: userId, role });
    return res.data?.data;
  },

  async updateStudyGroupMemberRole(id: number, userId: number, role: StudyGroupRole): Promise<StudyGroup> {
    const res = await api.put(`/study-groups/${id}/members/${userId}`, { role });
    return res.data?.data;
  },

  async removeStudyGroupMember(id: number, userId: number): Promise<void> {
    await api.delete(`/study-groups/${id}/members/${userId}`);
  },

  async shareNoteToGroup(groupId: number, noteId: number): Promise<StudyGroup> {
    const res = await api.post(`/study-groups/${groupId}/share-note`, { note_id: noteId });
    return res.data?.data;
  },

  async unshareNoteFromGroup(groupId: number, noteId: number): Promise<void> {
    await api.delete(`/study-groups/${groupId}/notes/${noteId}`);
  },

  async shareMaterialToGroup(groupId: number, materialId: number): Promise<StudyGroup> {
    const res = await api.post(`/study-groups/${groupId}/share-material`, { material_id: materialId });
    return res.data?.data;
  },

  async unshareMaterialFromGroup(groupId: number, materialId: number): Promise<void> {
    await api.delete(`/study-groups/${groupId}/materials/${materialId}`);
  },

  // === Projects ===
  async getProjects(params?: { study_group_id?: number; course_id?: number; status?: ProjectStatus }): Promise<Project[]> {
    const res = await api.get('/projects', { params });
    return res.data?.data || [];
  },

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    const res = await api.post('/projects', payload);
    return res.data?.data;
  },

  async getProject(id: number): Promise<Project> {
    const res = await api.get(`/projects/${id}`);
    return res.data?.data;
  },

  async updateProject(id: number, payload: UpdateProjectPayload): Promise<Project> {
    const res = await api.put(`/projects/${id}`, payload);
    return res.data?.data;
  },

  async deleteProject(id: number): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async addProjectMember(projectId: number, userId: number, role: ProjectMemberRole = 'editor'): Promise<Project> {
    const res = await api.post(`/projects/${projectId}/members`, { user_id: userId, role });
    return res.data?.data;
  },

  async removeProjectMember(projectId: number, userId: number): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  // === Milestones ===
  async getMilestones(projectId: number): Promise<ProjectMilestone[]> {
    const res = await api.get(`/projects/${projectId}/milestones`);
    return res.data?.data || [];
  },

  async createMilestone(projectId: number, payload: CreateMilestonePayload): Promise<ProjectMilestone> {
    const res = await api.post(`/projects/${projectId}/milestones`, payload);
    return res.data?.data;
  },

  async updateMilestone(id: number, payload: UpdateMilestonePayload): Promise<ProjectMilestone> {
    const res = await api.put(`/milestones/${id}`, payload);
    return res.data?.data;
  },

  async toggleMilestoneComplete(id: number): Promise<ProjectMilestone> {
    const res = await api.patch(`/milestones/${id}/toggle-complete`);
    return res.data?.data;
  },

  async deleteMilestone(id: number): Promise<void> {
    await api.delete(`/milestones/${id}`);
  },

  // === Kanban Project Tasks ===
  async getProjectTasks(
    projectId: number,
    params?: { status?: KanbanTaskStatus; assignee_id?: number; milestone_id?: number }
  ): Promise<ProjectTask[]> {
    const res = await api.get(`/projects/${projectId}/tasks`, { params });
    return res.data?.data || [];
  },

  async createProjectTask(projectId: number, payload: CreateProjectTaskPayload): Promise<ProjectTask> {
    const res = await api.post(`/projects/${projectId}/tasks`, payload);
    return res.data?.data;
  },

  async updateProjectTask(id: number, payload: UpdateProjectTaskPayload): Promise<ProjectTask> {
    const res = await api.put(`/project-tasks/${id}`, payload);
    return res.data?.data;
  },

  async moveProjectTask(id: number, payload: MoveProjectTaskPayload): Promise<ProjectTask> {
    const res = await api.patch(`/project-tasks/${id}/move`, payload);
    return res.data?.data;
  },

  async reorderProjectTasks(projectId: number, payload: ReorderProjectTasksPayload): Promise<ProjectTask[]> {
    const res = await api.post(`/projects/${projectId}/tasks/reorder`, payload);
    return res.data?.data || [];
  },

  async deleteProjectTask(id: number): Promise<void> {
    await api.delete(`/project-tasks/${id}`);
  },

  // === GitHub Integration ===
  async connectGithubRepo(projectId: number, payload: ConnectGithubRepoPayload): Promise<ProjectGithubRepo> {
    const res = await api.post(`/projects/${projectId}/github/connect`, payload);
    return res.data?.data;
  },

  async disconnectGithubRepo(projectId: number): Promise<void> {
    await api.delete(`/projects/${projectId}/github/disconnect`);
  },

  async getGithubActivities(projectId: number, type?: GithubActivityType): Promise<ProjectGithubActivity[]> {
    const params = type ? { type } : undefined;
    const res = await api.get(`/projects/${projectId}/github/activities`, { params });
    return res.data?.data || [];
  },

  async syncGithubRepo(projectId: number): Promise<ProjectGithubRepo> {
    const res = await api.post(`/projects/${projectId}/github/sync`);
    return res.data?.data;
  },
};
