import useSWR from 'swr';
import { useEffect } from 'react';

import fetcher from '@/libs/fetcher';
import useCurrentUser from './useCurrentUser';
import MICROSERVICES_CONFIG from '@/config/microservices.config';

const useEvents = (userId?: string) => {
  const { data: currentUser, isLoading: userLoading, isAuthenticated } = useCurrentUser();
  const url = userId ? `/api/events?userId=${userId}` : '/api/events';

  // For microservices, we need to ensure the user is authenticated and has a valid token
  const shouldFetch = MICROSERVICES_CONFIG.MICROSERVICES_ENABLED 
    ? (isAuthenticated && currentUser && !userLoading)
    : (currentUser && !userLoading);

  const { data, error, mutate, isValidating } = useSWR(
    shouldFetch ? url : null,
    fetcher
  );

  // Re-fetch events when authentication state changes
  useEffect(() => {
    if (shouldFetch) {
      mutate();
    }
  }, [currentUser, userLoading, isAuthenticated, mutate, shouldFetch]);

  return {
    data,
    error,
    isLoading: (!data && !error) || userLoading,
    mutate,
    isValidating,
  };
};

export default useEvents;
