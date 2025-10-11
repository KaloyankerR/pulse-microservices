import useSWR from 'swr';

import fetcher from '@/libs/fetcher';

const useFollowingDetails = (username: string) => {
  const { data, error, mutate } = useSWR(
    `/api/following?username=${username}`,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    mutate,
  };
};

export default useFollowingDetails;
