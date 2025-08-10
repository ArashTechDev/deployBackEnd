/* eslint-disable linebreak-style */
// backend/scripts/setup-demo.js
require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');

// IMPORTANT: Use the same User model as the auth system
const User = require('../src/db/models/User');
const FoodBank = require('../src/db/models/FoodBank');
const Inventory = require('../src/db/models/Inventory');
const Request = require('../src/db/models/Request'); // Add Request model

const setupDemo = async () => {
  try {
    // Use environment variable instead of hardcoded connection string
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in environment variables');
      console.error('   Please create a .env file based on .env.example');
      console.error('   Make sure MONGO_URI is properly set in your .env file');
      process.exit(1);
    }

    console.log('🚀 Setting up demo data...');
    console.log('🔗 Using MongoDB URI: Atlas Connection');

    // Connect with proper options
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGO_DB_NAME || 'ByteBasket',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected successfully to ${mongoose.connection.name}`);
    console.log(`🔗 Connection string: ${mongoUri.split('@')[0]}@***`);

    // Clear existing demo data
    console.log('\n🧹 Clearing existing demo data...');
    await User.deleteMany({ email: { $regex: '@demo.com$' } });
    await FoodBank.deleteMany({
      name: { $in: ['Main Location', 'Downtown Branch', 'Westside Branch', 'North Branch'] },
    });
    await Inventory.deleteMany({});
    await Request.deleteMany({}); // Clear existing requests

    console.log('\n🔧 Skipping index setup (will be handled by model definitions)...');

    // Create demo food banks first (needed for user foodbank_id references)
    console.log('\n🏢 Creating demo food banks...');
    const foodBanks = await FoodBank.create([
      {
        name: 'Main Location',
        address: '123 Main St, Toronto, ON M5V 3A8',
        phone: '(416) 555-0101',
        email: 'main@bytebasket.org',
        operating_hours: 'Mon-Fri: 9AM-6PM, Sat: 10AM-4PM',
        current_inventory_count: 0,
        capacity: 1000,
        description: 'Our primary food bank location serving downtown Toronto.',
      },
      {
        name: 'Downtown Branch',
        address: '456 King St W, Toronto, ON M5V 1M2',
        phone: '(416) 555-0102',
        email: 'downtown@bytebasket.org',
        operating_hours: 'Mon-Fri: 10AM-5PM',
        current_inventory_count: 0,
        capacity: 600,
        description: 'Convenient downtown location for working families.',
      },
      {
        name: 'Westside Branch',
        address: '789 Jane St, Toronto, ON M6N 4B7',
        phone: '(416) 555-0103',
        email: 'westside@bytebasket.org',
        operating_hours: 'Tue-Sat: 8AM-4PM',
        current_inventory_count: 0,
        capacity: 400,
        description: 'Serving the diverse Westside community.',
      },
      {
        name: 'North Branch',
        address: '321 Yonge St, Toronto, ON M4N 2N1',
        phone: '(416) 555-0104',
        email: 'north@bytebasket.org',
        operating_hours: 'Mon-Sat: 9AM-7PM',
        current_inventory_count: 0,
        capacity: 750,
        description: 'Our newest location serving North Toronto families.',
      },
    ]);

    console.log('✅ Food banks created successfully');

    // Create demo users
    console.log('\n👥 Creating demo users...');
    const users = await User.create([
      {
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: 'demo123',
        role: 'admin',
        phone: '+14165551001',
        isVerified: true,
        foodbank_id: foodBanks[0]._id,
      },
      {
        name: 'Demo Staff',
        email: 'staff@demo.com',
        password: 'demo123',
        role: 'staff',
        phone: '+14165551002',
        isVerified: true,
        foodbank_id: foodBanks[1]._id,
      },
      {
        name: 'Demo Donor',
        email: 'donor@demo.com',
        password: 'demo123',
        role: 'donor',
        phone: '+14165551003',
        isVerified: true,
      },
      {
        name: 'Maria Santos',
        email: 'recipient@demo.com',
        password: 'demo123',
        role: 'recipient',
        phone: '+14165551004',
        isVerified: true,
        dietary_restrictions: ['vegetarian', 'gluten-free'],
      },
      {
        name: 'John Thompson',
        email: 'recipient2@demo.com',
        password: 'demo123',
        role: 'recipient',
        phone: '+14165551005',
        isVerified: true,
        dietary_restrictions: [],
      },
      {
        name: 'Ahmed Hassan',
        email: 'recipient3@demo.com',
        password: 'demo123',
        role: 'recipient',
        phone: '+14165551006',
        isVerified: true,
        dietary_restrictions: ['halal'],
      },
    ]);

    console.log('✅ Demo users created successfully');

    // Assign managers to food banks
    console.log('\n🔧 Assigning managers to food banks...');
    await FoodBank.findByIdAndUpdate(foodBanks[0]._id, { manager_id: users[0]._id });
    await FoodBank.findByIdAndUpdate(foodBanks[1]._id, { manager_id: users[1]._id });

    // Create sample inventory items distributed across all locations
    console.log('\n📦 Creating sample inventory items...');
    const inventoryItems = [
      // Main Location Items (foodBanks[0])
      {
        foodbank_id: foodBanks[0]._id,
        item_name: 'Canned Tomatoes',
        category: 'Canned Goods',
        quantity: 89,
        minimum_stock_level: 20,
        unit: 'cans',
        expiration_date: new Date('2025-03-15'),
        storage_location: 'Aisle 1, Shelf A',
        dietary_category: 'Vegan',
        barcode: 'DEMO001',
        created_by: users[0]._id,
      },
      {
        foodbank_id: foodBanks[0]._id,
        item_name: 'White Rice',
        category: 'Grains',
        quantity: 156,
        minimum_stock_level: 50,
        unit: 'bags',
        expiration_date: new Date('2025-08-01'),
        storage_location: 'Dry Storage A',
        dietary_category: 'Vegan',
        barcode: 'DEMO002',
        created_by: users[0]._id,
      },
      {
        foodbank_id: foodBanks[0]._id,
        item_name: 'Ground Beef',
        category: 'Proteins',
        quantity: 24,
        minimum_stock_level: 15,
        unit: 'packages',
        expiration_date: new Date('2024-08-15'),
        storage_location: 'Freezer A',
        dietary_category: 'Meat',
        barcode: 'DEMO003',
        created_by: users[0]._id,
      },
      // Downtown Branch Items (foodBanks[1])
      {
        foodbank_id: foodBanks[1]._id,
        item_name: 'Whole Wheat Bread',
        category: 'Grains',
        quantity: 45,
        minimum_stock_level: 20,
        unit: 'loaves',
        expiration_date: new Date('2024-08-10'),
        storage_location: 'Bread Rack 1',
        dietary_category: 'Vegetarian',
        barcode: 'DEMO004',
        created_by: users[1]._id,
      },
      {
        foodbank_id: foodBanks[1]._id,
        item_name: 'Low-fat Milk',
        category: 'Dairy',
        quantity: 67,
        minimum_stock_level: 30,
        unit: 'cartons',
        expiration_date: new Date('2024-08-15'),
        storage_location: 'Refrigerator B',
        dietary_category: 'Vegetarian',
        barcode: 'DEMO005',
        created_by: users[1]._id,
      },
      {
        foodbank_id: foodBanks[1]._id,
        item_name: 'Canned Beans',
        category: 'Canned Goods',
        quantity: 78,
        minimum_stock_level: 25,
        unit: 'cans',
        expiration_date: new Date('2025-12-31'),
        storage_location: 'Aisle 2, Shelf C',
        dietary_category: 'Vegan',
        barcode: 'DEMO006',
        created_by: users[1]._id,
      },
      // Westside Branch Items (foodBanks[2])
      {
        foodbank_id: foodBanks[2]._id,
        item_name: 'Fresh Carrots',
        category: 'Vegetables',
        quantity: 34,
        minimum_stock_level: 40,
        unit: 'bunches',
        expiration_date: new Date('2024-08-20'),
        storage_location: 'Produce Section',
        dietary_category: 'Vegan',
        barcode: 'DEMO007',
        created_by: users[0]._id,
      },
      {
        foodbank_id: foodBanks[2]._id,
        item_name: 'Chicken Breast',
        category: 'Proteins',
        quantity: 18,
        minimum_stock_level: 20,
        unit: 'packages',
        expiration_date: new Date('2024-08-12'),
        storage_location: 'Freezer B',
        dietary_category: 'Meat',
        barcode: 'DEMO008',
        created_by: users[0]._id,
      },
      // North Branch Items (foodBanks[3])
      {
        foodbank_id: foodBanks[3]._id,
        item_name: 'Pasta',
        category: 'Grains',
        quantity: 112,
        minimum_stock_level: 30,
        unit: 'boxes',
        expiration_date: new Date('2025-06-30'),
        storage_location: 'Dry Storage B',
        dietary_category: 'Vegetarian',
        barcode: 'DEMO009',
        created_by: users[0]._id,
      },
      {
        foodbank_id: foodBanks[3]._id,
        item_name: 'Canned Soup',
        category: 'Canned Goods',
        quantity: 67,
        minimum_stock_level: 25,
        unit: 'cans',
        expiration_date: new Date('2025-04-20'),
        storage_location: 'Aisle 3, Shelf A',
        dietary_category: 'Vegetarian',
        barcode: 'DEMO010',
        created_by: users[0]._id,
      },
      {
        foodbank_id: foodBanks[3]._id,
        item_name: 'Apples',
        category: 'Fruits',
        quantity: 89,
        minimum_stock_level: 50,
        unit: 'bags',
        expiration_date: new Date('2024-08-25'),
        storage_location: 'Produce Section',
        dietary_category: 'Vegan',
        barcode: 'DEMO011',
        created_by: users[0]._id,
      },
    ];

    // Insert items one by one to handle any potential issues
    console.log('📦 Inserting inventory items...');
    let successCount = 0;
    for (let i = 0; i < inventoryItems.length; i++) {
      try {
        await Inventory.create(inventoryItems[i]);
        console.log(
          `✅ Created item ${i + 1}: ${inventoryItems[i].item_name} at ${
            foodBanks.find(fb => fb._id.equals(inventoryItems[i].foodbank_id))?.name
          }`
        );
        successCount++;
      } catch (error) {
        console.log(`⚠️ Skipped item ${i + 1} (${inventoryItems[i].item_name}): ${error.message}`);
      }
    }

    // Update food bank inventory counts
    console.log('\n📊 Updating food bank statistics...');
    for (const foodBank of foodBanks) {
      const count = await Inventory.countDocuments({ foodbank_id: foodBank._id });
      await FoodBank.findByIdAndUpdate(foodBank._id, { current_inventory_count: count });
    }

    // Create sample requests to test the analytics
    console.log('\n📋 Creating sample requests...');
    const sampleRequests = [
      {
        recipient_id: users[3]._id, // Maria Santos
        foodbank_id: foodBanks[0]._id,
        status: 'fulfilled',
        request_date: new Date('2024-08-01'),
        fulfillment_date: new Date('2024-08-02'),
        items: [
          { item_name: 'Canned Tomatoes', quantity: 3 },
          { item_name: 'White Rice', quantity: 2 },
        ],
        notes: 'Family of 4, vegetarian preferences',
        priority: 'high',
      },
      {
        recipient_id: users[4]._id, // John Thompson
        foodbank_id: foodBanks[1]._id,
        status: 'pending',
        request_date: new Date('2024-08-05'),
        items: [
          { item_name: 'Whole Wheat Bread', quantity: 2 },
          { item_name: 'Low-fat Milk', quantity: 1 },
        ],
        notes: 'Elderly couple, limited transportation',
        priority: 'medium',
      },
      {
        recipient_id: users[5]._id, // Ahmed Hassan
        foodbank_id: foodBanks[0]._id,
        status: 'in_progress',
        request_date: new Date('2024-08-03'),
        items: [
          { item_name: 'Canned Tomatoes', quantity: 4 },
          { item_name: 'White Rice', quantity: 3 },
        ],
        notes: 'Large family, halal dietary requirements',
        priority: 'high',
      },
      {
        recipient_id: users[3]._id, // Maria Santos
        foodbank_id: foodBanks[2]._id,
        status: 'rejected',
        request_date: new Date('2024-08-04'),
        items: [{ item_name: 'Chicken Breast', quantity: 2 }],
        notes: 'Dietary restriction incompatible',
        priority: 'low',
        rejection_reason: 'Requested meat products but recipient is vegetarian',
      },
      {
        recipient_id: users[4]._id, // John Thompson
        foodbank_id: foodBanks[3]._id,
        status: 'fulfilled',
        request_date: new Date('2024-08-06'),
        fulfillment_date: new Date('2024-08-07'),
        items: [
          { item_name: 'Pasta', quantity: 2 },
          { item_name: 'Canned Soup', quantity: 3 },
        ],
        notes: 'Regular weekly request',
        priority: 'medium',
      },
      // Add more requests for better analytics data
      {
        recipient_id: users[5]._id,
        foodbank_id: foodBanks[1]._id,
        status: 'fulfilled',
        request_date: new Date('2024-07-28'),
        fulfillment_date: new Date('2024-07-29'),
        items: [{ item_name: 'Canned Beans', quantity: 4 }],
        priority: 'medium',
      },
      {
        recipient_id: users[3]._id,
        foodbank_id: foodBanks[3]._id,
        status: 'fulfilled',
        request_date: new Date('2024-07-30'),
        fulfillment_date: new Date('2024-07-31'),
        items: [
          { item_name: 'Apples', quantity: 2 },
          { item_name: 'Pasta', quantity: 1 },
        ],
        priority: 'low',
      },
    ];

    // Create requests with error handling
    let requestSuccessCount = 0;
    for (let i = 0; i < sampleRequests.length; i++) {
      try {
        await Request.create(sampleRequests[i]);
        console.log(`✅ Created request ${i + 1}: ${sampleRequests[i].status} request`);
        requestSuccessCount++;
      } catch (error) {
        console.log(`⚠️ Skipped request ${i + 1}: ${error.message}`);
      }
    }

    console.log('\n🎉 Demo setup completed successfully!');
    console.log(
      `📦 Successfully created ${successCount} inventory items across ${foodBanks.length} locations`
    );
    console.log(`📋 Successfully created ${requestSuccessCount} sample requests`);
    console.log('\n📊 Location Summary:');
    console.log('- Main Location: Items in stock');
    console.log('- Downtown Branch: Items in stock');
    console.log('- Westside Branch: Items in stock (some low stock)');
    console.log('- North Branch: Items in stock');
    console.log('\n📋 Demo Login Credentials (ALL PRE-VERIFIED):');
    console.log('Admin: admin@demo.com / demo123');
    console.log('Staff: staff@demo.com / demo123');
    console.log('Donor: donor@demo.com / demo123');
    console.log('🆕 Recipients:');
    console.log('   - recipient@demo.com / demo123 (Maria Santos - Vegetarian, Gluten-Free)');
    console.log('   - recipient2@demo.com / demo123 (John Thompson - No restrictions)');
    console.log('   - recipient3@demo.com / demo123 (Ahmed Hassan - Halal)');
    console.log('\n🏢 Food Banks Created:');
    console.log('- Main Location (Toronto) - 1000 capacity');
    console.log('- Downtown Branch (Toronto) - 600 capacity');
    console.log('- Westside Branch (Toronto) - 400 capacity');
    console.log('- North Branch (Toronto) - 750 capacity');
    console.log('\n📦 Sample Inventory: Items distributed across all locations');
    console.log(
      '🥗 Dietary-Friendly Items Created: Vegan, Vegetarian, Gluten-Free, Halal, Meat options'
    );
    console.log('\n📊 Analytics Data: Request data available for testing reports and analytics');
    console.log('✅ All demo accounts are pre-verified and ready to use!');
    console.log('🎯 Now you can test the Reports & Analytics dashboard with real data!');
  } catch (error) {
    console.error('❌ Demo setup failed:', error);
    console.error('Error details:', error.message);

    // Provide specific error guidance
    if (error.message.includes('authentication') || error.message.includes('bad auth')) {
      console.error('\n🔑 Authentication Error - Possible solutions:');
      console.error('   1. Check your MongoDB Atlas username and password in .env');
      console.error('   2. Verify your MongoDB Atlas cluster is running');
      console.error('   3. Check if your IP address is whitelisted in MongoDB Atlas');
      console.error('   4. Ensure your MongoDB Atlas user has proper permissions');
    }

    if (error.message.includes('validation failed')) {
      console.error('\n📋 Schema Validation Error:');
      console.error('   The User model requires specific fields.');
      console.error('   Current script uses the User.js model which requires:');
      console.error('   - name (not full_name)');
      console.error('   - email');
      console.error('   - password');
      console.error('   - role');
    }

    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
};

// Run setup if called directly
if (require.main === module) {
  setupDemo();
}

module.exports = setupDemo;
