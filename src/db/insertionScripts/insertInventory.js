require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertInventory() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('inventory');

    const inventoryItems = [
      {
        foodbank_id: '60d5f9b5f9b5f9b5f9b5f9b5',
        item_name: 'Canned Beans',
        category: 'Canned Goods',
        quantity: 100,
        expiration_date: new Date('2025-12-31'),
        storage_location: 'Shelf A',
        dietary_category: 'Vegan',
        date_added: new Date(),
        barcode: '123456789012',
        low_stock: false,
        minimum_stock_level: 10,
      },
      {
        foodbank_id: '60d5f9b5f9b5f9b5f9b5f9b6',
        item_name: 'Rice',
        category: 'Grains',
        quantity: 200,
        expiration_date: new Date('2026-01-31'),
        storage_location: 'Shelf B',
        dietary_category: 'Gluten-Free',
        date_added: new Date(),
        barcode: '987654321098',
        low_stock: false,
        minimum_stock_level: 20,
      },
    ];

    const result = await collection.insertMany(inventoryItems);
    console.log(`${result.insertedCount} inventory items inserted successfully`);
  } catch (err) {
    console.error('Error inserting inventory items:', err.message);
  } finally {
    await client.close();
  }
}

insertInventory();