// Delete user(s) by email — reusable function + CLI
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const { connectMongoDB } = require('../src/config/mongodb');
const User = require('../src/db/models/User');

// Set your default emails here so running `node backend/scripts/deleteMyUsers.js`
// with no CLI args will delete these users.
const HARDCODED_EMAILS = [
  'arshdeeprathore@gmail.com',
  'techwitharash@gmail.com',
  'bhagwandassu1@gmail.com',
  'ned80085@gmail.com',
  'ajthapar20@gmail.com',
  'knowergenius@gmail.com',
];

async function ensureConnected() {
  if (mongoose.connection.readyState >= 1) return;
  await connectMongoDB();
}

/**
 * Delete a single user by email.
 * Keeps the DB connection open so you can call this multiple times; call closeConnection() when done.
 * @param {string} email - The email of the user to delete
 * @returns {Promise<{deleted: boolean, user?: object, message: string}>}
 */
async function deleteUser(email) {
  if (!email || typeof email !== 'string') {
    return { deleted: false, message: 'Email is required' };
  }

  await ensureConnected();

  const normalizedEmail = String(email).toLowerCase().trim();
  const deletedUser = await User.findOneAndDelete({ email: normalizedEmail });

  if (!deletedUser) {
    return { deleted: false, message: 'No user found with that email' };
  }

  return {
    deleted: true,
    message: 'User deleted',
    user: {
      id: deletedUser._id.toString(),
      name: deletedUser.name,
      email: deletedUser.email,
      role: deletedUser.role,
      createdAt: deletedUser.createdAt,
    },
  };
}

async function closeConnection() {
  if (mongoose.connection.readyState > 0) {
    await mongoose.connection.close();
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const emails = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--email' || arg === '-e') {
      if (args[i + 1]) emails.push(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith('--email=')) {
      const value = arg.split('=')[1];
      if (value) emails.push(value);
      continue;
    }
    if (!arg.startsWith('-')) {
      emails.push(arg);
    }
  }

  return { emails };
}

function printUsage() {
  console.log('Usage:');
  console.log('  node backend/scripts/deleteMyUsers.js --email <email1> --email <email2>');
  console.log('  node backend/scripts/deleteMyUsers.js <email1> <email2>');
  console.log('  (or run with no args to use built-in HARDCODED_EMAILS)');
  console.log('\nProgrammatic usage:');
  console.log("  const { deleteUser, closeConnection } = require('./backend/scripts/deleteMyUsers');");
  console.log("  await deleteUser('user@example.com');");
  console.log('  await closeConnection();');
}

// CLI mode (supports one or more emails)
if (require.main === module) {
  (async () => {
    const { emails } = parseArgs(process.argv);
    const emailsToDelete = emails.length ? emails : HARDCODED_EMAILS;

    if (!emailsToDelete.length) {
      console.error('❌ No emails provided and HARDCODED_EMAILS is empty.');
      printUsage();
      process.exit(1);
    }

    let exitCode = 0;
    try {
      await ensureConnected();
      console.log(`📂 Database: ${mongoose.connection.name}`);

      for (const email of emailsToDelete) {
        console.log(`🗑️ Deleting user with email: ${email}`);
        const result = await deleteUser(email);
        if (result.deleted) {
          console.log('✅', result.message, result.user);
        } else {
          console.log('ℹ️', result.message);
        }
      }
    } catch (err) {
      exitCode = 1;
      console.error('❌ Error:', err.message || err);
    } finally {
      try {
        await closeConnection();
        console.log('🔒 Connection closed');
      } catch {}
      process.exit(exitCode);
    }
  })();
}

module.exports = { deleteUser, closeConnection };
