// backend/tests/volunteer.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const Volunteer = require('../src/db/models/Volunteer');
const Shift = require('../src/db/models/Shift');
const VolunteerShift = require('../src/db/models/VolunteerShift');
const User = require('../src/db/models/User');
const FoodBank = require('../src/db/models/FoodBank');
const jwt = require('jsonwebtoken');

// Set test environment before importing app
process.env.NODE_ENV = 'test';

// Import app after setting environment
const app = require('../src/index');

describe('Volunteer Management System', () => {
  let authToken;
  let testUser;
  let testFoodBank;
  let testVolunteer;
  let testShift;

  beforeAll(async () => {
    // Wait for mongoose to be ready
    await mongoose.connect(
      process.env.MONGO_URI ||
        'mongodb+srv://techwitharash:byteBasket@cluster0.eabzdc3.mongodb.net/ByteBasket'
    );

    // Create test food bank
    testFoodBank = await FoodBank.create({
      name: 'Test Food Bank',
      address: '123 Test Street',
      city: 'Test City',
      contactEmail: 'test@foodbank.com',
    });

    // Create test user
    testUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      foodbank_id: testFoodBank._id,
    });

    // Generate auth token
    authToken = jwt.sign(
      {
        id: testUser._id,
        email: testUser.email,
        role: testUser.role,
      },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (testFoodBank) {
      await FoodBank.deleteOne({ _id: testFoodBank._id });
    }
    // Note: We don't close the connection as it might be used by other tests
  });

  beforeEach(async () => {
    // Clean up data before each test
    await Volunteer.deleteMany({});
    await Shift.deleteMany({});
    await VolunteerShift.deleteMany({});
  });

  describe('POST /api/volunteers', () => {
    it('should create a new volunteer', async () => {
      const volunteerUser = await User.create({
        name: 'Test Volunteer',
        email: 'volunteer@test.com',
        password: 'password123',
        role: 'volunteer',
      });

      const volunteerData = {
        user_id: volunteerUser._id,
        foodbank_id: testFoodBank._id,
        skills: [{ skill_name: 'Food Sorting', proficiency: 'intermediate' }],
        availability: {
          days_of_week: ['monday', 'wednesday'],
          preferred_shifts: ['morning'],
          max_hours_per_week: 20,
        },
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '555-0123',
          relationship: 'Friend',
        },
      };

      const response = await request(app)
        .post('/api/volunteers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(volunteerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.volunteer_id).toBeDefined();
      expect(response.body.data.status).toBe('active');
    });

    it('should fail with invalid user_id', async () => {
      const volunteerData = {
        user_id: new mongoose.Types.ObjectId(),
        foodbank_id: testFoodBank._id,
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '555-0123',
          relationship: 'Friend',
        },
      };

      await request(app)
        .post('/api/volunteers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(volunteerData)
        .expect(404);
    });
  });

  describe('GET /api/volunteers/foodbank/:foodbank_id', () => {
    it('should return volunteers for a food bank', async () => {
      // Create test volunteer
      const volunteerUser = await User.create({
        name: 'Test Volunteer',
        email: 'volunteer@test.com',
        password: 'password123',
        role: 'volunteer',
      });

      testVolunteer = await Volunteer.create({
        user_id: volunteerUser._id,
        foodbank_id: testFoodBank._id,
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '555-0123',
          relationship: 'Friend',
        },
        created_by: testUser._id,
      });

      const response = await request(app)
        .get(`/api/volunteers/foodbank/${testFoodBank._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.volunteers).toHaveLength(1);
      expect(response.body.data.volunteers[0].volunteer_id).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/volunteers/foodbank/${testFoodBank._id}`)
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.current_page).toBe(1);
      expect(response.body.data.pagination.items_per_page).toBe(5);
    });
  });

  describe('POST /api/shifts', () => {
    it('should create a new shift', async () => {
      const shiftData = {
        foodbank_id: testFoodBank._id,
        title: 'Test Shift',
        description: 'Test shift description',
        shift_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        start_time: '09:00',
        end_time: '12:00',
        capacity: 5,
        activity_category: 'food_sorting',
        location: 'Test Location',
        coordinator_id: testUser._id,
      };

      const response = await request(app)
        .post('/api/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shiftData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.shift_id).toBeDefined();
      expect(response.body.data.status).toBe('draft');
      expect(response.body.data.current_volunteers).toBe(0);
    });

    it('should validate required fields', async () => {
      const shiftData = {
        foodbank_id: testFoodBank._id,
        title: 'Test Shift',
        // Missing required fields
      };

      await request(app)
        .post('/api/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shiftData)
        .expect(500);
    });
  });

  describe('POST /api/shifts/assign-volunteer', () => {
    beforeEach(async () => {
      // Create test volunteer
      const volunteerUser = await User.create({
        name: 'Test Volunteer',
        email: 'volunteer@test.com',
        password: 'password123',
        role: 'volunteer',
      });

      testVolunteer = await Volunteer.create({
        user_id: volunteerUser._id,
        foodbank_id: testFoodBank._id,
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '555-0123',
          relationship: 'Friend',
        },
        created_by: testUser._id,
      });

      // Create test shift
      testShift = await Shift.create({
        foodbank_id: testFoodBank._id,
        title: 'Test Shift',
        description: 'Test shift description',
        shift_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        start_time: '09:00',
        end_time: '12:00',
        capacity: 5,
        activity_category: 'food_sorting',
        location: 'Test Location',
        coordinator_id: testUser._id,
        status: 'published',
        created_by: testUser._id,
      });
    });

    it('should assign volunteer to shift', async () => {
      const assignmentData = {
        shift_id: testShift._id,
        volunteer_id: testVolunteer._id,
      };

      const response = await request(app)
        .post('/api/shifts/assign-volunteer')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.volunteer_id).toEqual(testVolunteer._id.toString());
      expect(response.body.data.shift_id).toEqual(testShift._id.toString());
      expect(response.body.data.status).toBe('assigned');
    });

    it('should not assign volunteer to same shift twice', async () => {
      const assignmentData = {
        shift_id: testShift._id,
        volunteer_id: testVolunteer._id,
      };

      // First assignment should succeed
      await request(app)
        .post('/api/shifts/assign-volunteer')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData)
        .expect(201);

      // Second assignment should fail
      await request(app)
        .post('/api/shifts/assign-volunteer')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData)
        .expect(400);
    });
  });

  describe('POST /api/volunteer-shifts/:id/check-in', () => {
    let volunteerShift;

    beforeEach(async () => {
      // Create test volunteer
      const volunteerUser = await User.create({
        name: 'Test Volunteer',
        email: 'volunteer@test.com',
        password: 'password123',
        role: 'volunteer',
      });

      testVolunteer = await Volunteer.create({
        user_id: volunteerUser._id,
        foodbank_id: testFoodBank._id,
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '555-0123',
          relationship: 'Friend',
        },
        created_by: testUser._id,
      });

      // Create test shift
      testShift = await Shift.create({
        foodbank_id: testFoodBank._id,
        title: 'Test Shift',
        description: 'Test shift description',
        shift_date: new Date(),
        start_time: '09:00',
        end_time: '12:00',
        capacity: 5,
        activity_category: 'food_sorting',
        location: 'Test Location',
        coordinator_id: testUser._id,
        status: 'published',
        created_by: testUser._id,
      });

      // Create volunteer shift assignment
      volunteerShift = await VolunteerShift.create({
        volunteer_id: testVolunteer._id,
        shift_id: testShift._id,
        user_id: volunteerUser._id,
        foodbank_id: testFoodBank._id,
        work_date: testShift.shift_date,
        status: 'confirmed',
        created_by: testUser._id,
      });
    });

    it('should check in volunteer', async () => {
      const checkInData = {
        check_in_time: '09:05',
      };

      const response = await request(app)
        .post(`/api/volunteer-shifts/${volunteerShift._id}/check-in`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(checkInData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('checked_in');
      expect(response.body.data.check_in_time).toBe('09:05');
    });

    it('should not check in volunteer with wrong status', async () => {
      // Change status to assigned
      volunteerShift.status = 'assigned';
      await volunteerShift.save();

      const checkInData = {
        check_in_time: '09:05',
      };

      await request(app)
        .post(`/api/volunteer-shifts/${volunteerShift._id}/check-in`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(checkInData)
        .expect(500);
    });
  });

  describe('GET /api/reports/hours', () => {
    beforeEach(async () => {
      // Create test volunteer
      const volunteerUser = await User.create({
        name: 'Test Volunteer',
        email: 'volunteer@test.com',
        password: 'password123',
        role: 'volunteer',
      });

      testVolunteer = await Volunteer.create({
        user_id: volunteerUser._id,
        foodbank_id: testFoodBank._id,
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '555-0123',
          relationship: 'Friend',
        },
        created_by: testUser._id,
      });

      // Create completed volunteer shift
      await VolunteerShift.create({
        volunteer_id: testVolunteer._id,
        shift_id: new mongoose.Types.ObjectId(),
        user_id: volunteerUser._id,
        foodbank_id: testFoodBank._id,
        work_date: new Date(),
        status: 'completed',
        hours_worked: 4,
        performance_rating: 5,
        verified: true,
        created_by: testUser._id,
      });
    });

    it('should generate hours report', async () => {
      const response = await request(app)
        .get('/api/reports/hours')
        .query({ foodbank_id: testFoodBank._id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(response.body.data.summary.total_hours).toBe(4);
    });

    it('should support grouping by volunteer', async () => {
      const response = await request(app)
        .get('/api/reports/hours')
        .query({
          foodbank_id: testFoodBank._id,
          group_by: 'volunteer',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].total_hours).toBe(4);
    });
  });

  describe('GET /api/reports/export/hours/csv', () => {
    beforeEach(async () => {
      // Create test volunteer
      const volunteerUser = await User.create({
        name: 'Test Volunteer',
        email: 'volunteer@test.com',
        password: 'password123',
        role: 'volunteer',
      });

      testVolunteer = await Volunteer.create({
        user_id: volunteerUser._id,
        foodbank_id: testFoodBank._id,
        emergency_contact: {
          name: 'Emergency Contact',
          phone: '555-0123',
          relationship: 'Friend',
        },
        created_by: testUser._id,
      });

      // Create completed volunteer shift
      await VolunteerShift.create({
        volunteer_id: testVolunteer._id,
        shift_id: new mongoose.Types.ObjectId(),
        user_id: volunteerUser._id,
        foodbank_id: testFoodBank._id,
        work_date: new Date(),
        status: 'completed',
        hours_worked: 4,
        performance_rating: 5,
        verified: true,
        created_by: testUser._id,
      });
    });

    it('should export hours report as CSV', async () => {
      const response = await request(app)
        .get('/api/reports/export/hours/csv')
        .query({ foodbank_id: testFoodBank._id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('Volunteer ID,Volunteer Name,Email');
      expect(response.text).toContain('Test Volunteer');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app).get(`/api/volunteers/foodbank/${testFoodBank._id}`).expect(401);

      await request(app).post('/api/volunteers').send({}).expect(401);

      await request(app).get('/api/reports/hours').expect(401);
    });

    it('should reject invalid tokens', async () => {
      await request(app)
        .get(`/api/volunteers/foodbank/${testFoodBank._id}`)
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid MongoDB ObjectIds', async () => {
      await request(app)
        .get('/api/volunteers/invalid_id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });

    it('should handle missing resources', async () => {
      await request(app)
        .get(`/api/volunteers/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
