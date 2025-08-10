require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function setupNotifications() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    await db.createCollection('notifications', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user_id', 'message', 'notification_type'],
          properties: {
            user_id: {
              bsonType: 'objectId',
              description: 'Reference to users._id',
            },
            message: {
              bsonType: 'string',
              description: 'Notification message text',
            },
            created_at: {
              bsonType: 'date',
              description: 'Timestamp when the notification was created',
            },
            read: {
              bsonType: 'bool',
              description: 'Whether the notification has been read',
            },
            notification_type: {
              bsonType: 'string',
              description: 'Type or category of the notification',
            },
            reference_id: {
              bsonType: ['string', 'null'],
              description: 'Optional reference to a related entity (e.g., donation ID)',
            },
          },
        },
      },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log('Collection "notifications" created with schema validation');
  } catch (err) {
    console.error('Error creating "notifications" collection:', err.message);
  } finally {
    await client.close();
  }
}

setupNotifications();
