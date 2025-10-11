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
      await apiClient.post(API_ENDPOINTS.auth.logout);
    } finally {
      apiClient.logout();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.auth.me
    );
    return response.data!;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.auth.refresh, {
      refreshToken,
    });
  },
};

