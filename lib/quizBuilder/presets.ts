// Difficulty Presets for Quiz Builder

import type {
  Difficulty,
  QuizType,
  NoteIdentificationSettings,
  KeySignatureSettings,
  IntervalSettings,
  ChordSettings,
  ScaleSettings,
  EarTrainingNoteSettings,
  QuizSettings,
} from './types';

// Default settings factory for each quiz type
export function getDefaultSettings(quizType: QuizType, difficulty: Difficulty = 'beginner'): QuizSettings {
  const preset = DIFFICULTY_PRESETS[quizType]?.[difficulty];
  if (!preset) {
    throw new Error(`No preset found for ${quizType} at ${difficulty} difficulty`);
  }
  return {
    ...preset,
    questionCount: 10,
    answerChoices: 4,
    difficulty,
    timerEnabled: false,
    timeLimitSeconds: 60,
  } as QuizSettings;
}

// Difficulty presets organized by quiz type
export const DIFFICULTY_PRESETS: Record<QuizType, Record<Difficulty, Partial<QuizSettings>>> = {
  // Note Identification
  // Treble clef range: C4 to C6
  // Bass clef range: C2 to C4
  noteIdentification: {
    beginner: {
      quizType: 'noteIdentification',
      clef: 'treble',
      pitchRange: { min: 'C4', max: 'B4' }, // Single octave, treble
      accidentals: 'natural',
    } as Partial<NoteIdentificationSettings>,
    intermediate: {
      quizType: 'noteIdentification',
      clef: 'treble',
      pitchRange: { min: 'C4', max: 'C5' }, // Treble range
      accidentals: 'sharps',
    } as Partial<NoteIdentificationSettings>,
    advanced: {
      quizType: 'noteIdentification',
      clef: 'both',
      pitchRange: { min: 'C3', max: 'C5' }, // Middle range for 'both'
      accidentals: 'all',
    } as Partial<NoteIdentificationSettings>,
  },

  // Key Signature
  keySignature: {
    beginner: {
      quizType: 'keySignature',
      clef: 'treble',
      direction: 'staffToName',
      keyTypes: 'major',
      maxSharps: 2,
      maxFlats: 2,
    } as Partial<KeySignatureSettings>,
    intermediate: {
      quizType: 'keySignature',
      clef: 'treble',
      direction: 'both',
      keyTypes: 'major',
      maxSharps: 4,
      maxFlats: 4,
    } as Partial<KeySignatureSettings>,
    advanced: {
      quizType: 'keySignature',
      clef: 'both',
      direction: 'both',
      keyTypes: 'both',
      maxSharps: 7,
      maxFlats: 7,
    } as Partial<KeySignatureSettings>,
  },

  // Interval Identification (visual)
  intervalIdentification: {
    beginner: {
      quizType: 'intervalIdentification',
      clef: 'treble',
      intervals: ['M2', 'm3', 'M3', 'P5', 'P8'],
      direction: 'ascending',
    } as Partial<IntervalSettings>,
    intermediate: {
      quizType: 'intervalIdentification',
      clef: 'treble',
      intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'],
      direction: 'both',
    } as Partial<IntervalSettings>,
    advanced: {
      quizType: 'intervalIdentification',
      clef: 'both',
      intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
      direction: 'both',
    } as Partial<IntervalSettings>,
  },

  // Chord Identification
  chordIdentification: {
    beginner: {
      quizType: 'chordIdentification',
      clef: 'treble',
      chordTypes: ['major', 'minor'],
      inversions: 'root',
    } as Partial<ChordSettings>,
    intermediate: {
      quizType: 'chordIdentification',
      clef: 'treble',
      chordTypes: ['major', 'minor', 'diminished', 'augmented'],
      inversions: 'all',
    } as Partial<ChordSettings>,
    advanced: {
      quizType: 'chordIdentification',
      clef: 'both',
      chordTypes: ['major', 'minor', 'diminished', 'augmented', 'dom7', 'maj7', 'min7'],
      inversions: 'all',
    } as Partial<ChordSettings>,
  },

  // Scale Identification
  scaleIdentification: {
    beginner: {
      quizType: 'scaleIdentification',
      clef: 'treble',
      scaleTypes: ['major'],
    } as Partial<ScaleSettings>,
    intermediate: {
      quizType: 'scaleIdentification',
      clef: 'treble',
      scaleTypes: ['major', 'natural_minor', 'harmonic_minor'],
    } as Partial<ScaleSettings>,
    advanced: {
      quizType: 'scaleIdentification',
      clef: 'both',
      scaleTypes: ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian', 'phrygian', 'lydian', 'mixolydian'],
    } as Partial<ScaleSettings>,
  },

  // Ear Training - Note Recognition
  earTrainingNote: {
    beginner: {
      quizType: 'earTrainingNote',
      pitchRange: { min: 'C4', max: 'B4' },
      showReference: true,
    } as Partial<EarTrainingNoteSettings>,
    intermediate: {
      quizType: 'earTrainingNote',
      pitchRange: { min: 'C3', max: 'C5' },
      showReference: true,
    } as Partial<EarTrainingNoteSettings>,
    advanced: {
      quizType: 'earTrainingNote',
      pitchRange: { min: 'C3', max: 'C6' },
      showReference: false,
    } as Partial<EarTrainingNoteSettings>,
  },

  // Ear Training - Interval Recognition
  earTrainingInterval: {
    beginner: {
      quizType: 'earTrainingInterval',
      intervals: ['M2', 'm3', 'M3', 'P4', 'P5', 'P8'],
      direction: 'ascending',
    } as Partial<IntervalSettings>,
    intermediate: {
      quizType: 'earTrainingInterval',
      intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'],
      direction: 'both',
    } as Partial<IntervalSettings>,
    advanced: {
      quizType: 'earTrainingInterval',
      intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
      direction: 'both',
    } as Partial<IntervalSettings>,
  },

  // Ear Training - Chord Recognition
  earTrainingChord: {
    beginner: {
      quizType: 'earTrainingChord',
      chordTypes: ['major', 'minor', 'diminished', 'augmented'],
      inversions: 'root',
    } as Partial<ChordSettings>,
    intermediate: {
      quizType: 'earTrainingChord',
      chordTypes: ['major', 'minor', 'diminished', 'augmented'],
      inversions: 'root',
    } as Partial<ChordSettings>,
    advanced: {
      quizType: 'earTrainingChord',
      chordTypes: ['major', 'minor', 'diminished', 'augmented', 'dom7', 'maj7', 'min7'],
      inversions: 'all',
    } as Partial<ChordSettings>,
  },
};

// Beginner key signatures (limited set)
export const BEGINNER_KEYS = ['C', 'G', 'F', 'D', 'Bb'];

// Get available intervals for a difficulty level
export function getIntervalsForDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case 'beginner':
      return ['M2', 'm3', 'M3', 'P5', 'P8'];
    case 'intermediate':
      return ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'];
    case 'advanced':
      return ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
  }
}

// Get available chord types for a difficulty level
export function getChordsForDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case 'beginner':
      return ['major', 'minor'];
    case 'intermediate':
      return ['major', 'minor', 'diminished', 'augmented'];
    case 'advanced':
      return ['major', 'minor', 'diminished', 'augmented', 'dom7', 'maj7', 'min7'];
  }
}

// Get available scale types for a difficulty level
export function getScalesForDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case 'beginner':
      return ['major'];
    case 'intermediate':
      return ['major', 'natural_minor', 'harmonic_minor'];
    case 'advanced':
      return ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', 'dorian', 'phrygian', 'lydian', 'mixolydian'];
  }
}

// Pitch range options for dropdowns - separated by clef
export const TREBLE_PITCH_RANGE_OPTIONS = [
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
  'C6',
];

export const BASS_PITCH_RANGE_OPTIONS = [
  'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2',
  'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
  'C4',
];

// Legacy - kept for backward compatibility
export const PITCH_RANGE_OPTIONS = [
  'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2',
  'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
  'C6',
];

// Get pitch range options based on clef
export function getPitchRangeForClef(clef: 'treble' | 'bass' | 'both'): string[] {
  if (clef === 'treble') {
    return TREBLE_PITCH_RANGE_OPTIONS;
  } else if (clef === 'bass') {
    return BASS_PITCH_RANGE_OPTIONS;
  }
  // For 'both', return the full range
  return PITCH_RANGE_OPTIONS;
}

// Get default pitch range for a clef
export function getDefaultPitchRangeForClef(clef: 'treble' | 'bass' | 'both'): { min: string; max: string } {
  if (clef === 'treble') {
    return { min: 'C4', max: 'C5' };
  } else if (clef === 'bass') {
    return { min: 'C3', max: 'C4' };
  }
  // For 'both', use a middle range
  return { min: 'C3', max: 'C5' };
}

// Question count options
export const QUESTION_COUNT_OPTIONS: (10 | 20 | 30)[] = [10, 20, 30];

// Clef options for display
export const CLEF_OPTIONS: { value: 'treble' | 'bass' | 'both'; label: string }[] = [
  { value: 'treble', label: 'Treble' },
  { value: 'bass', label: 'Bass' },
  { value: 'both', label: 'Both' },
];

// Direction options for display
export const DIRECTION_OPTIONS: { value: 'ascending' | 'descending' | 'both'; label: string }[] = [
  { value: 'ascending', label: 'Ascending' },
  { value: 'descending', label: 'Descending' },
  { value: 'both', label: 'Both' },
];

// Accidental options for display
export const ACCIDENTAL_OPTIONS: { value: 'natural' | 'sharps' | 'flats' | 'all'; label: string }[] = [
  { value: 'natural', label: 'Natural only' },
  { value: 'sharps', label: 'With sharps' },
  { value: 'flats', label: 'With flats' },
  { value: 'all', label: 'All accidentals' },
];

// Key type options for display
export const KEY_TYPE_OPTIONS: { value: 'major' | 'minor' | 'both'; label: string }[] = [
  { value: 'major', label: 'Major keys' },
  { value: 'minor', label: 'Minor keys' },
  { value: 'both', label: 'Both' },
];

// Key signature direction options
export const KEY_DIRECTION_OPTIONS: { value: 'staffToName' | 'nameToStaff' | 'both'; label: string }[] = [
  { value: 'staffToName', label: 'Staff → Key Name' },
  { value: 'nameToStaff', label: 'Key Name → Staff' },
  { value: 'both', label: 'Both directions' },
];
