// MongoDB initialization script
db = db.getSiblingDB('admin');

// Create user for pulse services (only if it doesn't exist)
try {
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
  print('User pulse_user created successfully');
} catch (error) {
  if (error.code === 51003) { // User already exists
    print('User pulse_user already exists, skipping creation');
  } else {
    print('Error creating user:', error.message);
    throw error;
  }
}

// Switch to pulse_notifications database
db = db.getSiblingDB('pulse_notifications');

// Create collections and indexes (only if they don't exist)
const collections = ['notifications', 'notificationpreferences', 'usercache'];

collections.forEach(collectionName => {
  if (!db.getCollectionNames().includes(collectionName)) {
    db.createCollection(collectionName);
    print(`Collection ${collectionName} created successfully`);
  } else {
    print(`Collection ${collectionName} already exists, skipping creation`);
  }
});

// Create indexes for better performance
const indexDefinitions = [
  { collection: 'notifications', index: { recipient_id: 1, created_at: -1 } },
  { collection: 'notifications', index: { recipient_id: 1, is_read: 1 } },
  { collection: 'notifications', index: { created_at: -1 } },
  { collection: 'notifications', index: { type: 1 } },
  { collection: 'notificationpreferences', index: { user_id: 1 }, options: { unique: true } },
  { collection: 'usercache', index: { id: 1 }, options: { unique: true } },
  { collection: 'usercache', index: { username: 1 } }
];

indexDefinitions.forEach(({ collection, index, options = {} }) => {
  try {
    db[collection].createIndex(index, options);
    print(`Index created on ${collection}: ${JSON.stringify(index)}`);
  } catch (error) {
    if (error.code === 85) { // Index already exists
      print(`Index already exists on ${collection}: ${JSON.stringify(index)}`);
    } else {
      print(`Error creating index on ${collection}:`, error.message);
    }
  }
});

print('MongoDB initialization completed successfully');
