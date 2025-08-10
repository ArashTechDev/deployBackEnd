// backend/tests/models/User.test.js
const mongoose = require('mongoose');
const User = require('../../src/db/models/User');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    test('should create a user with default dietary preferences', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'recipient',
      };

      const user = await User.create(userData);

      expect(user.dietaryPreferences.defaultSeverity).toBe('mild');
      expect(user.dietaryPreferences.lastUpdated).toBeDefined();
      expect(user.role).toBe('recipient');
    });

    test('should create a user with custom dietary preferences', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'recipient',
        dietaryPreferences: {
          defaultSeverity: 'strict',
          lastUpdated: new Date(),
        },
      };

      const user = await User.create(userData);

      expect(user.dietaryPreferences.defaultSeverity).toBe('strict');
    });
  });

  describe('User Role Validation', () => {
    test('should accept valid roles', async () => {
      const validRoles = ['admin', 'staff', 'volunteer', 'donor', 'recipient'];

      for (const role of validRoles) {
        const user = new User({
          name: `Test User ${role}`,
          email: `test${role}@example.com`,
          password: 'password123',
          role: role,
        });

        await expect(user.save()).resolves.toBeDefined();
      }
    });

    test('should reject invalid roles', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid_role',
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Dietary Preferences Virtual', () => {
    test('should populate dietaryRestrictions virtual', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'recipient',
      });

      // Note: You'll need to create UserDietaryPreference documents for this test
      // This just tests that the virtual is configured correctly
      const populatedUser = await User.findById(user._id).populate('dietaryRestrictions');

      expect(populatedUser.dietaryRestrictions).toBeDefined();
      expect(Array.isArray(populatedUser.dietaryRestrictions)).toBe(true);
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const plainPassword = 'password123';
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: plainPassword,
        role: 'recipient',
      });

      await user.save();

      // Password should be hashed
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$.{53}$/); // bcrypt format
    });

    test('should validate password correctly', async () => {
      const plainPassword = 'password123';
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: plainPassword,
        role: 'recipient',
      });

      // Find user with password selected
      const foundUser = await User.findById(user._id).select('+password');
      const isValid = await foundUser.correctPassword(plainPassword, foundUser.password);

      expect(isValid).toBe(true);
    });
  });

  describe('JSON Serialization', () => {
    test('should exclude sensitive fields from JSON', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'recipient',
        verificationToken: 'test-token',
        passwordResetToken: 'reset-token',
      });

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.verificationToken).toBeUndefined();
      expect(userJSON.passwordResetToken).toBeUndefined();
      expect(userJSON.__v).toBeUndefined();

      // Should include virtuals
      expect(userJSON.id).toBeDefined();
      expect(userJSON.dietaryRestrictions).toBeDefined();
    });
  });

  describe('Foodbank ID Requirement', () => {
    test('should require foodbank_id for admin and staff roles', async () => {
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        // Missing foodbank_id
      });

      await expect(adminUser.save()).rejects.toThrow();
    });

    test('should not require foodbank_id for other roles', async () => {
      const donorUser = new User({
        name: 'Donor User',
        email: 'donor@example.com',
        password: 'password123',
        role: 'donor',
        // No foodbank_id needed
      });

      await expect(donorUser.save()).resolves.toBeDefined();
    });
  });
});

// Helper function to run these tests
async function runUserSchemaTests() {
  console.log('Running User Schema Tests...');

  // This would typically be run with Jest
  // npm test -- --testNamePattern="User Model"

  console.log('✅ User schema tests would verify:');
  console.log('  - Default dietary preferences creation');
  console.log('  - Role validation');
  console.log('  - Password hashing');
  console.log('  - Virtual population');
  console.log('  - JSON serialization');
  console.log('  - Foodbank ID requirements');
}

module.exports = { runUserSchemaTests };
