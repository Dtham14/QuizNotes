// Check if a quiz exists for today
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTodayQuiz() {
  const today = new Date().toISOString().split('T')[0]

  console.log(`Checking for quiz on ${today}...`)

  const { data: quiz, error } = await supabase
    .from('daily_quizzes')
    .select('*')
    .eq('quiz_date', today)
    .single()

  if (error || !quiz) {
    console.log('❌ No quiz found for today')
    console.log('✅ Auto-generation will create one when you visit /quiz/daily')
  } else {
    console.log('✅ Quiz exists for today!')
    console.log('Format:', quiz.quiz_format)
    console.log('Created at:', quiz.created_at)
  }
}

checkTodayQuiz()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
