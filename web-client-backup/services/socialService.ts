import axios from 'axios';
import MICROSERVICES_CONFIG from '@/config/microservices.config';

const baseURL = MICROSERVICES_CONFIG.GATEWAY_URL;

// Create axios instance with base configuration
const socialClient = axios.create({
  baseURL,
  timeout: MICROSERVICES_CONFIG.TIMEOUT.MICROSERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
socialClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
socialClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const socialService = {
  /**
   * Follow a user
   */
  async followUser(userId: string) {
    try {
      const response = await socialClient.post(`/api/v1/social/follow/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Follow user error:', error);
      throw error;
    }
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string) {
    try {
      const response = await socialClient.delete(`/api/v1/social/follow/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Unfollow user error:', error);
      throw error;
    }
  },

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, page = 1, limit = 20) {
    try {
      const response = await socialClient.get(`/api/v1/social/followers/${userId}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get followers error:', error);
      throw error;
    }
  },

  /**
   * Get user's following
   */
  async getFollowing(userId: string, page = 1, limit = 20) {
    try {
      const response = await socialClient.get(`/api/v1/social/following/${userId}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get following error:', error);
      throw error;
    }
  },

  /**
   * Check if current user is following a specific user
   */
  async isFollowing(userId: string) {
    try {
      const response = await socialClient.get(`/api/v1/social/is-following/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Check following status error:', error);
      throw error;
    }
  },

  /**
   * Get social stats for a user
   */
  async getSocialStats(userId: string) {
    try {
      const response = await socialClient.get(`/api/v1/social/stats/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get social stats error:', error);
      throw error;
    }
  },

  /**
   * Block a user
   */
  async blockUser(userId: string) {
    try {
      const response = await socialClient.post(`/api/v1/social/block/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Block user error:', error);
      throw error;
    }
  },

  /**
   * Unblock a user
   */
  async unblockUser(userId: string) {
    try {
      const response = await socialClient.delete(`/api/v1/social/block/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Unblock user error:', error);
      throw error;
    }
  },

  /**
   * Get blocked users
   */
  async getBlockedUsers(page = 1, limit = 20) {
    try {
      const response = await socialClient.get('/api/v1/social/blocked', {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get blocked users error:', error);
      throw error;
    }
  },
};

export default socialService;

