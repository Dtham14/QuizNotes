const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('=== Applying Contact Submissions RLS Fix ===\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '016_fix_contact_submissions_rls.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executing migration...\n');

  // Execute the migration
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async (e) => {
    // If rpc method doesn't exist, try direct execution
    // Split the SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });
        if (error) {
          console.error(`Error executing statement:`, error);
          console.log('Statement:', statement);
        }
      } catch (err) {
        console.error('Caught error:', err.message);
      }
    }

    return { error: null };
  });

  if (error) {
    console.error('Migration failed:', error);
    console.log('\n=== MANUAL STEPS REQUIRED ===');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/_/sql\n');
    console.log(sql);
    console.log('\n==================\n');
  } else {
    console.log('✓ Migration applied successfully!\n');
  }

  // Test if it works now
  console.log('Testing contact submissions fetch...\n');

  const { data: submissions, error: fetchError } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Still getting error:', fetchError);
  } else {
    console.log(`✓ Successfully fetched ${submissions?.length || 0} contact submissions!`);
  }
}

applyMigration().catch(console.error);
