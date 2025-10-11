import React, { FC } from 'react';

import EventCard from './EventCard';
import useEvents from '@/hooks/useEvents';

interface IEventFeedProps {
  userId?: string;
}

const EventFeed: FC<IEventFeedProps> = ({ userId }) => {
  const { data: eventsData, error, isLoading } = useEvents(userId);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-24'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center text-neutral-500 py-8'>
        <p>Failed to load events</p>
        <p className='text-sm text-red-500 mt-2'>{error.toString()}</p>
      </div>
    );
  }

  if (!eventsData) {
    return (
      <div className='text-center text-neutral-500 py-8'>
        <p>Loading events...</p>
      </div>
    );
  }

  if (!eventsData.events || eventsData.events.length === 0) {
    return (
      <div className='text-center text-neutral-500 py-8'>
        <p>No events found</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      {eventsData.events.map((event: any) => (
        <EventCard key={event.id} data={event} />
      ))}
    </div>
  );
};

export default EventFeed;
