import { useState, useEffect, useCallback } from 'react';
import { eventsApi } from '../api/events';
import { usersApi } from '../api/users';
import { Event, CreateEventRequest, UpdateEventRequest, RsvpStatus, EventAttendee } from '@/types';
import { cleanAvatarUrl } from '../utils';
import { useAuthStore } from '../stores/auth-store';

// Helper function to enrich events with creator information
const enrichEventsWithCreators = async (events: Event[], currentUser: any): Promise<Event[]> => {
  const enrichedEvents = await Promise.all(
    events.map(async (event) => {
      // If creator info is already present, return as is
      if (event.creator?.username) {
        return event;
      }

      // Handle the mock event service case where creator_id is "current_user"
      if (event.creator_id === 'current_user' && currentUser) {
        return {
          ...event,
          creator: {
            id: currentUser.id, // Use the actual user ID instead of "current_user"
            username: currentUser.username,
            displayName: currentUser.displayName || currentUser.fullName,
            avatarUrl: cleanAvatarUrl(currentUser.avatarUrl),
          },
        };
      }

      try {
        // Fetch creator information from user service
        const creator = await usersApi.getUserById(event.creator_id);
        return {
          ...event,
          creator: {
            id: creator.id,
            username: creator.username,
            displayName: creator.displayName || creator.fullName,
            avatarUrl: cleanAvatarUrl(creator.avatarUrl),
          },
        };
      } catch (error) {
        // Failed to fetch creator info
        // Return event with fallback creator info
        return {
          ...event,
          creator: {
            id: event.creator_id,
            username: 'unknown_user',
            displayName: 'Unknown User',
            avatarUrl: undefined,
          },
        };
      }
    })
  );
  return enrichedEvents;
};

export function useEvents(page = 0, size = 20) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    // Check if token exists before making API call
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        setError('Authentication required');
        setEvents([]);
        return;
      }
    }

    // Create AbortController for this request
    const abortController = new AbortController();
    let isMounted = true;

    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await eventsApi.getEvents(page, size, abortController.signal);
        
        // Check if component is still mounted and request wasn't aborted
        if (!isMounted || abortController.signal.aborted) {
          return;
        }
        
        // Ensure we always set an array
        const eventsArray = Array.isArray(data) ? data : [];
        
        // Enrich events with creator information
        const enrichedEvents = await enrichEventsWithCreators(eventsArray, currentUser);
        
        // Check again after async enrichment
        if (!isMounted || abortController.signal.aborted) {
          return;
        }
        
        setEvents(enrichedEvents);
      } catch (err: any) {
        // Don't set error if request was aborted
        if (abortController.signal.aborted || !isMounted) {
          return;
        }
        
        // Check if it's an axios cancel error
        if (err.name === 'CanceledError' || err.message === 'canceled' || err.code === 'ERR_CANCELED') {
          return;
        }
        
        const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch events';
        setError(errorMessage);
        // Set empty array on error to prevent .map() issues
        setEvents([]);
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchEvents();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [page, size, currentUser?.id]); // Only depend on currentUser.id to avoid unnecessary refetches

  const createEvent = async (data: CreateEventRequest) => {
    try {
      // Add the current user's ID to the event data
      const eventDataWithCreator = {
        ...data,
        creator_id: currentUser?.id
      };
      
      const newEvent = await eventsApi.createEvent(eventDataWithCreator);
      
      // Enrich the new event with creator information
      const enrichedEvents = await enrichEventsWithCreators([newEvent], currentUser);
      const enrichedEvent = enrichedEvents[0];
      
      setEvents((prev) => [enrichedEvent, ...prev]);
      return enrichedEvent;
    } catch (error) {
      throw error;
    }
  };

  const updateEvent = async (id: string, data: UpdateEventRequest) => {
    try {
      const updatedEvent = await eventsApi.updateEvent(id, data);
      
      // Enrich the updated event with creator information
      const enrichedEvents = await enrichEventsWithCreators([updatedEvent], currentUser);
      const enrichedEvent = enrichedEvents[0];
      
      setEvents((prev) =>
        prev.map((event) => (event.id === id ? enrichedEvent : event))
      );
      return enrichedEvent;
    } catch (error) {
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await eventsApi.deleteEvent(eventId);
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      throw error;
    }
  };

  const rsvpToEvent = async (eventId: string, status: RsvpStatus) => {
    try {
      await eventsApi.rsvpToEvent(eventId, { status });
      
      // Optimistically update the event's RSVP counts and user RSVP
      setEvents((prev) =>
        prev.map((event) => {
          if (event.id === eventId) {
            const currentRsvp = event.user_rsvp;
            const newRsvpCounts = { ...event.rsvp_counts };
            
            // Remove from old status count
            if (currentRsvp === 'YES') newRsvpCounts.yes = Math.max(0, newRsvpCounts.yes - 1);
            else if (currentRsvp === 'MAYBE') newRsvpCounts.maybe = Math.max(0, newRsvpCounts.maybe - 1);
            else if (currentRsvp === 'NO') newRsvpCounts.no = Math.max(0, newRsvpCounts.no - 1);
            
            // Add to new status count
            if (status === 'YES') newRsvpCounts.yes += 1;
            else if (status === 'MAYBE') newRsvpCounts.maybe += 1;
            else if (status === 'NO') newRsvpCounts.no += 1;
            
            return {
              ...event,
              user_rsvp: status,
              rsvp_counts: newRsvpCounts,
            };
          }
          return event;
        })
      );
    } catch (error) {
      throw error;
    }
  };

  const refetch = useCallback(async () => {
    // Check if token exists before making API call
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        setError('Authentication required');
        setEvents([]);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await eventsApi.getEvents(page, size);
      
      // Ensure we always set an array
      const eventsArray = Array.isArray(data) ? data : [];
      
      // Enrich events with creator information
      const enrichedEvents = await enrichEventsWithCreators(eventsArray, currentUser);
      setEvents(enrichedEvents);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch events';
      setError(errorMessage);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, currentUser]);

  return {
    events,
    isLoading,
    error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent,
    rsvpToEvent,
  };
}

export function useEvent(id: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    // Check if token exists before making API call
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        setError('Authentication required');
        setEvent(null);
        return;
      }
    }

    // Create AbortController for this request
    const abortController = new AbortController();
    let isMounted = true;

    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await eventsApi.getEventById(id, abortController.signal);
        
        // Check if component is still mounted and request wasn't aborted
        if (!isMounted || abortController.signal.aborted) {
          return;
        }
        
        // Enrich event with creator information
        const enrichedEvents = await enrichEventsWithCreators([data], currentUser);
        
        // Check again after async enrichment
        if (!isMounted || abortController.signal.aborted) {
          return;
        }
        
        setEvent(enrichedEvents[0]);
      } catch (err: any) {
        // Don't set error if request was aborted
        if (abortController.signal.aborted || !isMounted) {
          return;
        }
        
        // Check if it's an axios cancel error
        if (err.name === 'CanceledError' || err.message === 'canceled' || err.code === 'ERR_CANCELED') {
          return;
        }
        
        const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch event';
        setError(errorMessage);
        setEvent(null);
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchEvent();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [id, currentUser?.id]); // Only depend on currentUser.id to avoid unnecessary refetches

  const updateEvent = async (data: UpdateEventRequest) => {
    if (!event) return;
    
    try {
      const updatedEvent = await eventsApi.updateEvent(event.id, data);
      
      // Enrich the updated event with creator information
      const enrichedEvents = await enrichEventsWithCreators([updatedEvent], currentUser);
      setEvent(enrichedEvents[0]);
      return enrichedEvents[0];
    } catch (error) {
      throw error;
    }
  };

  const deleteEvent = async () => {
    if (!event) return;
    
    try {
      await eventsApi.deleteEvent(event.id);
      setEvent(null);
    } catch (error) {
      throw error;
    }
  };

  const rsvpToEvent = async (status: RsvpStatus) => {
    if (!event) return;
    
    try {
      await eventsApi.rsvpToEvent(event.id, { status });
      
      // Optimistically update the event's RSVP counts and user RSVP
      const currentRsvp = event.user_rsvp;
      const newRsvpCounts = { ...event.rsvp_counts };
      
      // Remove from old status count
      if (currentRsvp === 'YES') newRsvpCounts.yes = Math.max(0, newRsvpCounts.yes - 1);
      else if (currentRsvp === 'MAYBE') newRsvpCounts.maybe = Math.max(0, newRsvpCounts.maybe - 1);
      else if (currentRsvp === 'NO') newRsvpCounts.no = Math.max(0, newRsvpCounts.no - 1);
      
      // Add to new status count
      if (status === 'YES') newRsvpCounts.yes += 1;
      else if (status === 'MAYBE') newRsvpCounts.maybe += 1;
      else if (status === 'NO') newRsvpCounts.no += 1;
      
      setEvent({
        ...event,
        user_rsvp: status,
        rsvp_counts: newRsvpCounts,
      });
    } catch (error) {
      throw error;
    }
  };

  return {
    event,
    isLoading,
    error,
    updateEvent,
    deleteEvent,
    rsvpToEvent,
  };
}

export function useEventAttendees(id: string) {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendees = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      // Check if token exists before making API call
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsLoading(false);
          setError('Authentication required');
          setAttendees([]);
          return;
        }
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await eventsApi.getEventAttendees(id);
        setAttendees(data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch attendees';
        setError(errorMessage);
        setAttendees([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendees();
  }, [id]);

  return { attendees, isLoading, error };
}
