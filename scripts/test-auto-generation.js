// Test script to verify auto-generation works
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAutoGeneration() {
  const today = new Date().toISOString().split('T')[0]

  console.log(`Testing auto-generation for ${today}...`)

  // Delete today's quiz if it exists
  console.log('Deleting existing quiz for today...')
  const { error: deleteError } = await supabase
    .from('daily_quizzes')
    .delete()
    .eq('quiz_date', today)

  if (deleteError) {
    console.log('No existing quiz to delete (or error deleting):', deleteError.message)
  } else {
    console.log('✓ Deleted existing quiz')
  }

  // Verify it's gone
  const { data: check } = await supabase
    .from('daily_quizzes')
    .select('*')
    .eq('quiz_date', today)
    .single()

  if (!check) {
    console.log('✓ Confirmed: No quiz exists for today')
  } else {
    console.log('⚠️  Quiz still exists!')
  }

  console.log('\nNow visit http://localhost:3000/quiz/daily')
  console.log('The API should auto-generate a quiz!')
  console.log('\nAfter visiting, run this script again to verify a quiz was created.')
}

testAutoGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
