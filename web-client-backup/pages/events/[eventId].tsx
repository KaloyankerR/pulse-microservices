import React, { FC } from 'react';
import { useRouter } from 'next/router';

import EventDetailsPage from '@/components/events/EventDetailsPage';

const EventPage: FC = () => {
  const router = useRouter();
  const { eventId } = router.query;

  if (!eventId || typeof eventId !== 'string') {
    return (
      <div className='text-center text-neutral-500 py-8'>
        <p>Invalid event ID</p>
      </div>
    );
  }

  return <EventDetailsPage eventId={eventId} />;
};

export default EventPage;
