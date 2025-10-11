import useSWR from 'swr';

import fetcher from '@/libs/fetcher';

const usePost = (postId?: string) => {
  const { data, error, mutate, isValidating } = useSWR(
    postId ? `/api/posts/${postId}` : null,
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

export default usePost;
