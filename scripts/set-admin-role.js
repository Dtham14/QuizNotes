// Script to set a user as admin
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const targetEmail = 'decodewithdaniel@gmail.com'

async function setAdminRole() {
  console.log(`Checking user: ${targetEmail}`)

  // First, find the user
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('email', targetEmail)
    .single()

  if (fetchError || !profile) {
    console.error('User not found:', fetchError)
    process.exit(1)
  }

  console.log('Current user data:')
  console.log('- ID:', profile.id)
  console.log('- Email:', profile.email)
  console.log('- Current role:', profile.role)

  if (profile.role === 'admin') {
    console.log('\n✅ User is already an admin!')
    return
  }

  // Update to admin
  console.log('\nUpdating role to admin...')
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', profile.id)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating role:', updateError)
    process.exit(1)
  }

  console.log('\n✅ Successfully updated to admin!')
  console.log('New role:', updated.role)
  console.log('\nPlease log out and log back in to see the changes.')
}

setAdminRole()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
