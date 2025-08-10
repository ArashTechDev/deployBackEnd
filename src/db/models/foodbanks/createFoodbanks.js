require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function setupFoodbanks() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    await db.createCollection('foodbanks', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'name',
            'address',
            'city',
            'state',
            'zip',
            'phone',
            'opening_hours',
            'closing_hours'
          ],
          properties: {
            name: { bsonType: 'string' },
            address: { bsonType: 'string' },
            city: { bsonType: 'string' },
            state: { bsonType: 'string' },
            zip: { bsonType: 'string' },
            phone: { bsonType: 'string' },
            email: { bsonType: ['string', 'null'], pattern: '^.+@.+\\..+$' },
            opening_hours: { bsonType: 'string' },
            closing_hours: { bsonType: 'string' },
            active: { bsonType: 'bool' },
            location_coordinates: { bsonType: ['string', 'null'] }
          }
        }
      },
      validationLevel: 'strict',
      validationAction: 'error'
    });

    console.log('✅ "foodbanks" collection created');
  } catch (err) {
    if (err.codeName === 'NamespaceExists') {
      console.log('⚠️ "foodbanks" collection already exists');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
}

setupFoodbanks();
