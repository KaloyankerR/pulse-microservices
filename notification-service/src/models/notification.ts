import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import {
  INotification,
  NotificationType,
  ReferenceType,
  NotificationPriority,
} from '../types/models';

const notificationSchema = new Schema<INotification>(
  {
    recipient_id: {
      type: String,
      required: true,
      index: true,
    },
    sender_id: {
      type: String,
      required: false,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'FOLLOW',
        'LIKE',
        'COMMENT',
        'EVENT_INVITE',
        'EVENT_RSVP',
        'POST_MENTION',
        'SYSTEM',
        'MESSAGE',
        'POST_SHARE',
        'EVENT_REMINDER',
        'FRIEND_REQUEST',
        'ACCOUNT_VERIFICATION',
        'PASSWORD_RESET',
        'SECURITY_ALERT',
      ] as NotificationType[],
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    reference_id: {
      type: String,
      required: false,
      index: true,
    },
    reference_type: {
      type: String,
      required: false,
      enum: ['POST', 'EVENT', 'USER', 'MESSAGE', 'COMMENT'] as ReferenceType[],
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    read_at: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as NotificationPriority[],
      default: 'MEDIUM',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'notifications',
  }
);

// Indexes for performance optimization
notificationSchema.index({ recipient_id: 1, is_read: 1 });
notificationSchema.index({ recipient_id: 1, created_at: -1 });
notificationSchema.index({ type: 1, created_at: -1 });
notificationSchema.index({ reference_id: 1, reference_type: 1 });
notificationSchema.index({ created_at: -1 });

// Virtual for formatted creation date
notificationSchema.virtual('formatted_created_at').get(function (this: INotification) {
  return this.created_at.toISOString();
});

// Virtual for formatted read date
notificationSchema.virtual('formatted_read_at').get(function (this: INotification) {
  return this.read_at ? this.read_at.toISOString() : null;
});

// Pre-save middleware
notificationSchema.pre('save', function (next) {
  this.updated_at = new Date();

  // Auto-set read_at when is_read becomes true
  if (this.is_read && !this.read_at) {
    this.read_at = new Date();
  }

  // Auto-unset read_at when is_read becomes false
  if (!this.is_read && this.read_at) {
    this.read_at = null;
  }

  next();
});

// Instance methods
notificationSchema.methods.markAsRead = function (this: INotification): Promise<INotification> {
  this.is_read = true;
  this.read_at = new Date();
  return this.save();
};

notificationSchema.methods.markAsUnread = function (this: INotification): Promise<INotification> {
  this.is_read = false;
  this.read_at = null;
  return this.save();
};

notificationSchema.methods.toSafeObject = function (this: INotification): Record<string, unknown> {
  const obj = this.toObject();
  delete (obj as Record<string, unknown>).__v;
  return obj;
};

// Static methods
notificationSchema.statics.findByRecipient = function (
  recipientId: string,
  options: {
    unreadOnly?: boolean;
    type?: NotificationType;
    sort?: Record<string, 1 | -1>;
    limit?: number;
    skip?: number;
  } = {}
): Promise<INotification[]> {
  const query: Record<string, unknown> = { recipient_id: recipientId };

  if (options.unreadOnly) {
    query.is_read = false;
  }

  if (options.type) {
    query.type = options.type;
  }

  const sort = options.sort || { created_at: -1 };
  const limit = options.limit || 50;
  const skip = options.skip || 0;

  return this.find(query).sort(sort).limit(limit).skip(skip);
};

notificationSchema.statics.getUnreadCount = function (recipientId: string): Promise<number> {
  return this.countDocuments({ recipient_id: recipientId, is_read: false });
};

notificationSchema.statics.markAllAsRead = function (recipientId: string): Promise<unknown> {
  return this.updateMany(
    { recipient_id: recipientId, is_read: false },
    {
      $set: {
        is_read: true,
        read_at: new Date(),
      },
    }
  );
};

notificationSchema.statics.deleteOldNotifications = function (daysOld = 30): Promise<unknown> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    created_at: { $lt: cutoffDate },
    is_read: true,
  });
};

interface NotificationModel extends Model<INotification> {
  findByRecipient(
    recipientId: string,
    options?: {
      unreadOnly?: boolean;
      type?: NotificationType;
      sort?: Record<string, 1 | -1>;
      limit?: number;
      skip?: number;
    }
  ): Promise<INotification[]>;
  getUnreadCount(recipientId: string): Promise<number>;
  markAllAsRead(recipientId: string): Promise<unknown>;
  deleteOldNotifications(daysOld?: number): Promise<unknown>;
  getNotificationStats(recipientId: string): Promise<{
    total: number;
    unread: number;
    read: number;
    typeBreakdown: Record<string, { unread: number; read: number }>;
  }>;
}

notificationSchema.statics.getNotificationStats = async function (
  recipientId: string
): Promise<{
  total: number;
  unread: number;
  read: number;
  typeBreakdown: Record<string, { unread: number; read: number }>;
}> {
  // Simple aggregation for basic stats
  const basicStats = await this.aggregate([
    { $match: { recipient_id: recipientId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: {
            $cond: [{ $eq: ['$is_read', false] }, 1, 0],
          },
        },
        read: {
          $sum: {
            $cond: [{ $eq: ['$is_read', true] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        unread: 1,
        read: 1,
      },
    },
  ]);

  // Get type breakdown separately
  const typeStats = await this.aggregate([
    { $match: { recipient_id: recipientId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        unread: {
          $sum: {
            $cond: [{ $eq: ['$is_read', false] }, 1, 0],
          },
        },
        read: {
          $sum: {
            $cond: [{ $eq: ['$is_read', true] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        unread: 1,
        read: 1,
      },
    },
  ]);

  // Format the results
  const result = basicStats[0] || { total: 0, unread: 0, read: 0 };
  const typeBreakdown: Record<string, { unread: number; read: number }> = {};

  typeStats.forEach((stat: { type?: string; unread?: number; read?: number }) => {
    if (stat.type) {
      typeBreakdown[stat.type] = {
        unread: stat.unread || 0,
        read: stat.read || 0,
      };
    }
  });

  return {
    ...result,
    typeBreakdown,
  };
};

// Create the model
const Notification: NotificationModel = mongoose.model<INotification, NotificationModel>(
  'Notification',
  notificationSchema
);

export default Notification;

