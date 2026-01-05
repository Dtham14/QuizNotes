const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAdminRLS() {
  console.log('=== Testing Admin RLS with Real Admin User ===\n');

  // Create client with anon key (like the browser does)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Sign in as admin
  const adminEmail = 'decodewithdaniel@gmail.com';
  const adminPassword = process.argv[2];

  if (!adminPassword) {
    console.log('Usage: node scripts/test-admin-rls.js <admin-password>');
    console.log('\nThis will test if the admin user can access contact submissions.\n');
    return;
  }

  console.log(`Signing in as: ${adminEmail}...`);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    return;
  }

  console.log('✓ Signed in successfully');
  console.log(`User ID: ${authData.user.id}\n`);

  // Check user role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError);
    return;
  }

  console.log(`User role: ${profile.role}`);
  if (profile.role !== 'admin') {
    console.error('❌ User is not admin!');
    return;
  }
  console.log('✓ User is admin\n');

  // Now try to fetch contact submissions (exactly like the API does)
  console.log('Attempting to fetch contact submissions...\n');

  const { data: submissions, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ ERROR fetching submissions:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    console.error('\nThis is the RLS policy blocking access!\n');

    // Try to get more info about the policies
    console.log('Checking if is_admin() function works...');
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin', { user_id: authData.user.id });

    if (isAdminError) {
      console.error('❌ is_admin() error:', isAdminError);
    } else {
      console.log(`is_admin() returned: ${isAdminResult}`);
      if (isAdminResult) {
        console.log('✓ Function says user is admin, but RLS still blocking!\n');
        console.log('This means the RLS policy is not using the is_admin() function correctly.');
      }
    }
  } else {
    console.log(`✓ SUCCESS! Fetched ${submissions.length} submissions\n`);

    if (submissions.length > 0) {
      console.log('First submission:');
      console.log(`- Name: ${submissions[0].name}`);
      console.log(`- Email: ${submissions[0].email}`);
      console.log(`- Subject: ${submissions[0].subject}\n`);
    }
  }

  // Sign out
  await supabase.auth.signOut();
}

testAdminRLS().catch(console.error);
