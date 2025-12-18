// Script to make a user an admin
// Usage: node scripts/make-admin.js <email>

const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { users } = require('../lib/db/schema');
const { eq } = require('drizzle-orm');
const path = require('path');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

const dbPath = path.join(__dirname, '../drizzle/dev.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function makeAdmin() {
  try {
    const result = await db
      .update(users)
      .set({ role: 'admin', updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();

    if (result.length === 0) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Successfully made ${email} an admin!`);
    console.log(`User: ${result[0].name || result[0].email}`);
    console.log(`Role: ${result[0].role}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

makeAdmin();
