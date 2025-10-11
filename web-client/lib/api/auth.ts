import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ApiResponse,
} from '@/types';

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      credentials
    );
    
    if (response.success && response.data) {
      apiClient.setAuthTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
    }
    
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.auth.register,
      data
    );
    
    if (response.success && response.data) {
      apiClient.setAuthTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
    }
    
    return response;
  },

  async logout(): Promise<void> {
    try {
      // Only call API if we have a token
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        await apiClient.post(API_ENDPOINTS.auth.logout);
      }
    } catch (error) {
      console.log('[Auth API] Logout API error (ignored):', error);
    } finally {
      // Always clear tokens from localStorage
      apiClient.logout();
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>(
        API_ENDPOINTS.auth.me
      );
      
      console.log('getCurrentUser response:', response);
      
      // Handle different response structures
      if (response.data && response.data.user) {
        return response.data.user;
      } else if ((response as any).user) {
        // Direct user property (without data wrapper)
        return (response as any).user;
      } else if (response.data && !response.data.user) {
        // User data directly in response.data
        return response.data as unknown as User;
      }
      
      console.error('Unexpected response structure:', response);
      throw new Error('Invalid response structure from /api/v1/users/profile');
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.auth.refresh, {
      refreshToken,
    });
  },
};

