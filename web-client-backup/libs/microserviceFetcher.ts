import axios, { AxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

// Configuration for different API endpoints
const API_CONFIG = {
  // Microservices through Kong API Gateway
  MICROSERVICE_BASE: process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000',
  // Next.js API routes (existing functionality)
  NEXTJS_BASE: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
};

// Enhanced fetcher for microservices integration
class MicroserviceFetcher {
  private static instance: MicroserviceFetcher;
  private jwtToken: string | null = null;

  private constructor() {}

  static getInstance(): MicroserviceFetcher {
    if (!MicroserviceFetcher.instance) {
      MicroserviceFetcher.instance = new MicroserviceFetcher();
    }
    return MicroserviceFetcher.instance;
  }

  // Set JWT token for microservice authentication
  setJwtToken(token: string | null) {
    this.jwtToken = token;
  }

  // Get JWT token
  getJwtToken(): string | null {
    return this.jwtToken;
  }

  // Fetch from Spring Boot microservices
  async fetchMicroservice(endpoint: string, config?: AxiosRequestConfig) {
    try {
      const url = `${API_CONFIG.MICROSERVICE_BASE}${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config?.headers as Record<string, string> || {}),
      };

      // Add JWT token if available
      if (this.jwtToken) {
        headers['Authorization'] = `Bearer ${this.jwtToken}`;
      }

      const response = await axios({
        url,
        method: config?.method || 'GET',
        headers,
        withCredentials: true, // Include credentials for CORS
        ...config,
      });

      return response.data;
    } catch (error: any) {
      console.error('Microservice API Error:', error);
      
      if (error.response?.status === 401) {
        // Clear invalid token
        this.setJwtToken(null);
        throw new Error('Authentication failed');
      }
      
      if (error.response?.data) {
        throw error.response.data;
      }
      
      throw new Error(error.message || 'Microservice request failed');
    }
  }

  // Fetch from Next.js API routes (existing functionality)
  async fetchNextjs(endpoint: string, config?: AxiosRequestConfig) {
    try {
      const session = await getSession();
      const url = `${API_CONFIG.NEXTJS_BASE}/api${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config?.headers as Record<string, string> || {}),
      };

      // Add NextAuth session if available
      if (session?.user) {
        headers['X-User-Id'] = (session.user as any).id || '';
      }

      const response = await axios({
        url,
        method: config?.method || 'GET',
        headers,
        withCredentials: true, // Include credentials for CORS
        ...config,
      });

      return response.data;
    } catch (error: any) {
      console.error('Next.js API Error:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Not authenticated');
      }
      
      if (error.response?.data) {
        throw error.response.data;
      }
      
      throw new Error(error.message || 'API request failed');
    }
  }

  // Unified fetch method that determines which backend to use
  async fetch(endpoint: string, config?: AxiosRequestConfig & { useNextjs?: boolean }) {
    const { useNextjs, ...axiosConfig } = config || {};
    
    if (useNextjs) {
      return this.fetchNextjs(endpoint, axiosConfig);
    } else {
      return this.fetchMicroservice(endpoint, axiosConfig);
    }
  }
}

// Export singleton instance
const microserviceFetcher = MicroserviceFetcher.getInstance();

// Convenience functions for different operations
export const authAPI = {
  // Microservice authentication through Kong Gateway
  login: async (credentials: { usernameOrEmail: string; password: string }) => {
    return microserviceFetcher.fetchMicroservice('/api/v1/auth/login', {
      method: 'POST',
      data: { email: credentials.usernameOrEmail, password: credentials.password },
    });
  },
  
  register: async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    return microserviceFetcher.fetchMicroservice('/api/v1/auth/register', {
      method: 'POST',
      data: userData,
    });
  },
  
  getCurrentUser: async () => {
    return microserviceFetcher.fetchMicroservice('/api/v1/auth/me');
  },
  
  updateProfile: async (profileData: any) => {
    return microserviceFetcher.fetchMicroservice('/api/v1/users/profile', {
      method: 'PUT',
      data: profileData,
    });
  },
  
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    return microserviceFetcher.fetchMicroservice('/api/v1/auth/change-password', {
      method: 'POST',
      data: passwordData,
    });
  },
};

export const userAPI = {
  // Microservice user management through Kong Gateway
  getActiveUsers: async () => {
    return microserviceFetcher.fetchMicroservice('/api/v1/users/active');
  },
  
  getUserById: async (id: number) => {
    return microserviceFetcher.fetchMicroservice(`/api/v1/users/${id}`);
  },
  
  searchUsers: async (params: any) => {
    const queryString = new URLSearchParams(params).toString();
    return microserviceFetcher.fetchMicroservice(`/api/v1/users/search?${queryString}`);
  },
  
  checkUsername: async (username: string) => {
    return microserviceFetcher.fetchMicroservice(`/api/v1/users/check-username/${username}`);
  },
  
  checkEmail: async (email: string) => {
    return microserviceFetcher.fetchMicroservice(`/api/v1/users/check-email/${email}`);
  },
};

// Next.js API functions (existing functionality)
export const nextjsAPI = {
  // Posts
  getPosts: async () => {
    return microserviceFetcher.fetchNextjs('/posts');
  },
  
  createPost: async (postData: any) => {
    return microserviceFetcher.fetchNextjs('/posts', {
      method: 'POST',
      data: postData,
    });
  },
  
  // Events
  getEvents: async () => {
    return microserviceFetcher.fetchNextjs('/events');
  },
  
  createEvent: async (eventData: any) => {
    return microserviceFetcher.fetchNextjs('/events', {
      method: 'POST',
      data: eventData,
    });
  },
  
  // Chat
  getChats: async () => {
    return microserviceFetcher.fetchNextjs('/chats');
  },
  
  sendMessage: async (chatId: string, messageData: any) => {
    return microserviceFetcher.fetchNextjs(`/chats/${chatId}/messages`, {
      method: 'POST',
      data: messageData,
    });
  },
  
  // Notifications
  getNotifications: async (userId: string) => {
    return microserviceFetcher.fetchNextjs(`/notifications/${userId}`);
  },
};

export default microserviceFetcher;




