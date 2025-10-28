import { publishEvent, consumeEvents } from '../config/rabbitmq';
import prisma from '../config/database';
import logger from '../utils/logger';
import {
  BaseEvent,
  UserFollowedEventData,
  UserBlockedEventData,
  UserDeletedEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
} from '../types';

class EventService {
  async publishUserFollowed(followerId: string, followingId: string): Promise<void> {
    try {
      logger.info('Publishing user.followed event', { followerId, followingId });
      
      // Get user information for notification
      const followerUser = await prisma.userCache.findUnique({
        where: { id: followerId }
      });

      const eventData: UserFollowedEventData = {
        follower_id: followerId,
        following_id: followingId,
        follower_username: followerUser?.username || 'Someone',
        timestamp: new Date().toISOString(),
      };

      logger.info('Event data prepared', eventData);

      const result = await publishEvent('user.followed', eventData as Record<string, unknown>);
      
      if (result) {
        logger.info('Event published successfully', { eventType: 'user.followed', followerId, followingId });
      } else {
        logger.warn('Event publishing failed', { eventType: 'user.followed', followerId, followingId });
      }
    } catch (error) {
      logger.error('Error publishing user.followed event', { error: (error as Error).message, followerId, followingId });
    }
  }

  async publishUserBlocked(blockerId: string, blockedId: string): Promise<void> {
    const eventData: UserBlockedEventData = {
      blockerId,
      blockedId,
      timestamp: new Date().toISOString(),
    };
    await publishEvent('user.blocked', eventData as Record<string, unknown>);
  }

  async startEventConsumers(): Promise<void> {
    // Listen for user.deleted events
    await consumeEvents(['user.deleted'], async (event: BaseEvent) => {
      await this.handleUserDeleted(event as unknown as UserDeletedEvent);
    });

    // Listen for user.created and user.updated events to sync user cache
    await consumeEvents(['user.created', 'user.updated'], async (event: BaseEvent) => {
      if (event.type === 'user.created') {
        await this.handleUserSync(event as unknown as UserCreatedEvent);
      } else if (event.type === 'user.updated') {
        await this.handleUserSync(event as unknown as UserUpdatedEvent);
      }
    });
  }

  async handleUserDeleted(event: UserDeletedEvent): Promise<void> {
    try {
      const { userId } = event.data;
      logger.info(`Processing user.deleted event for user ${userId}`);

      // Delete all follow relationships
      await prisma.follow.deleteMany({
        where: {
          OR: [{ followerId: userId }, { followingId: userId }],
        },
      });

      // Delete all block relationships
      await prisma.block.deleteMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
      });

      // Delete social stats
      await prisma.userSocialStats.delete({
        where: { userId },
      }).catch(() => {}); // Ignore if not exists

      // Delete user cache
      await prisma.userCache.delete({
        where: { id: userId },
      }).catch(() => {}); // Ignore if not exists

      logger.info(`Successfully cleaned up data for deleted user ${userId}`);
    } catch (error) {
      logger.error('Error handling user.deleted event:', error);
    }
  }

  async handleUserSync(event: UserCreatedEvent | UserUpdatedEvent): Promise<void> {
    try {
      const { user } = event.data;
      logger.info(`Syncing user cache for user ${user.id}`);

      await prisma.userCache.upsert({
        where: { id: user.id },
        update: {
          username: user.username,
          displayName: user.displayName || null,
          avatarUrl: user.avatarUrl || null,
          verified: user.verified || false,
          lastSynced: new Date(),
        },
        create: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || null,
          avatarUrl: user.avatarUrl || null,
          verified: user.verified || false,
          lastSynced: new Date(),
        },
      });

      logger.info(`Successfully synced user cache for user ${user.id}`);
    } catch (error) {
      logger.error('Error syncing user cache:', error);
    }
  }
}

export default new EventService();

