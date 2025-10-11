import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

import useCurrentUser from './useCurrentUser';
import useLoginModal from './useLoginModal';
import useEvent from './useEvent';

interface UseRSVPProps {
  eventId: string;
}

const useRSVP = ({ eventId }: UseRSVPProps) => {
  const { data: currentUser } = useCurrentUser();
  const loginModal = useLoginModal();
  const { data: eventData, mutate: mutateEvent } = useEvent(eventId);

  const rsvp = useCallback(
    async (status: 'going' | 'maybe' | 'not_going') => {
      if (!currentUser) {
        return loginModal.onOpen();
      }

      try {
        await axios.post(`/api/events/${eventId}/rsvp`, { status });

        toast.success(`RSVP updated to ${status.replace('_', ' ')}`);
        mutateEvent();
      } catch (error) {
        console.error('RSVP Error:', error);
        toast.error('Failed to update RSVP');
      }
    },
    [currentUser, loginModal, eventId, mutateEvent]
  );

  const hasRSVPed = useCallback(
    (status: 'going' | 'maybe' | 'not_going') => {
      if (!eventData?.rsvps || !currentUser) {
        return false;
      }

      return eventData.rsvps.some(
        (rsvp: any) => rsvp.userId === currentUser.id && rsvp.status === status
      );
    },
    [eventData?.rsvps, currentUser]
  );

  const getUserRSVPStatus = useCallback(() => {
    if (!eventData?.rsvps || !currentUser) {
      return null;
    }

    const userRSVP = eventData.rsvps.find(
      (rsvp: any) => rsvp.userId === currentUser.id
    );

    return userRSVP ? userRSVP.status : null;
  }, [eventData?.rsvps, currentUser]);

  const getRSVPCounts = useCallback(() => {
    if (!eventData?.rsvps) {
      return { going: 0, maybe: 0, not_going: 0 };
    }

    const counts = { going: 0, maybe: 0, not_going: 0 };

    eventData.rsvps.forEach((rsvp: any) => {
      if (rsvp.status in counts) {
        counts[rsvp.status as keyof typeof counts]++;
      }
    });

    return counts;
  }, [eventData?.rsvps]);

  return {
    rsvp,
    hasRSVPed,
    getUserRSVPStatus,
    getRSVPCounts,
  };
};

export default useRSVP;
