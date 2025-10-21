'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CreateEvent } from '@/components/event/CreateEvent';
import { EventCard } from '@/components/event/EventCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useEvents } from '@/lib/hooks/use-events';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Calendar, Plus, Filter, MapPin, Video } from 'lucide-react';

type FilterType = 'ALL' | 'UPCOMING' | 'PAST';
type EventTypeFilter = 'ALL' | 'PHYSICAL' | 'VIRTUAL';

export default function EventsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { events, isLoading, error, createEvent, rsvpToEvent, deleteEvent } = useEvents();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<FilterType>('UPCOMING');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('ALL');

  const handleCreateEvent = async (data: any) => {
    await createEvent(data);
    setShowCreateForm(false);
  };

  const handleRsvp = async (eventId: string, status: any) => {
    await rsvpToEvent(eventId, status);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(eventId);
    }
  };

  // Filter events based on selected filters
  const filteredEvents = events.filter(event => {
    const now = new Date();
    const eventDate = new Date(event.start_date);
    
    // Time filter
    if (filter === 'UPCOMING' && eventDate < now) return false;
    if (filter === 'PAST' && eventDate >= now) return false;
    
    // Event type filter
    if (eventTypeFilter !== 'ALL' && event.event_type !== eventTypeFilter) return false;
    
    return true;
  });

  // Sort events by date (upcoming first, then by start date)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const now = new Date();
    const aDate = new Date(a.start_date);
    const bDate = new Date(b.start_date);
    
    // Past events go to the end
    if (aDate < now && bDate >= now) return 1;
    if (aDate >= now && bDate < now) return -1;
    
    // Sort by date
    return aDate.getTime() - bDate.getTime();
  });

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <Calendar className="mx-auto h-16 w-16 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Discover Events
            </h2>
            <p className="text-gray-600 text-lg mb-2">
              Join events and connect with your community
            </p>
            <p className="text-gray-500 mb-8">
              You need to register or login to view and create events
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/auth/register')}
                className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Register
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="flex-1 sm:flex-none px-8 py-3 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg transition-colors border-2 border-blue-600"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Events</h1>
                <p className="text-gray-600 mt-1">Discover and join events in your community</p>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="mt-4 sm:mt-0 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            {/* Create Event Form */}
            {showCreateForm && (
              <CreateEvent onEventCreate={handleCreateEvent} />
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Time Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <div className="flex space-x-2">
                    {[
                      { key: 'UPCOMING', label: 'Upcoming' },
                      { key: 'PAST', label: 'Past' },
                      { key: 'ALL', label: 'All' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setFilter(option.key as FilterType)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          filter === option.key
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Type Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="flex space-x-2">
                    {[
                      { key: 'ALL', label: 'All', icon: Calendar },
                      { key: 'PHYSICAL', label: 'Physical', icon: MapPin },
                      { key: 'VIRTUAL', label: 'Virtual', icon: Video },
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.key}
                          onClick={() => setEventTypeFilter(option.key as EventTypeFilter)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors flex items-center ${
                            eventTypeFilter === option.key
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Events List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-red-600 text-lg font-medium">
                    Failed to load events
                  </p>
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                </div>
              </div>
            ) : sortedEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No events found</p>
                <p className="text-gray-400 text-sm mt-2">
                  {filter === 'UPCOMING' ? 'No upcoming events' : 
                   filter === 'PAST' ? 'No past events' : 
                   'No events match your filters'}
                </p>
                {!showCreateForm && (
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create the first event
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRsvp={handleRsvp}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
