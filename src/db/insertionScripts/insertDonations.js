require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertDonations() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('donations');

    const donations = [
      {
        donor_id: '60d5f9b5f9b5f9b5f9b5f9b5',
        foodbank_id: '60d5f9b5f9b5f9b5f9b5f9b6',
        donation_date: new Date(),
        status: 'Scheduled',
        receipt_generated: false,
      },
      {
        donor_id: '60d5f9b5f9b5f9b5f9b5f9b7',
        foodbank_id: '60d5f9b5f9b5f9b5f9b5f9b8',
        donation_date: new Date(),
        status: 'Received',
        receipt_generated: true,
      },
    ];

    const result = await collection.insertMany(donations);
    console.log(`${result.insertedCount} donations inserted successfully`);
  } catch (err) {
    console.error('Error inserting donations:', err.message);
  } finally {
    await client.close();
  }
}

insertDonations();