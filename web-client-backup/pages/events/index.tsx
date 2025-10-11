import React, { FC, useState } from 'react';

import CreateEventForm from '@/components/events/CreateEventForm';
import EventFeed from '@/components/events/EventFeed';

import useCurrentUser from '@/hooks/useCurrentUser';

const EventsPage: FC = () => {
  const { data: currentUser } = useCurrentUser();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='p-4 border-b border-neutral-800'>
        <h1 className='text-2xl font-bold text-white mb-4'>Events</h1>

        {currentUser && (
          <div className='flex gap-4'>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className='px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition'
            >
              {showCreateForm ? 'Cancel' : 'Create Event'}
            </button>
          </div>
        )}
      </div>

      {/* Create Event Form */}
      {showCreateForm && currentUser && (
        <CreateEventForm onClose={() => setShowCreateForm(false)} />
      )}

      {/* Events Feed */}
      <EventFeed />
    </div>
  );
};

export default EventsPage;
