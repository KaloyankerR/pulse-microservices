import useSWR from 'swr';

import fetcher from '@/libs/fetcher';

const useEvent = (eventId?: string) => {
  const { data, error, mutate, isValidating } = useSWR(
    eventId ? `/api/events/${eventId}` : null,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
    isValidating,
  };
};

export default useEvent;
