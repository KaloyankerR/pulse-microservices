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
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
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
      } else {
        throw new Error('Invalid registration response');
      }
    } catch (error: any) {
      // Extract validation errors from backend response
      let errorMessage = error.response?.data?.error?.message || error.message || 'Registration failed';
      
      // If there are validation details, format them nicely
      if (error.response?.data?.error?.details && Array.isArray(error.response.data.error.details)) {
        const validationErrors = error.response.data.error.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join(', ');
        if (validationErrors) {
          errorMessage = validationErrors;
        }
      }
      
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
    // Only check auth if we're on the client-side and have a token
    if (typeof window === 'undefined') {
      // Server-side: don't check auth
      set({ isLoading: false });
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    try {
      set({ isLoading: true });
      
      // Wait a bit for config to be loaded if it's not ready yet
      let retries = 0;
      while (retries < 10 && typeof window !== 'undefined' && !(window as any).__APP_CONFIG__) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      const user = await authApi.getCurrentUser();
      
      // Validate user data
      if (!user || !user.id || !user.username) {
        throw new Error('Invalid user data received');
      }
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[AuthStore] checkAuth failed:', error);
      // Only clear tokens on actual auth errors (401, 403), not network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } else {
        // For other errors (network, etc.), keep tokens but mark as not authenticated
        // This prevents logout on temporary network issues
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }
  },

  clearError: () => set({ error: null }),
}));

