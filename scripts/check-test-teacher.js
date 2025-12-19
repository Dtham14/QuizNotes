// Script to check test teacher profile
// Run with: node scripts/check-test-teacher.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTestTeacher() {
  const testTeacherEmail = 'testteacher@quiznotes.test';

  // Find the user
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  const testTeacher = users.users.find(u => u.email === testTeacherEmail);

  if (!testTeacher) {
    console.error('Test teacher not found');
    process.exit(1);
  }

  console.log('=== Auth User ===');
  console.log('ID:', testTeacher.id);
  console.log('Email:', testTeacher.email);
  console.log('User Metadata:', JSON.stringify(testTeacher.user_metadata, null, 2));

  // Check the profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', testTeacher.id)
    .single();

  if (profileError) {
    console.error('\n=== Profile Error ===');
    console.error(profileError.message);

    // Try to create the profile
    console.log('\nAttempting to create profile...');
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testTeacher.id,
        email: testTeacher.email,
        name: 'Test Teacher',
        role: 'teacher',
        subscription_status: 'active',
        subscription_plan: 'yearly',
        subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error('Failed to create profile:', insertError.message);
    } else {
      console.log('Profile created successfully!');
    }
  } else {
    console.log('\n=== Profile ===');
    console.log(JSON.stringify(profile, null, 2));
  }
}

checkTestTeacher();
