// Script to create test accounts for QuizNotes
// Run with: node scripts/create-test-accounts.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'MISSING');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestAccounts() {
  const testAccounts = [
    {
      email: 'testteacher@quiznotes.test',
      password: 'TestTeacher123!',
      name: 'Test Teacher',
      role: 'teacher'
    },
    {
      email: 'teststudent@quiznotes.test',
      password: 'TestStudent123!',
      name: 'Test Student',
      role: 'student'
    }
  ];

  console.log('\n=== Creating Test Accounts ===\n');

  for (const account of testAccounts) {
    try {
      // Create user with admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: account.name,
          role: account.role
        }
      });

      if (error) {
        if (error.message.includes('already been registered')) {
          console.log(`[SKIP] ${account.role.toUpperCase()}: ${account.email} already exists`);
        } else {
          console.error(`[ERROR] Failed to create ${account.role}:`, error.message);
        }
      } else {
        console.log(`[OK] Created ${account.role.toUpperCase()}: ${account.email}`);
      }
    } catch (err) {
      console.error(`[ERROR] Exception creating ${account.role}:`, err.message);
    }
  }

  console.log('\n=== Test Account Credentials ===\n');
  console.log('TEACHER ACCOUNT:');
  console.log('  Email:    testteacher@quiznotes.test');
  console.log('  Password: TestTeacher123!');
  console.log('');
  console.log('STUDENT ACCOUNT:');
  console.log('  Email:    teststudent@quiznotes.test');
  console.log('  Password: TestStudent123!');
  console.log('');
}

createTestAccounts();
