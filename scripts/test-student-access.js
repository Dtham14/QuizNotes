// Script to test student class access
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStudentAccess() {
  console.log('\n=== Testing Student Class Access ===\n');

  // Login as test student
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'teststudent@quiznotes.test',
    password: 'TestStudent123!'
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }

  console.log('✓ Logged in as test student');

  // Try to access the class
  const classId = 'd1a7801e-a1c2-4fa7-9dc2-0aad2e809711';

  try {
    const response = await fetch(`http://localhost:3000/api/student/classes/${classId}`, {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✓ SUCCESS! Student can access the class\n');
      console.log('Class Details:');
      console.log('  Name:', data.class.name);
      console.log('  Description:', data.class.description);
      console.log('  Teacher:', data.class.teacherName);
      console.log('  Assignments:', data.assignments?.length || 0);
    } else {
      console.log('\n✗ FAILED! Error accessing class\n');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }

  await supabase.auth.signOut();
}

testStudentAccess().catch(console.error);
