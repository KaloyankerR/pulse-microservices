import useSWR from 'swr';
import { useSpringBootAuth } from './useSpringBootAuth';
import { useAuth } from './useAuth';
import MICROSERVICES_CONFIG from '@/config/microservices.config';

import fetcher from '@/libs/fetcher';

const useCurrentUser = () => {
  const springBootAuth = useSpringBootAuth();
  const { user, loading, isAuthenticated } = useAuth();
  
  // Use new API client authentication when microservices are enabled
  if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED) {
    return {
      data: isAuthenticated ? user : null,
      error: null,
      isLoading: loading,
      isAuthenticated,
      mutate: () => {
        // Force re-initialization of auth state
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser);
              // Trigger a re-render by updating state
              window.dispatchEvent(new Event('authStateChanged'));
            } catch (error) {
              console.error('Error parsing saved user:', error);
            }
          }
        }
      },
    };
  }
  
  // Fallback to NextAuth when microservices are disabled
  const { data, error, mutate } = useSWR('/api/current', fetcher);

  return {
    data,
    error,
    isLoading: !data && !error,
    isAuthenticated: !!data,
    mutate,
  };
};

export default useCurrentUser;
