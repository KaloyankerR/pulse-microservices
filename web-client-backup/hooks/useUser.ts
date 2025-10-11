import useSWR from 'swr';
import MICROSERVICES_CONFIG from '@/config/microservices.config';
import fetcher from '@/libs/fetcher';

const useUser = (username: string) => {
  // For microservices mode, still use local API endpoint which will proxy or search
  // The backend needs to implement username search or we keep using local API for now
  const endpoint = `/api/users/${username}`;

  const { data, error, mutate } = useSWR(
    username ? endpoint : null,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
  };
};

export default useUser;
