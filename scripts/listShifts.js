require('dotenv').config();
const mongoose = require('mongoose');
const Shift = require('../src/db/models/Shift');

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bytebasket';
    const dbName = process.env.MONGO_DB_NAME || 'bytebasket';
    await mongoose.connect(mongoUri, { dbName });

    const totalCount = await Shift.countDocuments();
    const upcomingCount = await Shift.countDocuments({ shift_date: { $gte: new Date() } });
    const publishedUpcomingCount = await Shift.countDocuments({ status: 'published', shift_date: { $gte: new Date() } });

    console.log('DB:', mongoose.connection.name);
    console.log('Total shifts:', totalCount);
    console.log('Upcoming shifts (any status):', upcomingCount);
    console.log('Upcoming published shifts:', publishedUpcomingCount);

    if (totalCount > 0) {
      const sample = await Shift.find({}).sort({ shift_date: 1 }).limit(5).lean();
      console.log('\nSample (first 5 by date):');
      for (const s of sample) {
        console.log({
          id: String(s._id),
          title: s.title,
          date: s.shift_date,
          status: s.status,
          capacity: s.capacity,
          current: s.current_volunteers,
          foodbank: String(s.foodbank_id),
        });
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
})();


