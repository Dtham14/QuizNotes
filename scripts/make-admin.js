// Script to make a user an admin
// Usage: node scripts/make-admin.js <email>

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Make sure .env.local is configured.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin', updated_at: new Date().toISOString() })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }

    if (!data) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    console.log(`Successfully made ${email} an admin!`);
    console.log(`User: ${data.name || data.email}`);
    console.log(`Role: ${data.role}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();
