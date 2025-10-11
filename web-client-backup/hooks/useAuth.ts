import { useState, useEffect } from 'react';
import { apiClient } from '@/libs/api-client';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setAuthState(prev => ({ ...prev, user: userData, isAuthenticated: true }));
          
          // Verify token is still valid
          await apiClient.getCurrentUser();
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setAuthState(prev => ({ ...prev, user: null, isAuthenticated: false }));
        }
      }
      setAuthState(prev => ({ ...prev, loading: false }));
    };

    initAuth();

    // Listen for authentication state changes
    const handleAuthStateChange = () => {
      initAuth();
    };

    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange);
    };
  }, []);

  const login = async (credentials: { usernameOrEmail: string; password: string }) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const response = await apiClient.login(credentials);
      setAuthState(prev => ({ 
        ...prev, 
        user: response.data.user, 
        isAuthenticated: true, 
        loading: false 
      }));
      
      // Trigger authentication state change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authStateChanged'));
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      await apiClient.register(userData);
      // Auto-login after registration
      await login({
        usernameOrEmail: userData.username,
        password: userData.password,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      setAuthState(prev => ({ 
        ...prev, 
        user: null, 
        isAuthenticated: false 
      }));
      
      // Trigger authentication state change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authStateChanged'));
      }
    } catch (error) {
      // Continue with logout even if server request fails
      setAuthState(prev => ({ 
        ...prev, 
        user: null, 
        isAuthenticated: false 
      }));
      
      // Trigger authentication state change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authStateChanged'));
      }
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      const updatedUser = await apiClient.updateProfile(profileData);
      setAuthState(prev => ({ 
        ...prev, 
        user: updatedUser.user || updatedUser 
      }));
    } catch (error) {
      throw error;
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    isAuthenticated: authState.isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };
};
