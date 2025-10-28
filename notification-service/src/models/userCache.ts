import mongoose, { Schema, Model } from 'mongoose';
import { IUserCache, UserCacheData } from '../types/models';

const userCacheSchema = new Schema<IUserCache>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      maxlength: 50,
    },
    display_name: {
      type: String,
      maxlength: 100,
    },
    avatar_url: {
      type: String,
      maxlength: 500,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    last_synced: {
      type: Date,
      default: Date.now,
    },
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
    collection: 'user_cache',
  }
);

// Indexes
userCacheSchema.index({ user_id: 1 });
userCacheSchema.index({ username: 1 });
userCacheSchema.index({ last_synced: -1 });

// Pre-save middleware
userCacheSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

// Instance methods
userCacheSchema.methods.updateFromUserData = function (
  this: IUserCache,
  userData: Partial<IUserCache>
): void {
  if (userData.username !== undefined) this.username = userData.username;
  if (userData.display_name !== undefined) this.display_name = userData.display_name;
  if (userData.avatar_url !== undefined) this.avatar_url = userData.avatar_url;
  if (userData.verified !== undefined) this.verified = userData.verified;
  this.last_synced = new Date();
};

userCacheSchema.methods.toSafeObject = function (this: IUserCache): Record<string, unknown> {
  const obj = this.toObject();
  delete (obj as Record<string, unknown>).__v;
  return obj;
};

// Static methods
userCacheSchema.statics.findByUserId = function (
  userId: string
): Promise<IUserCache | null> {
  return this.findOne({ user_id: userId });
};

userCacheSchema.statics.findByUserIds = function (userIds: string[]): Promise<IUserCache[]> {
  return this.find({ user_id: { $in: userIds } });
};

userCacheSchema.statics.createOrUpdate = async function (
  userData: UserCacheData
): Promise<IUserCache> {
  // @ts-ignore - Mongoose static method
  const existing = await this.findByUserId(userData.user_id);

  if (existing) {
    existing.updateFromUserData(userData);
    return existing.save();
  } else {
    return this.create({
      user_id: userData.user_id,
      username: userData.username,
      display_name: userData.display_name,
      avatar_url: userData.avatar_url,
      verified: userData.verified || false,
    });
  }
};

userCacheSchema.statics.cleanupOldEntries = function (daysOld = 30): Promise<unknown> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    last_synced: { $lt: cutoffDate },
  });
};

userCacheSchema.statics.bulkUpdate = async function (
  userDataArray: UserCacheData[]
): Promise<{
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
}> {
  const bulkOps = userDataArray.map((userData) => ({
    updateOne: {
      filter: { user_id: userData.user_id },
      update: {
        $set: {
          username: userData.username,
          display_name: userData.display_name,
          avatar_url: userData.avatar_url,
          verified: userData.verified || false,
          last_synced: new Date(),
          updated_at: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    const result = await this.bulkWrite(bulkOps);
    return {
      matchedCount: result.matchedCount || 0,
      modifiedCount: result.modifiedCount || 0,
      upsertedCount: result.upsertedCount || 0,
    };
  }

  return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
};

interface UserCacheModel extends Model<IUserCache> {
  findByUserId(userId: string): Promise<IUserCache | null>;
  findByUserIds(userIds: string[]): Promise<IUserCache[]>;
  createOrUpdate(userData: UserCacheData): Promise<IUserCache>;
  cleanupOldEntries(daysOld?: number): Promise<unknown>;
  bulkUpdate(userDataArray: UserCacheData[]): Promise<{
    matchedCount: number;
    modifiedCount: number;
    upsertedCount: number;
  }>;
}

// Create the model
const UserCache = mongoose.model<IUserCache, UserCacheModel>('UserCache', userCacheSchema);

export default UserCache;

