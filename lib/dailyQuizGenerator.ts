import type { DailyQuiz } from '@/lib/types/database'

type DailyQuizInsert = Omit<DailyQuiz, 'id' | 'created_at'>

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

const connectionsGroups = [
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

const wordleData = {
  answer: 'Cmaj7',
  answerType: 'chord',
  maxAttempts: 6,
  hints: [
    { attemptNumber: 3, hint: "It's a 7th chord" },
    { attemptNumber: 5, hint: 'Contains C, E, G, and B notes' },
  ],
}

/**
 * Generates quiz data for a specific format
 * @param date - The date for the quiz (YYYY-MM-DD format)
 * @param format - The quiz format: 'standard', 'connections', or 'wordle'
 * @returns Quiz data ready to be inserted into the database
 */
export function generateDailyQuizData(
  date: string,
  format: 'standard' | 'connections' | 'wordle' = 'standard'
): DailyQuizInsert {
  if (format === 'standard') {
    return {
      quiz_date: date,
      quiz_format: 'standard',
      quiz_type: 'noteIdentification',
      difficulty: 'intermediate',
      questions: sampleStandardQuiz as any,
      metadata: null,
    }
  } else if (format === 'connections') {
    return {
      quiz_date: date,
      quiz_format: 'connections',
      quiz_type: null,
      difficulty: 'intermediate',
      questions: [] as any,
      metadata: { groups: connectionsGroups } as any,
    }
  } else if (format === 'wordle') {
    return {
      quiz_date: date,
      quiz_format: 'wordle',
      quiz_type: null,
      difficulty: 'intermediate',
      questions: [] as any,
      metadata: wordleData as any,
    }
  }

  // Default to standard format
  return {
    quiz_date: date,
    quiz_format: 'standard',
    quiz_type: 'noteIdentification',
    difficulty: 'intermediate',
    questions: sampleStandardQuiz as any,
    metadata: null,
  }
}

/**
 * Determines which format to use for a given date
 * Rotates between standard, connections, and wordle
 * @param date - The date string (YYYY-MM-DD format)
 * @returns The format to use for that date
 */
export function getQuizFormatForDate(date: string): 'standard' | 'connections' | 'wordle' {
  // Parse the date and use the day of month to determine format
  const dayOfMonth = parseInt(date.split('-')[2], 10)

  // Rotate: standard on days 1-10, 11-20, 21-31
  // connections on days ending in 1-3
  // wordle on days ending in 4-6
  // standard on days ending in 7-0
  const dayMod = dayOfMonth % 10

  if (dayMod >= 1 && dayMod <= 3) {
    return 'connections'
  } else if (dayMod >= 4 && dayMod <= 6) {
    return 'wordle'
  } else {
    return 'standard'
  }
}
