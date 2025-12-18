import { Note } from '@/components/MusicNotation';

export type QuizQuestion = {
  id: string;
  question: string;
  notes: Note[];
  options: string[];
  correctAnswer: number;
  explanation?: string;
  clef?: 'treble' | 'bass';
};

export type QuizType = 'intervals' | 'chords' | 'scales' | 'noteIdentification' | 'mixed';

export const quizzes: Record<QuizType, QuizQuestion[]> = {
  intervals: [
    {
      id: 'int1',
      question: 'What interval is shown?',
      notes: [
        { keys: ['c/4'], duration: 'w' },
        { keys: ['e/4'], duration: 'w' },
      ],
      options: ['Minor 3rd', 'Major 3rd', 'Perfect 4th', 'Perfect 5th'],
      correctAnswer: 1,
      explanation: 'C to E is a Major 3rd (4 semitones)',
    },
    {
      id: 'int2',
      question: 'What interval is shown?',
      notes: [
        { keys: ['c/4'], duration: 'w' },
        { keys: ['g/4'], duration: 'w' },
      ],
      options: ['Perfect 4th', 'Perfect 5th', 'Major 6th', 'Octave'],
      correctAnswer: 1,
      explanation: 'C to G is a Perfect 5th (7 semitones)',
    },
    {
      id: 'int3',
      question: 'What interval is shown?',
      notes: [
        { keys: ['d/4'], duration: 'w' },
        { keys: ['f/4'], duration: 'w' },
      ],
      options: ['Major 2nd', 'Minor 3rd', 'Major 3rd', 'Perfect 4th'],
      correctAnswer: 1,
      explanation: 'D to F is a Minor 3rd (3 semitones)',
    },
    {
      id: 'int4',
      question: 'What interval is shown?',
      notes: [
        { keys: ['e/4'], duration: 'w' },
        { keys: ['c/5'], duration: 'w' },
      ],
      options: ['Perfect 5th', 'Major 6th', 'Minor 6th', 'Minor 7th'],
      correctAnswer: 1,
      explanation: 'E to C is a Major 6th (9 semitones)',
    },
    {
      id: 'int5',
      question: 'What interval is shown?',
      notes: [
        { keys: ['f/4'], duration: 'w' },
        { keys: ['b/4'], duration: 'w' },
      ],
      options: ['Perfect 4th', 'Augmented 4th', 'Perfect 5th', 'Diminished 5th'],
      correctAnswer: 1,
      explanation: 'F to B is an Augmented 4th/Tritone (6 semitones)',
    },
  ],
  chords: [
    {
      id: 'chord1',
      question: 'What type of chord is this?',
      notes: [
        { keys: ['c/4', 'e/4', 'g/4'], duration: 'w' },
      ],
      options: ['C minor', 'C major', 'C diminished', 'C augmented'],
      correctAnswer: 1,
      explanation: 'C-E-G forms a C Major chord',
    },
    {
      id: 'chord2',
      question: 'What type of chord is this?',
      notes: [
        { keys: ['d/4', 'f/4', 'a/4'], duration: 'w' },
      ],
      options: ['D major', 'D minor', 'D diminished', 'D suspended'],
      correctAnswer: 1,
      explanation: 'D-F-A forms a D minor chord',
    },
    {
      id: 'chord3',
      question: 'What type of chord is this?',
      notes: [
        { keys: ['g/4', 'b/4', 'd/5'], duration: 'w' },
      ],
      options: ['G minor', 'G major', 'G diminished', 'G augmented'],
      correctAnswer: 1,
      explanation: 'G-B-D forms a G Major chord',
    },
    {
      id: 'chord4',
      question: 'What type of chord is this?',
      notes: [
        { keys: ['a/4', 'c/5', 'e/5'], duration: 'w' },
      ],
      options: ['A major', 'A minor', 'A diminished', 'A suspended'],
      correctAnswer: 1,
      explanation: 'A-C-E forms an A minor chord',
    },
    {
      id: 'chord5',
      question: 'What type of chord is this?',
      notes: [
        { keys: ['e/4', 'g/4', 'b/4'], duration: 'w' },
      ],
      options: ['E major', 'E minor', 'E diminished', 'E augmented'],
      correctAnswer: 1,
      explanation: 'E-G-B forms an E minor chord',
    },
  ],
  scales: [
    {
      id: 'scale1',
      question: 'What scale degree is highlighted (the second note)?',
      notes: [
        { keys: ['c/4'], duration: 'q' },
        { keys: ['d/4'], duration: 'q' },
        { keys: ['e/4'], duration: 'q' },
        { keys: ['f/4'], duration: 'q' },
      ],
      options: ['Tonic', 'Supertonic', 'Mediant', 'Subdominant'],
      correctAnswer: 1,
      explanation: 'The second degree of the scale is called the Supertonic',
    },
    {
      id: 'scale2',
      question: 'In the C major scale shown, what is the name of the 5th degree (G)?',
      notes: [
        { keys: ['c/4'], duration: 'q' },
        { keys: ['d/4'], duration: 'q' },
        { keys: ['e/4'], duration: 'q' },
        { keys: ['g/4'], duration: 'h' },
      ],
      options: ['Subdominant', 'Dominant', 'Mediant', 'Leading Tone'],
      correctAnswer: 1,
      explanation: 'The 5th degree of the scale is called the Dominant',
    },
    {
      id: 'scale3',
      question: 'What type of scale is this?',
      notes: [
        { keys: ['c/4'], duration: 'q' },
        { keys: ['d/4'], duration: 'q' },
        { keys: ['eb/4'], duration: 'q', accidental: 'b' },
        { keys: ['f/4'], duration: 'q' },
      ],
      options: ['C Major', 'C Natural Minor', 'C Harmonic Minor', 'C Dorian'],
      correctAnswer: 1,
      explanation: 'The presence of Eb indicates a minor scale',
    },
    {
      id: 'scale4',
      question: 'What is the 4th degree of the scale called?',
      notes: [
        { keys: ['c/4'], duration: 'q' },
        { keys: ['d/4'], duration: 'q' },
        { keys: ['e/4'], duration: 'q' },
        { keys: ['f/4'], duration: 'q' },
      ],
      options: ['Mediant', 'Subdominant', 'Dominant', 'Submediant'],
      correctAnswer: 1,
      explanation: 'The 4th degree of the scale is called the Subdominant',
    },
    {
      id: 'scale5',
      question: 'What is the 3rd degree of the scale called?',
      notes: [
        { keys: ['c/4'], duration: 'q' },
        { keys: ['d/4'], duration: 'q' },
        { keys: ['e/4'], duration: 'h' },
      ],
      options: ['Supertonic', 'Mediant', 'Subdominant', 'Dominant'],
      correctAnswer: 1,
      explanation: 'The 3rd degree of the scale is called the Mediant',
    },
  ],
  noteIdentification: [
    {
      id: 'note1',
      question: 'What note is shown on the treble clef?',
      notes: [
        { keys: ['e/4'], duration: 'w' },
      ],
      options: ['D', 'E', 'F', 'G'],
      correctAnswer: 1,
      explanation: 'This note on the first line of the treble clef is E',
      clef: 'treble',
    },
    {
      id: 'note2',
      question: 'What note is shown on the treble clef?',
      notes: [
        { keys: ['g/4'], duration: 'w' },
      ],
      options: ['F', 'G', 'A', 'B'],
      correctAnswer: 1,
      explanation: 'This note on the second line of the treble clef is G',
      clef: 'treble',
    },
    {
      id: 'note3',
      question: 'What note is shown on the treble clef?',
      notes: [
        { keys: ['c/5'], duration: 'w' },
      ],
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 2,
      explanation: 'This note in the third space of the treble clef is C',
      clef: 'treble',
    },
    {
      id: 'note4',
      question: 'What note is shown on the bass clef?',
      notes: [
        { keys: ['g/3'], duration: 'w' },
      ],
      options: ['F', 'G', 'A', 'B'],
      correctAnswer: 1,
      explanation: 'This note on the first line of the bass clef is G',
      clef: 'bass',
    },
    {
      id: 'note5',
      question: 'What note is shown on the bass clef?',
      notes: [
        { keys: ['a/3'], duration: 'w' },
      ],
      options: ['G', 'A', 'B', 'C'],
      correctAnswer: 1,
      explanation: 'This note in the second space of the bass clef is A',
      clef: 'bass',
    },
  ],
  mixed: [],
};

export function getQuizQuestions(type: QuizType): QuizQuestion[] {
  if (type === 'mixed') {
    const allQuestions = [
      ...quizzes.intervals,
      ...quizzes.chords,
      ...quizzes.scales,
      ...quizzes.noteIdentification,
    ];
    return allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
  }
  return quizzes[type] || [];
}
