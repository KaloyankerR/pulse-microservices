import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import { User, ApiResponse, PaginatedResponse } from '@/types';
import { cleanAvatarUrl } from '../utils';

export const usersApi = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>(
      API_ENDPOINTS.users.profile
    );
    if (!response.data || !response.data.user) {
      throw new Error('Invalid response structure from user profile endpoint');
    }
    const user = response.data.user;
    return {
      ...user,
      avatarUrl: cleanAvatarUrl(user.avatarUrl)
    };
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>(
      API_ENDPOINTS.users.byId(id)
    );
    if (!response.data || !response.data.user) {
      throw new Error('Invalid response structure from getUserById endpoint');
    }
    const user = response.data.user;
    return {
      ...user,
      avatarUrl: cleanAvatarUrl(user.avatarUrl)
    };
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<{ user: User }>>(
      API_ENDPOINTS.users.updateProfile,
      data
    );
    if (!response.data || !response.data.user) {
      throw new Error('Invalid response structure from updateProfile endpoint');
    }
    const user = response.data.user;
    return {
      ...user,
      avatarUrl: cleanAvatarUrl(user.avatarUrl)
    };
  },

  async searchUsers(query: string, page = 1, limit = 20): Promise<{ data: { users: User[]; pagination: any } }> {
    const response = await apiClient.get<{ success: boolean; data: { users: User[]; pagination: any } }>(
      API_ENDPOINTS.users.search,
      {
        params: { q: query, page, limit },
      }
    );
    // Return the data structure expected by the frontend
    return {
      data: response.data || { users: [], pagination: {} },
    };
  },

  async updateProfileById(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<{ user: User }>>(
      API_ENDPOINTS.users.updateProfileById(id),
      data
    );
    if (!response.data || !response.data.user) {
      throw new Error('Invalid response structure from updateProfile endpoint');
    }
    const user = response.data.user;
    return {
      ...user,
      avatarUrl: cleanAvatarUrl(user.avatarUrl)
    };
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.users.deleteUser(id)
    );
    if (!response.data) {
      throw new Error('Invalid response structure from deleteUser endpoint');
    }
    return response.data;
  },

  async banUser(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.users.banUser(id),
      {}
    );
    if (!response.data) {
      throw new Error('Invalid response structure from banUser endpoint');
    }
    return response.data;
  },

  async unbanUser(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.users.unbanUser(id),
      {}
    );
    if (!response.data) {
      throw new Error('Invalid response structure from unbanUser endpoint');
    }
    return response.data;
  },

  async getAllUsers(page = 1, limit = 20): Promise<{ data: { users: User[]; pagination: any } }> {
    const response = await apiClient.get<{ success: boolean; data: { users: User[]; pagination: any } }>(
      API_ENDPOINTS.users.getAllUsers,
      {
        params: { page, limit },
      }
    );
    return {
      data: response.data || { users: [], pagination: {} },
    };
  },
};

