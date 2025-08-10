// backend/src/scripts/testMongooseConnection.js
const { connectDB } = require('./mongoose');

(async () => {
  await connectDB(); // This triggers your logs

  // Optional: exit after a delay to give logs time to print
  setTimeout(() => {
    console.log('👋 Test finished. Exiting...');
    process.exit(0);
  }, 1000);
})();
