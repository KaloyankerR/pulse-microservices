import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import {
  UserWithSocial,
  FollowStats,
  FollowStatus,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const socialApi = {
  async followUser(userId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.social.follow(userId));
  },

  async unfollowUser(userId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.social.follow(userId));
  },

  async getFollowers(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<UserWithSocial>> {
    return apiClient.get<PaginatedResponse<UserWithSocial>>(
      API_ENDPOINTS.social.followers(userId),
      {
        params: { page, limit },
      }
    );
  },

  async getFollowing(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<UserWithSocial>> {
    return apiClient.get<PaginatedResponse<UserWithSocial>>(
      API_ENDPOINTS.social.following(userId),
      {
        params: { page, limit },
      }
    );
  },

  async getSocialStats(userId: string): Promise<FollowStats> {
    const response = await apiClient.get<ApiResponse<FollowStats>>(
      API_ENDPOINTS.social.stats(userId)
    );
    return response.data!;
  },

  async getFollowStatus(userId: string): Promise<FollowStatus> {
    const response = await apiClient.get<ApiResponse<FollowStatus>>(
      API_ENDPOINTS.social.status(userId)
    );
    return response.data!;
  },

  async getRecommendations(limit = 10, signal?: AbortSignal): Promise<UserWithSocial[]> {
    const response = await apiClient.get<ApiResponse<{ recommendations: UserWithSocial[] }>>(
      API_ENDPOINTS.social.recommendations,
      {
        params: { limit },
        signal,
      }
    );
    return response.data?.recommendations || [];
  },
};

