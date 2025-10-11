// Enhanced API client for microservice backend integration
// Based on the MIT-level specification for Pulse MVP

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired, redirect to login
      this.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Authentication methods
  async login(credentials: { usernameOrEmail: string; password: string }) {
    const response = await this.request<{
      success: boolean;
      data: {
        accessToken: string;
        refreshToken: string;
        user: any;
        expiresIn: string;
      };
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: credentials.usernameOrEmail, password: credentials.password }),
    });

    this.token = response.data.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
  }) {
    return this.request<any>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<any>('/api/v1/auth/me');
  }

  async updateProfile(profileData: any) {
    return this.request<{ user: any }>('/api/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return this.request('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async logout() {
    if (this.token) {
      try {
        await this.request('/api/v1/auth/logout', { method: 'POST' });
      } catch (error) {
        // Continue with logout even if server request fails
        console.warn('Logout request failed:', error);
      }
    }
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // User management methods
  async getActiveUsers() {
    return this.request('/api/v1/users/active');
  }

  async getUserById(id: number) {
    return this.request(`/api/v1/users/${id}`);
  }

  async searchUsers(params: {
    keyword?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, value.toString());
    });
    
    return this.request(`/api/v1/users/search?${searchParams.toString()}`);
  }

  async checkUsername(username: string) {
    return this.request(`/api/v1/users/check-username/${username}`);
  }

  async checkEmail(email: string) {
    return this.request(`/api/v1/users/check-email/${email}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Service health check
  async serviceHealthCheck() {
    return this.request('/health');
  }

  // Set token manually (for initialization)
  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiClient = new ApiClient();
