// backend/src/models/dietary/dietaryRestrictionsModel.js

/**
 * Schema: dietary_restrictions
 * {
 *   name: string (required, unique),
 *   description: string | null,
 *   icon: string | null
 * }
 */


// code that you can copy/take inspiration

// // backend/src/routes/insertSample.js
// const { insertDietaryRestriction } = require('../models/dietary/dietaryRestrictionsModel');

// (async () => {
//   try {
//     const id = await insertDietaryRestriction({
//       name: 'Vegan',
//       description: 'No animal products',
//       icon: '🥦',
//     });
//     console.log('Inserted with ID:', id);
//   } catch (err) {
//     console.error('Insertion error:', err.message);
//   }
// })();

require('dotenv').config({ path: '../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';
const collectionName = 'dietary_restrictions';

async function withDB(callback) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    return await callback(collection);
  } finally {
    await client.close();
  }
}

async function insertDietaryRestriction({ name, description = null, icon = null }) {
  if (!name) {
    throw new Error('Name is required');
  }

  return withDB(async (collection) => {
    const result = await collection.insertOne({ name, description, icon });
    return result.insertedId;
  });
}

module.exports = {
  insertDietaryRestriction,
};
