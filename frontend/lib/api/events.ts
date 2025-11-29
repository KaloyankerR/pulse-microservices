import { apiClient } from './client';
import { API_ENDPOINTS } from '../config';
import { Event, CreateEventRequest, UpdateEventRequest, RsvpRequest, EventAttendee } from '@/types';

// Event Service response structure
interface EventsResponse {
  events: Event[];
  page: number;
  size: number;
  totalEvents: number;
  totalPages: number;
}

export const eventsApi = {
  async getEvents(page = 0, size = 20, signal?: AbortSignal): Promise<Event[]> {
    const response = await apiClient.get<EventsResponse>(API_ENDPOINTS.events.list, {
      params: { page, size },
      signal,
    });
    
    if (!response.events) {
      return [];
    }
    
    // Transform snake_case to camelCase for frontend compatibility
    return response.events.map((event: any) => ({
      ...event,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      creatorId: event.creator_id,
      startDate: event.start_date,
      endDate: event.end_date,
      eventType: event.event_type,
      virtualLink: event.virtual_link,
      rsvpCounts: event.rsvp_counts,
      userRsvp: event.user_rsvp,
      creator: event.creator ? {
        ...event.creator,
        displayName: event.creator.display_name,
        avatarUrl: event.creator.avatar_url
      } : undefined
    }));
  },

  async getEventById(id: string, signal?: AbortSignal): Promise<Event> {
    const response = await apiClient.get<any>(API_ENDPOINTS.events.byId(id), {
      signal,
    });
    
    // Transform snake_case to camelCase for frontend compatibility
    return {
      ...response,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      creatorId: response.creator_id,
      startDate: response.start_date,
      endDate: response.end_date,
      eventType: response.event_type,
      virtualLink: response.virtual_link,
      rsvpCounts: response.rsvp_counts,
      userRsvp: response.user_rsvp,
      creator: response.creator ? {
        ...response.creator,
        displayName: response.creator.display_name,
        avatarUrl: response.creator.avatar_url
      } : undefined
    };
  },

  async createEvent(data: CreateEventRequest): Promise<Event> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.events.create,
      data
    );
    
    // Transform snake_case to camelCase for frontend compatibility
    return {
      ...response,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      creatorId: response.creator_id,
      startDate: response.start_date,
      endDate: response.end_date,
      eventType: response.event_type,
      virtualLink: response.virtual_link,
      rsvpCounts: response.rsvp_counts,
      userRsvp: response.user_rsvp,
      creator: response.creator ? {
        ...response.creator,
        displayName: response.creator.display_name,
        avatarUrl: response.creator.avatar_url
      } : undefined
    };
  },

  async updateEvent(id: string, data: UpdateEventRequest): Promise<Event> {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.events.update(id),
      data
    );
    
    // Transform snake_case to camelCase for frontend compatibility
    return {
      ...response,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      creatorId: response.creator_id,
      startDate: response.start_date,
      endDate: response.end_date,
      eventType: response.event_type,
      virtualLink: response.virtual_link,
      rsvpCounts: response.rsvp_counts,
      userRsvp: response.user_rsvp,
      creator: response.creator ? {
        ...response.creator,
        displayName: response.creator.display_name,
        avatarUrl: response.creator.avatar_url
      } : undefined
    };
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.events.delete(id));
  },

  async rsvpToEvent(id: string, data: RsvpRequest): Promise<void> {
    await apiClient.post(API_ENDPOINTS.events.rsvp(id), data);
  },

  async getEventAttendees(id: string): Promise<EventAttendee[]> {
    const response = await apiClient.get<EventAttendee[]>(API_ENDPOINTS.events.attendees(id));
    
    // Transform snake_case to camelCase for frontend compatibility
    return response.map((attendee: any) => ({
      ...attendee,
      displayName: attendee.display_name,
      avatarUrl: attendee.avatar_url,
      rsvpStatus: attendee.rsvp_status,
      rsvpDate: attendee.rsvp_date
    }));
  },
};
