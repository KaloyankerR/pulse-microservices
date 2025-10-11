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
      set({ isLoading: true, error: null });
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (email, username, password, fullName) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.register({
        email,
        username,
        password,
        full_name: fullName,
      });
      
      if (response.success && response.data) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Registration failed',
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
    // Only check auth if there's a token in localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }
    }

    try {
      set({ isLoading: true });
      const user = await authApi.getCurrentUser();
      
      // Validate user data
      if (!user || !user.id || !user.username) {
        console.error('Auth check failed: Invalid user data received', user);
        throw new Error('Invalid user data received');
      }
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Clear tokens on auth check failure
      if (typeof window !== 'undefined') {
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

