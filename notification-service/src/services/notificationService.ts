import Notification from '../models/notification';
import UserCache from '../models/userCache';
import NotificationPreferences from '../models/notificationPreferences';
import redis from '../config/redis';
import rabbitmq from '../config/rabbitmq';
import logger from '../utils/logger';
import metrics from '../config/metrics';
import {
  INotification,
  NotificationType,
  NotificationPriority,
  ReferenceType,
} from '../types/models';
import {
  NotificationOptions,
  NotificationListResponse,
  NotificationStats,
  NotificationWithSender,
} from '../types/api';
import {
  EventProcessingPayload,
  NotificationCreatedEvent,
} from '../types/events';
import { Types } from 'mongoose';

interface CreateNotificationData {
  recipient_id: string;
  sender_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: ReferenceType;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

class NotificationService {
  // Create a new notification
  async createNotification(notificationData: CreateNotificationData): Promise<INotification> {
    const startTime = Date.now();

    try {
      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      logger.logNotification('created', savedNotification._id.toString(), notificationData.recipient_id, {
        type: notificationData.type,
        title: notificationData.title,
      });

      metrics.incrementNotificationCounter(notificationData.type, 'success');
      metrics.recordNotificationProcessingDuration(notificationData.type, Date.now() - startTime);

      // Invalidate cache for user notifications
      await this.invalidateUserNotificationCache(notificationData.recipient_id);

      // Publish notification.created event for real-time delivery
      await this.publishNotificationCreatedEvent(savedNotification);

      return savedNotification;
    } catch (error) {
      logger.logError(error, { action: 'createNotification', notificationData });
      metrics.incrementNotificationCounter(notificationData.type || 'UNKNOWN', 'error');
      metrics.recordNotificationProcessingDuration(
        notificationData.type || 'UNKNOWN',
        Date.now() - startTime
      );
      throw error;
    }
  }

  // Get notifications for a user with pagination
  async getNotifications(userId: string, options: NotificationOptions = {}): Promise<NotificationListResponse> {
    const startTime = Date.now();

    try {
      const {
        page = 1,
        limit = 20,
        type,
        unreadOnly = false,
        sort = -1,
      } = options;

      const skip = (page - 1) * limit;

      // Try to get from cache first
      const cacheKey = `notifications:${userId}:${page}:${limit}:${type || 'all'}:${unreadOnly}`;

      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          metrics.incrementCacheHit('get_notifications');
          logger.logCacheOperation('get', cacheKey, 'hit');
          return JSON.parse(cached) as NotificationListResponse;
        }
        metrics.incrementCacheMiss('get_notifications');
        logger.logCacheOperation('get', cacheKey, 'miss');
      } catch (cacheError) {
        const err = cacheError as Error;
        logger.warn('Cache error during notification fetch', { error: err.message });
      }

      const query: Record<string, unknown> = { recipient_id: userId };

      if (unreadOnly) {
        query.is_read = false;
      }

      if (type) {
        query.type = type;
      }

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ created_at: sort })
          .limit(limit)
          .skip(skip)
          .lean(),
        Notification.countDocuments(query),
      ]);

      // Enrich notifications with user cache data
      const enrichedNotifications = await this.enrichNotificationsWithUserData(
        notifications as Array<Record<string, unknown>>
      );

      const result: NotificationListResponse = {
        notifications: enrichedNotifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1,
        },
      };

      // Cache the result for 5 minutes
      try {
        await redis.set(cacheKey, JSON.stringify(result), 300);
      } catch (cacheError) {
        const err = cacheError as Error;
        logger.warn('Cache error during notification cache set', { error: err.message });
      }

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('find', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('find', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, action: 'getNotifications', options });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('find', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('find', Date.now() - startTime);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<INotification | null> {
    const startTime = Date.now();

    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient_id: userId },
        { is_read: true, read_at: new Date() },
        { new: true }
      );

      if (notification) {
        logger.logNotification('marked_read', notificationId, userId);

        // Invalidate cache for user notifications
        await this.invalidateUserNotificationCache(userId);
      }

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('update', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('update', Date.now() - startTime);

      return notification;
    } catch (error) {
      logger.logError(error, { userId, notificationId, action: 'markAsRead' });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('update', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('update', Date.now() - startTime);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const startTime = Date.now();

    try {
      const result = (await Notification.updateMany(
        { recipient_id: userId, is_read: false },
        {
          $set: {
            is_read: true,
            read_at: new Date(),
          },
        }
      )) as { modifiedCount: number };

      logger.logNotification('marked_all_read', 'all', userId, {
        modified_count: result.modifiedCount,
      });

      // Invalidate cache for user notifications
      await this.invalidateUserNotificationCache(userId);

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('updateMany', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('updateMany', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, action: 'markAllAsRead' });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('updateMany', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('updateMany', Date.now() - startTime);
      throw error;
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    const startTime = Date.now();

    try {
      // Try cache first
      const cacheKey = `unread_count:${userId}`;

      try {
        const cached = await redis.get(cacheKey);
        if (cached !== null) {
          metrics.incrementCacheHit('get_unread_count');
          logger.logCacheOperation('get', cacheKey, 'hit');
          return parseInt(cached, 10);
        }
        metrics.incrementCacheMiss('get_unread_count');
        logger.logCacheOperation('get', cacheKey, 'miss');
      } catch (cacheError) {
        const err = cacheError as Error;
        logger.warn('Cache error during unread count fetch', { error: err.message });
      }

      const count = await Notification.countDocuments({
        recipient_id: userId,
        is_read: false,
      });

      // Cache for 1 minute
      try {
        await redis.set(cacheKey, count.toString(), 60);
      } catch (cacheError) {
        const err = cacheError as Error;
        logger.warn('Cache error during unread count cache set', { error: err.message });
      }

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('count', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('count', Date.now() - startTime);

      return count;
    } catch (error) {
      logger.logError(error, { userId, action: 'getUnreadCount' });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('count', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('count', Date.now() - startTime);
      throw error;
    }
  }

  // Get notification statistics for a user
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const startTime = Date.now();

    try {
      const stats = await Notification.getNotificationStats(userId);

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('aggregate', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('aggregate', Date.now() - startTime);

      return (
        stats || {
          total: 0,
          unread: 0,
          read: 0,
          typeBreakdown: {},
        }
      );
    } catch (error) {
      logger.logError(error, { userId, action: 'getNotificationStats' });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('aggregate', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('aggregate', Date.now() - startTime);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(userId: string, notificationId: string): Promise<INotification | null> {
    const startTime = Date.now();

    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient_id: userId,
      });

      if (result) {
        logger.logNotification('deleted', notificationId, userId);

        // Invalidate cache for user notifications
        await this.invalidateUserNotificationCache(userId);
      }

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('delete', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('delete', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, notificationId, action: 'deleteNotification' });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('delete', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('delete', Date.now() - startTime);
      throw error;
    }
  }

  // Cleanup old notifications
  async cleanupOldNotifications(userId: string, daysOld = 30): Promise<{ deletedCount: number }> {
    const startTime = Date.now();

    try {
      const result = (await Notification.deleteOldNotifications(daysOld)) as { deletedCount: number };

      logger.logNotification('cleanup', 'old_notifications', userId, {
        deleted_count: result.deletedCount,
        days_old: daysOld,
      });

      // Invalidate cache for user notifications
      await this.invalidateUserNotificationCache(userId);

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('deleteMany', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('deleteMany', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, action: 'cleanupOldNotifications', daysOld });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('deleteMany', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('deleteMany', Date.now() - startTime);
      throw error;
    }
  }

  // Process event and create notification
  async processEvent(eventData: EventProcessingPayload): Promise<void> {
    const startTime = Date.now();

    try {
      const { event_type, data } = eventData;

      logger.logEventProcessing(event_type, 'started', { eventData });

      let notificationData: CreateNotificationData | null = null;

      switch (event_type) {
        case 'user.followed':
          notificationData = await this.processFollowEvent(data as Record<string, unknown>);
          break;
        case 'post.liked':
          notificationData = await this.processLikeEvent(data as Record<string, unknown>);
          break;
        case 'comment.created':
          notificationData = await this.processCommentEvent(data as Record<string, unknown>);
          break;
        case 'event.created':
          notificationData = await this.processEventCreatedEvent(data as Record<string, unknown>);
          break;
        case 'event.rsvp.added':
          notificationData = await this.processEventRsvpEvent(data as Record<string, unknown>);
          break;
        case 'message.sent':
          notificationData = await this.processMessageEvent(data as Record<string, unknown>);
          break;
        case 'user.mentioned':
          notificationData = await this.processMentionEvent(data as Record<string, unknown>);
          break;
        default:
          logger.warn('Unknown event type received', { event_type, data });
          metrics.incrementEventProcessingCounter(event_type, 'unknown_event');
          return;
      }

      if (notificationData) {
        // Check user preferences before creating notification
        const shouldNotify = await this.shouldCreateNotification(notificationData);

        if (shouldNotify) {
          await this.createNotification(notificationData);
          metrics.incrementEventProcessingCounter(event_type, 'success');
        } else {
          metrics.incrementEventProcessingCounter(event_type, 'filtered_by_preferences');
        }
      }

      metrics.recordEventProcessingDuration(event_type, Date.now() - startTime);
    } catch (error) {
      logger.logError(error, { action: 'processEvent', eventData });
      metrics.incrementEventProcessingCounter(eventData.event_type || 'unknown', 'error');
      metrics.recordEventProcessingDuration(eventData.event_type || 'unknown', Date.now() - startTime);
      throw error;
    }
  }

  // Check if notification should be created based on user preferences
  async shouldCreateNotification(notificationData: CreateNotificationData): Promise<boolean> {
    try {
      const preferences = await NotificationPreferences.getOrCreate(notificationData.recipient_id);
      return preferences.shouldSendNotification(notificationData.type, 'in_app');
    } catch (error) {
      logger.logError(error, { action: 'shouldCreateNotification', notificationData });
      // Default to true if preferences can't be checked
      return true;
    }
  }

  // Enrich notifications with user data from cache
  async enrichNotificationsWithUserData(
    notifications: Array<Record<string, unknown>>
  ): Promise<NotificationWithSender[]> {
    try {
      const senderIds = notifications
        .map((n) => n.sender_id as string | undefined)
        .filter((id): id is string => Boolean(id));

      if (senderIds.length === 0) {
        return notifications as unknown as NotificationWithSender[];
      }

      const userCache = await UserCache.findByUserIds(senderIds);
      const userCacheMap: Record<string, unknown> = {};

      userCache.forEach((user) => {
        userCacheMap[user.user_id] = user;
      });

      return notifications.map((notification) => ({
        ...notification,
        sender: notification.sender_id
          ? (userCacheMap[notification.sender_id as string] as NotificationWithSender['sender'])
          : null,
      })) as NotificationWithSender[];
    } catch (error) {
      logger.logError(error, { action: 'enrichNotificationsWithUserData' });
      // Return notifications without enrichment if error occurs
      return notifications as unknown as NotificationWithSender[];
    }
  }

  // Invalidate user notification cache
  async invalidateUserNotificationCache(userId: string): Promise<void> {
    try {
      const unreadKey = `unread_count:${userId}`;

      // Delete unread count cache
      await redis.del(unreadKey);

      // Delete common notification cache keys
      const commonCacheKeys = [
        `notifications:${userId}:1:20:all:false`,
        `notifications:${userId}:1:20:all:true`,
        `notifications:${userId}:1:50:all:false`,
        `notifications:${userId}:1:50:all:true`,
      ];

      // Delete each common cache key
      for (const key of commonCacheKeys) {
        try {
          await redis.del(key);
        } catch (keyError) {
          // Ignore errors for individual keys
          const err = keyError as Error;
          logger.warn('Failed to delete cache key', { key, error: err.message });
        }
      }

      logger.logCacheOperation('invalidate', `user:${userId}`, 'success', {
        deletedKeys: commonCacheKeys.length,
      });
    } catch (error) {
      logger.logError(error, { action: 'invalidateUserNotificationCache', userId });
    }
  }

  // Publish notification.created event for real-time delivery
  async publishNotificationCreatedEvent(notification: INotification): Promise<void> {
    try {
      // Get sender information if available
      let senderInfo: NotificationCreatedEvent['sender'] = null;
      if (notification.sender_id) {
        const userCache = await UserCache.findByUserId(notification.sender_id);
        if (userCache) {
          senderInfo = {
            id: userCache.user_id,
            username: userCache.username,
            avatarUrl: userCache.avatar_url,
          };
        }
      }

      const eventData: NotificationCreatedEvent = {
        _id: notification._id.toString(),
        recipient_id: notification.recipient_id,
        sender_id: notification.sender_id || null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        reference_id: notification.reference_id,
        reference_type: notification.reference_type,
        is_read: notification.is_read,
        priority: notification.priority,
        created_at: notification.created_at.toISOString(),
        metadata: notification.metadata || {},
        sender: senderInfo,
      };

      await rabbitmq.publish('notification_events', 'notification.created', eventData as unknown as Record<string, unknown>);

      logger.info('Notification created event published', {
        notificationId: notification._id,
        recipientId: notification.recipient_id,
        type: notification.type,
      });
    } catch (error) {
      logger.logError(error, {
        action: 'publishNotificationCreatedEvent',
        notificationId: notification._id,
      });
      // Don't throw error - notification was still created successfully
    }
  }

  // Event processing methods
  private async processFollowEvent(data: Record<string, unknown>): Promise<CreateNotificationData> {
    return {
      recipient_id: data.following_id as string,
      sender_id: data.follower_id as string,
      type: 'FOLLOW',
      title: 'New Follower',
      message: `${(data.follower_username as string) || 'Someone'} started following you`,
      reference_id: data.follower_id as string,
      reference_type: 'USER',
      priority: 'MEDIUM',
      metadata: {
        follower_id: data.follower_id,
        follower_username: data.follower_username,
      },
    };
  }

  private async processLikeEvent(data: Record<string, unknown>): Promise<CreateNotificationData> {
    return {
      recipient_id: data.post_author_id as string,
      sender_id: data.user_id as string,
      type: 'LIKE',
      title: 'Post Liked',
      message: `${(data.user_username as string) || 'Someone'} liked your post`,
      reference_id: data.post_id as string,
      reference_type: 'POST',
      priority: 'LOW',
      metadata: {
        post_id: data.post_id,
        user_id: data.user_id,
        user_username: data.user_username,
      },
    };
  }

  private async processCommentEvent(data: Record<string, unknown>): Promise<CreateNotificationData> {
    return {
      recipient_id: data.post_author_id as string,
      sender_id: data.commenter_id as string,
      type: 'COMMENT',
      title: 'New Comment',
      message: `${(data.commenter_username as string) || 'Someone'} commented on your post`,
      reference_id: data.post_id as string,
      reference_type: 'POST',
      priority: 'HIGH',
      metadata: {
        post_id: data.post_id,
        comment_id: data.comment_id,
        commenter_id: data.commenter_id,
        commenter_username: data.commenter_id,
      },
    };
  }

  private async processEventCreatedEvent(data: Record<string, unknown>): Promise<null> {
    // This would typically notify followers or friends
    // For now, we'll skip this as it's not a direct notification
    return null;
  }

  private async processEventRsvpEvent(data: Record<string, unknown>): Promise<CreateNotificationData> {
    return {
      recipient_id: data.event_creator_id as string,
      sender_id: data.user_id as string,
      type: 'EVENT_RSVP',
      title: 'Event RSVP',
      message: `${(data.user_username as string) || 'Someone'} is ${((data.status as string) || '').toLowerCase()} to your event`,
      reference_id: data.event_id as string,
      reference_type: 'EVENT',
      priority: 'MEDIUM',
      metadata: {
        event_id: data.event_id,
        event_title: data.event_title,
        user_id: data.user_id,
        user_username: data.user_username,
        status: data.status,
      },
    };
  }

  private async processMessageEvent(data: Record<string, unknown>): Promise<CreateNotificationData | null> {
    // Filter out messages from the same user
    if (data.sender_id === data.recipient_id) {
      return null;
    }

    return {
      recipient_id: data.recipient_id as string,
      sender_id: data.sender_id as string,
      type: 'MESSAGE',
      title: 'New Message',
      message: `${(data.sender_username as string) || 'Someone'} sent you a message`,
      reference_id: data.conversation_id as string,
      reference_type: 'MESSAGE',
      priority: 'HIGH',
      metadata: {
        conversation_id: data.conversation_id,
        message_id: data.message_id,
        sender_id: data.sender_id,
        sender_username: data.sender_username,
      },
    };
  }

  private async processMentionEvent(data: Record<string, unknown>): Promise<CreateNotificationData> {
    return {
      recipient_id: data.mentioned_user_id as string,
      sender_id: data.mentioner_id as string,
      type: 'POST_MENTION',
      title: 'You were mentioned',
      message: `${(data.mentioner_username as string) || 'Someone'} mentioned you in a post`,
      reference_id: data.post_id as string,
      reference_type: 'POST',
      priority: 'HIGH',
      metadata: {
        post_id: data.post_id,
        mentioner_id: data.mentioner_id,
        mentioner_username: data.mentioner_username,
      },
    };
  }
}

export default new NotificationService();

