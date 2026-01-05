const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugContactSubmissions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('=== Checking Contact Submissions ===\n');

  // Check if table exists and get all submissions (using service role to bypass RLS)
  const { data: submissions, error: fetchError } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching submissions:', fetchError);
    return;
  }

  console.log(`Found ${submissions?.length || 0} contact submissions:\n`);

  if (submissions && submissions.length > 0) {
    submissions.forEach((sub, idx) => {
      console.log(`${idx + 1}. Name: ${sub.name}`);
      console.log(`   Email: ${sub.email}`);
      console.log(`   Subject: ${sub.subject}`);
      console.log(`   Message: ${sub.message.substring(0, 50)}...`);
      console.log(`   User ID: ${sub.user_id || 'Anonymous'}`);
      console.log(`   Created: ${sub.created_at}`);
      console.log('');
    });
  } else {
    console.log('No submissions found in the database.');
    console.log('Try submitting a test form from the /contact page first.\n');
  }

  // Test RLS policy by trying to fetch as anonymous user
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: anonData, error: anonError } = await anonClient
    .from('contact_submissions')
    .select('*');

  console.log('\n=== Testing RLS Policy (Anonymous User) ===');
  console.log('Expected: Should get 0 results (no permission)');
  console.log(`Actual: ${anonData?.length || 0} results`);
  if (anonError) {
    console.log('Error:', anonError.message);
  }
}

debugContactSubmissions().catch(console.error);
