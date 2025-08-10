require('dotenv').config({ path: '../../../.env' });
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = 'ByteBasket';
const collectionName = 'donation_items';

async function connect() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  return { client, collection };
}

// CREATE
async function createDonationItem(data) {
  const { client, collection } = await connect();
  try {
    const result = await collection.insertOne(data);
    return result;
  } finally {
    await client.close();
  }
}

// READ (all or by filter)
async function getDonationItems(filter = {}) {
  const { client, collection } = await connect();
  try {
    const items = await collection.find(filter).toArray();
    return items;
  } finally {
    await client.close();
  }
}

// READ (by ID)
async function getDonationItemById(id) {
  const { client, collection } = await connect();
  try {
    const item = await collection.findOne({ _id: new ObjectId(id) });
    return item;
  } finally {
    await client.close();
  }
}

// UPDATE
async function updateDonationItem(id, updateData) {
  const { client, collection } = await connect();
  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result;
  } finally {
    await client.close();
  }
}

// DELETE
async function deleteDonationItem(id) {
  const { client, collection } = await connect();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result;
  } finally {
    await client.close();
  }
}

module.exports = {
  createDonationItem,
  getDonationItems,
  getDonationItemById,
  updateDonationItem,
  deleteDonationItem,
};
