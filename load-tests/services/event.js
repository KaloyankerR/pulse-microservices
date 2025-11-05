import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, ENDPOINTS, HEADERS, TEST_CREDENTIALS } from '../lib/constants.js';
import { login, authenticatedRequest } from '../lib/auth.js';
import { validateJsonResponse, extractData, extractId, randomString, randomSleep } from '../lib/helpers.js';

/**
 * Event Service Load Tests
 * Tests: get events, create event, RSVP, get attendees
 */
export function eventTests() {
  const token = login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  
  if (!token) {
    console.error('Failed to login, skipping event tests');
    return;
  }

  // Get all events
  const listUrl = `${BASE_URL}${ENDPOINTS.EVENT.LIST}?page=0&size=10`;
  const listResponse = authenticatedRequest('GET', listUrl, token.accessToken, null, {
    tags: { name: 'Event_GetAll' },
  });
  // Accept 200 or 404 (empty list)
  validateJsonResponse(listResponse, 200, [404]);
  const events = listResponse.status === 200 ? extractData(listResponse, 'events') : null;
  const firstEvent = events && events.length > 0 ? events[0] : null;
  const eventId = firstEvent ? firstEvent.id : null;

  // Create a new event
  const createUrl = `${BASE_URL}${ENDPOINTS.EVENT.CREATE}`;
  const createPayload = {
    title: `Load Test Event ${randomString(5)}`,
    description: 'This is a load testing event',
    start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    end_time: new Date(Date.now() + 90000000).toISOString(),
    location: 'Virtual',
  };
  const createResponse = authenticatedRequest('POST', createUrl, token.accessToken, createPayload, {
    tags: { name: 'Event_Create' },
  });
  validateJsonResponse(createResponse, 201);
  const newEventId = extractId(createResponse, 'id');

  if (eventId) {
    // Get event by ID
    const getEventUrl = `${BASE_URL}${ENDPOINTS.EVENT.GET_BY_ID(eventId)}`;
    const getEventResponse = authenticatedRequest('GET', getEventUrl, token.accessToken, null, {
      tags: { name: 'Event_GetById' },
    });
    validateJsonResponse(getEventResponse, 200);

    // RSVP to event
    const rsvpUrl = `${BASE_URL}${ENDPOINTS.EVENT.RSVP(eventId)}`;
    const rsvpResponse = authenticatedRequest('POST', rsvpUrl, token.accessToken, null, {
      tags: { name: 'Event_RSVP' },
    });
    check(rsvpResponse, {
      'RSVP status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });

    // Get event attendees
    const attendeesUrl = `${BASE_URL}${ENDPOINTS.EVENT.ATTENDEES(eventId)}`;
    const attendeesResponse = authenticatedRequest('GET', attendeesUrl, token.accessToken, null, {
      tags: { name: 'Event_GetAttendees' },
    });
    validateJsonResponse(attendeesResponse, 200);
  }

  // Cleanup: Delete created event if possible
  if (newEventId) {
    const deleteUrl = `${BASE_URL}${ENDPOINTS.EVENT.DELETE(newEventId)}`;
    const deleteResponse = authenticatedRequest('DELETE', deleteUrl, token.accessToken, null, {
      tags: { name: 'Event_Delete' },
    });
    check(deleteResponse, {
      'delete event status is 200 or 204': (r) => r.status === 200 || r.status === 204,
    });
  }

  randomSleep(0.5, 1.5);
}

export default function () {
  eventTests();
}

