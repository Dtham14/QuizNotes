// Rhythm patterns for different difficulty levels
// Each number represents the beat position (1 = quarter note timing)

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface RhythmPattern {
  name: string
  beats: number[] // Beat positions where notes should be hit
  bpm: number
  timeSignature: [number, number] // e.g., [4, 4] for 4/4
}

// Easy patterns - quarter notes only, 60 BPM
export const EASY_PATTERNS: RhythmPattern[] = [
  {
    name: 'Simple Quarters',
    beats: [0, 1, 2, 3, 4, 5, 6, 7],
    bpm: 60,
    timeSignature: [4, 4],
  },
  {
    name: 'Half Time',
    beats: [0, 2, 4, 6],
    bpm: 60,
    timeSignature: [4, 4],
  },
  {
    name: 'Waltz Feel',
    beats: [0, 1, 2, 3, 4, 5],
    bpm: 70,
    timeSignature: [3, 4],
  },
]

// Medium patterns - eighth notes, 90 BPM
export const MEDIUM_PATTERNS: RhythmPattern[] = [
  {
    name: 'Eighth Notes',
    beats: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5],
    bpm: 80,
    timeSignature: [4, 4],
  },
  {
    name: 'Syncopated',
    beats: [0, 0.5, 1.5, 2, 3, 3.5, 4.5, 5, 6, 6.5, 7.5],
    bpm: 85,
    timeSignature: [4, 4],
  },
  {
    name: 'Dotted Quarter',
    beats: [0, 1.5, 3, 4, 5.5, 7],
    bpm: 90,
    timeSignature: [4, 4],
  },
]

// Hard patterns - mixed rhythms, 120 BPM
export const HARD_PATTERNS: RhythmPattern[] = [
  {
    name: 'Sixteenth Rush',
    beats: [0, 0.25, 0.5, 0.75, 1, 2, 2.25, 2.5, 2.75, 3, 4, 4.5, 5, 5.25, 5.5, 5.75, 6, 7],
    bpm: 100,
    timeSignature: [4, 4],
  },
  {
    name: 'Complex Syncopation',
    beats: [0, 0.5, 1.25, 2, 2.75, 3.5, 4, 4.5, 5.25, 6, 6.75, 7.5],
    bpm: 110,
    timeSignature: [4, 4],
  },
  {
    name: 'Polyrhythm',
    beats: [0, 0.67, 1.33, 2, 2.5, 3, 3.67, 4.33, 5, 5.5, 6, 6.67, 7.33],
    bpm: 120,
    timeSignature: [4, 4],
  },
]

export function getPatternsByDifficulty(difficulty: Difficulty): RhythmPattern[] {
  switch (difficulty) {
    case 'easy':
      return EASY_PATTERNS
    case 'medium':
      return MEDIUM_PATTERNS
    case 'hard':
      return HARD_PATTERNS
  }
}

export function getRandomPattern(difficulty: Difficulty): RhythmPattern {
  const patterns = getPatternsByDifficulty(difficulty)
  return patterns[Math.floor(Math.random() * patterns.length)]
}
