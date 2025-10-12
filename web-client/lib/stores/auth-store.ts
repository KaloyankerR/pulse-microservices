import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  login: async (email, password) => {
    try {
      console.log('[Auth Store] Starting login process:', { email });
      set({ isLoading: true, error: null });
      
      const response = await authApi.login({ email, password });
      
      console.log('[Auth Store] Login response received:', {
        hasSuccess: !!response.success,
        hasData: !!response.data,
        hasUser: !!response.data?.user
      });
      
      if (response.success && response.data) {
        console.log('[Auth Store] Login successful, updating state');
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        console.error('[Auth Store] Login response missing required fields:', response);
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
      console.error('[Auth Store] Login failed:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (email, username, password, fullName) => {
    try {
      console.log('[Auth Store] Starting registration:', { email, username });
      set({ isLoading: true, error: null });
      
      const response = await authApi.register({
        email,
        username,
        password,
        full_name: fullName,
      });
      
      console.log('[Auth Store] Registration response received:', {
        hasSuccess: !!response.success,
        hasData: !!response.data,
        hasUser: !!response.data?.user
      });
      
      if (response.success && response.data) {
        console.log('[Auth Store] Registration successful, updating state');
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        console.error('[Auth Store] Registration response missing required fields:', response);
        throw new Error('Invalid registration response');
      }
    } catch (error: any) {
      console.error('[Auth Store] Registration failed:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Registration failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Try to call the logout endpoint, but don't fail if it errors
      await authApi.logout();
    } catch (error) {
      // Ignore errors - we'll clear local state anyway
      console.log('[Auth Store] Logout API call failed (ignored):', error);
    } finally {
      // Always clear local state and tokens
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    console.log('[Auth Store] Checking authentication');
    
    // Only check auth if there's a token in localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('[Auth Store] No token found, setting unauthenticated');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }
      console.log('[Auth Store] Token found, verifying with server');
    }

    try {
      set({ isLoading: true });
      const user = await authApi.getCurrentUser();
      
      console.log('[Auth Store] User data received:', {
        hasId: !!user.id,
        hasUsername: !!user.username,
        username: user.username
      });
      
      // Validate user data
      if (!user || !user.id || !user.username) {
        console.error('[Auth Store] Auth check failed: Invalid user data received', user);
        throw new Error('Invalid user data received');
      }
      
      console.log('[Auth Store] Auth check successful');
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[Auth Store] Auth check failed:', error);
      // Clear tokens on auth check failure
      if (typeof window !== 'undefined') {
        console.log('[Auth Store] Clearing invalid tokens');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

