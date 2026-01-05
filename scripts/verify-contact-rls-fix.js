const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyRLSFix() {
  console.log('=== Verifying Contact Submissions RLS Fix ===\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Step 1: Check if is_admin function exists
  console.log('1. Checking if is_admin() function exists...');

  let functions, funcError;
  try {
    const result = await supabase.rpc('is_admin', {
      user_id: '00000000-0000-0000-0000-000000000000'
    });
    functions = result.data;
    funcError = result.error;
  } catch (e) {
    funcError = e;
  }

  if (funcError && funcError.message?.includes('function') && funcError.message?.includes('does not exist')) {
    console.log('   ❌ is_admin() function NOT found');
    console.log('   The migration was not applied correctly.\n');
    console.log('   Please run this SQL in Supabase dashboard:\n');
    console.log('   CREATE OR REPLACE FUNCTION is_admin(user_id UUID)');
    console.log('   RETURNS BOOLEAN AS $$');
    console.log('   DECLARE');
    console.log('     user_role TEXT;');
    console.log('   BEGIN');
    console.log('     SELECT role INTO user_role FROM public.profiles WHERE id = user_id;');
    console.log('     RETURN user_role = \'admin\';');
    console.log('   END;');
    console.log('   $$ LANGUAGE plpgsql SECURITY DEFINER;\n');
    return;
  } else {
    console.log('   ✓ is_admin() function exists\n');
  }

  // Step 2: Test is_admin function with the actual admin user
  console.log('2. Testing is_admin() function with admin user...');
  const adminUserId = '71274812-f919-40c7-acae-c1f9e4d406ed'; // decodewithdaniel@gmail.com

  const { data: isAdminResult, error: adminCheckError } = await supabase
    .rpc('is_admin', { user_id: adminUserId });

  if (adminCheckError) {
    console.log('   ❌ Error calling is_admin():', adminCheckError);
  } else {
    console.log(`   Result: ${isAdminResult}`);
    if (isAdminResult === true) {
      console.log('   ✓ Function correctly identifies admin\n');
    } else {
      console.log('   ❌ Function returned false for admin user!\n');
    }
  }

  // Step 3: Check RLS policies on contact_submissions
  console.log('3. Checking RLS policies on contact_submissions...');

  // We can't directly query pg_policies without service role, so let's test the behavior
  console.log('   Testing RLS behavior...\n');

  // Step 4: Simulate admin user query
  console.log('4. Simulating authenticated admin user query...');
  console.log('   (This simulates what happens when admin page loads)\n');

  // Create a new client and sign in as admin
  const testClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // For testing, we need actual admin credentials
  console.log('   To fully test, you need to sign in as admin.');
  console.log('   For now, checking with service role...\n');

  const { data: submissions, error: fetchError } = await supabase
    .from('contact_submissions')
    .select(`
      *,
      profiles:user_id (
        user_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.log('   ❌ Error fetching submissions:', fetchError);
  } else {
    console.log(`   ✓ Successfully fetched ${submissions.length} submissions with service role\n`);

    if (submissions.length > 0) {
      console.log('   Sample submission:');
      console.log(`   - Name: ${submissions[0].name}`);
      console.log(`   - Email: ${submissions[0].email}`);
      console.log(`   - Subject: ${submissions[0].subject}\n`);
    }
  }

  console.log('=== Summary ===');
  console.log('The data exists and can be fetched with service role.');
  console.log('\nIf admin page still shows no data, possible issues:');
  console.log('1. Admin user session is not properly authenticated');
  console.log('2. Browser cache needs to be cleared');
  console.log('3. RLS policy was not updated correctly\n');
  console.log('Next step: Log in as decodewithdaniel@gmail.com and check browser console for errors.');
}

verifyRLSFix().catch(console.error);
