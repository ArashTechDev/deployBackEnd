require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function setupVolunteerHours() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    await db.createCollection('volunteer_hours', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['volunteer_id', 'shift_id', 'hours_worked', 'work_date'],
          properties: {
            volunteer_id: {
              bsonType: 'objectId',
              description: 'Reference to users._id (volunteer)',
            },
            shift_id: {
              bsonType: 'objectId',
              description: 'Reference to volunteer_shifts._id',
            },
            hours_worked: {
              bsonType: 'double',
              minimum: 0.01,
              description: 'Number of hours worked (up to 2 decimal places)',
            },
            work_date: {
              bsonType: 'date',
              description: 'Date the work was performed',
            },
            check_in: {
              bsonType: ['string', 'null'],
              description: 'Check-in time (e.g., "08:30")',
            },
            check_out: {
              bsonType: ['string', 'null'],
              description: 'Check-out time (e.g., "12:00")',
            },
            verified: {
              bsonType: 'bool',
              description: 'Whether the hours are verified',
            },
            activities: {
              bsonType: ['string', 'null'],
              description: 'Optional description of activities performed',
            },
            notes: {
              bsonType: ['string', 'null'],
              description: 'Optional additional notes',
            },
          },
        },
      },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log('Collection "volunteer_hours" created with schema validation');
  } catch (err) {
    console.error('Error creating "volunteer_hours" collection:', err.message);
  } finally {
    await client.close();
  }
}

setupVolunteerHours();
