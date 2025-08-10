require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function setupFoodRequests() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    await db.createCollection('food_requests', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['recipient_id', 'foodbank_id', 'status'],
          properties: {
            recipient_id: {
              bsonType: 'objectId',
              description: 'Reference to users._id (recipient)',
            },
            foodbank_id: {
              bsonType: 'objectId',
              description: 'Reference to foodbanks._id',
            },
            request_date: {
              bsonType: 'date',
              description: 'Timestamp when the request was made',
            },
            status: {
              enum: ['Pending', 'Approved', 'Ready', 'Fulfilled'],
              description: 'Status of the request',
            },
            pickup_date: {
              bsonType: ['date', 'null'],
              description: 'Optional pickup date',
            },
            pickup_time: {
              bsonType: ['string', 'null'],
              description: 'Optional pickup time window',
            },
            special_instructions: {
              bsonType: ['string', 'null'],
              description: 'Optional notes from the requester',
            },
            recurring: {
              bsonType: 'bool',
              description: 'Whether this request is recurring',
            },
            frequency: {
              bsonType: ['string', 'null'],
              description: 'Optional recurrence frequency description',
            },
          },
        },
      },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log('Collection "food_requests" created with schema validation');
  } catch (err) {
    console.error('Error creating "food_requests" collection:', err.message);
  } finally {
    await client.close();
  }
}

setupFoodRequests();
