import axios from 'axios';
import MICROSERVICES_CONFIG from '@/config/microservices.config';

const fetcher = async (url: string) => {
  try {
    const headers: Record<string, string> = {};
    
    // Add JWT token if microservices are enabled and token exists
    if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED && typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error: any) {
    // Handle 401 errors more gracefully for unauthenticated requests
    if (error.response?.status === 401) {
      throw new Error('Not authenticated');
    }
    // Handle other errors
    if (error.response?.data) {
      throw error.response.data;
    }
    throw error.message || 'An error occurred';
  }
};

export default fetcher;
