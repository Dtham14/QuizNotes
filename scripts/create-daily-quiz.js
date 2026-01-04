// Script to create a daily quiz for testing
// Run with: node scripts/create-daily-quiz.js [format]
// Formats: standard, connections, wordle (default: standard)

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample standard quiz questions
const sampleStandardQuiz = [
  {
    id: '1',
    type: 'noteIdentification',
    question: 'Identify this note on the treble clef:',
    options: ['C', 'D', 'E', 'F'],
    correctAnswer: 2, // E
    clef: 'treble',
    notes: ['e/4'],
  },
  {
    id: '2',
    type: 'noteIdentification',
    question: 'Identify this note on the treble clef:',
    options: ['F', 'G', 'A', 'B'],
    correctAnswer: 1, // G
    clef: 'treble',
    notes: ['g/4'],
  },
  {
    id: '3',
    type: 'intervalIdentification',
    question: 'What interval is this?',
    options: ['Major 2nd', 'Major 3rd', 'Perfect 4th', 'Perfect 5th'],
    correctAnswer: 2, // Perfect 4th
    clef: 'treble',
    notes: ['c/4', 'f/4'],
  },
  {
    id: '4',
    type: 'chordIdentification',
    question: 'What type of chord is this?',
    options: ['Major', 'Minor', 'Diminished', 'Augmented'],
    correctAnswer: 0, // Major
    clef: 'treble',
    notes: ['c/4', 'e/4', 'g/4'],
  },
  {
    id: '5',
    type: 'keySignature',
    question: 'What key signature is this?',
    options: ['C Major', 'G Major', 'D Major', 'A Major'],
    correctAnswer: 1, // G Major (1 sharp)
    clef: 'treble',
    keySignature: 'G',
  },
  {
    id: '6',
    type: 'noteIdentification',
    question: 'Identify this note on the bass clef:',
    options: ['C', 'D', 'E', 'F'],
    correctAnswer: 0, // C
    clef: 'bass',
    notes: ['c/3'],
  },
  {
    id: '7',
    type: 'intervalIdentification',
    question: 'What interval is this?',
    options: ['Major 3rd', 'Minor 3rd', 'Perfect 4th', 'Major 6th'],
    correctAnswer: 0, // Major 3rd
    clef: 'treble',
    notes: ['c/4', 'e/4'],
  },
  {
    id: '8',
    type: 'chordIdentification',
    question: 'What type of chord is this?',
    options: ['Major', 'Minor', 'Diminished', 'Augmented'],
    correctAnswer: 1, // Minor
    clef: 'treble',
    notes: ['a/4', 'c/5', 'e/5'],
  },
  {
    id: '9',
    type: 'noteIdentification',
    question: 'Identify this note on the treble clef:',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 1, // B
    clef: 'treble',
    notes: ['b/4'],
  },
  {
    id: '10',
    type: 'intervalIdentification',
    question: 'What interval is this?',
    options: ['Perfect 4th', 'Perfect 5th', 'Major 6th', 'Perfect 8th'],
    correctAnswer: 1, // Perfect 5th
    clef: 'treble',
    notes: ['c/4', 'g/4'],
  },
]

async function createDailyQuiz(date, format = 'standard') {
  console.log(`Creating daily quiz for ${date} with format: ${format}`)

  let quizData = {}

  if (format === 'standard') {
    quizData = {
      quiz_date: date,
      quiz_format: 'standard',
      quiz_type: 'noteIdentification',
      difficulty: 'intermediate',
      questions: sampleStandardQuiz,
      metadata: null,
    }
  } else if (format === 'connections') {
    const groups = [
      {
        name: 'Major Triads',
        items: ['C Major', 'F Major', 'G Major', 'D Major'],
        difficulty: 1,
      },
      {
        name: 'Minor Triads',
        items: ['A minor', 'D minor', 'E minor', 'B minor'],
        difficulty: 2,
      },
      {
        name: 'Perfect Intervals',
        items: ['Perfect 1st (P1)', 'Perfect 4th (P4)', 'Perfect 5th (P5)', 'Perfect 8th (P8)'],
        difficulty: 3,
      },
      {
        name: 'Major Intervals',
        items: ['Major 2nd (M2)', 'Major 3rd (M3)', 'Major 6th (M6)', 'Major 7th (M7)'],
        difficulty: 4,
      },
    ]

    quizData = {
      quiz_date: date,
      quiz_format: 'connections',
      quiz_type: null,
      difficulty: 'intermediate',
      questions: [],
      metadata: { groups },
    }
  } else if (format === 'wordle') {
    const wordleData = {
      answer: 'Cmaj7',
      answerType: 'chord',
      maxAttempts: 6,
      hints: [
        { attemptNumber: 3, hint: "It's a 7th chord" },
        { attemptNumber: 5, hint: 'Contains C, E, G, and B notes' },
      ],
    }

    quizData = {
      quiz_date: date,
      quiz_format: 'wordle',
      quiz_type: null,
      difficulty: 'intermediate',
      questions: [],
      metadata: wordleData,
    }
  }

  // Check if quiz already exists for this date
  const { data: existing } = await supabase
    .from('daily_quizzes')
    .select('id')
    .eq('quiz_date', date)
    .single()

  if (existing) {
    console.log(`Quiz already exists for ${date}, deleting it first...`)
    await supabase.from('daily_quizzes').delete().eq('quiz_date', date)
  }

  // Insert the quiz
  const { data, error } = await supabase.from('daily_quizzes').insert(quizData).select().single()

  if (error) {
    console.error('Error creating daily quiz:', error)
    process.exit(1)
  }

  console.log('\n✅ Daily quiz created successfully!')
  console.log('Quiz ID:', data.id)
  console.log('Format:', data.quiz_format)
  console.log('Date:', data.quiz_date)

  return data
}

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0]

// Get format from command line argument (default: standard)
const format = process.argv[2] || 'standard'

if (!['standard', 'connections', 'wordle'].includes(format)) {
  console.error('Invalid format. Use: standard, connections, or wordle')
  process.exit(1)
}

createDailyQuiz(today, format)
  .then(() => {
    console.log('\n🎉 Daily quiz is ready!')
    console.log('Visit http://localhost:3000 to see the widget')
    console.log('Or visit http://localhost:3000/quiz/daily to take it directly')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to create daily quiz:', error)
    process.exit(1)
  })
