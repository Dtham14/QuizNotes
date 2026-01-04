// Script to populate quiz templates for Connections and Wordle
// Run with: node scripts/populate-quiz-templates.js

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

// Connections templates
const connectionsTemplates = [
  {
    difficulty: 'beginner',
    groups: [
      {
        name: 'White Keys in C Major Scale',
        items: ['C', 'D', 'E', 'F'],
        difficulty: 1,
      },
      {
        name: 'Remaining White Keys',
        items: ['G', 'A', 'B', 'C♯/D♭'],
        difficulty: 2,
      },
      {
        name: 'Black Keys (Sharps)',
        items: ['C♯', 'D♯', 'F♯', 'G♯'],
        difficulty: 3,
      },
      {
        name: 'Black Keys (Flats)',
        items: ['D♭', 'E♭', 'G♭', 'A♭'],
        difficulty: 4,
      },
    ],
  },
  {
    difficulty: 'intermediate',
    groups: [
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
        items: ['Perfect Unison', 'Perfect 4th', 'Perfect 5th', 'Perfect Octave'],
        difficulty: 3,
      },
      {
        name: 'Major Intervals',
        items: ['Major 2nd', 'Major 3rd', 'Major 6th', 'Major 7th'],
        difficulty: 4,
      },
    ],
  },
  {
    difficulty: 'intermediate',
    groups: [
      {
        name: 'Time Signature Top Numbers',
        items: ['2 (in 2/4)', '3 (in 3/4)', '4 (in 4/4)', '6 (in 6/8)'],
        difficulty: 1,
      },
      {
        name: 'Dynamic Markings (Soft to Loud)',
        items: ['pianissimo (pp)', 'piano (p)', 'forte (f)', 'fortissimo (ff)'],
        difficulty: 2,
      },
      {
        name: 'Tempo Markings (Slow)',
        items: ['Largo', 'Adagio', 'Andante', 'Moderato'],
        difficulty: 3,
      },
      {
        name: 'Tempo Markings (Fast)',
        items: ['Allegro', 'Vivace', 'Presto', 'Prestissimo'],
        difficulty: 4,
      },
    ],
  },
  {
    difficulty: 'advanced',
    groups: [
      {
        name: 'Diminished Intervals',
        items: ['dim 2nd', 'dim 3rd', 'dim 5th', 'dim 7th'],
        difficulty: 1,
      },
      {
        name: 'Augmented Intervals',
        items: ['Aug 2nd', 'Aug 4th', 'Aug 5th', 'Aug 6th'],
        difficulty: 2,
      },
      {
        name: '7th Chord Types',
        items: ['Maj7', 'Min7', 'Dom7', 'HalfDim7'],
        difficulty: 3,
      },
      {
        name: 'Modal Scales',
        items: ['Dorian', 'Phrygian', 'Lydian', 'Mixolydian'],
        difficulty: 4,
      },
    ],
  },
  {
    difficulty: 'intermediate',
    groups: [
      {
        name: 'Sharps Key Signatures (1-2 sharps)',
        items: ['G Major', 'D Major', 'E minor', 'B minor'],
        difficulty: 1,
      },
      {
        name: 'Flats Key Signatures (1-2 flats)',
        items: ['F Major', 'B♭ Major', 'D minor', 'G minor'],
        difficulty: 2,
      },
      {
        name: 'Note Durations (Whole to Quarter)',
        items: ['Whole Note', 'Half Note', 'Quarter Note', 'Eighth Note'],
        difficulty: 3,
      },
      {
        name: 'Rest Symbols',
        items: ['Whole Rest', 'Half Rest', 'Quarter Rest', 'Eighth Rest'],
        difficulty: 4,
      },
    ],
  },
]

// Wordle templates
const wordleTemplates = [
  {
    difficulty: 'beginner',
    answer: 'Cmaj',
    answerType: 'chord',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: "It's a major chord" },
      { attemptNumber: 5, hint: 'Root note is C' },
    ],
  },
  {
    difficulty: 'beginner',
    answer: 'Amin',
    answerType: 'chord',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: "It's a minor chord" },
      { attemptNumber: 5, hint: 'Natural minor, no accidentals' },
    ],
  },
  {
    difficulty: 'intermediate',
    answer: 'Cmaj7',
    answerType: 'chord',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: "It's a 7th chord" },
      { attemptNumber: 5, hint: 'Contains C, E, G, and B notes' },
    ],
  },
  {
    difficulty: 'intermediate',
    answer: 'Dmin7',
    answerType: 'chord',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: 'Minor 7th chord' },
      { attemptNumber: 5, hint: 'Starts with D' },
    ],
  },
  {
    difficulty: 'advanced',
    answer: 'Gdim7',
    answerType: 'chord',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: 'Diminished 7th chord' },
      { attemptNumber: 5, hint: 'Root is G' },
    ],
  },
  {
    difficulty: 'beginner',
    answer: 'C Major',
    answerType: 'scale',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: 'A major scale with no sharps or flats' },
      { attemptNumber: 5, hint: 'The most basic major scale' },
    ],
  },
  {
    difficulty: 'intermediate',
    answer: 'G Major',
    answerType: 'scale',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: 'Major scale with 1 sharp' },
      { attemptNumber: 5, hint: 'Contains F♯' },
    ],
  },
  {
    difficulty: 'intermediate',
    answer: 'D Dorian',
    answerType: 'scale',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: "It's a mode" },
      { attemptNumber: 5, hint: 'Second mode of C Major' },
    ],
  },
  {
    difficulty: 'beginner',
    answer: 'P5',
    answerType: 'interval',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: 'A perfect interval' },
      { attemptNumber: 5, hint: '7 semitones apart' },
    ],
  },
  {
    difficulty: 'intermediate',
    answer: 'M3',
    answerType: 'interval',
    maxAttempts: 6,
    hints: [
      { attemptNumber: 3, hint: 'A major interval' },
      { attemptNumber: 5, hint: '4 semitones apart' },
    ],
  },
]

async function populateTemplates() {
  console.log('Populating quiz templates...\n')

  let connectionsCount = 0
  let wordleCount = 0

  // Insert Connections templates
  console.log('Adding Connections templates...')
  for (const template of connectionsTemplates) {
    const { error } = await supabase.from('daily_quiz_templates').insert({
      template_type: 'connections',
      difficulty: template.difficulty,
      template_data: template,
    })

    if (error) {
      console.error('Error inserting Connections template:', error)
    } else {
      connectionsCount++
      console.log(`  ✓ Added ${template.difficulty} Connections template`)
    }
  }

  // Insert Wordle templates
  console.log('\nAdding Wordle templates...')
  for (const template of wordleTemplates) {
    const { error } = await supabase.from('daily_quiz_templates').insert({
      template_type: 'wordle',
      difficulty: template.difficulty,
      template_data: template,
    })

    if (error) {
      console.error('Error inserting Wordle template:', error)
    } else {
      wordleCount++
      console.log(`  ✓ Added ${template.difficulty} ${template.answerType} Wordle template`)
    }
  }

  console.log('\n✅ Templates populated successfully!')
  console.log(`   Connections: ${connectionsCount} templates`)
  console.log(`   Wordle: ${wordleCount} templates`)
  console.log(`   Total: ${connectionsCount + wordleCount} templates`)

  // Show template counts by type
  const { data: stats } = await supabase
    .from('daily_quiz_templates')
    .select('template_type, difficulty')

  if (stats) {
    console.log('\n📊 Template Statistics:')
    const byType = stats.reduce((acc, t) => {
      acc[t.template_type] = (acc[t.template_type] || 0) + 1
      return acc
    }, {})
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} templates`)
    })
  }
}

populateTemplates()
  .then(() => {
    console.log('\n🎉 All templates are ready!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to populate templates:', error)
    process.exit(1)
  })
