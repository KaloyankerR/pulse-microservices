import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { config } from '../config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        
        // Debug logging
        console.log('[API Client] Request:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
        });
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (!token) {
          console.warn('[API Client] No token found in localStorage');
        }
        
        return config;
      },
      (error) => {
        console.error('[API Client] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.client.post('/api/v1/auth/refresh', {
                refreshToken,
              });

              const { accessToken } = response.data.data;
              this.setToken(accessToken);

              // Retry the original request
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Public methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      console.log(`[API Client] GET ${url} - Success:`, {
        status: response.status,
        data: response.data
      });
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] GET ${url} - Error:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      console.log(`[API Client] POST ${url} - Success:`, {
        status: response.status,
        data: response.data
      });
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] POST ${url} - Error:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
        requestData: data
      });
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      console.log(`[API Client] PUT ${url} - Success:`, {
        status: response.status,
        data: response.data
      });
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] PUT ${url} - Error:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      throw error;
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      console.log(`[API Client] PATCH ${url} - Success:`, {
        status: response.status,
        data: response.data
      });
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] PATCH ${url} - Error:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      console.log(`[API Client] DELETE ${url} - Success:`, {
        status: response.status,
        data: response.data
      });
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] DELETE ${url} - Error:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Helper to set tokens after login
  setAuthTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      console.log('[API Client] Tokens saved:', {
        accessTokenPreview: `${accessToken.substring(0, 20)}...`,
        refreshTokenPreview: `${refreshToken.substring(0, 20)}...`
      });
    }
  }

  // Helper to clear auth on logout
  logout(): void {
    this.clearTokens();
  }
}

export const apiClient = new ApiClient();

