import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ApiResponse,
} from '@/types';
import { cleanAvatarUrl } from '../utils';

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
      
      // Clean avatar URL in the response
      if (response.data.user) {
        response.data.user.avatarUrl = cleanAvatarUrl(response.data.user.avatarUrl);
      }
    } else {
      throw new Error('Invalid login response structure');
    }
    
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Backend expects displayName (camelCase), not full_name (snake_case)
    const registerPayload = {
      email: data.email,
      username: data.username,
      password: data.password,
      displayName: data.full_name || data.username, // fallback to username
    };
    
    // Registration endpoint returns { success: true, data: { user }, meta }
    // But doesn't return tokens! So we need to login after registration
    const registerResponse = await apiClient.post<{ success: boolean; data: { user: User }; meta: any }>(
      API_ENDPOINTS.auth.register,
      registerPayload
    );
    
    if (!registerResponse.success || !registerResponse.data?.user) {
      throw new Error('Invalid registration response structure');
    }
    
    // Now login to get the tokens
    const loginResponse = await this.login({
      email: data.email,
      password: data.password
    });
    
    return loginResponse;
  },

  async logout(): Promise<void> {
    try {
      // Only call API if we have a token
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        await apiClient.post(API_ENDPOINTS.auth.logout);
      }
    } catch (error) {
      // Ignore logout API errors
    } finally {
      // Always clear tokens from localStorage
      apiClient.logout();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>(
      API_ENDPOINTS.auth.me
    );
    
    // Auth service returns: { success: true, data: { user: {...} }, meta: {...} }
    if (!response.data || !response.data.user) {
      throw new Error('Invalid response structure from /api/v1/auth/me');
    }
    
    const user = response.data.user;
    
    // Clean avatar URL
    user.avatarUrl = cleanAvatarUrl(user.avatarUrl);
    return user;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.auth.refresh, {
      refreshToken,
    });
  },
};

