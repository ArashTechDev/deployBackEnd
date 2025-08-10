// backend/src/models/dietary/createUserDietaryRestrictions.js
require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function setupUserDietaryRestrictions() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    await db.createCollection('user_dietary_restrictions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user_id', 'restriction_id'],
          properties: {
            user_id: {
              bsonType: 'objectId',
              description: 'Reference to users._id',
            },
            restriction_id: {
              bsonType: 'objectId',
              description: 'Reference to dietary_restrictions._id',
            },
          },
        },
      },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    // Optional: Enforce uniqueness of (user_id, restriction_id) combo
    await db.collection('user_dietary_restrictions').createIndex(
      { user_id: 1, restriction_id: 1 },
      { unique: true }
    );

    console.log('Collection "user_dietary_restrictions" created with validation and unique compound index');
  } catch (err) {
    console.error('Error creating "user_dietary_restrictions" collection:', err.message);
  } finally {
    await client.close();
  }
}

setupUserDietaryRestrictions();
