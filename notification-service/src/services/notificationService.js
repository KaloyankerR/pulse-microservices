const Notification = require('../models/notification');
const UserCache = require('../models/userCache');
const NotificationPreferences = require('../models/notificationPreferences');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const metrics = require('../config/metrics');

class NotificationService {
  // Create a new notification
  async createNotification(notificationData) {
    const startTime = Date.now();
    
    try {
      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      logger.logNotification('created', savedNotification._id, notificationData.recipient_id, {
        type: notificationData.type,
        title: notificationData.title,
      });

      metrics.incrementNotificationCounter(notificationData.type, 'success');
      metrics.recordNotificationProcessingDuration(notificationData.type, Date.now() - startTime);

      // Invalidate cache for user notifications
      await this.invalidateUserNotificationCache(notificationData.recipient_id);

      return savedNotification;
    } catch (error) {
      logger.logError(error, { action: 'createNotification', notificationData });
      metrics.incrementNotificationCounter(notificationData.type || 'UNKNOWN', 'error');
      metrics.recordNotificationProcessingDuration(notificationData.type || 'UNKNOWN', Date.now() - startTime);
      throw error;
    }
  }

  // Get notifications for a user with pagination
  async getNotifications(userId, options = {}) {
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
          return JSON.parse(cached);
        }
        metrics.incrementCacheMiss('get_notifications');
        logger.logCacheOperation('get', cacheKey, 'miss');
      } catch (cacheError) {
        logger.warn('Cache error during notification fetch', { error: cacheError.message });
      }

      const query = { recipient_id: userId };
      
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
      const enrichedNotifications = await this.enrichNotificationsWithUserData(notifications);

      const result = {
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
        logger.warn('Cache error during notification cache set', { error: cacheError.message });
      }

      metrics.incrementDatabaseOperation('find', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('find', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, action: 'getNotifications', options });
      metrics.incrementDatabaseOperation('find', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('find', Date.now() - startTime);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(userId, notificationId) {
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

      metrics.incrementDatabaseOperation('update', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('update', Date.now() - startTime);

      return notification;
    } catch (error) {
      logger.logError(error, { userId, notificationId, action: 'markAsRead' });
      metrics.incrementDatabaseOperation('update', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('update', Date.now() - startTime);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const startTime = Date.now();
    
    try {
      const result = await Notification.updateMany(
        { recipient_id: userId, is_read: false },
        { 
          $set: { 
            is_read: true, 
            read_at: new Date() 
          } 
        }
      );

      logger.logNotification('marked_all_read', 'all', userId, {
        modified_count: result.modifiedCount,
      });

      // Invalidate cache for user notifications
      await this.invalidateUserNotificationCache(userId);

      metrics.incrementDatabaseOperation('updateMany', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('updateMany', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, action: 'markAllAsRead' });
      metrics.incrementDatabaseOperation('updateMany', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('updateMany', Date.now() - startTime);
      throw error;
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
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
        logger.warn('Cache error during unread count fetch', { error: cacheError.message });
      }

      const count = await Notification.countDocuments({ 
        recipient_id: userId, 
        is_read: false 
      });

      // Cache for 1 minute
      try {
        await redis.set(cacheKey, count.toString(), 60);
      } catch (cacheError) {
        logger.warn('Cache error during unread count cache set', { error: cacheError.message });
      }

      metrics.incrementDatabaseOperation('count', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('count', Date.now() - startTime);

      return count;
    } catch (error) {
      logger.logError(error, { userId, action: 'getUnreadCount' });
      metrics.incrementDatabaseOperation('count', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('count', Date.now() - startTime);
      throw error;
    }
  }

  // Get notification statistics for a user
  async getNotificationStats(userId) {
    const startTime = Date.now();
    
    try {
      const stats = await Notification.getNotificationStats(userId);
      
      metrics.incrementDatabaseOperation('aggregate', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('aggregate', Date.now() - startTime);

      return stats || {
        total: 0,
        unread: 0,
        read: 0,
        typeBreakdown: {},
      };
    } catch (error) {
      logger.logError(error, { userId, action: 'getNotificationStats' });
      metrics.incrementDatabaseOperation('aggregate', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('aggregate', Date.now() - startTime);
      throw error;
    }
  }

  // Delete a notification
  async deleteNotification(userId, notificationId) {
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

      metrics.incrementDatabaseOperation('delete', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('delete', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, notificationId, action: 'deleteNotification' });
      metrics.incrementDatabaseOperation('delete', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('delete', Date.now() - startTime);
      throw error;
    }
  }

  // Cleanup old notifications
  async cleanupOldNotifications(userId, daysOld = 30) {
    const startTime = Date.now();
    
    try {
      const result = await Notification.deleteOldNotifications(daysOld);

      logger.logNotification('cleanup', 'old_notifications', userId, {
        deleted_count: result.deletedCount,
        days_old: daysOld,
      });

      // Invalidate cache for user notifications
      await this.invalidateUserNotificationCache(userId);

      metrics.incrementDatabaseOperation('deleteMany', 'notifications', 'success');
      metrics.recordDatabaseOperationDuration('deleteMany', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, action: 'cleanupOldNotifications', daysOld });
      metrics.incrementDatabaseOperation('deleteMany', 'notifications', 'error');
      metrics.recordDatabaseOperationDuration('deleteMany', Date.now() - startTime);
      throw error;
    }
  }

  // Process event and create notification
  async processEvent(eventData) {
    const startTime = Date.now();
    
    try {
      const { event_type, data } = eventData;
      
      logger.logEventProcessing(event_type, 'started', { eventData });

      let notificationData;
      
      switch (event_type) {
        case 'user.followed':
          notificationData = await this.processFollowEvent(data);
          break;
        case 'post.liked':
          notificationData = await this.processLikeEvent(data);
          break;
        case 'comment.created':
          notificationData = await this.processCommentEvent(data);
          break;
        case 'event.created':
          notificationData = await this.processEventCreatedEvent(data);
          break;
        case 'event.rsvp.added':
          notificationData = await this.processEventRsvpEvent(data);
          break;
        case 'message.sent':
          notificationData = await this.processMessageEvent(data);
          break;
        case 'user.mentioned':
          notificationData = await this.processMentionEvent(data);
          break;
        default:
          logger.warn('Unknown event type received', { event_type, data });
          metrics.incrementEventProcessingCounter(event_type, 'unknown_event');
          return null;
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
  async shouldCreateNotification(notificationData) {
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
  async enrichNotificationsWithUserData(notifications) {
    try {
      const senderIds = notifications
        .map(n => n.sender_id)
        .filter(id => id);

      if (senderIds.length === 0) {
        return notifications;
      }

      const userCache = await UserCache.findByUserIds(senderIds);
      const userCacheMap = {};
      
      userCache.forEach(user => {
        userCacheMap[user.user_id] = user;
      });

      return notifications.map(notification => ({
        ...notification,
        sender: notification.sender_id ? userCacheMap[notification.sender_id] : null,
      }));
    } catch (error) {
      logger.logError(error, { action: 'enrichNotificationsWithUserData' });
      // Return notifications without enrichment if error occurs
      return notifications;
    }
  }

  // Invalidate user notification cache
  async invalidateUserNotificationCache(userId) {
    try {
      const unreadKey = `unread_count:${userId}`;
      
      // Delete unread count cache
      await redis.del(unreadKey);
      
      // Delete common notification cache keys
      // Since we know the cache key pattern, we can delete the most common ones
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
          logger.warn('Failed to delete cache key', { key, error: keyError.message });
        }
      }
      
      logger.logCacheOperation('invalidate', `user:${userId}`, 'success', { deletedKeys: commonCacheKeys.length });
    } catch (error) {
      logger.logError(error, { action: 'invalidateUserNotificationCache', userId });
    }
  }

  // Event processing methods
  async processFollowEvent(data) {
    return {
      recipient_id: data.following_id,
      sender_id: data.follower_id,
      type: 'FOLLOW',
      title: 'New Follower',
      message: `${data.follower_username || 'Someone'} started following you`,
      reference_id: data.follower_id,
      reference_type: 'USER',
      priority: 'MEDIUM',
      metadata: {
        follower_id: data.follower_id,
        follower_username: data.follower_username,
      },
    };
  }

  async processLikeEvent(data) {
    return {
      recipient_id: data.post_author_id,
      sender_id: data.user_id,
      type: 'LIKE',
      title: 'Post Liked',
      message: `${data.user_username || 'Someone'} liked your post`,
      reference_id: data.post_id,
      reference_type: 'POST',
      priority: 'LOW',
      metadata: {
        post_id: data.post_id,
        user_id: data.user_id,
        user_username: data.user_username,
      },
    };
  }

  async processCommentEvent(data) {
    return {
      recipient_id: data.post_author_id,
      sender_id: data.commenter_id,
      type: 'COMMENT',
      title: 'New Comment',
      message: `${data.commenter_username || 'Someone'} commented on your post`,
      reference_id: data.post_id,
      reference_type: 'POST',
      priority: 'HIGH',
      metadata: {
        post_id: data.post_id,
        comment_id: data.comment_id,
        commenter_id: data.commenter_id,
        commenter_username: data.commenter_username,
      },
    };
  }

  async processEventCreatedEvent(data) {
    // This would typically notify followers or friends
    // For now, we'll skip this as it's not a direct notification
    return null;
  }

  async processEventRsvpEvent(data) {
    return {
      recipient_id: data.event_creator_id,
      sender_id: data.user_id,
      type: 'EVENT_RSVP',
      title: 'Event RSVP',
      message: `${data.user_username || 'Someone'} is ${data.status.toLowerCase()} to your event`,
      reference_id: data.event_id,
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

  async processMessageEvent(data) {
    // Filter out messages from the same user
    if (data.sender_id === data.recipient_id) {
      return null;
    }

    return {
      recipient_id: data.recipient_id,
      sender_id: data.sender_id,
      type: 'MESSAGE',
      title: 'New Message',
      message: `${data.sender_username || 'Someone'} sent you a message`,
      reference_id: data.conversation_id,
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

  async processMentionEvent(data) {
    return {
      recipient_id: data.mentioned_user_id,
      sender_id: data.mentioner_id,
      type: 'POST_MENTION',
      title: 'You were mentioned',
      message: `${data.mentioner_username || 'Someone'} mentioned you in a post`,
      reference_id: data.post_id,
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

module.exports = new NotificationService();
