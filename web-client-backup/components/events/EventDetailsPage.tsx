import React, { FC, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

import { format } from 'date-fns';
import {
  RiCalendarLine,
  RiMapPinLine,
  RiUserLine,
  RiArrowLeftLine,
  RiEditLine,
  RiDeleteBinLine,
} from 'react-icons/ri';

import useCurrentUser from '@/hooks/useCurrentUser';
import useEvent from '@/hooks/useEvent';
import useRSVP from '@/hooks/useRSVP';

import Avatar from '@/components/Avatar';
import Button from '@/components/shared/Button';

interface IEventDetailsPageProps {
  eventId: string;
}

const EventDetailsPage: FC<IEventDetailsPageProps> = ({ eventId }) => {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: event, error, isLoading } = useEvent(eventId);
  const { rsvp, getUserRSVPStatus, getRSVPCounts } = useRSVP({ eventId });

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const goToUser = useCallback(
    (e: React.MouseEvent<HTMLHeadingElement>) => {
      e.stopPropagation();
      router.push(`/users/${event?.user?.username}`);
    },
    [router, event?.user?.username]
  );

  const handleRSVP = useCallback(
    (status: 'going' | 'maybe' | 'not_going') => {
      rsvp(status);
    },
    [rsvp]
  );

  const handleEdit = useCallback(() => {
    router.push(`/events/${eventId}/edit`);
  }, [router, eventId]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      router.push('/events');
    } catch (error) {
      console.error('Delete Event Error:', error);
    }
  }, [router, eventId]);

  const eventDate = useMemo(() => {
    if (!event?.eventDate) {
      return null;
    }
    return format(new Date(event.eventDate), 'EEEE, MMMM dd, yyyy • h:mm a');
  }, [event?.eventDate]);

  const userRSVPStatus = getUserRSVPStatus();
  const rsvpCounts = getRSVPCounts();
  const isEventFull =
    event?.maxAttendees && rsvpCounts.going >= event.maxAttendees;
  const isOwner = currentUser?.id === event?.userId;

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white'></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className='text-center text-neutral-500 py-8'>
        <p>Event not found</p>
        <Button
          label='Go Back'
          onClick={goBack}
          size='custom'
          labelSize='base'
          labelWeight='semibold'
        />
      </div>
    );
  }

  return (
    <div className='max-w-2xl mx-auto'>
      {/* Header */}
      <div className='flex items-center gap-4 p-4 border-b border-neutral-800'>
        <button
          onClick={goBack}
          className='p-2 hover:bg-neutral-800 rounded-full transition'
        >
          <RiArrowLeftLine size={20} className='text-white' />
        </button>
        <h1 className='text-xl font-bold text-white'>Event Details</h1>
      </div>

      {/* Event Content */}
      <div className='p-4'>
        {/* Event Header */}
        <div className='flex items-start gap-4 mb-6'>
          <Avatar username={event.user.username} size='medium' />
          <div className='flex-1'>
            <div className='flex gap-2 items-center mb-2'>
              <h5
                className='text-white font-semibold cursor-pointer hover:underline'
                onClick={goToUser}
              >
                {event.user.name}
              </h5>
              <h6
                className='text-neutral-500 cursor-pointer hover:underline'
                onClick={goToUser}
              >
                @{event.user.username}
              </h6>
            </div>

            <h2 className='text-2xl font-bold text-white mb-2'>
              {event.title}
            </h2>

            {event.description && (
              <p className='text-neutral-300 text-lg'>{event.description}</p>
            )}
          </div>

          {/* Event Actions */}
          {isOwner && (
            <div className='flex gap-2'>
              <button
                onClick={handleEdit}
                className='p-2 hover:bg-neutral-800 rounded-full transition'
                title='Edit Event'
              >
                <RiEditLine size={20} className='text-neutral-400' />
              </button>
              <button
                onClick={handleDelete}
                className='p-2 hover:bg-neutral-800 rounded-full transition'
                title='Delete Event'
              >
                <RiDeleteBinLine size={20} className='text-red-500' />
              </button>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className='space-y-4 mb-6'>
          <div className='flex items-center gap-3 text-neutral-300'>
            <RiCalendarLine size={20} />
            <span className='text-lg'>{eventDate}</span>
          </div>

          {event.location && (
            <div className='flex items-center gap-3 text-neutral-300'>
              <RiMapPinLine size={20} />
              <span className='text-lg'>{event.location}</span>
            </div>
          )}

          {event.maxAttendees && (
            <div className='flex items-center gap-3 text-neutral-300'>
              <RiUserLine size={20} />
              <span className='text-lg'>
                {rsvpCounts.going} / {event.maxAttendees} attendees
                {isEventFull && (
                  <span className='text-red-500 ml-2'>(Full)</span>
                )}
              </span>
            </div>
          )}

          <div className='flex items-center gap-3 text-neutral-300'>
            <span className='text-lg'>
              Visibility: <span className='capitalize'>{event.visibility}</span>
            </span>
          </div>
        </div>

        {/* RSVP Section */}
        {currentUser && (
          <div className='border-t border-neutral-800 pt-6'>
            <h3 className='text-xl font-bold text-white mb-4'>RSVP</h3>

            <div className='flex gap-3 mb-4'>
              <button
                className={`px-4 py-2 rounded-full font-medium transition ${
                  userRSVPStatus === 'going'
                    ? 'bg-green-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-green-600 hover:text-white'
                } ${isEventFull && userRSVPStatus !== 'going' ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleRSVP('going')}
                disabled={isEventFull && userRSVPStatus !== 'going'}
              >
                Going ({rsvpCounts.going})
              </button>

              <button
                className={`px-4 py-2 rounded-full font-medium transition ${
                  userRSVPStatus === 'maybe'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-yellow-600 hover:text-white'
                }`}
                onClick={() => handleRSVP('maybe')}
              >
                Maybe ({rsvpCounts.maybe})
              </button>

              <button
                className={`px-4 py-2 rounded-full font-medium transition ${
                  userRSVPStatus === 'not_going'
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-red-600 hover:text-white'
                }`}
                onClick={() => handleRSVP('not_going')}
              >
                Not Going ({rsvpCounts.not_going})
              </button>
            </div>

            {userRSVPStatus && (
              <p className='text-neutral-400'>
                You are currently marked as:{' '}
                <span className='capitalize text-white'>
                  {userRSVPStatus.replace('_', ' ')}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailsPage;
