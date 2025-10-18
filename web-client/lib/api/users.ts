import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import { User, ApiResponse, PaginatedResponse } from '@/types';
import { cleanAvatarUrl } from '../utils';

export const usersApi = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.users.profile
    );
    const user = response.data!;
    return {
      ...user,
      avatarUrl: cleanAvatarUrl(user.avatarUrl)
    };
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>(
      API_ENDPOINTS.users.byId(id)
    );
    const user = response.data!.user;
    return {
      ...user,
      avatarUrl: cleanAvatarUrl(user.avatarUrl)
    };
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      API_ENDPOINTS.users.updateProfile,
      data
    );
    const user = response.data!;
    return {
      ...user,
      avatarUrl: cleanAvatarUrl(user.avatarUrl)
    };
  },

  async searchUsers(query: string, page = 1, limit = 20): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>(
      API_ENDPOINTS.users.search,
      {
        params: { q: query, page, limit },
      }
    );
  },
};

