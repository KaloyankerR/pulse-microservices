const NotificationPreferences = require('../models/notificationPreferences');
const logger = require('../utils/logger');
const metrics = require('../config/metrics');

class NotificationPreferencesService {
  // Get notification preferences for a user
  async getPreferences(userId) {
    const startTime = Date.now();
    
    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);

      metrics.incrementDatabaseOperation('findOne', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('findOne', Date.now() - startTime);

      return preferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'getPreferences' });
      metrics.incrementDatabaseOperation('findOne', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('findOne', Date.now() - startTime);
      throw error;
    }
  }

  // Update notification preferences for a user
  async updatePreferences(userId, preferencesData) {
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
        Object.keys(preferencesData.preferences).forEach(notificationType => {
          if (existingPreferences.preferences[notificationType]) {
            const typePreferences = preferencesData.preferences[notificationType];
            
            if (typePreferences.email !== undefined) {
              existingPreferences.preferences[notificationType].email = typePreferences.email;
            }
            if (typePreferences.push !== undefined) {
              existingPreferences.preferences[notificationType].push = typePreferences.push;
            }
            if (typePreferences.in_app !== undefined) {
              existingPreferences.preferences[notificationType].in_app = typePreferences.in_app;
            }
          }
        });
      }

      const updatedPreferences = await existingPreferences.save();

      logger.info('Notification preferences updated', {
        userId,
        preferences: preferencesData,
      });

      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'updatePreferences', preferencesData });
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Update specific notification type preference
  async updateTypePreference(userId, notificationType, channel, enabled) {
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

      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, { 
        userId, 
        action: 'updateTypePreference', 
        notificationType, 
        channel, 
        enabled 
      });
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Enable/disable all notifications for a channel
  async updateChannelPreferences(userId, channel, enabled) {
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

      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'updateChannelPreferences', channel, enabled });
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Update quiet hours
  async updateQuietHours(userId, quietHoursData) {
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

      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'updateQuietHours', quietHoursData });
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Reset preferences to default
  async resetToDefault(userId) {
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
      Object.keys(preferences.preferences).forEach(type => {
        const typePrefs = preferences.preferences[type];
        typePrefs.email = true;
        typePrefs.push = true;
        typePrefs.in_app = true;
      });

      const updatedPreferences = await preferences.save();

      logger.info('Notification preferences reset to default', { userId });

      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);

      return updatedPreferences;
    } catch (error) {
      logger.logError(error, { userId, action: 'resetToDefault' });
      metrics.incrementDatabaseOperation('save', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('save', Date.now() - startTime);
      throw error;
    }
  }

  // Check if notification should be sent based on preferences
  async shouldSendNotification(userId, notificationType, channel) {
    const startTime = Date.now();
    
    try {
      const preferences = await NotificationPreferences.getOrCreate(userId);
      const shouldSend = preferences.shouldSendNotification(notificationType, channel);

      metrics.incrementDatabaseOperation('findOne', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('findOne', Date.now() - startTime);

      return shouldSend;
    } catch (error) {
      logger.logError(error, { 
        userId, 
        action: 'shouldSendNotification', 
        notificationType, 
        channel 
      });
      metrics.incrementDatabaseOperation('findOne', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('findOne', Date.now() - startTime);
      // Default to true if preferences can't be checked
      return true;
    }
  }

  // Get preferences for multiple users (bulk operation)
  async getBulkPreferences(userIds) {
    const startTime = Date.now();
    
    try {
      const preferences = await NotificationPreferences.find({
        user_id: { $in: userIds }
      });

      const preferencesMap = {};
      preferences.forEach(pref => {
        preferencesMap[pref.user_id] = pref;
      });

      metrics.incrementDatabaseOperation('find', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('find', Date.now() - startTime);

      return preferencesMap;
    } catch (error) {
      logger.logError(error, { action: 'getBulkPreferences', userIds });
      metrics.incrementDatabaseOperation('find', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('find', Date.now() - startTime);
      throw error;
    }
  }

  // Delete preferences for a user
  async deletePreferences(userId) {
    const startTime = Date.now();
    
    try {
      const result = await NotificationPreferences.findOneAndDelete({ user_id: userId });

      logger.info('Notification preferences deleted', { userId });

      metrics.incrementDatabaseOperation('findOneAndDelete', 'notification_preferences', 'success');
      metrics.recordDatabaseOperationDuration('findOneAndDelete', Date.now() - startTime);

      return result;
    } catch (error) {
      logger.logError(error, { userId, action: 'deletePreferences' });
      metrics.incrementDatabaseOperation('findOneAndDelete', 'notification_preferences', 'error');
      metrics.recordDatabaseOperationDuration('findOneAndDelete', Date.now() - startTime);
      throw error;
    }
  }
}

module.exports = new NotificationPreferencesService();
