import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import { User, ApiResponse, PaginatedResponse } from '@/types';

export const usersApi = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.users.profile
    );
    return response.data!;
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.users.byId(id)
    );
    return response.data!;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      API_ENDPOINTS.users.updateProfile,
      data
    );
    return response.data!;
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

