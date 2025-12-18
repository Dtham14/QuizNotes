// Script to check all users in the database
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { users } = require('../lib/db/schema');
const path = require('path');

const dbPath = path.join(__dirname, '../sqlite.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function checkUsers() {
  try {
    const allUsers = await db.select().from(users);

    console.log('\n=== All Users ===');
    console.log(`Total users: ${allUsers.length}\n`);

    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name || 'Not set'}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

checkUsers();
