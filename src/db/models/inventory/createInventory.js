// backend/src/db/models/inventory/createInventory.js
require('dotenv').config({ path: '../../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function setupInventory() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    // Drop existing collection if it exists (for clean setup)
    try {
      await db.collection('inventory').drop();
      console.log('🗑️ Existing inventory collection dropped');
    } catch (err) {
      // Collection doesn't exist, which is fine
      console.log('⚠️ Collection does not exist, proceeding with creation');
    }

    // Create 'inventory' collection with schema validation
    // Updated to be compatible with Mongoose model
    await db.createCollection('inventory', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['foodbank_id', 'item_name', 'category', 'quantity'],
          properties: {
            foodbank_id: {
              bsonType: 'objectId',
              description: 'must be an ObjectId referencing a foodbank',
            },
            item_name: {
              bsonType: 'string',
              maxLength: 255,
              description: 'name of the item - required string',
            },
            category: {
              bsonType: 'string',
              maxLength: 100,
              description: 'item category - required string',
            },
            quantity: {
              bsonType: 'int',
              minimum: 0,
              description: 'number of units - required non-negative integer',
            },
            expiration_date: {
              bsonType: ['date', 'null'],
              description: 'optional expiration date',
            },
            storage_location: {
              bsonType: ['string', 'null'],
              maxLength: 100,
              description: 'optional storage location string',
            },
            dietary_category: {
              enum: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Kosher', 'Halal', null],
              description: 'must match a known dietary category or be null',
            },
            date_added: {
              bsonType: 'date',
              description: 'auto-generated timestamp when added',
            },
            barcode: {
              bsonType: ['string', 'null'],
              maxLength: 50,
              description: 'optional barcode string',
            },
            low_stock: {
              bsonType: 'bool',
              description: 'boolean flag for low stock alert',
            },
            minimum_stock_level: {
              bsonType: 'int',
              minimum: 0,
              description: 'threshold for low stock warning',
            },
            // Additional fields for Mongoose compatibility
            last_updated: {
              bsonType: ['date', 'null'],
              description: 'last update timestamp',
            },
            created_by: {
              bsonType: ['objectId', 'null'],
              description: 'user who created this item',
            },
            updated_by: {
              bsonType: ['objectId', 'null'],
              description: 'user who last updated this item',
            },
            // Mongoose automatic timestamps
            createdAt: {
              bsonType: ['date', 'null'],
              description: 'mongoose createdAt timestamp',
            },
            updatedAt: {
              bsonType: ['date', 'null'],
              description: 'mongoose updatedAt timestamp',
            },
            // Mongoose version key
            __v: {
              bsonType: ['int', 'null'],
              description: 'mongoose version key',
            }
          },
        },
      },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log('Collection "inventory" created with schema validation');

    // Create indexes for better performance
    const collection = db.collection('inventory');
    
    // Basic indexes
    await collection.createIndex({ foodbank_id: 1 });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ low_stock: 1 });
    await collection.createIndex({ expiration_date: 1 });
    await collection.createIndex({ date_added: -1 });
    
    // Compound indexes
    await collection.createIndex({ foodbank_id: 1, category: 1 });
    await collection.createIndex({ foodbank_id: 1, low_stock: 1 });
    await collection.createIndex({ expiration_date: 1, quantity: 1 });
    
    // Text search index
    await collection.createIndex({ 
      item_name: 'text', 
      category: 'text' 
    });
    
    // Unique barcode per foodbank (sparse to allow nulls)
    await collection.createIndex(
      { barcode: 1, foodbank_id: 1 }, 
      { unique: true, sparse: true }
    );

    console.log('✅ Indexes created successfully');

  } catch (err) {
    console.error('Error setting up inventory collection:', err.message);
  } finally {
    await client.close();
  }
}

setupInventory();