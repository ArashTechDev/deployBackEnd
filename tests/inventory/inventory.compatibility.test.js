/* eslint-disable linebreak-style */
// tests/inventory.compatibility.test.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import the model after connection setup
let Inventory;

describe('Inventory Model Compatibility Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoURI = process.env.MONGO_URI_TEST || process.env.MONGO_URI || 'mongodb://localhost:27017/bytebasket-test';
    
    await mongoose.connect(mongoURI, {
      dbName: 'ByteBasket-Test',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Import model after connection
    Inventory = require('../src/db/models/inventory/Inventory');
  });

  afterAll(async () => {
    // Clean up test data and close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  });

  describe('Schema Compatibility', () => {
    test('should have correct dietary category enum values', () => {
      const dietaryEnum = Inventory.schema.path('dietary_category').enumValues;
      const expectedCategories = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Kosher', 'Halal'];
      
      expectedCategories.forEach(category => {
        expect(dietaryEnum).toContain(category);
      });
    });

    test('should have all required fields defined', () => {
      const requiredFields = ['foodbank_id', 'item_name', 'category', 'quantity'];
      const schemaPaths = Object.keys(Inventory.schema.paths);
      
      requiredFields.forEach(field => {
        expect(schemaPaths).toContain(field);
        expect(Inventory.schema.path(field).isRequired).toBe(true);
      });
    });

    test('should have correct field types', () => {
      expect(Inventory.schema.path('item_name').instance).toBe('String');
      expect(Inventory.schema.path('category').instance).toBe('String');
      expect(Inventory.schema.path('quantity').instance).toBe('Number');
      expect(Inventory.schema.path('low_stock').instance).toBe('Boolean');
      expect(Inventory.schema.path('foodbank_id').instance).toBe('ObjectID');
    });

    test('should have proper indexes configured', () => {
      const indexes = Inventory.schema.indexes();
      
      // Check for basic indexes
      expect(indexes.some(idx => idx[0].foodbank_id)).toBe(true);
      expect(indexes.some(idx => idx[0].category)).toBe(true);
      expect(indexes.some(idx => idx[0].low_stock)).toBe(true);
      
      // Check for compound indexes
      expect(indexes.some(idx => idx[0].foodbank_id && idx[0].category)).toBe(true);
      expect(indexes.some(idx => idx[0].barcode && idx[0].foodbank_id)).toBe(true);
    });

  });

  describe('Document Validation', () => {
    
    test('should validate a complete document successfully', () => {
      const validDoc = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Test Canned Beans',
        category: 'Canned Goods',
        quantity: 50,
        expiration_date: new Date('2025-12-31'),
        storage_location: 'Aisle 3, Shelf B',
        dietary_category: 'Vegetarian',
        barcode: '1234567890123',
        minimum_stock_level: 15
      });

      const validationError = validDoc.validateSync();
      expect(validationError).toBeUndefined();
    });

    test('should fail validation for missing required fields', () => {
      const invalidDoc = new Inventory({
        item_name: 'Test Item'
        // Missing required fields: foodbank_id, category, quantity
      });

      const validationError = invalidDoc.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.foodbank_id).toBeDefined();
      expect(validationError.errors.category).toBeDefined();
      expect(validationError.errors.quantity).toBeDefined();
    });

    test('should fail validation for invalid dietary category', () => {
      const invalidDoc = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Test Item',
        category: 'Test Category',
        quantity: 10,
        dietary_category: 'InvalidCategory' // Not in enum
      });

      const validationError = invalidDoc.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.dietary_category).toBeDefined();
    });

    test('should allow null dietary category', () => {
      const validDoc = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Test Item',
        category: 'Test Category',
        quantity: 10,
        dietary_category: null
      });

      const validationError = validDoc.validateSync();
      expect(validationError).toBeUndefined();
    });

    test('should validate quantity constraints', () => {
      const negativeQuantityDoc = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Test Item',
        category: 'Test Category',
        quantity: -5 // Invalid negative quantity
      });

      const validationError = negativeQuantityDoc.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.quantity).toBeDefined();
    });

  });

  describe('Virtual Fields', () => {
    
    test('should calculate is_expiring_soon correctly', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const expiringItem = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Expiring Item',
        category: 'Test',
        quantity: 10,
        expiration_date: tomorrow
      });

      expect(expiringItem.is_expiring_soon).toBe(true);
    });

    test('should calculate days_until_expiration correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const item = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Future Item',
        category: 'Test',
        quantity: 10,
        expiration_date: futureDate
      });

      expect(item.days_until_expiration).toBe(5);
    });

    test('should return null for days_until_expiration when no expiration date', () => {
      const item = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'No Expiry Item',
        category: 'Test',
        quantity: 10
        // No expiration_date
      });

      expect(item.days_until_expiration).toBeNull();
    });

  });

  describe('Middleware Functions', () => {
    
    test('should automatically set low_stock flag on save', () => {
      const lowStockItem = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Low Stock Item',
        category: 'Test',
        quantity: 5,
        minimum_stock_level: 10
      });

      // Trigger pre-save middleware
      lowStockItem.validate();
      expect(lowStockItem.low_stock).toBe(true);
    });

    test('should set low_stock to false when quantity is above minimum', () => {
      const adequateStockItem = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Adequate Stock Item',
        category: 'Test',
        quantity: 25,
        minimum_stock_level: 10
      });

      // Trigger pre-save middleware
      adequateStockItem.validate();
      expect(adequateStockItem.low_stock).toBe(false);
    });

    test('should update last_updated timestamp on save', async () => {
      const item = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Timestamp Test Item',
        category: 'Test',
        quantity: 15
      });

      const beforeSave = new Date();
      await item.validate(); // Triggers pre-save
      
      expect(item.last_updated).toBeDefined();
      expect(item.last_updated.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    });

  });

  describe('Instance Methods', () => {
    
    test('updateQuantity should update quantity and recalculate low_stock', async () => {
      const item = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Method Test Item',
        category: 'Test',
        quantity: 20,
        minimum_stock_level: 10
      });

      await item.updateQuantity(5);
      
      expect(item.quantity).toBe(5);
      expect(item.low_stock).toBe(true);
    });

    test('adjustQuantity should modify quantity by adjustment amount', async () => {
      const item = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Adjust Test Item',
        category: 'Test',
        quantity: 20
      });

      await item.adjustQuantity(-5);
      expect(item.quantity).toBe(15);

      await item.adjustQuantity(10);
      expect(item.quantity).toBe(25);
    });

    test('adjustQuantity should not allow negative quantities', async () => {
      const item = new Inventory({
        foodbank_id: new mongoose.Types.ObjectId(),
        item_name: 'Negative Test Item',
        category: 'Test',
        quantity: 5
      });

      await item.adjustQuantity(-10); // Try to subtract more than available
      expect(item.quantity).toBe(0); // Should be clamped to 0
    });

  });

  describe('Static Methods', () => {
    
    test('findLowStock should return query for low stock items', () => {
      const query = Inventory.findLowStock();
      expect(query.getQuery()).toEqual({ low_stock: true });
    });

    test('findExpiringSoon should return query for expiring items', () => {
      const query = Inventory.findExpiringSoon(7);
      const queryObj = query.getQuery();
      
      expect(queryObj.expiration_date).toBeDefined();
      expect(queryObj.expiration_date.$gte).toBeDefined();
      expect(queryObj.expiration_date.$lte).toBeDefined();
    });

    test('searchItems should create text search query', () => {
      const query = Inventory.searchItems('tomato');
      const queryObj = query.getQuery();
      
      expect(queryObj.$text).toBeDefined();
      expect(queryObj.$text.$search).toBe('tomato');
    });

  });

});

describe('MongoDB Collection Integration', () => {
  
  test('should work with MongoDB collection validation', async () => {
    // This test verifies that Mongoose documents pass MongoDB collection validation
    const validDoc = {
      foodbank_id: new mongoose.Types.ObjectId(),
      item_name: 'Integration Test Item',
      category: 'Test Category',
      quantity: 30,
      expiration_date: new Date('2025-06-01'),
      dietary_category: 'Vegan',
      date_added: new Date(),
      low_stock: false,
      minimum_stock_level: 10
    };

    // Create Mongoose document
    const mongooseDoc = new Inventory(validDoc);
    const validationError = mongooseDoc.validateSync();
    
    expect(validationError).toBeUndefined();
    
    // Verify the document has all fields expected by MongoDB collection
    expect(mongooseDoc.foodbank_id).toBeDefined();
    expect(mongooseDoc.item_name).toBeDefined();
    expect(mongooseDoc.category).toBeDefined();
    expect(mongooseDoc.quantity).toBeDefined();
    expect(typeof mongooseDoc.low_stock).toBe('boolean');
  });

});