// Script to create a demo premium student account for QuizNotes
// Run with: node scripts/create-premium-student.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'MISSING');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createPremiumStudent() {
  const account = {
    email: 'demostudentpremium@quiznotes.test',
    password: 'DemoStudent123!',
    name: 'Demo Premium Student',
    role: 'student'
  };

  console.log('\n=== Creating Demo Premium Student Account ===\n');

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', account.email)
      .single();

    let userId;

    if (existingUser) {
      console.log(`[INFO] User already exists, updating to premium...`);
      userId = existingUser.id;
    } else {
      // Create user with admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          name: account.name,
          role: account.role
        }
      });

      if (error) {
        if (error.message.includes('already been registered')) {
          console.log(`[INFO] Auth user exists, fetching ID...`);
          // Get user ID from auth
          const { data: users } = await supabase.auth.admin.listUsers();
          const authUser = users?.users?.find(u => u.email === account.email);
          if (authUser) {
            userId = authUser.id;
          } else {
            console.error('[ERROR] Could not find user ID');
            process.exit(1);
          }
        } else {
          console.error(`[ERROR] Failed to create user:`, error.message);
          process.exit(1);
        }
      } else {
        userId = data.user.id;
        console.log(`[OK] Created user: ${account.email}`);
      }
    }

    // Update the profile to be premium
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        role: 'student',
        name: account.name
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[ERROR] Failed to update profile to premium:', updateError.message);
      process.exit(1);
    }

    console.log(`[OK] Set subscription status to ACTIVE (premium)`);

    console.log('\n=== Demo Premium Student Account Credentials ===\n');
    console.log('PREMIUM STUDENT ACCOUNT:');
    console.log('  Email:    demostudentpremium@quiznotes.test');
    console.log('  Password: DemoStudent123!');
    console.log('  Status:   Premium (Active)');
    console.log('');

  } catch (err) {
    console.error(`[ERROR] Exception:`, err.message);
    process.exit(1);
  }
}

createPremiumStudent();
