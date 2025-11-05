import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, ENDPOINTS, HEADERS, TEST_CREDENTIALS } from '../lib/constants.js';
import { login, authenticatedRequest } from '../lib/auth.js';
import { validateJsonResponse, extractData, extractId, randomMessageContent, randomSleep } from '../lib/helpers.js';

/**
 * Messaging Service Load Tests
 * Tests: get conversations, send message, mark as read
 */
export function messagingTests() {
  const token = login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  
  if (!token) {
    console.error('Failed to login, skipping messaging tests');
    return;
  }

  // Get user conversations
  const conversationsUrl = `${BASE_URL}${ENDPOINTS.MESSAGING.CONVERSATIONS}?limit=10&offset=0`;
  const conversationsResponse = authenticatedRequest('GET', conversationsUrl, token.accessToken, null, {
    tags: { name: 'Messaging_GetConversations' },
  });
  // Accept 200 or 404 (no conversations)
  validateJsonResponse(conversationsResponse, 200, [404]);
  const conversations = conversationsResponse.status === 200 ? extractData(conversationsResponse, 'data') : null;
  const firstConversation = conversations && conversations.length > 0 ? conversations[0] : null;
  const conversationId = firstConversation ? firstConversation.id : null;

  if (conversationId) {
    // Get conversation messages
    const messagesUrl = `${BASE_URL}${ENDPOINTS.MESSAGING.MESSAGES(conversationId)}?limit=20&offset=0`;
    const messagesResponse = authenticatedRequest('GET', messagesUrl, token.accessToken, null, {
      tags: { name: 'Messaging_GetMessages' },
    });
    validateJsonResponse(messagesResponse, 200);
    const messages = extractData(messagesResponse, 'data');
    const firstMessage = messages && messages.length > 0 ? messages[0] : null;
    const messageId = firstMessage ? firstMessage.id : null;

    // Send a new message
    const sendMessageUrl = `${BASE_URL}${ENDPOINTS.MESSAGING.SEND_MESSAGE}`;
    const messagePayload = {
      conversation_id: conversationId,
      content: randomMessageContent(),
    };
    const sendMessageResponse = authenticatedRequest('POST', sendMessageUrl, token.accessToken, messagePayload, {
      tags: { name: 'Messaging_SendMessage' },
    });
    validateJsonResponse(sendMessageResponse, 201);
    const newMessageId = extractId(sendMessageResponse, 'data.id');

    // Mark message as read
    if (messageId || newMessageId) {
      const markReadUrl = `${BASE_URL}${ENDPOINTS.MESSAGING.MARK_READ(newMessageId || messageId)}`;
      const markReadResponse = authenticatedRequest('PUT', markReadUrl, token.accessToken, null, {
        tags: { name: 'Messaging_MarkRead' },
      });
      check(markReadResponse, {
        'mark read status is 200': (r) => r.status === 200,
      });
    }

    // Get conversation by ID
    const getConversationUrl = `${BASE_URL}${ENDPOINTS.MESSAGING.CONVERSATION_BY_ID(conversationId)}`;
    const getConversationResponse = authenticatedRequest('GET', getConversationUrl, token.accessToken, null, {
      tags: { name: 'Messaging_GetConversation' },
    });
    validateJsonResponse(getConversationResponse, 200);
  }

  randomSleep(0.5, 1.5);
}

export default function () {
  messagingTests();
}

