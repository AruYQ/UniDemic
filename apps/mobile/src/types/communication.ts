import { User } from '@/store/useAuthStore';
import { Course } from './academic';

export type ConversationType = 'direct' | 'group' | 'course';
export type ParticipantRole = 'admin' | 'member';
export type MessageType = 'text' | 'image' | 'file' | 'academic_ref' | 'system';
export type AcademicReferenceType = 'course' | 'assignment' | 'exam' | 'material' | 'note' | 'task' | 'quiz';

export interface ConversationParticipant {
  id: number;
  conversation_id: number;
  user_id: number;
  role: ParticipantRole;
  joined_at: string;
  last_read_at?: string | null;
  user?: User;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  created_at: string;
}

export interface MessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  user?: User;
  created_at: string;
}

export interface AcademicReference {
  type: AcademicReferenceType;
  id: number;
  title?: string;
  subtitle?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  user_id: number;
  content: string;
  type: MessageType;
  reply_to_id?: number | null;
  reply_to?: Message | null;
  reference_type?: AcademicReferenceType | null;
  reference_id?: number | null;
  reference_data?: any;
  user?: User;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  is_read?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  name?: string | null;
  description?: string | null;
  course_id?: number | null;
  avatar_url?: string | null;
  created_by: number;
  course?: Course | null;
  participants?: ConversationParticipant[];
  last_message?: Message | null;
  last_message_at?: string | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationPayload {
  type: ConversationType;
  participant_ids: number[];
  name?: string | null;
  description?: string | null;
  course_id?: number | null;
}

export interface UpdateConversationPayload {
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
}

export interface SendMessagePayload {
  content: string;
  type?: MessageType;
  reply_to_id?: number | null;
  reference_type?: AcademicReferenceType | null;
  reference_id?: number | null;
  files?: any[];
}

export interface UpdateMessagePayload {
  content: string;
}

export interface ToggleReactionPayload {
  emoji: string;
}

export interface AddParticipantPayload {
  user_ids: number[];
  role?: ParticipantRole;
}

export interface CreateCourseChannelPayload {
  name: string;
  description?: string | null;
}
