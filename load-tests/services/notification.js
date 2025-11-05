import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, ENDPOINTS, HEADERS, TEST_CREDENTIALS } from '../lib/constants.js';
import { login, authenticatedRequest } from '../lib/auth.js';
import { validateJsonResponse, extractData, extractId, randomSleep } from '../lib/helpers.js';

/**
 * Notification Service Load Tests
 * Tests: get notifications, mark as read, get unread count
 */
export function notificationTests() {
  const token = login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  
  if (!token) {
    console.error('Failed to login, skipping notification tests');
    return;
  }

  // Get user notifications
  const notificationsUrl = `${BASE_URL}${ENDPOINTS.NOTIFICATION.LIST}?page=1&limit=20`;
  const notificationsResponse = authenticatedRequest('GET', notificationsUrl, token.accessToken, null, {
    tags: { name: 'Notification_GetList' },
  });
  validateJsonResponse(notificationsResponse, 200);
  const notifications = extractData(notificationsResponse, 'data.notifications');
  const firstNotification = notifications && notifications.length > 0 ? notifications[0] : null;
  const notificationId = firstNotification ? firstNotification._id : null;

  // Get unread count
  const unreadCountUrl = `${BASE_URL}${ENDPOINTS.NOTIFICATION.UNREAD_COUNT}`;
  const unreadCountResponse = authenticatedRequest('GET', unreadCountUrl, token.accessToken, null, {
    tags: { name: 'Notification_GetUnreadCount' },
  });
  validateJsonResponse(unreadCountResponse, 200);

  // Get notification stats
  const statsUrl = `${BASE_URL}${ENDPOINTS.NOTIFICATION.STATS}`;
  const statsResponse = authenticatedRequest('GET', statsUrl, token.accessToken, null, {
    tags: { name: 'Notification_GetStats' },
  });
  validateJsonResponse(statsResponse, 200);

  // Mark notification as read
  if (notificationId) {
    const markReadUrl = `${BASE_URL}${ENDPOINTS.NOTIFICATION.MARK_READ(notificationId)}`;
    const markReadResponse = authenticatedRequest('PUT', markReadUrl, token.accessToken, null, {
      tags: { name: 'Notification_MarkRead' },
    });
    validateJsonResponse(markReadResponse, 200);
  }

  // Get notification preferences
  const preferencesUrl = `${BASE_URL}${ENDPOINTS.NOTIFICATION.PREFERENCES}`;
  const preferencesResponse = authenticatedRequest('GET', preferencesUrl, token.accessToken, null, {
    tags: { name: 'Notification_GetPreferences' },
  });
  validateJsonResponse(preferencesResponse, 200);

  randomSleep(0.5, 1.5);
}

export default function () {
  notificationTests();
}

