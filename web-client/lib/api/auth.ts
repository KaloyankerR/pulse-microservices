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
    console.log('[Auth API] Login request:', { email: credentials.email });
    
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      credentials
    );
    
    console.log('[Auth API] Login response structure:', {
      hasSuccess: 'success' in response,
      hasData: 'data' in response,
      responseKeys: Object.keys(response)
    });
    
    if (response.success && response.data) {
      console.log('[Auth API] Login successful, storing tokens');
      apiClient.setAuthTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
    } else {
      console.error('[Auth API] Login response missing success or data:', response);
      throw new Error('Invalid login response structure');
    }
    
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log('[Auth API] Register request:', { 
      email: data.email,
      username: data.username 
    });
    
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
    
    console.log('[Auth API] Register response structure:', {
      hasSuccess: 'success' in registerResponse,
      hasData: 'data' in registerResponse,
      hasUser: registerResponse.data && 'user' in registerResponse.data,
      responseKeys: Object.keys(registerResponse)
    });
    
    if (!registerResponse.success || !registerResponse.data?.user) {
      console.error('[Auth API] Register response missing required fields:', registerResponse);
      throw new Error('Invalid registration response structure');
    }
    
    console.log('[Auth API] Registration successful, now logging in to get tokens');
    
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
      console.log('[Auth API] Logout API error (ignored):', error);
    } finally {
      // Always clear tokens from localStorage
      apiClient.logout();
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      console.log('[Auth API] Fetching current user');
      
      const response = await apiClient.get<ApiResponse<{ user: User }>>(
        API_ENDPOINTS.auth.me
      );
      
      console.log('[Auth API] getCurrentUser response:', {
        hasData: 'data' in response,
        hasUser: response.data && 'user' in response.data,
        responseKeys: Object.keys(response),
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      // Handle different response structures
      // User service returns: { success: true, data: { user: {...} }, meta: {...} }
      if (response.data && response.data.user) {
        console.log('[Auth API] Found user in response.data.user');
        return response.data.user;
      } else if ((response as any).user) {
        // Direct user property (without data wrapper)
        console.log('[Auth API] Found user in response.user');
        return (response as any).user;
      } else if (response.data && !response.data.user) {
        // User data directly in response.data
        console.log('[Auth API] Found user directly in response.data');
        return response.data as unknown as User;
      }
      
      console.error('[Auth API] Unexpected response structure:', response);
      throw new Error('Invalid response structure from /api/v1/users/profile');
    } catch (error) {
      console.error('[Auth API] Error in getCurrentUser:', error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.auth.refresh, {
      refreshToken,
    });
  },
};

