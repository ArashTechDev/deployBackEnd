// backend/scripts/seedVolunteerData.js
require('dotenv').config();
const mongoose = require('mongoose');
const Volunteer = require('../src/db/models/Volunteer');
const Shift = require('../src/db/models/Shift');
const VolunteerShift = require('../src/db/models/VolunteerShift');
const User = require('../src/db/models/User');
const FoodBank = require('../src/db/models/FoodBank');

const seedVolunteerData = async () => {
  try {
    console.log('🌱 Starting volunteer data seeding...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGO_DB_NAME || 'ByteBasket',
    });
    console.log('✅ Connected to MongoDB');

    // Get existing foodbank for testing
    const foodbank = await FoodBank.findOne();
    if (!foodbank) {
      console.log('❌ No foodbank found. Please run the setup-demo script first.');
      process.exit(1);
    }

    // Create test users for volunteers
    const testUsers = [
      {
        name: 'Alice Johnson',
        email: 'alice.volunteer@example.com',
        password: 'password123',
        role: 'volunteer',
      },
      {
        name: 'Bob Smith',
        email: 'bob.volunteer@example.com',
        password: 'password123',
        role: 'volunteer',
      },
      {
        name: 'Carol Davis',
        email: 'carol.volunteer@example.com',
        password: 'password123',
        role: 'volunteer',
      },
      {
        name: 'David Wilson',
        email: 'david.volunteer@example.com',
        password: 'password123',
        role: 'volunteer',
      },
      {
        name: 'Eva Brown',
        email: 'eva.volunteer@example.com',
        password: 'password123',
        role: 'volunteer',
      },
    ];

    // Create admin user for shifts
    const adminUser =
      (await User.findOne({ role: 'admin' })) ||
      (await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        foodbank_id: foodbank._id,
      }));

    // Create test volunteer users
    const createdUsers = [];
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = await User.create(userData);
        createdUsers.push(user);
      } else {
        createdUsers.push(existingUser);
      }
    }

    console.log(`✅ Created ${createdUsers.length} volunteer users`);

    // Create volunteers
    const volunteers = [];
    for (const user of createdUsers) {
      const existingVolunteer = await Volunteer.findOne({
        user_id: user._id,
        foodbank_id: foodbank._id,
      });

      if (!existingVolunteer) {
        const volunteer = await Volunteer.create({
          user_id: user._id,
          foodbank_id: foodbank._id,
          skills: [
            { skill_name: 'Food Sorting', proficiency: 'intermediate' },
            { skill_name: 'Customer Service', proficiency: 'beginner' },
          ],
          availability: {
            days_of_week: ['monday', 'wednesday', 'friday'],
            preferred_shifts: ['morning', 'afternoon'],
            max_hours_per_week: 20,
          },
          emergency_contact: {
            name: 'Emergency Contact',
            phone: '555-0123',
            relationship: 'Friend',
          },
          background_check: {
            completed: true,
            completion_date: new Date(),
            expires_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
          training_status: {
            orientation_completed: true,
            orientation_date: new Date(),
            certifications: [
              {
                name: 'Food Safety',
                date_obtained: new Date(),
                expires_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              },
            ],
          },
          created_by: adminUser._id,
        });
        volunteers.push(volunteer);
      } else {
        volunteers.push(existingVolunteer);
      }
    }

    console.log(`✅ Created ${volunteers.length} volunteers`);

    // Create test shifts
    const shifts = [];
    const shiftData = [
      {
        title: 'Morning Food Sorting',
        description: 'Sort and organize donated food items',
        shift_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        start_time: '09:00',
        end_time: '12:00',
        capacity: 4,
        activity_category: 'food_sorting',
        location: 'Main Warehouse',
        status: 'published',
      },
      {
        title: 'Afternoon Food Distribution',
        description: 'Distribute food to community members',
        shift_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        start_time: '14:00',
        end_time: '17:00',
        capacity: 3,
        activity_category: 'food_distribution',
        location: 'Distribution Center',
        status: 'published',
      },
      {
        title: 'Inventory Management',
        description: 'Update inventory database and check stock levels',
        shift_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        start_time: '10:00',
        end_time: '14:00',
        capacity: 2,
        activity_category: 'inventory',
        location: 'Office',
        status: 'published',
      },
      {
        title: 'Delivery Service',
        description: 'Deliver food packages to homebound clients',
        shift_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        start_time: '10:00',
        end_time: '15:00',
        capacity: 2,
        activity_category: 'delivery',
        location: 'Various Locations',
        status: 'published',
      },
    ];

    for (const shiftInfo of shiftData) {
      const shift = await Shift.create({
        ...shiftInfo,
        foodbank_id: foodbank._id,
        coordinator_id: adminUser._id,
        created_by: adminUser._id,
      });
      shifts.push(shift);
    }

    console.log(`✅ Created ${shifts.length} shifts`);

    // Create volunteer shift assignments
    const volunteerShifts = [];

    // Assign first 2 volunteers to first shift
    for (let i = 0; i < 2; i++) {
      const volunteerShift = await VolunteerShift.create({
        volunteer_id: volunteers[i]._id,
        shift_id: shifts[0]._id,
        user_id: volunteers[i].user_id,
        foodbank_id: foodbank._id,
        work_date: shifts[0].shift_date,
        status: 'confirmed',
        created_by: adminUser._id,
      });
      volunteerShifts.push(volunteerShift);

      // Update shift volunteer count
      await shifts[0].addVolunteer();
    }

    // Assign volunteers to second shift
    for (let i = 2; i < 4; i++) {
      const volunteerShift = await VolunteerShift.create({
        volunteer_id: volunteers[i]._id,
        shift_id: shifts[1]._id,
        user_id: volunteers[i].user_id,
        foodbank_id: foodbank._id,
        work_date: shifts[1].shift_date,
        status: 'assigned',
        created_by: adminUser._id,
      });
      volunteerShifts.push(volunteerShift);

      // Update shift volunteer count
      await shifts[1].addVolunteer();
    }

    // Create some completed shifts in the past for reporting
    const pastShift = await Shift.create({
      title: 'Past Food Distribution',
      description: 'Completed food distribution shift',
      shift_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      start_time: '10:00',
      end_time: '14:00',
      capacity: 3,
      current_volunteers: 2,
      activity_category: 'food_distribution',
      location: 'Distribution Center',
      status: 'completed',
      foodbank_id: foodbank._id,
      coordinator_id: adminUser._id,
      created_by: adminUser._id,
    });

    // Create completed volunteer shifts
    for (let i = 0; i < 2; i++) {
      await VolunteerShift.create({
        volunteer_id: volunteers[i]._id,
        shift_id: pastShift._id,
        user_id: volunteers[i].user_id,
        foodbank_id: foodbank._id,
        work_date: pastShift.shift_date,
        status: 'completed',
        check_in_time: '10:00',
        check_out_time: '14:00',
        hours_worked: 4,
        performance_rating: 4 + Math.floor(Math.random() * 2), // 4 or 5
        feedback: {
          coordinator_feedback: 'Great work today! Very helpful and efficient.',
          volunteer_feedback: 'Enjoyed helping the community.',
        },
        verified: true,
        verified_by: adminUser._id,
        verified_date: new Date(),
        created_by: adminUser._id,
      });
    }

    console.log(`✅ Created ${volunteerShifts.length + 2} volunteer shift assignments`);

    // Update volunteer total hours
    for (const volunteer of volunteers.slice(0, 2)) {
      await volunteer.updateTotalHours();
    }

    console.log('✅ Updated volunteer total hours');

    console.log('\n🎉 Volunteer data seeding completed successfully!');
    console.log(`
📊 Summary:
- Users created: ${createdUsers.length}
- Volunteers created: ${volunteers.length}
- Shifts created: ${shifts.length + 1}
- Volunteer assignments: ${volunteerShifts.length + 2}
- Food bank: ${foodbank.name}
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding volunteer data:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedVolunteerData();
