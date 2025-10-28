import rabbitmq from '../config/rabbitmq';
import UserCache from '../models/userCache';
import logger from '../utils/logger';
import metrics from '../config/metrics';
import NotificationService from './notificationService';
import {
  UserRegisteredEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  PostLikedEvent,
  PostCommentedEvent,
  PostSharedEvent,
  PostMentionedEvent,
  EventCreatedEvent,
  EventRsvpAddedEvent,
  EventRsvpRemovedEvent,
  EventUpdatedEvent,
  EventCancelledEvent,
  UserFollowedEvent,
  UserUnfollowedEvent,
  UserBlockedEvent,
  MessageSentEvent,
  MessageReadEvent,
  UserOnlineEvent,
  UserOfflineEvent,
  WrappedEvent,
} from '../types/events';

type MessageHandler = (content: Record<string, unknown>) => Promise<void>;

class EventService {
  private consumers: Map<string, boolean> = new Map();

  // Initialize all event consumers
  async initializeConsumers(rabbitmqInstance: typeof rabbitmq): Promise<void> {
    try {
      logger.info('Initializing event consumers');

      // User events
      await this.setupUserEventConsumers(rabbitmqInstance);

      // Post events
      await this.setupPostEventConsumers(rabbitmqInstance);

      // Event events
      await this.setupEventEventConsumers(rabbitmqInstance);

      // Social events
      await this.setupSocialEventConsumers(rabbitmqInstance);

      // Messaging events
      await this.setupMessagingEventConsumers(rabbitmqInstance);

      logger.info('All event consumers initialized successfully');
    } catch (error) {
      logger.logError(error, { action: 'initializeConsumers' });
      throw error;
    }
  }

  // Setup user-related event consumers
  private async setupUserEventConsumers(rabbitmqInstance: typeof rabbitmq): Promise<void> {
    const userEvents = [
      { routingKey: 'user.registered', handler: this.handleUserRegistered.bind(this) as MessageHandler },
      { routingKey: 'user.updated', handler: this.handleUserUpdated.bind(this) as MessageHandler },
      { routingKey: 'user.deleted', handler: this.handleUserDeleted.bind(this) as MessageHandler },
    ];

    for (const event of userEvents) {
      await rabbitmqInstance.setupConsumer(
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
  private async setupPostEventConsumers(rabbitmqInstance: typeof rabbitmq): Promise<void> {
    const postEvents = [
      { routingKey: 'post.created', handler: this.handlePostCreated.bind(this) as MessageHandler },
      { routingKey: 'post.liked', handler: this.handlePostLiked.bind(this) as MessageHandler },
      { routingKey: 'post.commented', handler: this.handlePostCommented.bind(this) as MessageHandler },
      { routingKey: 'post.shared', handler: this.handlePostShared.bind(this) as MessageHandler },
      { routingKey: 'post.mentioned', handler: this.handlePostMentioned.bind(this) as MessageHandler },
    ];

    for (const event of postEvents) {
      await rabbitmqInstance.setupConsumer(
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
  private async setupEventEventConsumers(rabbitmqInstance: typeof rabbitmq): Promise<void> {
    const eventEvents = [
      { routingKey: 'event.created', handler: this.handleEventCreated.bind(this) as MessageHandler },
      { routingKey: 'event.rsvp.added', handler: this.handleEventRsvpAdded.bind(this) as MessageHandler },
      { routingKey: 'event.rsvp.removed', handler: this.handleEventRsvpRemoved.bind(this) as MessageHandler },
      { routingKey: 'event.updated', handler: this.handleEventUpdated.bind(this) as MessageHandler },
      { routingKey: 'event.cancelled', handler: this.handleEventCancelled.bind(this) as MessageHandler },
    ];

    for (const event of eventEvents) {
      await rabbitmqInstance.setupConsumer(
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
  private async setupSocialEventConsumers(rabbitmqInstance: typeof rabbitmq): Promise<void> {
    const socialEvents = [
      { routingKey: 'user.followed', handler: this.handleUserFollowed.bind(this) as MessageHandler },
      { routingKey: 'user.unfollowed', handler: this.handleUserUnfollowed.bind(this) as MessageHandler },
      { routingKey: 'user.blocked', handler: this.handleUserBlocked.bind(this) as MessageHandler },
    ];

    for (const event of socialEvents) {
      await rabbitmqInstance.setupConsumer(
        `notification-service.social.${event.routingKey}`,
        'pulse.events',
        event.routingKey,
        event.handler
      );

      this.consumers.set(event.routingKey, true);
      logger.info(`Social event consumer setup: ${event.routingKey}`);
    }
  }

  // Setup messaging-related event consumers
  private async setupMessagingEventConsumers(rabbitmqInstance: typeof rabbitmq): Promise<void> {
    const messagingEvents = [
      { routingKey: 'message.sent', handler: this.handleMessageSent.bind(this) as MessageHandler },
      { routingKey: 'message.read', handler: this.handleMessageRead.bind(this) as MessageHandler },
      { routingKey: 'user.online', handler: this.handleUserOnline.bind(this) as MessageHandler },
      { routingKey: 'user.offline', handler: this.handleUserOffline.bind(this) as MessageHandler },
    ];

    for (const event of messagingEvents) {
      await rabbitmqInstance.setupConsumer(
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
  private async handleUserRegistered(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('user.registered', 'started', { data });

      const eventData = data as UserRegisteredEvent;

      // Update user cache
      await UserCache.createOrUpdate({
        user_id: eventData.user_id,
        username: eventData.username,
        display_name: eventData.display_name,
        avatar_url: eventData.avatar_url,
        verified: eventData.verified || false,
      });

      logger.logEventProcessing('user.registered', 'completed', { userId: eventData.user_id });
      metrics.incrementEventProcessingCounter('user.registered', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserRegistered', data });
      metrics.incrementEventProcessingCounter('user.registered', 'error');
      throw error;
    }
  }

  private async handleUserUpdated(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('user.updated', 'started', { data });

      const eventData = data as UserUpdatedEvent;

      // Update user cache
      await UserCache.createOrUpdate({
        user_id: eventData.user_id,
        username: eventData.username,
        display_name: eventData.display_name,
        avatar_url: eventData.avatar_url,
        verified: eventData.verified || false,
      });

      logger.logEventProcessing('user.updated', 'completed', { userId: eventData.user_id });
      metrics.incrementEventProcessingCounter('user.updated', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserUpdated', data });
      metrics.incrementEventProcessingCounter('user.updated', 'error');
      throw error;
    }
  }

  private async handleUserDeleted(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('user.deleted', 'started', { data });

      const eventData = data as UserDeletedEvent;

      // Remove user from cache
      await UserCache.findOneAndDelete({ user_id: eventData.user_id });

      logger.logEventProcessing('user.deleted', 'completed', { userId: eventData.user_id });
      metrics.incrementEventProcessingCounter('user.deleted', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserDeleted', data });
      metrics.incrementEventProcessingCounter('user.deleted', 'error');
      throw error;
    }
  }

  private async handlePostCreated(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('post.created', 'started', { data });

      // For now, we don't send notifications for new posts
      // This could be extended to notify followers in the future

      const eventData = data as EventCreatedEvent;
      logger.logEventProcessing('post.created', 'completed', { postId: eventData.event_id });
      metrics.incrementEventProcessingCounter('post.created', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostCreated', data });
      metrics.incrementEventProcessingCounter('post.created', 'error');
      throw error;
    }
  }

  private async handlePostLiked(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('post.liked', 'started', { data });

      const eventData = data as PostLikedEvent;

      await NotificationService.processEvent({
        event_type: 'post.liked',
        data: {
          post_id: eventData.post_id,
          post_author_id: eventData.author_id,
          user_id: eventData.user_id,
          user_username: eventData.user_username,
        },
      });

      logger.logEventProcessing('post.liked', 'completed', {
        postId: eventData.post_id,
        userId: eventData.user_id,
      });
      metrics.incrementEventProcessingCounter('post.liked', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostLiked', data });
      metrics.incrementEventProcessingCounter('post.liked', 'error');
      throw error;
    }
  }

  private async handlePostCommented(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('post.commented', 'started', { data });

      const eventData = data as PostCommentedEvent;

      await NotificationService.processEvent({
        event_type: 'comment.created',
        data: {
          post_id: eventData.post_id,
          post_author_id: eventData.author_id,
          comment_id: eventData.comment_id,
          commenter_id: eventData.user_id,
          commenter_username: eventData.user_username,
        },
      });

      logger.logEventProcessing('post.commented', 'completed', {
        postId: eventData.post_id,
        commentId: eventData.comment_id,
      });
      metrics.incrementEventProcessingCounter('post.commented', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostCommented', data });
      metrics.incrementEventProcessingCounter('post.commented', 'error');
      throw error;
    }
  }

  private async handlePostShared(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('post.shared', 'started', { data });

      const eventData = data as PostSharedEvent;

      await NotificationService.processEvent({
        event_type: 'post.shared',
        data: {
          post_id: eventData.post_id,
          post_author_id: eventData.author_id,
          user_id: eventData.user_id,
          user_username: eventData.user_username,
        },
      });

      logger.logEventProcessing('post.shared', 'completed', {
        postId: eventData.post_id,
        userId: eventData.user_id,
      });
      metrics.incrementEventProcessingCounter('post.shared', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostShared', data });
      metrics.incrementEventProcessingCounter('post.shared', 'error');
      throw error;
    }
  }

  private async handlePostMentioned(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('post.mentioned', 'started', { data });

      const eventData = data as PostMentionedEvent;

      // Handle mentions for each mentioned user
      for (const mentionedUser of eventData.mentioned_users) {
        await NotificationService.processEvent({
          event_type: 'user.mentioned',
          data: {
            post_id: eventData.post_id,
            mentioned_user_id: mentionedUser.user_id,
            mentioner_id: eventData.user_id,
            mentioner_username: eventData.user_username,
          },
        });
      }

      logger.logEventProcessing('post.mentioned', 'completed', {
        postId: eventData.post_id,
        mentionedCount: eventData.mentioned_users.length,
      });
      metrics.incrementEventProcessingCounter('post.mentioned', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handlePostMentioned', data });
      metrics.incrementEventProcessingCounter('post.mentioned', 'error');
      throw error;
    }
  }

  private async handleEventCreated(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('event.created', 'started', { data });

      // For now, we don't send notifications for new events
      // This could be extended to notify followers or friends in the future

      const eventData = data as EventCreatedEvent;
      logger.logEventProcessing('event.created', 'completed', { eventId: eventData.event_id });
      metrics.incrementEventProcessingCounter('event.created', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventCreated', data });
      metrics.incrementEventProcessingCounter('event.created', 'error');
      throw error;
    }
  }

  private async handleEventRsvpAdded(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('event.rsvp.added', 'started', { data });

      const eventData = data as EventRsvpAddedEvent;

      await NotificationService.processEvent({
        event_type: 'event.rsvp.added',
        data: {
          event_id: eventData.event_id,
          event_title: eventData.event_title,
          event_creator_id: eventData.creator_id,
          user_id: eventData.user_id,
          user_username: eventData.user_username,
          status: eventData.status,
        },
      });

      logger.logEventProcessing('event.rsvp.added', 'completed', {
        eventId: eventData.event_id,
        userId: eventData.user_id,
      });
      metrics.incrementEventProcessingCounter('event.rsvp.added', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventRsvpAdded', data });
      metrics.incrementEventProcessingCounter('event.rsvp.added', 'error');
      throw error;
    }
  }

  private async handleEventRsvpRemoved(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('event.rsvp.removed', 'started', { data });

      // For now, we don't send notifications for RSVP removals
      // This could be extended in the future

      const eventData = data as EventRsvpRemovedEvent;
      logger.logEventProcessing('event.rsvp.removed', 'completed', {
        eventId: eventData.event_id,
        userId: eventData.user_id,
      });
      metrics.incrementEventProcessingCounter('event.rsvp.removed', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventRsvpRemoved', data });
      metrics.incrementEventProcessingCounter('event.rsvp.removed', 'error');
      throw error;
    }
  }

  private async handleEventUpdated(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('event.updated', 'started', { data });

      // For now, we don't send notifications for event updates
      // This could be extended to notify attendees in the future

      const eventData = data as EventUpdatedEvent;
      logger.logEventProcessing('event.updated', 'completed', { eventId: eventData.event_id });
      metrics.incrementEventProcessingCounter('event.updated', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventUpdated', data });
      metrics.incrementEventProcessingCounter('event.updated', 'error');
      throw error;
    }
  }

  private async handleEventCancelled(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('event.cancelled', 'started', { data });

      const eventData = data as EventCancelledEvent;

      // Create system notification for all attendees
      const notificationData = {
        recipient_id: eventData.creator_id,
        type: 'SYSTEM' as const,
        title: 'Event Cancelled',
        message: `Your event "${eventData.event_title}" has been cancelled`,
        reference_id: eventData.event_id,
        reference_type: 'EVENT' as const,
        priority: 'HIGH' as const,
        metadata: {
          event_id: eventData.event_id,
          event_title: eventData.event_title,
        },
      };

      await NotificationService.createNotification(notificationData);

      logger.logEventProcessing('event.cancelled', 'completed', { eventId: eventData.event_id });
      metrics.incrementEventProcessingCounter('event.cancelled', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleEventCancelled', data });
      metrics.incrementEventProcessingCounter('event.cancelled', 'error');
      throw error;
    }
  }

  private async handleUserFollowed(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('user.followed', 'started', { data });

      // Extract the actual data from the nested structure (social-service wraps it)
      let eventData: UserFollowedEvent;
      if ('data' in data && data.data) {
        eventData = data.data as UserFollowedEvent;
      } else {
        eventData = data as UserFollowedEvent;
      }

      await NotificationService.processEvent({
        event_type: 'user.followed',
        data: {
          follower_id: eventData.follower_id,
          follower_username: eventData.follower_username,
          following_id: eventData.following_id,
        },
      });

      logger.logEventProcessing('user.followed', 'completed', {
        followerId: eventData.follower_id,
        followingId: eventData.following_id,
      });
      metrics.incrementEventProcessingCounter('user.followed', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserFollowed', data });
      metrics.incrementEventProcessingCounter('user.followed', 'error');
      throw error;
    }
  }

  private async handleUserUnfollowed(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('user.unfollowed', 'started', { data });

      // For now, we don't send notifications for unfollows
      // This could be extended in the future

      const eventData = data as UserUnfollowedEvent;
      logger.logEventProcessing('user.unfollowed', 'completed', {
        followerId: eventData.follower_id,
        followingId: eventData.following_id,
      });
      metrics.incrementEventProcessingCounter('user.unfollowed', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserUnfollowed', data });
      metrics.incrementEventProcessingCounter('user.unfollowed', 'error');
      throw error;
    }
  }

  private async handleUserBlocked(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('user.blocked', 'started', { data });

      const eventData = data as UserBlockedEvent;

      // Create system notification for the blocked user
      const notificationData = {
        recipient_id: eventData.blocked_user_id,
        type: 'SECURITY_ALERT' as const,
        title: 'Account Blocked',
        message: 'Your account has been blocked by another user',
        priority: 'HIGH' as const,
        metadata: {
          blocker_id: eventData.blocker_id,
          reason: eventData.reason,
        },
      };

      await NotificationService.createNotification(notificationData);

      logger.logEventProcessing('user.blocked', 'completed', {
        blockerId: eventData.blocker_id,
        blockedId: eventData.blocked_user_id,
      });
      metrics.incrementEventProcessingCounter('user.blocked', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserBlocked', data });
      metrics.incrementEventProcessingCounter('user.blocked', 'error');
      throw error;
    }
  }

  private async handleMessageSent(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('message.sent', 'started', { data });

      // Extract the actual data from the nested structure (messaging-service wraps it)
      let eventData: MessageSentEvent;
      if ('data' in data && data.data) {
        eventData = data.data as MessageSentEvent;
      } else {
        eventData = data as MessageSentEvent;
      }

      await NotificationService.processEvent({
        event_type: 'message.sent',
        data: {
          conversation_id: eventData.conversation_id,
          message_id: eventData.message_id,
          sender_id: eventData.sender_id,
          sender_username: eventData.sender_username,
          recipient_id: eventData.recipient_id,
        },
      });

      logger.logEventProcessing('message.sent', 'completed', {
        messageId: eventData.message_id,
        conversationId: eventData.conversation_id,
      });
      metrics.incrementEventProcessingCounter('message.sent', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleMessageSent', data });
      metrics.incrementEventProcessingCounter('message.sent', 'error');
      throw error;
    }
  }

  private async handleMessageRead(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('message.read', 'started', { data });

      // For now, we don't send notifications for message reads
      // This could be extended to show read receipts in the future

      const eventData = data as MessageReadEvent;
      logger.logEventProcessing('message.read', 'completed', {
        messageId: eventData.message_id,
        userId: eventData.user_id,
      });
      metrics.incrementEventProcessingCounter('message.read', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleMessageRead', data });
      metrics.incrementEventProcessingCounter('message.read', 'error');
      throw error;
    }
  }

  private async handleUserOnline(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('user.online', 'started', { data });

      // For now, we don't send notifications for user online status
      // This could be extended to show presence indicators in the future

      const eventData = data as UserOnlineEvent;
      logger.logEventProcessing('user.online', 'completed', { userId: eventData.user_id });
      metrics.incrementEventProcessingCounter('user.online', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserOnline', data });
      metrics.incrementEventProcessingCounter('user.online', 'error');
      throw error;
    }
  }

  private async handleUserOffline(data: Record<string, unknown>): Promise<void> {
    try {
      logger.logEventProcessing('user.offline', 'started', { data });

      // For now, we don't send notifications for user offline status
      // This could be extended to show presence indicators in the future

      const eventData = data as UserOfflineEvent;
      logger.logEventProcessing('user.offline', 'completed', { userId: eventData.user_id });
      metrics.incrementEventProcessingCounter('user.offline', 'success');
    } catch (error) {
      logger.logError(error, { action: 'handleUserOffline', data });
      metrics.incrementEventProcessingCounter('user.offline', 'error');
      throw error;
    }
  }

  // Get consumer status
  getConsumerStatus(): {
    total_consumers: number;
    consumers: string[];
    status: string;
  } {
    return {
      total_consumers: this.consumers.size,
      consumers: Array.from(this.consumers.keys()),
      status: this.consumers.size > 0 ? 'active' : 'inactive',
    };
  }
}

export default new EventService();

