import { create } from 'zustand';
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
  ProjectGithubRepo,
  ProjectGithubActivity,
  GithubActivityType,
  ConnectGithubRepoPayload,
} from '../types/collaboration';
import { collaborationService } from '../services/collaborationService';
import { formatApiError } from '../lib/api';

const CACHE_TTL_MS = 2 * 60 * 1000;

interface CollaborationState {
  // Collections
  myStudyGroups: StudyGroup[];
  publicStudyGroups: StudyGroup[];
  activeStudyGroup: StudyGroup | null;
  projects: Project[];
  activeProject: Project | null;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  githubActivities: ProjectGithubActivity[];

  // Loading & Error States
  isGroupsLoading: boolean;
  isGroupDetailLoading: boolean;
  isProjectsLoading: boolean;
  isProjectDetailLoading: boolean;
  isSyncingGithub: boolean;
  error: string | null;
  lastFetched: Record<string, number>;

  clearError: () => void;

  // === Study Group Actions ===
  fetchStudyGroups: (options?: { discover?: boolean; search?: string; forceRefresh?: boolean }) => Promise<void>;
  fetchStudyGroupDetail: (id: number) => Promise<StudyGroup | null>;
  createStudyGroup: (payload: CreateStudyGroupPayload) => Promise<StudyGroup>;
  updateStudyGroup: (id: number, payload: UpdateStudyGroupPayload) => Promise<StudyGroup>;
  deleteStudyGroup: (id: number) => Promise<void>;
  joinStudyGroup: (payload: JoinStudyGroupPayload) => Promise<StudyGroup>;
  regenerateInviteCode: (id: number) => Promise<string>;
  addStudyGroupMember: (groupId: number, userId: number, role?: StudyGroupRole) => Promise<void>;
  updateStudyGroupMemberRole: (groupId: number, userId: number, role: StudyGroupRole) => Promise<void>;
  removeStudyGroupMember: (groupId: number, userId: number) => Promise<void>;
  shareNoteToGroup: (groupId: number, noteId: number) => Promise<void>;
  unshareNoteFromGroup: (groupId: number, noteId: number) => Promise<void>;
  shareMaterialToGroup: (groupId: number, materialId: number) => Promise<void>;
  unshareMaterialFromGroup: (groupId: number, materialId: number) => Promise<void>;

  // === Project Actions ===
  fetchProjects: (options?: { study_group_id?: number; status?: ProjectStatus; forceRefresh?: boolean }) => Promise<void>;
  fetchProjectDetail: (id: number) => Promise<Project | null>;
  createProject: (payload: CreateProjectPayload) => Promise<Project>;
  updateProject: (id: number, payload: UpdateProjectPayload) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  addProjectMember: (projectId: number, userId: number, role?: ProjectMemberRole) => Promise<void>;
  removeProjectMember: (projectId: number, userId: number) => Promise<void>;

  // === Milestone Actions ===
  createMilestone: (projectId: number, payload: CreateMilestonePayload) => Promise<ProjectMilestone>;
  updateMilestone: (id: number, payload: UpdateMilestonePayload) => Promise<ProjectMilestone>;
  toggleMilestoneComplete: (id: number) => Promise<void>;
  deleteMilestone: (id: number) => Promise<void>;

  // === Kanban Task Actions ===
  createProjectTask: (projectId: number, payload: CreateProjectTaskPayload) => Promise<ProjectTask>;
  updateProjectTask: (id: number, payload: UpdateProjectTaskPayload) => Promise<ProjectTask>;
  moveProjectTask: (taskId: number, targetStatus: KanbanTaskStatus, targetPosition: number) => Promise<void>;
  deleteProjectTask: (id: number) => Promise<void>;

  // === GitHub Integration Actions ===
  connectGithubRepo: (projectId: number, payload: ConnectGithubRepoPayload) => Promise<ProjectGithubRepo>;
  disconnectGithubRepo: (projectId: number) => Promise<void>;
  syncGithubRepo: (projectId: number) => Promise<void>;
  fetchGithubActivities: (projectId: number, type?: GithubActivityType) => Promise<void>;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  myStudyGroups: [],
  publicStudyGroups: [],
  activeStudyGroup: null,
  projects: [],
  activeProject: null,
  milestones: [],
  tasks: [],
  githubActivities: [],

  isGroupsLoading: false,
  isGroupDetailLoading: false,
  isProjectsLoading: false,
  isProjectDetailLoading: false,
  isSyncingGithub: false,
  error: null,
  lastFetched: {},

  clearError: () => set({ error: null }),

  // === Study Groups ===
  fetchStudyGroups: async ({ discover = false, search, forceRefresh = false } = {}) => {
    const cacheKey = `groups_${discover ? 'public' : 'mine'}_${search || ''}`;
    const now = Date.now();
    const last = get().lastFetched[cacheKey] || 0;
    const currentList = discover ? get().publicStudyGroups : get().myStudyGroups;

    if (!forceRefresh && !search && currentList.length > 0 && now - last < CACHE_TTL_MS) {
      return;
    }

    set({ isGroupsLoading: true, error: null });
    try {
      const data = await collaborationService.getStudyGroups({
        discover: discover || undefined,
        search: search || undefined,
      });
      set((state) => ({
        ...(discover ? { publicStudyGroups: data } : { myStudyGroups: data }),
        isGroupsLoading: false,
        lastFetched: { ...state.lastFetched, [cacheKey]: now },
      }));
    } catch (err) {
      set({ error: formatApiError(err), isGroupsLoading: false });
    }
  },

  fetchStudyGroupDetail: async (id: number) => {
    set({ isGroupDetailLoading: true, error: null });
    try {
      const group = await collaborationService.getStudyGroup(id);
      set({ activeStudyGroup: group, isGroupDetailLoading: false });
      return group;
    } catch (err) {
      set({ error: formatApiError(err), isGroupDetailLoading: false });
      return null;
    }
  },

  createStudyGroup: async (payload) => {
    set({ error: null });
    const created = await collaborationService.createStudyGroup(payload);
    set((state) => ({
      myStudyGroups: [created, ...state.myStudyGroups],
      ...(created.is_public ? { publicStudyGroups: [created, ...state.publicStudyGroups] } : {}),
    }));
    return created;
  },

  updateStudyGroup: async (id, payload) => {
    const updated = await collaborationService.updateStudyGroup(id, payload);
    set((state) => ({
      activeStudyGroup: state.activeStudyGroup?.id === id ? { ...state.activeStudyGroup, ...updated } : state.activeStudyGroup,
      myStudyGroups: state.myStudyGroups.map((g) => (g.id === id ? updated : g)),
    }));
    return updated;
  },

  deleteStudyGroup: async (id) => {
    await collaborationService.deleteStudyGroup(id);
    set((state) => ({
      myStudyGroups: state.myStudyGroups.filter((g) => g.id !== id),
      publicStudyGroups: state.publicStudyGroups.filter((g) => g.id !== id),
      activeStudyGroup: state.activeStudyGroup?.id === id ? null : state.activeStudyGroup,
    }));
  },

  joinStudyGroup: async (payload) => {
    const joined = await collaborationService.joinStudyGroup(payload);
    set((state) => {
      const exists = state.myStudyGroups.some((g) => g.id === joined.id);
      return {
        myStudyGroups: exists
          ? state.myStudyGroups.map((g) => (g.id === joined.id ? joined : g))
          : [joined, ...state.myStudyGroups],
      };
    });
    return joined;
  },

  regenerateInviteCode: async (id) => {
    const newCode = await collaborationService.regenerateInviteCode(id);
    set((state) => ({
      activeStudyGroup:
        state.activeStudyGroup?.id === id ? { ...state.activeStudyGroup, invite_code: newCode } : state.activeStudyGroup,
      myStudyGroups: state.myStudyGroups.map((g) => (g.id === id ? { ...g, invite_code: newCode } : g)),
    }));
    return newCode;
  },

  addStudyGroupMember: async (groupId, userId, role = 'member') => {
    const updated = await collaborationService.addStudyGroupMember(groupId, userId, role);
    set((state) => ({
      activeStudyGroup:
        state.activeStudyGroup?.id === groupId ? { ...state.activeStudyGroup, ...updated } : state.activeStudyGroup,
      myStudyGroups: state.myStudyGroups.map((g) => (g.id === groupId ? { ...g, ...updated } : g)),
    }));
  },

  updateStudyGroupMemberRole: async (groupId, userId, role) => {
    const updated = await collaborationService.updateStudyGroupMemberRole(groupId, userId, role);
    set((state) => ({
      activeStudyGroup:
        state.activeStudyGroup?.id === groupId ? { ...state.activeStudyGroup, ...updated } : state.activeStudyGroup,
    }));
  },

  removeStudyGroupMember: async (groupId, userId) => {
    await collaborationService.removeStudyGroupMember(groupId, userId);
    set((state) => ({
      activeStudyGroup:
        state.activeStudyGroup?.id === groupId
          ? {
              ...state.activeStudyGroup,
              members: (state.activeStudyGroup.members || []).filter((m) => m.user_id !== userId),
              members_count: Math.max(0, (state.activeStudyGroup.members_count || 1) - 1),
            }
          : state.activeStudyGroup,
    }));
  },

  shareNoteToGroup: async (groupId, noteId) => {
    const updated = await collaborationService.shareNoteToGroup(groupId, noteId);
    set((state) => ({
      activeStudyGroup:
        state.activeStudyGroup?.id === groupId
          ? { ...state.activeStudyGroup, shared_notes: updated.shared_notes }
          : state.activeStudyGroup,
    }));
  },

  unshareNoteFromGroup: async (groupId, noteId) => {
    await collaborationService.unshareNoteFromGroup(groupId, noteId);
    set((state) => ({
      activeStudyGroup:
        state.activeStudyGroup?.id === groupId
          ? {
              ...state.activeStudyGroup,
              shared_notes: (state.activeStudyGroup.shared_notes || []).filter((n) => n.id !== noteId),
            }
          : state.activeStudyGroup,
    }));
  },

  shareMaterialToGroup: async (groupId, materialId) => {
    const updated = await collaborationService.shareMaterialToGroup(groupId, materialId);
    set((state) => ({
      activeStudyGroup:
        state.activeStudyGroup?.id === groupId
          ? { ...state.activeStudyGroup, shared_materials: updated.shared_materials }
          : state.activeStudyGroup,
    }));
  },

  unshareMaterialFromGroup: async (groupId, materialId) => {
    await collaborationService.unshareMaterialFromGroup(groupId, materialId);
    set((state) => ({
      activeStudyGroup:
        state.activeStudyGroup?.id === groupId
          ? {
              ...state.activeStudyGroup,
              shared_materials: (state.activeStudyGroup.shared_materials || []).filter((m) => m.id !== materialId),
            }
          : state.activeStudyGroup,
    }));
  },

  // === Projects ===
  fetchProjects: async ({ study_group_id, status, forceRefresh = false } = {}) => {
    const cacheKey = `projects_${study_group_id || 'all'}_${status || 'all'}`;
    const now = Date.now();
    const last = get().lastFetched[cacheKey] || 0;

    if (!forceRefresh && !study_group_id && !status && get().projects.length > 0 && now - last < CACHE_TTL_MS) {
      return;
    }

    set({ isProjectsLoading: true, error: null });
    try {
      const data = await collaborationService.getProjects({ study_group_id, status });
      set((state) => ({
        ...(study_group_id ? {} : { projects: data }),
        isProjectsLoading: false,
        lastFetched: { ...state.lastFetched, [cacheKey]: now },
      }));
    } catch (err) {
      set({ error: formatApiError(err), isProjectsLoading: false });
    }
  },

  fetchProjectDetail: async (id) => {
    set({ isProjectDetailLoading: true, error: null });
    try {
      const project = await collaborationService.getProject(id);
      set({
        activeProject: project,
        milestones: project.milestones || [],
        tasks: project.tasks || [],
        githubActivities: project.github_repo?.activities || [],
        isProjectDetailLoading: false,
      });
      return project;
    } catch (err) {
      set({ error: formatApiError(err), isProjectDetailLoading: false });
      return null;
    }
  },

  createProject: async (payload) => {
    const created = await collaborationService.createProject(payload);
    set((state) => ({
      projects: [created, ...state.projects],
    }));
    return created;
  },

  updateProject: async (id, payload) => {
    const updated = await collaborationService.updateProject(id, payload);
    set((state) => ({
      activeProject: state.activeProject?.id === id ? { ...state.activeProject, ...updated } : state.activeProject,
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
    return updated;
  },

  deleteProject: async (id) => {
    await collaborationService.deleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject: state.activeProject?.id === id ? null : state.activeProject,
    }));
  },

  addProjectMember: async (projectId, userId, role = 'editor') => {
    const updated = await collaborationService.addProjectMember(projectId, userId, role);
    set((state) => ({
      activeProject:
        state.activeProject?.id === projectId ? { ...state.activeProject, members: updated.members } : state.activeProject,
    }));
  },

  removeProjectMember: async (projectId, userId) => {
    await collaborationService.removeProjectMember(projectId, userId);
    set((state) => ({
      activeProject:
        state.activeProject?.id === projectId
          ? {
              ...state.activeProject,
              members: (state.activeProject.members || []).filter((m) => m.user_id !== userId),
            }
          : state.activeProject,
    }));
  },

  // === Milestones ===
  createMilestone: async (projectId, payload) => {
    const created = await collaborationService.createMilestone(projectId, payload);
    set((state) => ({
      milestones: [...state.milestones, created],
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, milestones_count: (p.milestones_count || 0) + 1 } : p
      ),
    }));
    return created;
  },

  updateMilestone: async (id, payload) => {
    const updated = await collaborationService.updateMilestone(id, payload);
    set((state) => ({
      milestones: state.milestones.map((m) => (m.id === id ? updated : m)),
    }));
    return updated;
  },

  toggleMilestoneComplete: async (id) => {
    const previous = get().milestones;
    set((state) => ({
      milestones: state.milestones.map((m) => (m.id === id ? { ...m, is_completed: !m.is_completed } : m)),
    }));

    try {
      const updated = await collaborationService.toggleMilestoneComplete(id);
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === id ? updated : m)),
      }));
    } catch (err) {
      set({ milestones: previous, error: formatApiError(err) });
      throw err;
    }
  },

  deleteMilestone: async (id) => {
    await collaborationService.deleteMilestone(id);
    set((state) => ({
      milestones: state.milestones.filter((m) => m.id !== id),
    }));
  },

  // === Kanban Tasks ===
  createProjectTask: async (projectId, payload) => {
    const created = await collaborationService.createProjectTask(projectId, payload);
    set((state) => ({
      tasks: [...state.tasks, created],
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, tasks_count: (p.tasks_count || 0) + 1 } : p
      ),
    }));
    return created;
  },

  updateProjectTask: async (id, payload) => {
    const updated = await collaborationService.updateProjectTask(id, payload);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
    return updated;
  },

  moveProjectTask: async (taskId, targetStatus, targetPosition) => {
    const prevTasks = get().tasks;
    const movingTask = prevTasks.find((t) => t.id === taskId);
    if (!movingTask) return;

    // Compute deterministic optimistic column re-indexing
    const targetSiblings = prevTasks
      .filter((t) => t.status === targetStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    const clamped = Math.max(0, Math.min(targetPosition, targetSiblings.length));
    const updatedTask: ProjectTask = { ...movingTask, status: targetStatus, position: clamped };
    targetSiblings.splice(clamped, 0, updatedTask);
    const reindexedTarget = targetSiblings.map((t, idx) => ({ ...t, position: idx }));

    let otherTasks = prevTasks.filter((t) => t.status !== targetStatus && t.id !== taskId);
    if (movingTask.status !== targetStatus) {
      const sourceSiblings = otherTasks
        .filter((t) => t.status === movingTask.status)
        .sort((a, b) => a.position - b.position)
        .map((t, idx) => ({ ...t, position: idx }));
      otherTasks = [
        ...otherTasks.filter((t) => t.status !== movingTask.status),
        ...sourceSiblings,
      ];
    }

    set({ tasks: [...otherTasks, ...reindexedTarget] });

    try {
      await collaborationService.moveProjectTask(taskId, {
        status: targetStatus,
        position: clamped,
      });
    } catch (err) {
      set({ tasks: prevTasks, error: formatApiError(err) });
      throw err;
    }
  },

  deleteProjectTask: async (id) => {
    const prevTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
    try {
      await collaborationService.deleteProjectTask(id);
    } catch (err) {
      set({ tasks: prevTasks, error: formatApiError(err) });
      throw err;
    }
  },

  // === GitHub Integration ===
  connectGithubRepo: async (projectId, payload) => {
    const repo = await collaborationService.connectGithubRepo(projectId, payload);
    set((state) => ({
      activeProject: state.activeProject?.id === projectId ? { ...state.activeProject, github_repo: repo } : state.activeProject,
    }));
    return repo;
  },

  disconnectGithubRepo: async (projectId) => {
    await collaborationService.disconnectGithubRepo(projectId);
    set((state) => ({
      activeProject:
        state.activeProject?.id === projectId ? { ...state.activeProject, github_repo: null } : state.activeProject,
      githubActivities: [],
    }));
  },

  syncGithubRepo: async (projectId) => {
    set({ isSyncingGithub: true, error: null });
    try {
      const repo = await collaborationService.syncGithubRepo(projectId);
      set((state) => ({
        activeProject:
          state.activeProject?.id === projectId ? { ...state.activeProject, github_repo: repo } : state.activeProject,
        githubActivities: repo.activities || [],
        isSyncingGithub: false,
      }));
    } catch (err) {
      set({ error: formatApiError(err), isSyncingGithub: false });
      throw err;
    }
  },

  fetchGithubActivities: async (projectId, type) => {
    try {
      const activities = await collaborationService.getGithubActivities(projectId, type);
      set({ githubActivities: activities });
    } catch (err) {
      set({ error: formatApiError(err) });
    }
  },
}));
