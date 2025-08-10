require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertVolunteerHours() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('volunteer_hours');

    const volunteerHours = [
      {
        volunteer_id: '60d5f9b5f9b5f9b5f9b5f9b5',
        hours: 5,
        date: new Date('2025-06-19'),
      },
      {
        volunteer_id: '60d5f9b5f9b5f9b5f9b5f9b6',
        hours: 3,
        date: new Date('2025-06-18'),
      },
    ];

    const result = await collection.insertMany(volunteerHours);
    console.log(`${result.insertedCount} volunteer hours inserted successfully`);
  } catch (err) {
    console.error('Error inserting volunteer hours:', err.message);
  } finally {
    await client.close();
  }
}

insertVolunteerHours();