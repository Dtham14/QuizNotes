// Script to activate subscription for test teacher account
// Run with: node scripts/activate-test-teacher.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function activateTestTeacher() {
  const testTeacherEmail = 'testteacher@quiznotes.test';

  // First, find the user
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  const testTeacher = users.users.find(u => u.email === testTeacherEmail);

  if (!testTeacher) {
    console.error('Test teacher not found. Run create-test-accounts.js first.');
    process.exit(1);
  }

  console.log('Found test teacher:', testTeacher.id);

  // Update the profile to have an active subscription
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_plan: 'yearly',
      subscription_expires_at: oneYearFromNow.toISOString(),
    })
    .eq('id', testTeacher.id);

  if (updateError) {
    console.error('Error updating profile:', updateError.message);
    process.exit(1);
  }

  console.log('\n=== Test Teacher Subscription Activated ===');
  console.log('Email:', testTeacherEmail);
  console.log('Subscription: Active (Yearly)');
  console.log('Expires:', oneYearFromNow.toLocaleDateString());
  console.log('\nYou can now access all teacher features!');
}

activateTestTeacher();
