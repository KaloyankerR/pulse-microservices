import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import {
  Notification,
  NotificationPreferences,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const notificationsApi = {
  async getNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false
  ): Promise<PaginatedResponse<Notification>> {
    return apiClient.get<PaginatedResponse<Notification>>(
      API_ENDPOINTS.notifications.list,
      {
        params: { page, limit, unread_only: unreadOnly },
      }
    );
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ unread_count: number }>>(
      API_ENDPOINTS.notifications.unreadCount
    );
    return response.data!.unread_count;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.put(API_ENDPOINTS.notifications.markRead(notificationId));
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.put(API_ENDPOINTS.notifications.markAllRead);
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<ApiResponse<NotificationPreferences>>(
      API_ENDPOINTS.notifications.preferences
    );
    return response.data!;
  },

  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const response = await apiClient.put<ApiResponse<NotificationPreferences>>(
      API_ENDPOINTS.notifications.preferences,
      preferences
    );
    return response.data!;
  },
};

