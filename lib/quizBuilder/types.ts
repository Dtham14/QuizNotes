// Quiz Builder Type Definitions

export type QuizType =
  | 'noteIdentification'
  | 'keySignature'
  | 'intervalIdentification'
  | 'chordIdentification'
  | 'scaleIdentification'
  | 'earTrainingNote'
  | 'earTrainingInterval'
  | 'earTrainingChord';

export type Clef = 'treble' | 'bass' | 'both';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type KeyType = 'major' | 'minor' | 'both';
export type Direction = 'ascending' | 'descending' | 'both';
export type AccidentalType = 'natural' | 'sharps' | 'flats' | 'all';

// Quiz type metadata for UI display
export interface QuizTypeInfo {
  type: QuizType;
  name: string;
  description: string;
  icon: string;
  category: 'visual' | 'earTraining';
}

export const QUIZ_TYPE_INFO: Record<QuizType, QuizTypeInfo> = {
  noteIdentification: {
    type: 'noteIdentification',
    name: 'Note Identification',
    description: 'Identify notes on the musical staff',
    icon: '🎵',
    category: 'visual',
  },
  keySignature: {
    type: 'keySignature',
    name: 'Key Signature',
    description: 'Identify key signatures and their names',
    icon: '🎼',
    category: 'visual',
  },
  intervalIdentification: {
    type: 'intervalIdentification',
    name: 'Interval Identification',
    description: 'Identify intervals between notes',
    icon: '📏',
    category: 'visual',
  },
  chordIdentification: {
    type: 'chordIdentification',
    name: 'Chord Identification',
    description: 'Identify chord types from notation',
    icon: '🎹',
    category: 'visual',
  },
  scaleIdentification: {
    type: 'scaleIdentification',
    name: 'Scale Identification',
    description: 'Identify scale types and modes',
    icon: '🎚️',
    category: 'visual',
  },
  earTrainingNote: {
    type: 'earTrainingNote',
    name: 'Note Recognition',
    description: 'Identify notes by ear',
    icon: '👂',
    category: 'earTraining',
  },
  earTrainingInterval: {
    type: 'earTrainingInterval',
    name: 'Interval Recognition',
    description: 'Identify intervals by ear',
    icon: '🔊',
    category: 'earTraining',
  },
  earTrainingChord: {
    type: 'earTrainingChord',
    name: 'Chord Recognition',
    description: 'Identify chord types by ear',
    icon: '🎧',
    category: 'earTraining',
  },
};

// Base settings shared by all quiz types
export interface BaseQuizSettings {
  quizType: QuizType;
  questionCount: number; // 5-25 questions
  answerChoices: number;
  difficulty: Difficulty;
}

// Note Identification settings
export interface NoteIdentificationSettings extends BaseQuizSettings {
  quizType: 'noteIdentification';
  clef: Clef;
  pitchRange: { min: string; max: string };
  accidentals: AccidentalType;
}

// Key Signature settings
export interface KeySignatureSettings extends BaseQuizSettings {
  quizType: 'keySignature';
  clef: Clef;
  direction: 'staffToName' | 'nameToStaff' | 'both';
  keyTypes: KeyType;
  maxSharps: number; // 0-7
  maxFlats: number;  // 0-7
}

// Interval settings (visual and ear training)
export interface IntervalSettings extends BaseQuizSettings {
  quizType: 'intervalIdentification' | 'earTrainingInterval';
  clef?: Clef; // Only for visual
  intervals: string[]; // ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
  direction: Direction;
}

// Chord settings (visual and ear training)
export interface ChordSettings extends BaseQuizSettings {
  quizType: 'chordIdentification' | 'earTrainingChord';
  clef?: Clef; // Only for visual
  chordTypes: string[]; // ['major', 'minor', 'diminished', 'augmented', 'dom7', 'maj7', 'min7']
  inversions: 'root' | 'all';
}

// Scale settings
export interface ScaleSettings extends BaseQuizSettings {
  quizType: 'scaleIdentification';
  clef: Clef;
  scaleTypes: string[]; // ['major', 'natural_minor', 'harmonic_minor', 'melodic_minor', modes...]
}

// Ear training note settings
export interface EarTrainingNoteSettings extends BaseQuizSettings {
  quizType: 'earTrainingNote';
  pitchRange: { min: string; max: string };
  showReference: boolean;
}

// Union type for all quiz settings
export type QuizSettings =
  | NoteIdentificationSettings
  | KeySignatureSettings
  | IntervalSettings
  | ChordSettings
  | ScaleSettings
  | EarTrainingNoteSettings;

// Generated question structure
export interface GeneratedQuestion {
  id: string;
  type: QuizType;
  question: string;
  notes?: string[]; // VexFlow format: ['c/4', 'e/4']
  options: string[];
  correctAnswer: string;
  explanation?: string;
  clef?: 'treble' | 'bass';
  // For key signature questions with notation options
  keySignature?: string;
  optionNotations?: { key: string; display: string }[];
  // For ear training
  audioData?: {
    subtype: 'note' | 'chord' | 'interval';
    notes: string[]; // Tone.js format: ['C4', 'E4']
    duration?: string;
  };
}

// Pitch range definitions
export const PITCH_RANGES = {
  C3: { note: 'C3', vex: 'c/3', midi: 48 },
  D3: { note: 'D3', vex: 'd/3', midi: 50 },
  E3: { note: 'E3', vex: 'e/3', midi: 52 },
  F3: { note: 'F3', vex: 'f/3', midi: 53 },
  G3: { note: 'G3', vex: 'g/3', midi: 55 },
  A3: { note: 'A3', vex: 'a/3', midi: 57 },
  B3: { note: 'B3', vex: 'b/3', midi: 59 },
  C4: { note: 'C4', vex: 'c/4', midi: 60 },
  D4: { note: 'D4', vex: 'd/4', midi: 62 },
  E4: { note: 'E4', vex: 'e/4', midi: 64 },
  F4: { note: 'F4', vex: 'f/4', midi: 65 },
  G4: { note: 'G4', vex: 'g/4', midi: 67 },
  A4: { note: 'A4', vex: 'a/4', midi: 69 },
  B4: { note: 'B4', vex: 'b/4', midi: 71 },
  C5: { note: 'C5', vex: 'c/5', midi: 72 },
  D5: { note: 'D5', vex: 'd/5', midi: 74 },
  E5: { note: 'E5', vex: 'e/5', midi: 76 },
  F5: { note: 'F5', vex: 'f/5', midi: 77 },
  G5: { note: 'G5', vex: 'g/5', midi: 79 },
  A5: { note: 'A5', vex: 'a/5', midi: 81 },
  B5: { note: 'B5', vex: 'b/5', midi: 83 },
  C6: { note: 'C6', vex: 'c/6', midi: 84 },
};

// All available intervals
export const ALL_INTERVALS = [
  { id: 'm2', name: 'Minor 2nd', semitones: 1 },
  { id: 'M2', name: 'Major 2nd', semitones: 2 },
  { id: 'm3', name: 'Minor 3rd', semitones: 3 },
  { id: 'M3', name: 'Major 3rd', semitones: 4 },
  { id: 'P4', name: 'Perfect 4th', semitones: 5 },
  { id: 'TT', name: 'Tritone', semitones: 6 },
  { id: 'P5', name: 'Perfect 5th', semitones: 7 },
  { id: 'm6', name: 'Minor 6th', semitones: 8 },
  { id: 'M6', name: 'Major 6th', semitones: 9 },
  { id: 'm7', name: 'Minor 7th', semitones: 10 },
  { id: 'M7', name: 'Major 7th', semitones: 11 },
  { id: 'P8', name: 'Octave', semitones: 12 },
];

// All available chord types
export const ALL_CHORD_TYPES = [
  { id: 'major', name: 'Major', intervals: [0, 4, 7] },
  { id: 'minor', name: 'Minor', intervals: [0, 3, 7] },
  { id: 'diminished', name: 'Diminished', intervals: [0, 3, 6] },
  { id: 'augmented', name: 'Augmented', intervals: [0, 4, 8] },
  { id: 'dom7', name: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  { id: 'maj7', name: 'Major 7th', intervals: [0, 4, 7, 11] },
  { id: 'min7', name: 'Minor 7th', intervals: [0, 3, 7, 10] },
  { id: 'dim7', name: 'Diminished 7th', intervals: [0, 3, 6, 9] },
  { id: 'halfdim7', name: 'Half-Diminished 7th', intervals: [0, 3, 6, 10] },
];

// All available scale types
export const ALL_SCALE_TYPES = [
  { id: 'major', name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'natural_minor', name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonic_minor', name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic_minor', name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'locrian', name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
];

// Key signature definitions
export const KEY_SIGNATURES = {
  major: [
    { key: 'C', sharps: 0, flats: 0, signature: '' },
    { key: 'G', sharps: 1, flats: 0, signature: 'F#' },
    { key: 'D', sharps: 2, flats: 0, signature: 'F#, C#' },
    { key: 'A', sharps: 3, flats: 0, signature: 'F#, C#, G#' },
    { key: 'E', sharps: 4, flats: 0, signature: 'F#, C#, G#, D#' },
    { key: 'B', sharps: 5, flats: 0, signature: 'F#, C#, G#, D#, A#' },
    { key: 'F#', sharps: 6, flats: 0, signature: 'F#, C#, G#, D#, A#, E#' },
    { key: 'F', sharps: 0, flats: 1, signature: 'Bb' },
    { key: 'Bb', sharps: 0, flats: 2, signature: 'Bb, Eb' },
    { key: 'Eb', sharps: 0, flats: 3, signature: 'Bb, Eb, Ab' },
    { key: 'Ab', sharps: 0, flats: 4, signature: 'Bb, Eb, Ab, Db' },
    { key: 'Db', sharps: 0, flats: 5, signature: 'Bb, Eb, Ab, Db, Gb' },
    { key: 'Gb', sharps: 0, flats: 6, signature: 'Bb, Eb, Ab, Db, Gb, Cb' },
  ],
  minor: [
    { key: 'Am', sharps: 0, flats: 0, signature: '' },
    { key: 'Em', sharps: 1, flats: 0, signature: 'F#' },
    { key: 'Bm', sharps: 2, flats: 0, signature: 'F#, C#' },
    { key: 'F#m', sharps: 3, flats: 0, signature: 'F#, C#, G#' },
    { key: 'C#m', sharps: 4, flats: 0, signature: 'F#, C#, G#, D#' },
    { key: 'G#m', sharps: 5, flats: 0, signature: 'F#, C#, G#, D#, A#' },
    { key: 'D#m', sharps: 6, flats: 0, signature: 'F#, C#, G#, D#, A#, E#' },
    { key: 'Dm', sharps: 0, flats: 1, signature: 'Bb' },
    { key: 'Gm', sharps: 0, flats: 2, signature: 'Bb, Eb' },
    { key: 'Cm', sharps: 0, flats: 3, signature: 'Bb, Eb, Ab' },
    { key: 'Fm', sharps: 0, flats: 4, signature: 'Bb, Eb, Ab, Db' },
    { key: 'Bbm', sharps: 0, flats: 5, signature: 'Bb, Eb, Ab, Db, Gb' },
    { key: 'Ebm', sharps: 0, flats: 6, signature: 'Bb, Eb, Ab, Db, Gb, Cb' },
  ],
};
