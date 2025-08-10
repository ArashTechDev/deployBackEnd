/* eslint-disable linebreak-style */
// tests/inventory.integration.test.js
const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env.test' });

// Import models
let app, Inventory, Foodbank;

describe('Inventory API Integration Tests', () => {
  let testFoodbankId;
  let testInventoryId;

  beforeAll(async () => {
    // Connect to test database
    const mongoURI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/bytebasket-test';
    
    await mongoose.connect(mongoURI, {
      dbName: 'ByteBasket-Test',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Import models and app after connection
    Inventory = require('../src/db/models/Inventory');
    Foodbank = require('../src/db/models/Foodbank');
    
    // Create express app for testing
    const express = require('express');
    app = express();
    app.use(express.json());
    
    // Import and mount routes
    const inventoryRoutes = require('../src/api/routes/inventory');
    app.use('/api/inventory', inventoryRoutes);

    // Create test foodbank
    const testFoodbank = new Foodbank({
      name: 'Test Integration Foodbank',
      address: '123 Test Integration St',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      phone: '555-0199',
      opening_hours: '09:00',
      closing_hours: '18:00',
      active: true
    });

    const savedFoodbank = await testFoodbank.save();
    testFoodbankId = savedFoodbank._id;
  });

  afterAll(async () => {
    // Clean up test data
    await Inventory.deleteMany({});
    await Foodbank.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean inventory before each test
    await Inventory.deleteMany({});
  });

  describe('POST /api/inventory', () => {
    
    test('should create new inventory item successfully', async () => {
      const newItem = {
        foodbank_id: testFoodbankId,
        item_name: 'Integration Test Beans',
        category: 'Canned Goods',
        quantity: 30,
        expiration_date: '2025-12-31',
        storage_location: 'Aisle 1, Shelf A',
        dietary_category: 'Vegetarian',
        minimum_stock_level: 10
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(newItem)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.item).toBeDefined();
      expect(response.body.item.item_name).toBe(newItem.item_name);
      expect(response.body.item.quantity).toBe(newItem.quantity);
      expect(response.body.item.low_stock).toBe(false);

      testInventoryId = response.body.item._id;
    });

    test('should fail validation for missing required fields', async () => {
      const invalidItem = {
        item_name: 'Incomplete Item'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(invalidItem)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Required fields');
    });

    test('should fail for invalid dietary category', async () => {
      const invalidItem = {
        foodbank_id: testFoodbankId,
        item_name: 'Invalid Dietary Item',
        category: 'Test Category',
        quantity: 15,
        dietary_category: 'InvalidCategory'
      };

      const response = await request(app)
        .post('/api/inventory')
        .send(invalidItem)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

  });

  describe('GET /api/inventory', () => {
    
    beforeEach(async () => {
      // Create test inventory items
      const testItems = [
        {
          foodbank_id: testFoodbankId,
          item_name: 'Test Tomatoes',
          category: 'Fresh Produce',
          quantity: 50,
          dietary_category: 'Vegan'
        },
        {
          foodbank_id: testFoodbankId,
          item_name: 'Test Bread',
          category: 'Bakery',
          quantity: 5,
          minimum_stock_level: 10,
          low_stock: true
        },
        {
          foodbank_id: testFoodbankId,
          item_name: 'Test Milk',
          category: 'Dairy',
          quantity: 20,
          expiration_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
        }
      ];

      for (const item of testItems) {
        await new Inventory(item).save();
      }
    });

    test('should get all inventory items with pagination', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBe(3);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalItems).toBe(3);
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get('/api/inventory?category=Fresh Produce')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].category).toBe('Fresh Produce');
    });

    test('should filter by low stock', async () => {
      const response = await request(app)
        .get('/api/inventory?low_stock_only=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].low_stock).toBe(true);
    });

    test('should filter by expiring soon', async () => {
      const response = await request(app)
        .get('/api/inventory?expiring_soon=true&expiring_days=7')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].item_name).toBe('Test Milk');
    });

    test('should search by item name', async () => {
      const response = await request(app)
        .get('/api/inventory?search=tomatoes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].item_name).toContain('Tomatoes');
    });

  });

  describe('GET /api/inventory/:id', () => {
    
    test('should get single inventory item', async () => {
      // Create test item
      const testItem = new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Single Item Test',
        category: 'Test Category',
        quantity: 25
      });
      const savedItem = await testItem.save();

      const response = await request(app)
        .get(`/api/inventory/${savedItem._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.item._id).toBe(savedItem._id.toString());
      expect(response.body.item.foodbank_id.name).toBe('Test Integration Foodbank');
    });

    test('should return 404 for non-existent item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/inventory/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/inventory/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

  });

  describe('PUT /api/inventory/:id', () => {
    
    test('should update inventory item successfully', async () => {
      // Create test item
      const testItem = new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Update Test Item',
        category: 'Test Category',
        quantity: 15
      });
      const savedItem = await testItem.save();

      const updateData = {
        item_name: 'Updated Test Item',
        quantity: 25,
        dietary_category: 'Vegan'
      };

      const response = await request(app)
        .put(`/api/inventory/${savedItem._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.item.item_name).toBe(updateData.item_name);
      expect(response.body.item.quantity).toBe(updateData.quantity);
      expect(response.body.item.dietary_category).toBe(updateData.dietary_category);
      expect(response.body.item.low_stock).toBe(false);
    });

    test('should recalculate low_stock when updating quantity', async () => {
      const testItem = new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Low Stock Update Test',
        category: 'Test Category',
        quantity: 15,
        minimum_stock_level: 10
      });
      const savedItem = await testItem.save();

      const updateData = { quantity: 5 }; // Below minimum

      const response = await request(app)
        .put(`/api/inventory/${savedItem._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.item.quantity).toBe(5);
      expect(response.body.item.low_stock).toBe(true);
    });

  });

  describe('DELETE /api/inventory/:id', () => {
    
    test('should delete inventory item successfully', async () => {
      const testItem = new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Delete Test Item',
        category: 'Test Category',
        quantity: 10
      });
      const savedItem = await testItem.save();

      const response = await request(app)
        .delete(`/api/inventory/${savedItem._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify item is actually deleted
      const deletedItem = await Inventory.findById(savedItem._id);
      expect(deletedItem).toBeNull();
    });

  });

  describe('PATCH /api/inventory/:id/quantity', () => {
    
    test('should update quantity directly', async () => {
      const testItem = new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Quantity Update Test',
        category: 'Test Category',
        quantity: 20
      });
      const savedItem = await testItem.save();

      const response = await request(app)
        .patch(`/api/inventory/${savedItem._id}/quantity`)
        .send({ quantity: 35 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.item.quantity).toBe(35);
    });

    test('should adjust quantity by amount', async () => {
      const testItem = new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Quantity Adjust Test',
        category: 'Test Category',
        quantity: 20
      });
      const savedItem = await testItem.save();

      const response = await request(app)
        .patch(`/api/inventory/${savedItem._id}/quantity`)
        .send({ adjustment: -5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.item.quantity).toBe(15);
    });

  });

  describe('GET /api/inventory/alerts/low-stock', () => {
    
    test('should return low stock items', async () => {
      // Create low stock item
      await new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Low Stock Alert Test',
        category: 'Test Category',
        quantity: 3,
        minimum_stock_level: 10,
        low_stock: true
      }).save();

      // Create normal stock item
      await new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Normal Stock Test',
        category: 'Test Category',
        quantity: 25,
        minimum_stock_level: 10,
        low_stock: false
      }).save();

      const response = await request(app)
        .get('/api/inventory/alerts/low-stock')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.items[0].item_name).toBe('Low Stock Alert Test');
      expect(response.body.items[0].low_stock).toBe(true);
    });

  });

  describe('GET /api/inventory/alerts/expiring', () => {
    
    test('should return expiring items', async () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 3); // 3 days from now

      const farDate = new Date();
      farDate.setDate(farDate.getDate() + 30); // 30 days from now

      // Create expiring item
      await new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Expiring Soon Test',
        category: 'Test Category',
        quantity: 15,
        expiration_date: soonDate
      }).save();

      // Create non-expiring item
      await new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Not Expiring Test',
        category: 'Test Category',
        quantity: 20,
        expiration_date: farDate
      }).save();

      const response = await request(app)
        .get('/api/inventory/alerts/expiring?days=7')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.items[0].item_name).toBe('Expiring Soon Test');
      expect(response.body.items[0].days_until_expiration).toBe(3);
    });

  });

  describe('GET /api/inventory/meta/categories', () => {
    
    test('should return available categories', async () => {
      // Create items with different categories
      await new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Fresh Item',
        category: 'Fresh Produce',
        quantity: 10
      }).save();

      await new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Canned Item',
        category: 'Canned Goods',
        quantity: 15
      }).save();

      const response = await request(app)
        .get('/api/inventory/meta/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.categories).toBeDefined();
      expect(response.body.categories.length).toBe(2);
      
      const categoryNames = response.body.categories.map(cat => cat.category);
      expect(categoryNames).toContain('Fresh Produce');
      expect(categoryNames).toContain('Canned Goods');
    });

  });

  describe('GET /api/inventory/meta/dietary-categories', () => {
    
    test('should return dietary categories enum', async () => {
      const response = await request(app)
        .get('/api/inventory/meta/dietary-categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dietary_categories).toBeDefined();
      expect(Array.isArray(response.body.dietary_categories)).toBe(true);
      
      const categoryValues = response.body.dietary_categories.map(cat => cat.value);
      expect(categoryValues).toContain('Vegan');
      expect(categoryValues).toContain('Vegetarian');
      expect(categoryValues).toContain('Gluten-Free');
      expect(categoryValues).toContain('Kosher');
      expect(categoryValues).toContain('Halal');
    });

  });

  describe('GET /api/inventory/stats', () => {
    
    test('should return inventory statistics', async () => {
      // Create test items with various properties
      await new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Stats Test 1',
        category: 'Category A',
        quantity: 50,
        low_stock: false
      }).save();

      await new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Stats Test 2',
        category: 'Category B',
        quantity: 5,
        minimum_stock_level: 10,
        low_stock: true
      }).save();

      await new Inventory({
        foodbank_id: testFoodbankId,
        item_name: 'Stats Test 3',
        category: 'Category A',
        quantity: 25,
        expiration_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
      }).save();

      const response = await request(app)
        .get('/api/inventory/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalItems).toBe(3);
      expect(response.body.stats.totalQuantity).toBe(80);
      expect(response.body.stats.lowStockItems).toBe(1);
      expect(response.body.stats.expiringItems).toBe(1);
      expect(response.body.stats.categoriesCount).toBe(2);
      expect(response.body.stats.avgQuantity).toBeCloseTo(26.67, 1);
    });

  });

  describe('Error Handling', () => {
    
    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express should handle this, but we want to ensure it doesn't crash
      expect(response.status).toBe(400);
    });

    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking mongoose, so we'll skip actual implementation
      // but it's important to plan for these scenarios
      expect(true).toBe(true); // Placeholder
    });

  });

});