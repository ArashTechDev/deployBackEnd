require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function setupVolunteerShifts() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    await db.createCollection('volunteer_shifts', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['foodbank_id', 'title', 'shift_date', 'start_time', 'end_time', 'coordinator_id'],
          properties: {
            foodbank_id: {
              bsonType: 'objectId',
              description: 'Reference to foodbanks._id',
            },
            title: {
              bsonType: 'string',
              description: 'Title of the shift',
            },
            description: {
              bsonType: ['string', 'null'],
              description: 'Optional description of the shift',
            },
            shift_date: {
              bsonType: 'date',
              description: 'Date of the shift',
            },
            start_time: {
              bsonType: 'string',
              description: 'Start time (e.g., "08:00")',
            },
            end_time: {
              bsonType: 'string',
              description: 'End time (e.g., "12:00")',
            },
            capacity: {
              bsonType: 'int',
              minimum: 1,
              description: 'Max number of volunteers, default 1',
            },
            status: {
              enum: ['Open', 'Filled', 'Completed'],
              description: 'Status of the volunteer shift',
            },
            requirements: {
              bsonType: ['string', 'null'],
              description: 'Optional requirements for volunteers',
            },
            coordinator_id: {
              bsonType: 'objectId',
              description: 'Reference to users._id (coordinator)',
            },
          },
        },
      },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log('Collection "volunteer_shifts" created with schema validation');
  } catch (err) {
    console.error('Error creating "volunteer_shifts" collection:', err.message);
  } finally {
    await client.close();
  }
}

setupVolunteerShifts();
