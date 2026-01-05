const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAdminFetch() {
  console.log('=== Testing Admin Contact Submissions Fetch ===\n');

  // Prompt for admin credentials to test
  const adminEmail = process.argv[2] || 'admin@quiznotes.test';
  const adminPassword = process.argv[3];

  if (!adminPassword) {
    console.log('Usage: node scripts/test-admin-contact-fetch.js <admin-email> <admin-password>');
    console.log('\nOr test with service role (bypasses RLS):');
    console.log('node scripts/test-admin-contact-fetch.js service-role\n');

    // Test with service role to see if data exists
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Service Role Fetch Results:');
    console.log(`- Found ${data?.length || 0} submissions`);
    if (error) console.log('- Error:', error);

    return;
  }

  // Create client and sign in as admin
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log(`Signing in as: ${adminEmail}\n`);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authError) {
    console.error('Authentication failed:', authError.message);
    return;
  }

  console.log('✓ Authenticated successfully');
  console.log(`User ID: ${authData.user.id}\n`);

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Failed to fetch profile:', profileError);
    return;
  }

  console.log(`User role: ${profile.role}`);

  if (profile.role !== 'admin') {
    console.error('\n❌ User is not an admin! Please use an admin account.\n');
    return;
  }

  console.log('✓ User is admin\n');

  // Now test fetching contact submissions (same as admin API)
  console.log('Fetching contact submissions...\n');

  const { data: submissions, error } = await supabase
    .from('contact_submissions')
    .select(`
      *,
      profiles:user_id (
        user_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching submissions:', error);
    console.log('\nThis is the error the admin page is seeing!');
  } else {
    console.log(`✓ Successfully fetched ${submissions.length} contact submissions!\n`);

    submissions.forEach((sub, idx) => {
      console.log(`${idx + 1}. ${sub.name} - ${sub.subject}`);
      console.log(`   Email: ${sub.email}`);
      console.log(`   Submitted: ${sub.created_at}`);
      console.log('');
    });
  }

  // Sign out
  await supabase.auth.signOut();
}

testAdminFetch().catch(console.error);
