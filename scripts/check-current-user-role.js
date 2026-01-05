const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUserRole() {
  console.log('=== Checking User Roles ===\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Get all users and their roles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('All users:\n');

  const admins = [];
  profiles.forEach((profile, idx) => {
    const roleLabel = profile.role === 'admin' ? '👑 ADMIN' : profile.role;
    console.log(`${idx + 1}. ${profile.email || 'No email'}`);
    console.log(`   Name: ${profile.name || 'Not set'}`);
    console.log(`   Role: ${roleLabel}`);
    console.log(`   ID: ${profile.id}`);
    console.log('');

    if (profile.role === 'admin') {
      admins.push(profile);
    }
  });

  console.log(`\nTotal admins: ${admins.length}`);

  if (admins.length === 0) {
    console.log('\n⚠️  WARNING: No admin users found!');
    console.log('You need to set at least one user as admin to access the admin panel.\n');
    console.log('To set a user as admin, use the set-admin-role.js script.');
  } else {
    console.log('\nAdmin users:');
    admins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.name || 'No name'})`);
    });
  }
}

checkUserRole().catch(console.error);
