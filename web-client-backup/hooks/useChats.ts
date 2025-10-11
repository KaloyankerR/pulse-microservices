import useSWR from 'swr';

import fetcher from '@/libs/fetcher';
import useCurrentUser from './useCurrentUser';

const useChats = () => {
  const { data: currentUser } = useCurrentUser();

  const { data, error, mutate } = useSWR(
    currentUser ? '/api/chats' : null,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
  };
};

export default useChats;
