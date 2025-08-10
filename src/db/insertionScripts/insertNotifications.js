require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertNotifications() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('notifications');

    const notifications = [
      {
        user_id: '60d5f9b5f9b5f9b5f9b5f9b5',
        message: 'Your food request has been approved.',
        created_at: new Date(),
        read: false,
      },
      {
        user_id: '60d5f9b5f9b5f9b5f9b5f9b6',
        message: 'Your volunteer shift is scheduled for tomorrow.',
        created_at: new Date(),
        read: true,
      },
    ];

    const result = await collection.insertMany(notifications);
    console.log(`${result.insertedCount} notifications inserted successfully`);
  } catch (err) {
    console.error('Error inserting notifications:', err.message);
  } finally {
    await client.close();
  }
}

insertNotifications();