import React, { FC, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

import { formatDistanceToNowStrict, format } from 'date-fns';
import {
  RiCalendarLine,
  RiMapPinLine,
  RiUserLine,
  RiMoreFill,
  RiDeleteBinLine,
  RiEditLine,
} from 'react-icons/ri';

import useCurrentUser from '@/hooks/useCurrentUser';
import useLoginModal from '@/hooks/useLoginModal';
import useRSVP from '@/hooks/useRSVP';

import Avatar from '@/components/Avatar';

interface IEventCardProps {
  data: Record<string, any>;
  showActions?: boolean;
}

const EventCard: FC<IEventCardProps> = ({ data, showActions = true }) => {
  const loginModal = useLoginModal();
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { rsvp, getUserRSVPStatus, getRSVPCounts } = useRSVP({
    eventId: data.id,
  });

  const goToUser = useCallback(
    (event: React.MouseEvent<HTMLHeadingElement>) => {
      event.stopPropagation();
      router.push(`/users/${data?.user?.username}`);
    },
    [router, data?.user?.username]
  );

  const goToEvent = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      router.push(`/events/${data?.id}`);
    },
    [router, data?.id]
  );

  const handleRSVP = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement>,
      status: 'going' | 'maybe' | 'not_going'
    ) => {
      event.stopPropagation();
      rsvp(status);
    },
    [rsvp]
  );

  const createdAt = useMemo(() => {
    if (!data?.createdAt) {
      return null;
    }
    return formatDistanceToNowStrict(new Date(data.createdAt));
  }, [data?.createdAt]);

  const eventDate = useMemo(() => {
    if (!data?.eventDate) {
      return null;
    }
    return format(new Date(data.eventDate), 'MMM dd, yyyy • h:mm a');
  }, [data?.eventDate]);

  const userRSVPStatus = getUserRSVPStatus();
  const rsvpCounts = getRSVPCounts();
  const isEventFull =
    data.maxAttendees && rsvpCounts.going >= data.maxAttendees;

  return (
    <div
      className='border-neutral-800 p-4 border-b transition hover:bg-neutral-900 cursor-pointer'
      onClick={goToEvent}
    >
      <div className='flex items-start gap-4 relative'>
        <Avatar username={data.user.username} size='small' />
        <div className='flex flex-col flex-1'>
          <div className='flex gap-2 items-center'>
            <h5
              className='text-white font-semibold cursor-pointer hover:underline'
              onClick={goToUser}
            >
              {data.user.name}
            </h5>
            <h6
              className='text-neutral-500 cursor-pointer hover:underline'
              onClick={goToUser}
            >
              @{data.user.username}
            </h6>
            <span className='text-neutral-500'>·</span>
            <span className='text-neutral-500'>{createdAt}</span>
          </div>

          {/* Event Title */}
          <h3 className='text-white text-lg font-bold mt-2'>{data.title}</h3>

          {/* Event Description */}
          {data.description && (
            <p className='text-neutral-300 mt-1'>{data.description}</p>
          )}

          {/* Event Details */}
          <div className='mt-3 space-y-2'>
            <div className='flex items-center gap-2 text-neutral-400'>
              <RiCalendarLine size={16} />
              <span>{eventDate}</span>
            </div>

            {data.location && (
              <div className='flex items-center gap-2 text-neutral-400'>
                <RiMapPinLine size={16} />
                <span>{data.location}</span>
              </div>
            )}

            {data.maxAttendees && (
              <div className='flex items-center gap-2 text-neutral-400'>
                <RiUserLine size={16} />
                <span>
                  {rsvpCounts.going} / {data.maxAttendees} attendees
                  {isEventFull && (
                    <span className='text-red-500 ml-1'>(Full)</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* RSVP Buttons */}
          {showActions && currentUser && (
            <div className='flex gap-2 mt-4'>
              <button
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  userRSVPStatus === 'going'
                    ? 'bg-green-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-green-600 hover:text-white'
                } ${isEventFull && userRSVPStatus !== 'going' ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={e => handleRSVP(e, 'going')}
                disabled={isEventFull && userRSVPStatus !== 'going'}
              >
                Going ({rsvpCounts.going})
              </button>

              <button
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  userRSVPStatus === 'maybe'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-yellow-600 hover:text-white'
                }`}
                onClick={e => handleRSVP(e, 'maybe')}
              >
                Maybe ({rsvpCounts.maybe})
              </button>

              <button
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  userRSVPStatus === 'not_going'
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-red-600 hover:text-white'
                }`}
                onClick={e => handleRSVP(e, 'not_going')}
              >
                Not Going ({rsvpCounts.not_going})
              </button>
            </div>
          )}

          {/* Event Actions Menu */}
          {showActions &&
            currentUser &&
            data?.user?.username === currentUser?.username && (
              <RiMoreFill
                className='absolute right-0 top-0 text-neutral-400 hover:text-white cursor-pointer'
                onClick={e => {
                  e.stopPropagation();
                  // TODO: Implement event actions menu
                }}
              />
            )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
