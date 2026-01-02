// Script to add parent_message_id column for threaded replies
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addMessageRepliesSupport() {
  console.log('\n=== Adding Threaded Replies Support ===\n');

  try {
    // Add parent_message_id column
    console.log('Adding parent_message_id column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.class_messages
        ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.class_messages(id) ON DELETE CASCADE;
      `
    });

    if (alterError) {
      console.error('Note: Column might already exist or direct SQL execution not available');
      console.log('Please run the migration file manually in Supabase SQL Editor');
      console.log('File: supabase/migrations/013_add_message_replies.sql');
    } else {
      console.log('✓ Added parent_message_id column');
    }

    console.log('\n✓ Migration ready');
    console.log('\nTo apply manually:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL from: supabase/migrations/013_add_message_replies.sql');

  } catch (err) {
    console.error('Error:', err.message);
    console.log('\nPlease apply the migration manually in Supabase SQL Editor');
    console.log('File: supabase/migrations/013_add_message_replies.sql');
  }
}

addMessageRepliesSupport();
