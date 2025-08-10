const mongoose = require('mongoose');
const Donation = require('../src/models/Donation');
require('dotenv').config();

const sampleDonations = [
  {
    donorName: 'John Smith',
    donorEmail: 'john.smith@email.com',
    donorPhone: '+1234567890',
    productName: 'Canned Beans',
    quantity: 24,
    unit: 'cans',
    category: 'canned-goods',
    scheduledPickupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    scheduledPickupTime: '10:00 AM',
    status: 'pending',
    notes: 'Unopened cans, expires in 2 years'
  },
  {
    donorName: 'Maria Garcia',
    donorEmail: 'maria.garcia@email.com',
    donorPhone: '+1987654321',
    productName: 'Fresh Apples',
    quantity: 10,
    unit: 'kg',
    category: 'fresh-produce',
    expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    scheduledPickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    scheduledPickupTime: '2:00 PM',
    status: 'confirmed',
    notes: 'Organic apples from local farm'
  },
  {
    donorName: 'David Johnson',
    donorEmail: 'david.johnson@email.com',
    productName: 'Pasta Boxes',
    quantity: 15,
    unit: 'boxes',
    category: 'grains',
    scheduledPickupDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    scheduledPickupTime: '11:30 AM',
    status: 'pending',
    notes: 'Various pasta types - spaghetti, penne, fusilli'
  }
];

async function insertSampleData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing donations (optional)
    await Donation.deleteMany({});
    console.log('🗑️ Cleared existing donation data');
    
    // Insert sample data
    const insertedDonations = await Donation.insertMany(sampleDonations);
    console.log(`✅ Inserted ${insertedDonations.length} sample donations`);
    
    console.log('📋 Sample donations created:');
    insertedDonations.forEach((donation, index) => {
      console.log(`   ${index + 1}. ${donation.donorName} - ${donation.productName} (${donation.quantity} ${donation.unit})`);
    });
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  insertSampleData();
}

module.exports = { insertSampleData, sampleDonations };