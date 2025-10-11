import useSWR from 'swr';

import fetcher from '@/libs/fetcher';
import useCurrentUser from './useCurrentUser';

const useMessages = (chatId?: string) => {
  const { data: currentUser } = useCurrentUser();

  const { data, error, mutate } = useSWR(
    currentUser && chatId ? `/api/chats/${chatId}/messages` : null,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
  };
};

export default useMessages;
