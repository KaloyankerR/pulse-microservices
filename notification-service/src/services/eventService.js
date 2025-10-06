const NotificationService = require('./notificationService');
const UserCache = require('../models/userCache');
const logger = require('../utils/logger');
const metrics = require('../config/metrics');

class EventService {
  constructor() {
    this.consumers = new Map();
  }

  // Initialize all event consumers
  async initializeConsumers(rabbitmq) {
    try {
      logger.info('Initializing event consumers');

      // User events
      await this.setupUserEventConsumers(rabbitmq);
      
      // Post events
      await this.setupPostEventConsumers(rabbitmq);
      
      // Event events
      await this.setupEventEventConsumers(rabbitmq);
      
      // Social events
      await this.setupSocialEventConsumers(rabbitmq);
      
      // Messaging events
      await this.setupMessagingEventConsumers(rabbitmq);

      logger.info('All event consumers initialized successfully');
    } catch (error) {
      logger.logError(error, { action: 'initializeConsumers' });
      throw error;
    }
  }

  // Setup user-related event consumers
  async setupUserEventConsumers(rabbitmq) {
    const userEvents = [
      { routingKey: 'user.registered', handler: this.handleUserRegistered.bind(this) },
      { routingKey: 'user.updated', handler: this.handleUserUpdated.bind(this) },
      { routingKey: 'user.deleted', handler: this.handleUserDeleted.bind(this) },
    ];

    for (const event of userEvents) {
      await rabbitmq.setupConsumer(
        `notification-service.user.${event.routingKey}`,
        'user_events',
        event.routingKey,
        event.handler
      );
      
      this.consumers.set(event.routingKey, true);
      logger.info(`User event consumer setup: ${event.routingKey}`);
    }
  }

  // Setup post-related event consumers
  async setupPostEventConsumers(rabbitmq) {
    const postEvents = [
      { routingKey: 'post.created', handler: this.handlePostCreated.bind(this) },
      { routingKey: 'post.liked', handler: this.handlePostLiked.bind(this) },
      { routingKey: 'post.commented', handler: this.handlePostCommented.bind(this) },
      { routingKey: 'post.shared', handler: this.handlePostShared.bind(this) },
      { routingKey: 'post.mentioned', handler: this.handlePostMentioned.bind(this) },
    ];

    for (const event of postEvents) {
      await rabbitmq.setupConsumer(
        `notification-service.post.${event.routingKey}`,
        'post_events',
        event.routingKey,
        event.handler
      );
      
      this.consumers.set(event.routingKey, true);
      logger.info(`Post event consumer setup: ${event.routingKey}`);
    }
  }

  // Setup event-related event consumers
  async setupEventEventConsumers(rabbitmq) {
    const eventEvents = [
      { routingKey: 'event.created', handler: this.handleEventCreated.bind(this) },
      { routingKey: 'event.rsvp.added', handler: this.handleEventRsvpAdded.bind(this) },
      { routingKey: 'event.rsvp.removed', handler: this.handleEventRsvpRemoved.bind(this) },
      { routingKey: 'event.updated', handler: this.handleEventUpdated.bind(this) },
      { routingKey: 'event.cancelled', handler: this.handleEventCancelled.bind(this) },
    ];

    for (const event of eventEvents) {
      await rabbitmq.setupConsumer(
        `notification-service.event.${event.routingKey}`,
        'event_events',
        event.routingKey,
        event.handler
      );
      
      this.consumers.set(event.routingKey, true);
      logger.info(`Event event consumer setup: ${event.routingKey}`);
    }
  }

  // Setup social-related event consumers
  async setupSocialEventConsumers(rabbitmq) {
    const socialEvents = [
      { routingKey: 'user.followed', handler: this.handleUserFollowed.bind(this) },
      { routingKey: 'user.unfollowed', handler: this.handleUserUnfollowed.bind(this) },
      { routingKey: 'user.blocked', handler: this.handleUserBlocked.bind(this) },
    ];

    for (const event of socialEvents) {
      await rabbitmq.setupConsumer(
        `notification-service.social.${event.routingKey}`,
        'social_events',
        event.routingKey,
        event.handler
      );
      
      this.consumers.set(event.routingKey, true);
      logger.info(`Social event consumer setup: ${event.routingKey}`);
    }
  }

  // Setup messaging-related event consumers
  async setupMessagingEventConsumers(rabbitmq) {
    const messagingEvents = [
      { routingKey: 'message.sent', handler: this.handleMessageSent.bind(this) },
      { routingKey: 'message.read', handler: this.handleMessageRead.bind(this) },
      { routingKey: 'user.online', handler: this.handleUserOnline.bind(this) },
      { routingKey: 'user.offline', handler: this.handleUserOffline.bind(this) },
    ];

    for (const event of messagingEvents) {
      await rabbitmq.setupConsumer(
        `notification-service.messaging.${event.routingKey}`,
        'messaging_events',
        event.routingKey,
        event.handler
      );
      
      this.consumers.set(event.routingKey, true);
      logger.info(`Messaging event consumer setup: ${event.routingKey}`);
    }
  }

  // Event handlers
  async handleUserRegistered(data) {
    try {
      logger.logEventProcessing('user.registered', 'started', { data });
      
      // Update user cache
      await UserCache.createOrUpdate({
        user_id: data.user_id,
        username: data.username,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        verified: data.verified || false,
      });

      logger.logEventProcessing('user.registered', 'completed', { userId: data.user_id });
      metrics.incrementEventProcessingCounter('user.registered', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserRegistered', data });
      metrics.incrementEventProcessingCounter('user.registered', 'error');
      throw error;
    }
  }

  async handleUserUpdated(data) {
    try {
      logger.logEventProcessing('user.updated', 'started', { data });
      
      // Update user cache
      await UserCache.createOrUpdate({
        user_id: data.user_id,
        username: data.username,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        verified: data.verified,
      });

      logger.logEventProcessing('user.updated', 'completed', { userId: data.user_id });
      metrics.incrementEventProcessingCounter('user.updated', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserUpdated', data });
      metrics.incrementEventProcessingCounter('user.updated', 'error');
      throw error;
    }
  }

  async handleUserDeleted(data) {
    try {
      logger.logEventProcessing('user.deleted', 'started', { data });
      
      // Remove user from cache
      await UserCache.findOneAndDelete({ user_id: data.user_id });

      logger.logEventProcessing('user.deleted', 'completed', { userId: data.user_id });
      metrics.incrementEventProcessingCounter('user.deleted', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserDeleted', data });
      metrics.incrementEventProcessingCounter('user.deleted', 'error');
      throw error;
    }
  }

  async handlePostCreated(data) {
    try {
      logger.logEventProcessing('post.created', 'started', { data });
      
      // For now, we don't send notifications for new posts
      // This could be extended to notify followers in the future
      
      logger.logEventProcessing('post.created', 'completed', { postId: data.post_id });
      metrics.incrementEventProcessingCounter('post.created', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostCreated', data });
      metrics.incrementEventProcessingCounter('post.created', 'error');
      throw error;
    }
  }

  async handlePostLiked(data) {
    try {
      logger.logEventProcessing('post.liked', 'started', { data });
      
      await NotificationService.processEvent({
        event_type: 'post.liked',
        data: {
          post_id: data.post_id,
          post_author_id: data.author_id,
          user_id: data.user_id,
          user_username: data.user_username,
        },
      });

      logger.logEventProcessing('post.liked', 'completed', { postId: data.post_id, userId: data.user_id });
      metrics.incrementEventProcessingCounter('post.liked', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostLiked', data });
      metrics.incrementEventProcessingCounter('post.liked', 'error');
      throw error;
    }
  }

  async handlePostCommented(data) {
    try {
      logger.logEventProcessing('post.commented', 'started', { data });
      
      await NotificationService.processEvent({
        event_type: 'comment.created',
        data: {
          post_id: data.post_id,
          post_author_id: data.author_id,
          comment_id: data.comment_id,
          commenter_id: data.user_id,
          commenter_username: data.user_username,
        },
      });

      logger.logEventProcessing('post.commented', 'completed', { postId: data.post_id, commentId: data.comment_id });
      metrics.incrementEventProcessingCounter('post.commented', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostCommented', data });
      metrics.incrementEventProcessingCounter('post.commented', 'error');
      throw error;
    }
  }

  async handlePostShared(data) {
    try {
      logger.logEventProcessing('post.shared', 'started', { data });
      
      await NotificationService.processEvent({
        event_type: 'post.shared',
        data: {
          post_id: data.post_id,
          post_author_id: data.author_id,
          user_id: data.user_id,
          user_username: data.user_username,
        },
      });

      logger.logEventProcessing('post.shared', 'completed', { postId: data.post_id, userId: data.user_id });
      metrics.incrementEventProcessingCounter('post.shared', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostShared', data });
      metrics.incrementEventProcessingCounter('post.shared', 'error');
      throw error;
    }
  }

  async handlePostMentioned(data) {
    try {
      logger.logEventProcessing('post.mentioned', 'started', { data });
      
      // Handle mentions for each mentioned user
      for (const mentionedUser of data.mentioned_users) {
        await NotificationService.processEvent({
          event_type: 'user.mentioned',
          data: {
            post_id: data.post_id,
            mentioned_user_id: mentionedUser.user_id,
            mentioner_id: data.user_id,
            mentioner_username: data.user_username,
          },
        });
      }

      logger.logEventProcessing('post.mentioned', 'completed', { postId: data.post_id, mentionedCount: data.mentioned_users.length });
      metrics.incrementEventProcessingCounter('post.mentioned', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostMentioned', data });
      metrics.incrementEventProcessingCounter('post.mentioned', 'error');
      throw error;
    }
  }

  async handleEventCreated(data) {
    try {
      logger.logEventProcessing('event.created', 'started', { data });
      
      // For now, we don't send notifications for new events
      // This could be extended to notify followers or friends in the future
      
      logger.logEventProcessing('event.created', 'completed', { eventId: data.event_id });
      metrics.incrementEventProcessingCounter('event.created', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventCreated', data });
      metrics.incrementEventProcessingCounter('event.created', 'error');
      throw error;
    }
  }

  async handleEventRsvpAdded(data) {
    try {
      logger.logEventProcessing('event.rsvp.added', 'started', { data });
      
      await NotificationService.processEvent({
        event_type: 'event.rsvp.added',
        data: {
          event_id: data.event_id,
          event_title: data.event_title,
          event_creator_id: data.creator_id,
          user_id: data.user_id,
          user_username: data.user_username,
          status: data.status,
        },
      });

      logger.logEventProcessing('event.rsvp.added', 'completed', { eventId: data.event_id, userId: data.user_id });
      metrics.incrementEventProcessingCounter('event.rsvp.added', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventRsvpAdded', data });
      metrics.incrementEventProcessingCounter('event.rsvp.added', 'error');
      throw error;
    }
  }

  async handleEventRsvpRemoved(data) {
    try {
      logger.logEventProcessing('event.rsvp.removed', 'started', { data });
      
      // For now, we don't send notifications for RSVP removals
      // This could be extended in the future
      
      logger.logEventProcessing('event.rsvp.removed', 'completed', { eventId: data.event_id, userId: data.user_id });
      metrics.incrementEventProcessingCounter('event.rsvp.removed', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventRsvpRemoved', data });
      metrics.incrementEventProcessingCounter('event.rsvp.removed', 'error');
      throw error;
    }
  }

  async handleEventUpdated(data) {
    try {
      logger.logEventProcessing('event.updated', 'started', { data });
      
      // For now, we don't send notifications for event updates
      // This could be extended to notify attendees in the future
      
      logger.logEventProcessing('event.updated', 'completed', { eventId: data.event_id });
      metrics.incrementEventProcessingCounter('event.updated', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventUpdated', data });
      metrics.incrementEventProcessingCounter('event.updated', 'error');
      throw error;
    }
  }

  async handleEventCancelled(data) {
    try {
      logger.logEventProcessing('event.cancelled', 'started', { data });
      
      // Create system notification for all attendees
      const notificationData = {
        recipient_id: data.creator_id,
        type: 'SYSTEM',
        title: 'Event Cancelled',
        message: `Your event "${data.event_title}" has been cancelled`,
        reference_id: data.event_id,
        reference_type: 'EVENT',
        priority: 'HIGH',
        metadata: {
          event_id: data.event_id,
          event_title: data.event_title,
        },
      };

      await NotificationService.createNotification(notificationData);

      logger.logEventProcessing('event.cancelled', 'completed', { eventId: data.event_id });
      metrics.incrementEventProcessingCounter('event.cancelled', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventCancelled', data });
      metrics.incrementEventProcessingCounter('event.cancelled', 'error');
      throw error;
    }
  }

  async handleUserFollowed(data) {
    try {
      logger.logEventProcessing('user.followed', 'started', { data });
      
      await NotificationService.processEvent({
        event_type: 'user.followed',
        data: {
          follower_id: data.follower_id,
          follower_username: data.follower_username,
          following_id: data.following_id,
        },
      });

      logger.logEventProcessing('user.followed', 'completed', { followerId: data.follower_id, followingId: data.following_id });
      metrics.incrementEventProcessingCounter('user.followed', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserFollowed', data });
      metrics.incrementEventProcessingCounter('user.followed', 'error');
      throw error;
    }
  }

  async handleUserUnfollowed(data) {
    try {
      logger.logEventProcessing('user.unfollowed', 'started', { data });
      
      // For now, we don't send notifications for unfollows
      // This could be extended in the future
      
      logger.logEventProcessing('user.unfollowed', 'completed', { followerId: data.follower_id, followingId: data.following_id });
      metrics.incrementEventProcessingCounter('user.unfollowed', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserUnfollowed', data });
      metrics.incrementEventProcessingCounter('user.unfollowed', 'error');
      throw error;
    }
  }

  async handleUserBlocked(data) {
    try {
      logger.logEventProcessing('user.blocked', 'started', { data });
      
      // Create system notification for the blocked user
      const notificationData = {
        recipient_id: data.blocked_user_id,
        type: 'SECURITY_ALERT',
        title: 'Account Blocked',
        message: 'Your account has been blocked by another user',
        priority: 'HIGH',
        metadata: {
          blocker_id: data.blocker_id,
          reason: data.reason,
        },
      };

      await NotificationService.createNotification(notificationData);

      logger.logEventProcessing('user.blocked', 'completed', { blockerId: data.blocker_id, blockedId: data.blocked_user_id });
      metrics.incrementEventProcessingCounter('user.blocked', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserBlocked', data });
      metrics.incrementEventProcessingCounter('user.blocked', 'error');
      throw error;
    }
  }

  async handleMessageSent(data) {
    try {
      logger.logEventProcessing('message.sent', 'started', { data });
      
      await NotificationService.processEvent({
        event_type: 'message.sent',
        data: {
          conversation_id: data.conversation_id,
          message_id: data.message_id,
          sender_id: data.sender_id,
          sender_username: data.sender_username,
          recipient_id: data.recipient_id,
        },
      });

      logger.logEventProcessing('message.sent', 'completed', { messageId: data.message_id, conversationId: data.conversation_id });
      metrics.incrementEventProcessingCounter('message.sent', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleMessageSent', data });
      metrics.incrementEventProcessingCounter('message.sent', 'error');
      throw error;
    }
  }

  async handleMessageRead(data) {
    try {
      logger.logEventProcessing('message.read', 'started', { data });
      
      // For now, we don't send notifications for message reads
      // This could be extended to show read receipts in the future
      
      logger.logEventProcessing('message.read', 'completed', { messageId: data.message_id, userId: data.user_id });
      metrics.incrementEventProcessingCounter('message.read', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleMessageRead', data });
      metrics.incrementEventProcessingCounter('message.read', 'error');
      throw error;
    }
  }

  async handleUserOnline(data) {
    try {
      logger.logEventProcessing('user.online', 'started', { data });
      
      // For now, we don't send notifications for user online status
      // This could be extended to show presence indicators in the future
      
      logger.logEventProcessing('user.online', 'completed', { userId: data.user_id });
      metrics.incrementEventProcessingCounter('user.online', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserOnline', data });
      metrics.incrementEventProcessingCounter('user.online', 'error');
      throw error;
    }
  }

  async handleUserOffline(data) {
    try {
      logger.logEventProcessing('user.offline', 'started', { data });
      
      // For now, we don't send notifications for user offline status
      // This could be extended to show presence indicators in the future
      
      logger.logEventProcessing('user.offline', 'completed', { userId: data.user_id });
      metrics.incrementEventProcessingCounter('user.offline', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserOffline', data });
      metrics.incrementEventProcessingCounter('user.offline', 'error');
      throw error;
    }
  }

  // Get consumer status
  getConsumerStatus() {
    return {
      total_consumers: this.consumers.size,
      consumers: Array.from(this.consumers.keys()),
      status: this.consumers.size > 0 ? 'active' : 'inactive',
    };
  }
}

module.exports = new EventService();
