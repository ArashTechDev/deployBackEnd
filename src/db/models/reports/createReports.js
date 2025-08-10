/* backend/src/models/reports/createReports.js */
require('dotenv').config({ path: '../../../.env' });   // adjust if .env lives elsewhere
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;            // e.g. "mongodb://localhost:27017"
const dbName = 'ByteBasket';

async function setupReports() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    await db.createCollection('reports', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'generated_by', 'type'],
          properties: {
            title: {
              bsonType: 'string',
              description: 'Report title (max ~255 chars)',
            },
            description: {
              bsonType: ['string', 'null'],
              description: 'Optional description of the report',
            },
            generated_at: {
              bsonType: 'date',
              description: 'When the report was generated',
            },
            generated_by: {
              bsonType: 'objectId',
              description: 'Reference to users._id (report creator)',
            },
            type: {
              enum: ['Inventory', 'Donation', 'Distribution', 'Volunteer'],
              description: 'Category/type of report',
            },
            parameters: {
              bsonType: ['string', 'null'],
              description: 'Optional JSON/text of filter parameters used',
            },
            file_path: {
              bsonType: ['string', 'null'],
              description: 'Storage path or URL to the generated file',
            },
          },
        },
      },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log('Collection "reports" created with schema validation');
  } catch (err) {
    console.error('Error creating "reports" collection:', err.message);
  } finally {
    await client.close();
  }
}

setupReports();
