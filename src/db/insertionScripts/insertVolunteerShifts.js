require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertVolunteerShifts() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('volunteer_shifts');

    const volunteerShifts = [
      {
        volunteer_id: '60d5f9b5f9b5f9b5f9b5f9b5',
        shift_date: new Date('2025-06-20'),
        start_time: '09:00 AM',
        end_time: '01:00 PM',
        role: 'Food Distribution',
      },
      {
        volunteer_id: '60d5f9b5f9b5f9b5f9b5f9b6',
        shift_date: new Date('2025-06-21'),
        start_time: '10:00 AM',
        end_time: '02:00 PM',
        role: 'Inventory Management',
      },
    ];

    const result = await collection.insertMany(volunteerShifts);
    console.log(`${result.insertedCount} volunteer shifts inserted successfully`);
  } catch (err) {
    console.error('Error inserting volunteer shifts:', err.message);
  } finally {
    await client.close();
  }
}

insertVolunteerShifts();