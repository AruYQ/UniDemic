import { create } from 'zustand';
import {
  Conversation,
  Message,
  ConversationType,
  CreateConversationPayload,
  UpdateConversationPayload,
  SendMessagePayload,
  UpdateMessagePayload,
  AcademicReference,
  CreateCourseChannelPayload,
  AddParticipantPayload,
} from '../types/communication';
import { communicationService } from '../services/communicationService';
import { formatApiError } from '../lib/api';

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes cache for conversations

interface CommunicationState {
  // Collections
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Record<number, Message[]>; // conversationId -> messages[]
  courseDiscussions: Record<number, Conversation[]>; // courseId -> channels[]

  // Composer State
  replyingTo: Message | null;
  attachedAcademicRef: AcademicReference | null;

  // Loading & Error States
  isConversationsLoading: boolean;
  isMessagesLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Unread Stats
  totalUnreadCount: number;

  // Cache Tracker
  lastFetched: Record<string, number>;

  // Actions — Conversations
  fetchConversations: (type?: ConversationType, forceRefresh?: boolean) => Promise<void>;
  fetchConversation: (id: number) => Promise<Conversation>;
  createConversation: (payload: CreateConversationPayload) => Promise<Conversation>;
  updateConversation: (id: number, payload: UpdateConversationPayload) => Promise<Conversation>;
  deleteConversation: (id: number) => Promise<void>;
  markConversationAsRead: (id: number) => Promise<void>;
  addParticipants: (id: number, payload: AddParticipantPayload) => Promise<Conversation>;
  removeParticipant: (id: number, userId: number) => Promise<void>;

  // Actions — Messages
  fetchMessages: (conversationId: number, limit?: number) => Promise<void>;
  sendMessage: (conversationId: number, payload: SendMessagePayload, currentUserId?: number) => Promise<Message>;
  updateMessage: (id: number, payload: UpdateMessagePayload) => Promise<Message>;
  deleteMessage: (id: number) => Promise<void>;
  toggleReaction: (messageId: number, emoji: string) => Promise<void>;

  // Actions — Course Discussions
  fetchCourseDiscussions: (courseId: number, forceRefresh?: boolean) => Promise<Conversation[]>;
  createCourseDiscussion: (courseId: number, payload: CreateCourseChannelPayload) => Promise<Conversation>;

  // Composer Helpers
  setActiveConversation: (conversation: Conversation | null) => void;
  setReplyingTo: (message: Message | null) => void;
  setAttachedAcademicRef: (ref: AcademicReference | null) => void;
  calculateUnreadCount: () => void;
  clearError: () => void;
}

export const useCommunicationStore = create<CommunicationState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  courseDiscussions: {},

  replyingTo: null,
  attachedAcademicRef: null,

  isConversationsLoading: false,
  isMessagesLoading: false,
  isSending: false,
  error: null,
  totalUnreadCount: 0,
  lastFetched: {},

  clearError: () => set({ error: null }),

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    if (conversation) {
      get().markConversationAsRead(conversation.id);
    }
  },

  setReplyingTo: (message) => set({ replyingTo: message }),

  setAttachedAcademicRef: (ref) => set({ attachedAcademicRef: ref }),

  calculateUnreadCount: () => {
    const total = get().conversations.reduce((acc, conv) => acc + (conv.unread_count || 0), 0);
    set({ totalUnreadCount: total });
  },

  // === Conversations ===
  fetchConversations: async (type, forceRefresh = false) => {
    const cacheKey = `conversations_${type || 'all'}`;
    const now = Date.now();
    const lastFetch = get().lastFetched[cacheKey] || 0;

    if (!forceRefresh && get().conversations.length > 0 && now - lastFetch < CACHE_TTL_MS) {
      return;
    }

    set({ isConversationsLoading: true, error: null });
    try {
      const data = await communicationService.getConversations(type);
      set((state) => {
        let updatedConversations = state.conversations;
        if (!type) {
          updatedConversations = data;
        } else {
          // Merge type-filtered data preserving other types
          const otherTypes = state.conversations.filter((c) => c.type !== type);
          updatedConversations = [...data, ...otherTypes];
        }

        // Sort by last_message_at descending
        updatedConversations.sort((a, b) => {
          const dateA = new Date(a.last_message_at || a.created_at).getTime();
          const dateB = new Date(b.last_message_at || b.created_at).getTime();
          return dateB - dateA;
        });

        const totalUnread = updatedConversations.reduce(
          (sum, c) => sum + (c.unread_count || 0),
          0
        );

        return {
          conversations: updatedConversations,
          totalUnreadCount: totalUnread,
          lastFetched: { ...state.lastFetched, [cacheKey]: now },
          isConversationsLoading: false,
        };
      });
    } catch (err) {
      set({ error: formatApiError(err), isConversationsLoading: false });
    }
  },

  fetchConversation: async (id: number) => {
    set({ error: null });
    try {
      const data = await communicationService.getConversation(id);
      set((state) => ({
        activeConversation: data,
        conversations: state.conversations.map((c) => (c.id === id ? data : c)),
      }));
      return data;
    } catch (err) {
      const msg = formatApiError(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  createConversation: async (payload) => {
    set({ error: null });
    try {
      const created = await communicationService.createConversation(payload);
      set((state) => {
        const updated = [created, ...state.conversations.filter((c) => c.id !== created.id)];
        return { conversations: updated, activeConversation: created };
      });
      get().calculateUnreadCount();
      return created;
    } catch (err) {
      const msg = formatApiError(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  updateConversation: async (id, payload) => {
    set({ error: null });
    try {
      const updated = await communicationService.updateConversation(id, payload);
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === id ? updated : c)),
        activeConversation:
          state.activeConversation?.id === id ? updated : state.activeConversation,
      }));
      return updated;
    } catch (err) {
      const msg = formatApiError(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  deleteConversation: async (id) => {
    set({ error: null });
    try {
      await communicationService.deleteConversation(id);
      set((state) => {
        const filtered = state.conversations.filter((c) => c.id !== id);
        const { [id]: _, ...remainingMessages } = state.messages;
        return {
          conversations: filtered,
          messages: remainingMessages,
          activeConversation: state.activeConversation?.id === id ? null : state.activeConversation,
        };
      });
      get().calculateUnreadCount();
    } catch (err) {
      const msg = formatApiError(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  markConversationAsRead: async (id) => {
    try {
      await communicationService.markAsRead(id);
      set((state) => {
        const updated = state.conversations.map((c) =>
          c.id === id ? { ...c, unread_count: 0 } : c
        );
        const total = updated.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        return { conversations: updated, totalUnreadCount: total };
      });
    } catch (err) {
      // Non-blocking error for read indicator
      console.warn('Failed to mark conversation as read', err);
    }
  },

  addParticipants: async (id, payload) => {
    set({ error: null });
    try {
      const updated = await communicationService.addParticipants(id, payload);
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === id ? updated : c)),
        activeConversation:
          state.activeConversation?.id === id ? updated : state.activeConversation,
      }));
      return updated;
    } catch (err) {
      const msg = formatApiError(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  removeParticipant: async (id, userId) => {
    set({ error: null });
    try {
      await communicationService.removeParticipant(id, userId);
      set((state) => {
        const conv = state.conversations.find((c) => c.id === id);
        if (!conv) return {};
        const updated = {
          ...conv,
          participants: conv.participants?.filter((p) => p.user_id !== userId),
        };
        return {
          conversations: state.conversations.map((c) => (c.id === id ? updated : c)),
          activeConversation:
            state.activeConversation?.id === id ? updated : state.activeConversation,
        };
      });
    } catch (err) {
      const msg = formatApiError(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  // === Messages ===
  fetchMessages: async (conversationId: number, limit: number = 50) => {
    set({ isMessagesLoading: true, error: null });
    try {
      const data = await communicationService.getMessages(conversationId, limit);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: data,
        },
        isMessagesLoading: false,
      }));
    } catch (err) {
      set({ error: formatApiError(err), isMessagesLoading: false });
    }
  },

  sendMessage: async (conversationId: number, payload: SendMessagePayload, currentUserId?: number) => {
    set({ isSending: true, error: null });

    // Optimistic message placeholder
    const tempId = -Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      user_id: currentUserId || 0,
      content: payload.content,
      type: payload.type || 'text',
      reply_to_id: payload.reply_to_id || null,
      reply_to: get().replyingTo,
      reference_type: payload.reference_type || null,
      reference_id: payload.reference_id || null,
      reactions: [],
      attachments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => {
      const existing = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, optimisticMsg],
        },
        replyingTo: null,
        attachedAcademicRef: null,
      };
    });

    try {
      const realMessage = await communicationService.sendMessage(conversationId, payload);

      set((state) => {
        const convMessages = (state.messages[conversationId] || []).map((m) =>
          m.id === tempId ? realMessage : m
        );

        // Also update conversation last_message in list
        const updatedConversations = state.conversations.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              last_message: realMessage,
              last_message_at: realMessage.created_at,
            };
          }
          return c;
        });

        // Re-sort conversations
        updatedConversations.sort((a, b) => {
          const dateA = new Date(a.last_message_at || a.created_at).getTime();
          const dateB = new Date(b.last_message_at || b.created_at).getTime();
          return dateB - dateA;
        });

        return {
          messages: {
            ...state.messages,
            [conversationId]: convMessages,
          },
          conversations: updatedConversations,
          isSending: false,
        };
      });

      return realMessage;
    } catch (err) {
      // Rollback optimistic message on failure
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).filter((m) => m.id !== tempId),
        },
        isSending: false,
        error: formatApiError(err),
      }));
      throw err;
    }
  },

  updateMessage: async (id: number, payload: UpdateMessagePayload) => {
    set({ error: null });
    try {
      const updated = await communicationService.updateMessage(id, payload);
      set((state) => {
        const convId = updated.conversation_id;
        const convMessages = (state.messages[convId] || []).map((m) =>
          m.id === id ? updated : m
        );
        return {
          messages: {
            ...state.messages,
            [convId]: convMessages,
          },
        };
      });
      return updated;
    } catch (err) {
      const msg = formatApiError(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  deleteMessage: async (id: number) => {
    set({ error: null });
    try {
      await communicationService.deleteMessage(id);
      set((state) => {
        const updatedMessages: Record<number, Message[]> = {};
        for (const [cId, msgs] of Object.entries(state.messages)) {
          updatedMessages[Number(cId)] = msgs.map((m) =>
            m.id === id ? { ...m, deleted_at: new Date().toISOString(), content: 'Pesan telah dihapus' } : m
          );
        }
        return { messages: updatedMessages };
      });
    } catch (err) {
      const msg = formatApiError(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },

  toggleReaction: async (messageId: number, emoji: string) => {
    try {
      const updatedMsg = await communicationService.toggleReaction(messageId, { emoji });
      set((state) => {
        const convId = updatedMsg.conversation_id;
        const convMessages = (state.messages[convId] || []).map((m) =>
          m.id === messageId ? updatedMsg : m
        );
        return {
          messages: {
            ...state.messages,
            [convId]: convMessages,
          },
        };
      });
    } catch (err) {
      console.warn('Failed to toggle reaction', err);
    }
  },

  // === Course Discussions ===
  fetchCourseDiscussions: async (courseId: number, forceRefresh = false) => {
    const cacheKey = `course_discussions_${courseId}`;
    const now = Date.now();
    const lastFetch = get().lastFetched[cacheKey] || 0;

    if (!forceRefresh && get().courseDiscussions[courseId]?.length > 0 && now - lastFetch < CACHE_TTL_MS) {
      return get().courseDiscussions[courseId];
    }

    try {
      const channels = await communicationService.getCourseDiscussions(courseId);
      set((state) => ({
        courseDiscussions: {
          ...state.courseDiscussions,
          [courseId]: channels,
        },
        lastFetched: { ...state.lastFetched, [cacheKey]: now },
      }));
      return channels;
    } catch (err) {
      set({ error: formatApiError(err) });
      return [];
    }
  },

  createCourseDiscussion: async (courseId: number, payload: CreateCourseChannelPayload) => {
    set({ error: null });
    try {
      const created = await communicationService.createCourseDiscussion(courseId, payload);
      set((state) => {
        const existing = state.courseDiscussions[courseId] || [];
        return {
          courseDiscussions: {
            ...state.courseDiscussions,
            [courseId]: [...existing, created],
          },
          conversations: [created, ...state.conversations],
        };
      });
      return created;
    } catch (err) {
      const msg = formatApiError(err);
      set({ error: msg });
      throw new Error(msg);
    }
  },
}));
