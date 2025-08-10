require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('users');

    const users = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword123',
        role: 'Admin',
        isVerified: true,
        verificationToken: null,
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword456',
        role: 'Donor',
        isVerified: false,
        verificationToken: 'sampletoken123',
      },
    ];

    const result = await collection.insertMany(users);
    console.log(`${result.insertedCount} users inserted successfully`);
  } catch (err) {
    console.error('Error inserting users:', err.message);
  } finally {
    await client.close();
  }
}

insertUsers();