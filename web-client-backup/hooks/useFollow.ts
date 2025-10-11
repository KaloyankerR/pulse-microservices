import { useCallback, useMemo } from 'react';

import axios from 'axios';
import { toast } from 'react-hot-toast';

import useCurrentUser from '@/hooks/useCurrentUser';
import useLoginModal from '@/hooks/useLoginModal';
import useUser from '@/hooks/useUser';
import MICROSERVICES_CONFIG from '@/config/microservices.config';
import { socialService } from '@/services/socialService';

const useFollow = (userName: string) => {
  const { data: currentUser, mutate: mutateCurrentUser } = useCurrentUser();
  const { data: fetchedUser, mutate: mutateFetchedUser } = useUser(userName);

  const loginModal = useLoginModal();

  const userFollowingList = useMemo(() => {
    return currentUser?.followingIds || [];
  }, [currentUser?.followingIds]);

  const toggleFollow = useCallback(async () => {
    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    if (!fetchedUser?.id) {
      toast.error('User not found');
      return;
    }

    try {
      if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED) {
        // Use microservices social-service
        const isFollowing = userFollowingList.includes(fetchedUser.id);
        
        if (isFollowing) {
          await socialService.unfollowUser(fetchedUser.id);
          toast.success('Unfollowed successfully');
        } else {
          await socialService.followUser(fetchedUser.id);
          toast.success('Followed successfully');
        }
      } else {
        // Use local API
        let request;

        if (userFollowingList.includes(fetchedUser.id)) {
          request = () =>
            axios.delete(`/api/follow`, {
              data: {
                username: fetchedUser.username,
              },
            });
        } else {
          request = () =>
            axios.post(`/api/follow`, {
              username: fetchedUser.username,
            });
        }

        await request();
      }

      mutateCurrentUser();
      mutateFetchedUser();
    } catch (error: any) {
      console.log(error);
      toast.error(error.message || 'Failed to follow/unfollow user');
    }
  }, [
    currentUser,
    fetchedUser?.username,
    fetchedUser?.id,
    userFollowingList,
    loginModal,
    mutateCurrentUser,
    mutateFetchedUser,
  ]);

  return {
    userFollowingList,
    toggleFollow,
  };
};

export default useFollow;
