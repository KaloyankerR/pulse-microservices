const mongoose = require('mongoose');

// User Cache Schema - for storing minimal user data for notifications
const userCacheSchema = new mongoose.Schema({
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
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'user_cache',
});

// Indexes
userCacheSchema.index({ user_id: 1 });
userCacheSchema.index({ username: 1 });
userCacheSchema.index({ last_synced: -1 });

// Pre-save middleware
userCacheSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Instance methods
userCacheSchema.methods.updateFromUserData = function(userData) {
  this.username = userData.username || this.username;
  this.display_name = userData.display_name || this.display_name;
  this.avatar_url = userData.avatar_url || this.avatar_url;
  this.verified = userData.verified !== undefined ? userData.verified : this.verified;
  this.last_synced = new Date();
};

userCacheSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
userCacheSchema.statics.findByUserId = function(userId) {
  return this.findOne({ user_id: userId });
};

userCacheSchema.statics.findByUserIds = function(userIds) {
  return this.find({ user_id: { $in: userIds } });
};

userCacheSchema.statics.createOrUpdate = async function(userData) {
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

userCacheSchema.statics.cleanupOldEntries = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    last_synced: { $lt: cutoffDate }
  });
};

userCacheSchema.statics.bulkUpdate = async function(userDataArray) {
  const bulkOps = userDataArray.map(userData => ({
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
        }
      },
      upsert: true,
    }
  }));
  
  if (bulkOps.length > 0) {
    return this.bulkWrite(bulkOps);
  }
  
  return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
};

// Create the model
const UserCache = mongoose.model('UserCache', userCacheSchema);

module.exports = UserCache;
