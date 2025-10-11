import useSWR from 'swr';

import fetcher from '@/libs/fetcher';
import useCurrentUser from './useCurrentUser';

const useUsers = () => {
  const { data: currentUser } = useCurrentUser();

  const { data, error, mutate } = useSWR(
    currentUser ? '/api/users' : null,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
  };
};

export default useUsers;
