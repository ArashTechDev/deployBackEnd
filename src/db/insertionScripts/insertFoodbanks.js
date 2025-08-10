require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertFoodbanks() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('foodbanks');

    const foodbanks = [
      {
        name: 'Central Food Bank',
        address: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        zip: '10001',
        phone: '123-456-7890',
        email: 'info@centralfoodbank.org',
        opening_hours: '08:00',
        closing_hours: '18:00',
        active: true,
      },
      {
        name: 'Westside Food Bank',
        address: '456 Elm St',
        city: 'Gotham',
        state: 'CA',
        zip: '90210',
        phone: '987-654-3210',
        email: 'contact@westsidefoodbank.org',
        opening_hours: '09:00',
        closing_hours: '17:00',
        active: true,
      },
    ];

    const result = await collection.insertMany(foodbanks);
    console.log(`${result.insertedCount} foodbanks inserted successfully`);
  } catch (err) {
    console.error('Error inserting foodbanks:', err.message);
  } finally {
    await client.close();
  }
}

insertFoodbanks();