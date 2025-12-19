import type { EarTrainingQuizQuestion } from '@/lib/types/earTraining';
export type { EarTrainingQuizQuestion } from '@/lib/types/earTraining';

// Pre-built ear training questions for anonymous quiz
export const earTrainingQuestions: EarTrainingQuizQuestion[] = [
  // Note identification questions (5)
  {
    question: 'What note is being played?',
    options: ['C', 'D', 'E', 'F'],
    correctAnswer: 0,
    earTraining: {
      subtype: 'note',
      audioData: { notes: ['C4'] },
    },
  },
  {
    question: 'What note is being played?',
    options: ['E', 'F', 'G', 'A'],
    correctAnswer: 2,
    earTraining: {
      subtype: 'note',
      audioData: { notes: ['G4'] },
    },
  },
  {
    question: 'What note is being played?',
    options: ['D', 'E', 'F', 'G'],
    correctAnswer: 1,
    earTraining: {
      subtype: 'note',
      audioData: { notes: ['E4'] },
    },
  },
  {
    question: 'What note is being played?',
    options: ['F', 'G', 'A', 'B'],
    correctAnswer: 2,
    earTraining: {
      subtype: 'note',
      audioData: { notes: ['A4'] },
    },
  },
  {
    question: 'What note is being played?',
    options: ['C', 'D', 'E', 'B'],
    correctAnswer: 3,
    earTraining: {
      subtype: 'note',
      audioData: { notes: ['B4'] },
    },
  },

  // Chord identification questions (5)
  {
    question: 'What type of chord is being played?',
    options: ['Major', 'Minor', 'Diminished', 'Augmented'],
    correctAnswer: 0,
    earTraining: {
      subtype: 'chord',
      audioData: { notes: ['C4', 'E4', 'G4'] }, // C Major
    },
  },
  {
    question: 'What type of chord is being played?',
    options: ['Major', 'Minor', 'Diminished', 'Augmented'],
    correctAnswer: 1,
    earTraining: {
      subtype: 'chord',
      audioData: { notes: ['A4', 'C5', 'E5'] }, // A Minor
    },
  },
  {
    question: 'What type of chord is being played?',
    options: ['Major', 'Minor', 'Diminished', 'Augmented'],
    correctAnswer: 2,
    earTraining: {
      subtype: 'chord',
      audioData: { notes: ['B4', 'D5', 'F5'] }, // B Diminished
    },
  },
  {
    question: 'What type of chord is being played?',
    options: ['Major', 'Minor', 'Diminished', 'Augmented'],
    correctAnswer: 3,
    earTraining: {
      subtype: 'chord',
      audioData: { notes: ['C4', 'E4', 'G#4'] }, // C Augmented
    },
  },
  {
    question: 'What type of chord is being played?',
    options: ['Major', 'Minor', 'Diminished', 'Augmented'],
    correctAnswer: 0,
    earTraining: {
      subtype: 'chord',
      audioData: { notes: ['G4', 'B4', 'D5'] }, // G Major
    },
  },

  // Interval identification questions (5)
  {
    question: 'What interval is being played?',
    options: ['Major 2nd', 'Major 3rd', 'Perfect 4th', 'Perfect 5th'],
    correctAnswer: 1,
    earTraining: {
      subtype: 'interval',
      audioData: { notes: ['C4', 'E4'] }, // Major 3rd
    },
  },
  {
    question: 'What interval is being played?',
    options: ['Minor 3rd', 'Perfect 4th', 'Perfect 5th', 'Octave'],
    correctAnswer: 2,
    earTraining: {
      subtype: 'interval',
      audioData: { notes: ['C4', 'G4'] }, // Perfect 5th
    },
  },
  {
    question: 'What interval is being played?',
    options: ['Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd'],
    correctAnswer: 2,
    earTraining: {
      subtype: 'interval',
      audioData: { notes: ['E4', 'G4'] }, // Minor 3rd
    },
  },
  {
    question: 'What interval is being played?',
    options: ['Perfect 4th', 'Tritone', 'Perfect 5th', 'Minor 6th'],
    correctAnswer: 0,
    earTraining: {
      subtype: 'interval',
      audioData: { notes: ['G4', 'C5'] }, // Perfect 4th
    },
  },
  {
    question: 'What interval is being played?',
    options: ['Minor 6th', 'Major 6th', 'Minor 7th', 'Octave'],
    correctAnswer: 3,
    earTraining: {
      subtype: 'interval',
      audioData: { notes: ['C4', 'C5'] }, // Octave
    },
  },
];

// Get shuffled subset of ear training questions
export function getEarTrainingQuestions(count: number = 10): EarTrainingQuizQuestion[] {
  const shuffled = [...earTrainingQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
