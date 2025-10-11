import { useState, useEffect, useCallback } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import microserviceFetcher, { authAPI } from '@/libs/microserviceFetcher';
import MICROSERVICES_CONFIG from '@/config/microservices.config';

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

interface HybridAuthState {
  // NextAuth session
  nextAuthUser: any;
  nextAuthLoading: boolean;
  
  // Spring Boot JWT user
  springBootUser: SpringBootUser | null;
  springBootLoading: boolean;
  springBootToken: string | null;
  
  // Combined state
  isAuthenticated: boolean;
  currentUser: any;
  authMethod: 'nextauth' | 'springboot' | 'none';
}

// Conditional hook for NextAuth session
const useNextAuthSession = () => {
  if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED) {
    // Return mock session when microservices are enabled
    return { data: null, status: 'unauthenticated' as const };
  }
  
  // Only import and use NextAuth when microservices are disabled
  try {
    const { useSession } = require('next-auth/react');
    return useSession();
  } catch (error) {
    return { data: null, status: 'unauthenticated' as const };
  }
};

export const useHybridAuth = () => {
  const { data: session, status: sessionStatus } = useNextAuthSession();
  
  const [authState, setAuthState] = useState<HybridAuthState>({
    nextAuthUser: null,
    nextAuthLoading: true,
    springBootUser: null,
    springBootLoading: true,
    springBootToken: null,
    isAuthenticated: false,
    currentUser: null,
    authMethod: 'none',
  });

  // Load Spring Boot token from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('springboot_jwt_token');
      if (token) {
        microserviceFetcher.setJwtToken(token);
        setAuthState(prev => ({ ...prev, springBootToken: token }));
        // Verify token and load user
        verifySpringBootToken(token);
      } else {
        setAuthState(prev => ({ ...prev, springBootLoading: false }));
      }
    }
  }, []);

  // Update NextAuth state (only if microservices are disabled)
  useEffect(() => {
    if (!MICROSERVICES_CONFIG.MICROSERVICES_ENABLED) {
      setAuthState(prev => ({
        ...prev,
        nextAuthUser: session?.user || null,
        nextAuthLoading: sessionStatus === 'loading',
      }));
    } else {
      // When microservices are enabled, ignore NextAuth
      setAuthState(prev => ({
        ...prev,
        nextAuthUser: null,
        nextAuthLoading: false,
      }));
    }
  }, [session, sessionStatus]);

  // Update combined authentication state
  useEffect(() => {
    const { nextAuthUser, springBootUser, nextAuthLoading, springBootLoading } = authState;
    
    if (nextAuthLoading || springBootLoading) {
      return; // Still loading
    }

    let isAuthenticated = false;
    let currentUser: any = null;
    let authMethod: 'nextauth' | 'springboot' | 'none' = 'none';

    if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED) {
      // When microservices are enabled, only use Spring Boot authentication
      if (springBootUser) {
        isAuthenticated = true;
        currentUser = springBootUser;
        authMethod = 'springboot';
      }
    } else {
      // When microservices are disabled, use NextAuth
      if (nextAuthUser) {
        isAuthenticated = true;
        currentUser = nextAuthUser;
        authMethod = 'nextauth';
      }
    }

    setAuthState(prev => ({
      ...prev,
      isAuthenticated,
      currentUser,
      authMethod,
    }));
  }, [authState.nextAuthUser, authState.springBootUser, authState.nextAuthLoading, authState.springBootLoading]);

  // Verify Spring Boot JWT token
  const verifySpringBootToken = async (token: string) => {
    try {
      setAuthState(prev => ({ ...prev, springBootLoading: true }));
      
      microserviceFetcher.setJwtToken(token);
      const user = await authAPI.getCurrentUser();
      
      setAuthState(prev => ({
        ...prev,
        springBootUser: user,
        springBootToken: token,
        springBootLoading: false,
      }));
    } catch (error) {
      console.error('Spring Boot token verification failed:', error);
      // Clear invalid token
      localStorage.removeItem('springboot_jwt_token');
      microserviceFetcher.setJwtToken(null);
      
      setAuthState(prev => ({
        ...prev,
        springBootUser: null,
        springBootToken: null,
        springBootLoading: false,
      }));
    }
  };

  // Spring Boot login
  const springBootLogin = useCallback(async (credentials: {
    usernameOrEmail: string;
    password: string;
  }) => {
    try {
      setAuthState(prev => ({ ...prev, springBootLoading: true }));
      
      const response = await authAPI.login(credentials);
      const { token, user } = response;
      
      // Store token
      localStorage.setItem('springboot_jwt_token', token);
      microserviceFetcher.setJwtToken(token);
      
      setAuthState(prev => ({
        ...prev,
        springBootUser: user,
        springBootToken: token,
        springBootLoading: false,
      }));
      
      toast.success('Successfully logged in!');
      return { success: true, user, token };
    } catch (error: any) {
      console.error('Spring Boot login failed:', error);
      setAuthState(prev => ({ ...prev, springBootLoading: false }));
      
      const message = error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Spring Boot register
  const springBootRegister = useCallback(async (userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      setAuthState(prev => ({ ...prev, springBootLoading: true }));
      
      const response = await authAPI.register(userData);
      const { token, user } = response;
      
      // Store token
      localStorage.setItem('springboot_jwt_token', token);
      microserviceFetcher.setJwtToken(token);
      
      setAuthState(prev => ({
        ...prev,
        springBootUser: user,
        springBootToken: token,
        springBootLoading: false,
      }));
      
      toast.success('Registration successful!');
      return { success: true, user, token };
    } catch (error: any) {
      console.error('Spring Boot registration failed:', error);
      setAuthState(prev => ({ ...prev, springBootLoading: false }));
      
      const message = error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Unified login (uses Spring Boot if enabled, otherwise NextAuth)
  const login = useCallback(async (credentials: {
    usernameOrEmail: string;
    password: string;
  }) => {
    if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED) {
      return springBootLogin(credentials);
    } else {
      // Use NextAuth
      try {
        const result = await signIn('credentials', {
          loginInput: credentials.usernameOrEmail,
          password: credentials.password,
          redirect: false,
        });
        
        if (result?.ok) {
          toast.success('Successfully logged in!');
          return { success: true };
        } else {
          toast.error('Login failed');
          return { success: false, error: 'Invalid credentials' };
        }
      } catch (error) {
        toast.error('Login failed');
        return { success: false, error: 'Login service unavailable' };
      }
    }
  }, [springBootLogin]);

  // Unified register (uses Spring Boot if enabled, otherwise Next.js API)
  const register = useCallback(async (userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED) {
      return springBootRegister(userData);
    } else {
      // Use existing Next.js registration
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          toast.success('Registration successful!');
          return { success: true, user: data };
        } else {
          toast.error(data.error || 'Registration failed');
          return { success: false, error: data.error };
        }
      } catch (error: any) {
        toast.error('Registration failed');
        return { success: false, error: error.message };
      }
    }
  }, [springBootRegister]);

  // Unified logout
  const logout = useCallback(async () => {
    try {
      // Clear Spring Boot token
      localStorage.removeItem('springboot_jwt_token');
      microserviceFetcher.setJwtToken(null);
      
      // Sign out from NextAuth
      await signOut({ redirect: false });
      
      setAuthState(prev => ({
        ...prev,
        springBootUser: null,
        springBootToken: null,
        isAuthenticated: false,
        currentUser: null,
        authMethod: 'none',
      }));
      
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  }, []);

  return {
    // Combined state
    isAuthenticated: authState.isAuthenticated,
    currentUser: authState.currentUser,
    authMethod: authState.authMethod,
    isLoading: authState.nextAuthLoading || authState.springBootLoading,
    
    // Specific states
    nextAuthUser: authState.nextAuthUser,
    springBootUser: authState.springBootUser,
    springBootToken: authState.springBootToken,
    
    // Methods
    login,
    register,
    logout,
    springBootLogin,
    springBootRegister,
    
    // Utils
    microservicesEnabled: MICROSERVICES_CONFIG.MICROSERVICES_ENABLED,
  };
};




