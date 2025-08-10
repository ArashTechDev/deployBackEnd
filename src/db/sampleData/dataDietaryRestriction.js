require('dotenv').config({ path: '../../../.env' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';

async function insertDietaryRestrictions() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('dietary_restrictions');

    const dietaryRestrictions = [
      {
        name: 'Vegan',
        description: 'No animal products or by-products',
        icon: 'https://example.com/icons/vegan.png',
      },
      {
        name: 'Gluten-Free',
        description: 'No gluten-containing ingredients',
        icon: 'https://example.com/icons/gluten-free.png',
      },
      {
        name: 'Nut-Free',
        description: 'No nuts or nut-based products',
        icon: 'https://example.com/icons/nut-free.png',
      },
      {
        name: 'Halal',
        description: 'Prepared according to Islamic dietary laws',
        icon: 'https://example.com/icons/halal.png',
      },
      {
        name: 'Kosher',
        description: 'Prepared according to Jewish dietary laws',
        icon: 'https://example.com/icons/kosher.png',
      },
    ];

    const result = await collection.insertMany(dietaryRestrictions);
    console.log(`${result.insertedCount} dietary restrictions inserted successfully`);
  } catch (err) {
    console.error('Error inserting dietary restrictions:', err.message);
  } finally {
    await client.close();
  }
}

insertDietaryRestrictions();