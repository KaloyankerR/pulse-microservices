import mongoose, { Schema, Model } from 'mongoose';
import {
  INotificationPreferences,
  NotificationPreferenceChannels,
  NotificationTypePreferences,
  QuietHours,
} from '../types/models';

const notificationPreferencesSchema = new Schema<INotificationPreferences>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email_notifications: {
      type: Boolean,
      default: true,
    },
    push_notifications: {
      type: Boolean,
      default: true,
    },
    in_app_notifications: {
      type: Boolean,
      default: true,
    },
    preferences: {
      FOLLOW: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      LIKE: {
        email: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      COMMENT: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      EVENT_INVITE: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      EVENT_RSVP: {
        email: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
        in_app: { type: Boolean, default: true },
      },
      POST_MENTION: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      SYSTEM: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      MESSAGE: {
        email: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      POST_SHARE: {
        email: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      EVENT_REMINDER: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      FRIEND_REQUEST: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
      ACCOUNT_VERIFICATION: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
        in_app: { type: Boolean, default: true },
      },
      PASSWORD_RESET: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
        in_app: { type: Boolean, default: false },
      },
      SECURITY_ALERT: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        in_app: { type: Boolean, default: true },
      },
    } as NotificationTypePreferences,
    quiet_hours: {
      enabled: {
        type: Boolean,
        default: false,
      },
      start_time: {
        type: String,
        default: '22:00',
        validate: {
          validator: function (v: string): boolean {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:MM format',
        },
      },
      end_time: {
        type: String,
        default: '08:00',
        validate: {
          validator: function (v: string): boolean {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:MM format',
        },
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    } as QuietHours,
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'notification_preferences',
  }
);

// Index
notificationPreferencesSchema.index({ user_id: 1 });

// Pre-save middleware
notificationPreferencesSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

// Instance methods
notificationPreferencesSchema.methods.getPreferenceForType = function (
  this: INotificationPreferences,
  notificationType: string,
  channel: string
): boolean {
  const prefs = this.preferences as NotificationTypePreferences;
  if (!prefs[notificationType]) {
    return false;
  }

  const typePreferences = prefs[notificationType] as NotificationPreferenceChannels;

  switch (channel) {
    case 'email':
      return typePreferences.email && this.email_notifications;
    case 'push':
      return typePreferences.push && this.push_notifications;
    case 'in_app':
      return typePreferences.in_app && this.in_app_notifications;
    default:
      return false;
  }
};

notificationPreferencesSchema.methods.setPreferenceForType = function (
  this: INotificationPreferences,
  notificationType: string,
  channel: string,
  enabled: boolean
): void {
  const prefs = this.preferences as NotificationTypePreferences;
  if (!prefs[notificationType]) {
    prefs[notificationType] = {
      email: false,
      push: false,
      in_app: false,
    };
  }

  const typePreferences = prefs[notificationType] as NotificationPreferenceChannels;

  switch (channel) {
    case 'email':
      typePreferences.email = enabled;
      break;
    case 'push':
      typePreferences.push = enabled;
      break;
    case 'in_app':
      typePreferences.in_app = enabled;
      break;
  }
};

notificationPreferencesSchema.methods.isQuietHours = function (
  this: INotificationPreferences
): boolean {
  if (!this.quiet_hours.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', {
    hour12: false,
    timeZone: this.quiet_hours.timezone || 'UTC',
  });

  const startTime = this.quiet_hours.start_time;
  const endTime = this.quiet_hours.end_time;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  // Handle same-day quiet hours (e.g., 09:00 to 17:00)
  return currentTime >= startTime && currentTime <= endTime;
};

notificationPreferencesSchema.methods.shouldSendNotification = function (
  this: INotificationPreferences,
  notificationType: string,
  channel: string
): boolean {
  // Check if quiet hours are active
  if (this.isQuietHours() && channel !== 'in_app') {
    return false;
  }

  // Check user's preference for this notification type and channel
  return this.getPreferenceForType(notificationType, channel);
};

// Static methods
notificationPreferencesSchema.statics.findByUserId = function (
  userId: string
): Promise<INotificationPreferences | null> {
  return this.findOne({ user_id: userId });
};

notificationPreferencesSchema.statics.createDefault = function (
  userId: string
): Promise<INotificationPreferences> {
  return this.create({ user_id: userId });
};

notificationPreferencesSchema.statics.getOrCreate = async function (
  userId: string
): Promise<INotificationPreferences> {
  let preferences = await this.findByUserId(userId);

  if (!preferences) {
    preferences = await this.createDefault(userId);
  }

  return preferences;
};

interface NotificationPreferencesModel extends Model<INotificationPreferences> {
  findByUserId(userId: string): Promise<INotificationPreferences | null>;
  createDefault(userId: string): Promise<INotificationPreferences>;
  getOrCreate(userId: string): Promise<INotificationPreferences>;
}

// Create the model
const NotificationPreferences = mongoose.model<
  INotificationPreferences,
  NotificationPreferencesModel
>('NotificationPreferences', notificationPreferencesSchema);

export default NotificationPreferences;

