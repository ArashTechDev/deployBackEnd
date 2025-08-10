require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertFoodRequestItems() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('food_request_items');

    const foodRequestItems = [
      {
        request_id: '60d5f9b5f9b5f9b5f9b5f9b5',
        inventory_id: '60d5f9b5f9b5f9b5f9b5f9b6',
        item_name: 'Canned Beans',
        quantity_requested: 10,
        quantity_fulfilled: 8,
      },
      {
        request_id: '60d5f9b5f9b5f9b5f9b5f9b7',
        inventory_id: '60d5f9b5f9b5f9b5f9b5f9b8',
        item_name: 'Rice',
        quantity_requested: 20,
        quantity_fulfilled: 20,
      },
    ];

    const result = await collection.insertMany(foodRequestItems);
    console.log(`${result.insertedCount} food request items inserted successfully`);
  } catch (err) {
    console.error('Error inserting food request items:', err.message);
  } finally {
    await client.close();
  }
}

insertFoodRequestItems();