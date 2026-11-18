import { z } from 'zod';
import { User } from '@/store/useAuthStore';
import { Course } from './academic';
import { Material, Note } from './learning';

export type StudyGroupRole = 'admin' | 'moderator' | 'member';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived';
export type ProjectMemberRole = 'owner' | 'editor' | 'viewer';
export type KanbanTaskStatus = 'todo' | 'in_progress' | 'done';
export type ProjectTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type GithubActivityType = 'commit' | 'pull_request' | 'issue' | 'release';

export interface StudyGroupMember {
  id: number;
  study_group_id: number;
  user_id: number;
  role: StudyGroupRole;
  joined_at: string;
  user?: User;
}

export interface StudyGroup {
  id: number;
  name: string;
  description?: string | null;
  subject?: string | null;
  course_id?: number | null;
  conversation_id?: number | null;
  creator_id: number;
  invite_code: string;
  is_public: boolean;
  max_members?: number | null;
  avatar_url?: string | null;
  members_count?: number;
  projects_count?: number;
  course?: Course | null;
  members?: StudyGroupMember[];
  shared_notes?: Note[];
  shared_materials?: Material[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: ProjectMemberRole;
  joined_at: string;
  user?: User;
}

export interface ProjectMilestone {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  due_date?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  order: number;
  tasks_count?: number;
  completed_tasks_count?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  milestone_id?: number | null;
  creator_id: number;
  assignee_id?: number | null;
  title: string;
  description?: string | null;
  status: KanbanTaskStatus;
  priority: ProjectTaskPriority;
  position: number;
  due_date?: string | null;
  labels?: string[];
  assignee?: {
    id: number;
    name: string;
    avatar_url?: string | null;
  } | null;
  creator?: {
    id: number;
    name: string;
    avatar_url?: string | null;
  } | null;
  milestone?: ProjectMilestone | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectGithubActivity {
  id: number;
  project_github_repo_id: number;
  type: GithubActivityType;
  external_id: string;
  title: string;
  author_name?: string | null;
  author_avatar?: string | null;
  url?: string | null;
  state?: string | null;
  occurred_at?: string | null;
  created_at: string;
}

export interface ProjectGithubRepo {
  id: number;
  project_id: number;
  repo_owner: string;
  repo_name: string;
  full_name: string;
  default_branch: string;
  html_url: string;
  has_webhook_secret: boolean;
  has_access_token: boolean;
  last_synced_at?: string | null;
  activities?: ProjectGithubActivity[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  study_group_id?: number | null;
  course_id?: number | null;
  creator_id: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  due_date?: string | null;
  tasks_count?: number;
  milestones_count?: number;
  study_group?: StudyGroup | null;
  course?: Course | null;
  members?: ProjectMember[];
  milestones?: ProjectMilestone[];
  tasks?: ProjectTask[];
  github_repo?: ProjectGithubRepo | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStudyGroupPayload {
  name: string;
  description?: string | null;
  subject?: string | null;
  course_id?: number | null;
  is_public?: boolean;
  max_members?: number | null;
}

export interface UpdateStudyGroupPayload {
  name?: string;
  description?: string | null;
  subject?: string | null;
  course_id?: number | null;
  is_public?: boolean;
  max_members?: number | null;
}

export interface JoinStudyGroupPayload {
  invite_code?: string;
  study_group_id?: number;
}

export interface CreateProjectPayload {
  name: string;
  description?: string | null;
  study_group_id?: number | null;
  course_id?: number | null;
  status?: ProjectStatus;
  due_date?: string | null;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  due_date?: string | null;
}

export interface CreateMilestonePayload {
  title: string;
  description?: string | null;
  due_date?: string | null;
  order?: number;
}

export interface UpdateMilestonePayload {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  is_completed?: boolean;
  order?: number;
}

export interface CreateProjectTaskPayload {
  title: string;
  description?: string | null;
  milestone_id?: number | null;
  assignee_id?: number | null;
  status?: KanbanTaskStatus;
  priority?: ProjectTaskPriority;
  due_date?: string | null;
  labels?: string[];
}

export interface UpdateProjectTaskPayload {
  title?: string;
  description?: string | null;
  milestone_id?: number | null;
  assignee_id?: number | null;
  status?: KanbanTaskStatus;
  priority?: ProjectTaskPriority;
  position?: number;
  due_date?: string | null;
  labels?: string[];
}

export interface MoveProjectTaskPayload {
  status: KanbanTaskStatus;
  position: number;
}

export interface ReorderProjectTasksPayload {
  tasks: Array<{
    id: number;
    status: KanbanTaskStatus;
    position: number;
  }>;
}

export interface ConnectGithubRepoPayload {
  repo_owner: string;
  repo_name: string;
  default_branch?: string;
  access_token?: string | null;
  webhook_secret?: string | null;
}

// === Zod Validation Schemas ===
export const createStudyGroupSchema = z.object({
  name: z.string().trim().min(2, 'Nama grup minimal 2 karakter').max(255),
  subject: z.string().trim().max(150).optional(),
  description: z.string().trim().optional(),
  max_members: z.number().int().min(2, 'Minimal 2 anggota').max(200, 'Maksimal 200 anggota').optional(),
});

export const joinStudyGroupSchema = z.object({
  invite_code: z.string().trim().min(4, 'Kode undangan minimal 4 karakter').max(16),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, 'Nama proyek minimal 2 karakter').max(255),
  description: z.string().trim().optional(),
});

export const createMilestoneSchema = z.object({
  title: z.string().trim().min(2, 'Judul milestone minimal 2 karakter').max(255),
  description: z.string().trim().optional(),
});

export const createProjectTaskSchema = z.object({
  title: z.string().trim().min(2, 'Judul tugas minimal 2 karakter').max(255),
  description: z.string().trim().optional(),
});

export const connectGithubSchema = z.object({
  repo_owner: z
    .string()
    .trim()
    .min(1, 'Owner repositori wajib diisi')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Format owner tidak valid'),
  repo_name: z
    .string()
    .trim()
    .min(1, 'Nama repositori wajib diisi')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Format nama repositori tidak valid'),
  default_branch: z.string().trim().optional(),
});
