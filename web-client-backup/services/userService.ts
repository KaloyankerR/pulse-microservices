import axios from 'axios';
import MICROSERVICES_CONFIG from '@/config/microservices.config';

const baseURL = MICROSERVICES_CONFIG.GATEWAY_URL;

// Create axios instance with base configuration
const userClient = axios.create({
  baseURL,
  timeout: MICROSERVICES_CONFIG.TIMEOUT.MICROSERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
userClient.interceptors.request.use(
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
userClient.interceptors.response.use(
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

export const userService = {
  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    try {
      const response = await userClient.get(`/api/v1/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  },

  /**
   * Get user by username
   */
  async getUserByUsername(username: string) {
    try {
      // The backend might need a search endpoint or we map username to ID
      // For now, we'll use the same endpoint as getUserById
      // You may need to adjust this based on your backend API
      const response = await userClient.get(`/api/v1/users/username/${username}`);
      return response.data;
    } catch (error: any) {
      console.error('Get user by username error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: {
    displayName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    location?: string;
    website?: string;
    birthday?: string;
  }) {
    try {
      const response = await userClient.put(`/api/v1/users/${userId}`, profileData);
      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  /**
   * Search users
   */
  async searchUsers(query: string, page = 1, limit = 20) {
    try {
      const response = await userClient.get('/api/v1/users/search', {
        params: { query, page, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Search users error:', error);
      throw error;
    }
  },

  /**
   * Get active users (suggested users)
   */
  async getActiveUsers(limit = 5) {
    try {
      const response = await userClient.get('/api/v1/users/active', {
        params: { limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get active users error:', error);
      throw error;
    }
  },
};

export default userService;

