import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/libs/api-client';

interface SpringBootUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive: boolean;
  isEmailVerified: boolean;
}

interface SpringBootAuthState {
  user: SpringBootUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useSpringBootAuth = () => {
  const [authState, setAuthState] = useState<SpringBootAuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        apiClient.setToken(token);
        setAuthState(prev => ({ ...prev, token }));
        // Verify token and load user
        verifyToken(token);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, []);

  // Verify JWT token
  const verifyToken = async (token: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      apiClient.setToken(token);
      const user = await apiClient.getCurrentUser();
      
      setAuthState(prev => ({
        ...prev,
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      }));
    } catch (error) {
      console.error('Spring Boot token verification failed:', error);
      // Clear invalid token
      localStorage.removeItem('authToken');
      apiClient.setToken(null);
      
      setAuthState(prev => ({
        ...prev,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      }));
    }
  };

  // Login
  const login = useCallback(async (credentials: {
    usernameOrEmail: string;
    password: string;
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiClient.login(credentials);
      const { accessToken, user } = response.data;
      
      setAuthState(prev => ({
        ...prev,
        user,
        token: accessToken,
        isLoading: false,
        isAuthenticated: true,
      }));
      
      toast.success('Successfully logged in!');
      return { success: true, user, token: accessToken };
    } catch (error: any) {
      console.error('Spring Boot login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const message = error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Register
  const register = useCallback(async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiClient.register(userData);
      const { user } = response.data;
      
      // Auto-login after registration
      return await login({ usernameOrEmail: userData.username, password: userData.password });
    } catch (error: any) {
      console.error('Spring Boot registration failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const message = error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [login]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
      
      setAuthState(prev => ({
        ...prev,
        user: null,
        token: null,
        isAuthenticated: false,
      }));
      
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
  };
};
