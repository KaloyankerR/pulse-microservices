// MongoDB initialization script
db = db.getSiblingDB('admin');

// Create user for pulse services
db.createUser({
  user: 'pulse_user',
  pwd: 'pulse_user',
  roles: [
    {
      role: 'readWrite',
      db: 'pulse_notifications'
    },
    {
      role: 'readWrite',
      db: 'messaging_db'
    }
  ]
});

// Switch to pulse_notifications database
db = db.getSiblingDB('pulse_notifications');

// Create collections and indexes
db.createCollection('notifications');
db.createCollection('notificationpreferences');
db.createCollection('usercache');

// Create indexes for better performance
db.notifications.createIndex({ recipient_id: 1, created_at: -1 });
db.notifications.createIndex({ recipient_id: 1, is_read: 1 });
db.notifications.createIndex({ created_at: -1 });
db.notifications.createIndex({ type: 1 });

db.notificationpreferences.createIndex({ user_id: 1 }, { unique: true });
db.usercache.createIndex({ id: 1 }, { unique: true });
db.usercache.createIndex({ username: 1 });

print('MongoDB initialization completed successfully');
