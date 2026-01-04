// Script to create a test contact submission
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestSubmission() {
  console.log('Creating test contact submission...')

  const { data, error } = await supabase
    .from('contact_submissions')
    .insert({
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Feature Request',
      message: 'This is a test contact submission to verify the admin panel is working correctly. The contact submissions tab should display this message.',
      user_id: null, // Anonymous submission
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating test submission:', error)
    process.exit(1)
  }

  console.log('✅ Test contact submission created successfully!')
  console.log('Submission ID:', data.id)
  console.log('Name:', data.name)
  console.log('Email:', data.email)
  console.log('Subject:', data.subject)
  console.log('\nYou can now view this in the admin panel at /admin')
  console.log('Click on the "Contact Submissions" tab to see it.')
}

createTestSubmission()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to create test submission:', error)
    process.exit(1)
  })
