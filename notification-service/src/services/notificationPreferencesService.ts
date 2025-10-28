import NotificationPreferences from '../models/notificationPreferences';
import { INotificationPreferences } from '../types/models';
import logger from '../utils/logger';
import metrics from '../config/metrics';
import { UpdatePreferencesRequest } from '../types/api';

class NotificationPreferencesService {
  // Get notification preferences for a user
  async getPreferences(userId: string): Promise<INotificationPreferences> {
    const startTime = Date.now();

    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('findOne', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('findOne', Date.now() - startTime);

      return preferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'getPreferences' });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('findOne', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('findOne', Date.now() - startTime);
      throw error;
    }
  }

  // Update notification preferences for a user
  async updatePreferences(userId: string, preferencesData: UpdatePreferencesRequest): Promise<INotificationPreferences> {
    const startTime = Date.now();

    try {
      const existingPreferences = await NotificationPreferences.getOrCreate(userId);

      // Update general preferences
      if (preferencesData.email_notifications !== undefined) {
        existingPreferences.email_notifications = preferencesData.email_notifications;
      }
      if (preferencesData.push_notifications !== undefined) {
        existingPreferences.push_notifications = preferencesData.push_notifications;
      }
      if (preferencesData.in_app_notifications !== undefined) {
        existingPreferences.in_app_notifications = preferencesData.in_app_notifications;
      }

      // Update quiet hours
      if (preferencesData.quiet_hours) {
        if (preferencesData.quiet_hours.enabled !== undefined) {
          existingPreferences.quiet_hours.enabled = preferencesData.quiet_hours.enabled;
        }
        if (preferencesData.quiet_hours.start_time) {
          existingPreferences.quiet_hours.start_time = preferencesData.quiet_hours.start_time;
        }
        if (preferencesData.quiet_hours.end_time) {
          existingPreferences.quiet_hours.end_time = preferencesData.quiet_hours.end_time;
        }
        if (preferencesData.quiet_hours.timezone) {
          existingPreferences.quiet_hours.timezone = preferencesData.quiet_hours.timezone;
        }
      }

      // Update type-specific preferences
      if (preferencesData.preferences) {
        Object.keys(preferencesData.preferences).forEach((notificationType) => {
          const prefs = existingPreferences.preferences as Record<string, { email?: boolean; push?: boolean; in_app?: boolean }>;
          if (prefs[notificationType]) {
            const typePreferences = preferencesData.preferences![notificationType];

            if (typePreferences.email !== undefined) {
              prefs[notificationType].email = typePreferences.email;
            }
            if (typePreferences.push !== undefined) {
              prefs[notificationType].push = typePreferences.push;
            }
            if (typePreferences.in_app !== undefined) {
              prefs[notificationType].in_app = typePreferences.in_app;
            }
          }
        });
      }

      const updatedPreferences = await existingPreferences.save();

      logger.info('Notification preferences updated', {
        userId,
        preferences: preferencesData,
      });

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'updatePreferences', preferencesData });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Update specific notification type preference
  async updateTypePreference(
    userId: string,
    notificationType: string,
    channel: string,
    enabled: boolean
  ): Promise<INotificationPreferences> {
    const startTime = Date.now();

    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);

      preferences.setPreferenceForType(notificationType, channel, enabled);

      const updatedPreferences = await preferences.save();

      logger.info('Notification type preference updated', {
        userId,
        notificationType,
        channel,
        enabled,
      });

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, {
        userId,
        action: 'updateTypePreference',
        notificationType,
        channel,
        enabled,
      });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Enable/disable all notifications for a channel
  async updateChannelPreferences(userId: string, channel: string, enabled: boolean): Promise<INotificationPreferences> {
    const startTime = Date.now();

    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);

      switch (channel) {
        case 'email':
          preferences.email_notifications = enabled;
          break;
        case 'push':
          preferences.push_notifications = enabled;
          break;
        case 'in_app':
          preferences.in_app_notifications = enabled;
          break;
        default:
          throw new Error(`Invalid channel: ${channel}`);
      }

      const updatedPreferences = await preferences.save();

      logger.info('Channel preferences updated', {
        userId,
        channel,
        enabled,
      });

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'updateChannelPreferences', channel, enabled });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Update quiet hours
  async updateQuietHours(
    userId: string,
    quietHoursData: {
      enabled?: boolean;
      start_time?: string;
      end_time?: string;
      timezone?: string;
    }
  ): Promise<INotificationPreferences> {
    const startTime = Date.now();

    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);

      if (quietHoursData.enabled !== undefined) {
        preferences.quiet_hours.enabled = quietHoursData.enabled;
      }
      if (quietHoursData.start_time) {
        preferences.quiet_hours.start_time = quietHoursData.start_time;
      }
      if (quietHoursData.end_time) {
        preferences.quiet_hours.end_time = quietHoursData.end_time;
      }
      if (quietHoursData.timezone) {
        preferences.quiet_hours.timezone = quietHoursData.timezone;
      }

      const updatedPreferences = await preferences.save();

      logger.info('Quiet hours updated', {
        userId,
        quietHours: quietHoursData,
      });

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'updateQuietHours', quietHoursData });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Reset preferences to default
  async resetToDefault(userId: string): Promise<INotificationPreferences> {
    const startTime = Date.now();

    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);

      // Reset to default values
      preferences.email_notifications = true;
      preferences.push_notifications = true;
      preferences.in_app_notifications = true;

      preferences.quiet_hours.enabled = false;
      preferences.quiet_hours.start_time = '22:00';
      preferences.quiet_hours.end_time = '08:00';
      preferences.quiet_hours.timezone = 'UTC';

      // Reset type-specific preferences to defaults
      const prefs = preferences.preferences as Record<string, { email: boolean; push: boolean; in_app: boolean }>;
      Object.keys(prefs).forEach((type) => {
        const typePrefs = prefs[type];
        typePrefs.email = true;
        typePrefs.push = true;
        typePrefs.in_app = true;
      });

      const updatedPreferences = await preferences.save();

      logger.info('Notification preferences reset to default', { userId });

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'resetToDefault' });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Check if notification should be sent based on preferences
  async shouldSendNotification(userId: string, notificationType: string, channel: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);
      const shouldSend = preferences.shouldSendNotification(notificationType, channel);

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('findOne', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('findOne', Date.now() - startTime);

      return shouldSend;
    } catch (error) {
      logger.logError(error, {
        userId,
        action: 'shouldSendNotification',
        notificationType,
        channel,
      });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('findOne', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('findOne', Date.now() - startTime);
      // Default to true if preferences can't be checked
      return true;
    }
  }

  // Get preferences for multiple users (bulk operation)
  async getBulkPreferences(userIds: string[]): Promise<Record<string, INotificationPreferences>> {
    const startTime = Date.now();

    try {
      const preferences = await NotificationPreferences.find({
        user_id: { $in: userIds },
      });

      const preferencesMap: Record<string, INotificationPreferences> = {};
      preferences.forEach((pref) => {
        preferencesMap[pref.user_id] = pref;
      });

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('find', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('find', Date.now() - startTime);

      return preferencesMap;
    } catch (error) {
      logger.logError(error, { action: 'getBulkPreferences', userIds });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('find', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('find', Date.now() - startTime);
      throw error;
    }
  }

  // Delete preferences for a user
  async deletePreferences(userId: string): Promise<INotificationPreferences | null> {
    const startTime = Date.now();

    try {
      const result = await NotificationPreferences.findOneAndDelete({ user_id: userId });

      logger.info('Notification preferences deleted', { userId });

      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('findOneAndDelete', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('findOneAndDelete', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, action: 'deletePreferences' });
      // @ts-ignore - metrics function signature
      metrics.incrementDatabaseOperation('findOneAndDelete', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('findOneAndDelete', Date.now() - startTime);
      throw error;
    }
  }
}

export default new NotificationPreferencesService();

