import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import {
  Message,
  Conversation,
  CreateMessageRequest,
  ApiResponse,
} from '@/types';

export const messagesApi = {
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<ApiResponse<Conversation[]>>(
      API_ENDPOINTS.messages.conversations
    );
    return response.data!;
  },

  async getConversation(id: string): Promise<Conversation> {
    const response = await apiClient.get<ApiResponse<Conversation>>(
      API_ENDPOINTS.messages.conversationById(id)
    );
    return response.data!;
  },

  async getConversationMessages(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<Message[]> {
    const response = await apiClient.get<ApiResponse<Message[]>>(
      API_ENDPOINTS.messages.conversationMessages(conversationId),
      {
        params: { page, limit },
      }
    );
    return response.data!;
  },

  async sendMessage(data: CreateMessageRequest): Promise<Message> {
    const response = await apiClient.post<ApiResponse<Message>>(
      API_ENDPOINTS.messages.send,
      data
    );
    return response.data!;
  },

  async markMessageAsRead(messageId: string): Promise<void> {
    await apiClient.put(API_ENDPOINTS.messages.markRead(messageId));
  },

  async createGroup(participantIds: string[], name?: string): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<Conversation>>(
      API_ENDPOINTS.messages.createGroup,
      {
        participants: participantIds,
        name,
      }
    );
    return response.data!;
  },
};

