require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertReports() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('reports');

    const reports = [
      {
        user_id: '60d5f9b5f9b5f9b5f9b5f9b5',
        report_type: 'Issue',
        description: 'Food item expired',
        created_at: new Date(),
      },
      {
        user_id: '60d5f9b5f9b5f9b5f9b5f9b6',
        report_type: 'Feedback',
        description: 'Great service!',
        created_at: new Date(),
      },
    ];

    const result = await collection.insertMany(reports);
    console.log(`${result.insertedCount} reports inserted successfully`);
  } catch (err) {
    console.error('Error inserting reports:', err.message);
  } finally {
    await client.close();
  }
}

insertReports();