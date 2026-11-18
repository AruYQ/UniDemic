import api from '../lib/api';
import {
  Conversation,
  Message,
  ConversationType,
  CreateConversationPayload,
  UpdateConversationPayload,
  SendMessagePayload,
  UpdateMessagePayload,
  ToggleReactionPayload,
  AddParticipantPayload,
  CreateCourseChannelPayload,
} from '../types/communication';

export const communicationService = {
  // === Conversations ===
  async getConversations(type?: ConversationType): Promise<Conversation[]> {
    const params = type ? { type } : {};
    const res = await api.get('/conversations', { params });
    return res.data?.data || [];
  },

  async getConversation(id: number): Promise<Conversation> {
    const res = await api.get(`/conversations/${id}`);
    return res.data?.data;
  },

  async createConversation(payload: CreateConversationPayload): Promise<Conversation> {
    const res = await api.post('/conversations', payload);
    return res.data?.data;
  },

  async updateConversation(id: number, payload: UpdateConversationPayload): Promise<Conversation> {
    const res = await api.put(`/conversations/${id}`, payload);
    return res.data?.data;
  },

  async deleteConversation(id: number): Promise<void> {
    await api.delete(`/conversations/${id}`);
  },

  async addParticipants(id: number, payload: AddParticipantPayload): Promise<Conversation> {
    const res = await api.post(`/conversations/${id}/participants`, payload);
    return res.data?.data;
  },

  async removeParticipant(id: number, userId: number): Promise<void> {
    await api.delete(`/conversations/${id}/participants/${userId}`);
  },

  async markAsRead(id: number): Promise<void> {
    await api.post(`/conversations/${id}/read`);
  },

  // === Messages ===
  async getMessages(conversationId: number, limit: number = 50): Promise<Message[]> {
    const res = await api.get(`/conversations/${conversationId}/messages`, {
      params: { limit },
    });
    return res.data?.data || [];
  },

  async sendMessage(conversationId: number, payload: SendMessagePayload): Promise<Message> {
    if (payload.files && payload.files.length > 0) {
      const formData = new FormData();
      formData.append('content', payload.content);
      if (payload.type) formData.append('type', payload.type);
      if (payload.reply_to_id) formData.append('reply_to_id', String(payload.reply_to_id));
      if (payload.reference_type) formData.append('reference_type', payload.reference_type);
      if (payload.reference_id) formData.append('reference_id', String(payload.reference_id));

      payload.files.forEach((file: any) => {
        formData.append('files[]', file);
      });

      const res = await api.post(`/conversations/${conversationId}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data;
    }

    const res = await api.post(`/conversations/${conversationId}/messages`, payload);
    return res.data?.data;
  },

  async getMessage(id: number): Promise<Message> {
    const res = await api.get(`/messages/${id}`);
    return res.data?.data;
  },

  async updateMessage(id: number, payload: UpdateMessagePayload): Promise<Message> {
    const res = await api.put(`/messages/${id}`, payload);
    return res.data?.data;
  },

  async deleteMessage(id: number): Promise<void> {
    await api.delete(`/messages/${id}`);
  },

  async toggleReaction(id: number, payload: ToggleReactionPayload): Promise<Message> {
    const res = await api.post(`/messages/${id}/reactions`, payload);
    return res.data?.data;
  },

  // === Course Discussions ===
  async getCourseDiscussions(courseId: number): Promise<Conversation[]> {
    const res = await api.get(`/courses/${courseId}/discussions`);
    return res.data?.data || [];
  },

  async createCourseDiscussion(
    courseId: number,
    payload: CreateCourseChannelPayload
  ): Promise<Conversation> {
    const res = await api.post(`/courses/${courseId}/discussions`, payload);
    return res.data?.data;
  },
};
