// Quiz Builder Utility Functions

import { PITCH_RANGES, ALL_INTERVALS, ALL_CHORD_TYPES, ALL_SCALE_TYPES } from './types';
import type { AccidentalType, Clef } from './types';

// Note definitions with all accidentals
const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SHARP_NOTES = ['C#', 'D#', 'F#', 'G#', 'A#'];
const FLAT_NOTES = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Shuffle an array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get a random element from an array
export function getRandomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Get multiple unique random elements from an array
export function getRandomUniqueFromArray<T>(array: T[], count: number): T[] {
  if (count >= array.length) return shuffleArray(array);
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

// Get notes within a pitch range
export function getNotesInRange(
  minNote: string,
  maxNote: string,
  accidentals: AccidentalType = 'natural'
): string[] {
  const minPitch = PITCH_RANGES[minNote as keyof typeof PITCH_RANGES];
  const maxPitch = PITCH_RANGES[maxNote as keyof typeof PITCH_RANGES];

  if (!minPitch || !maxPitch) {
    console.error('Invalid pitch range:', minNote, maxNote);
    return [];
  }

  const notes: string[] = [];
  const minOctave = parseInt(minNote.slice(-1));
  const maxOctave = parseInt(maxNote.slice(-1));

  for (let octave = minOctave; octave <= maxOctave; octave++) {
    for (const note of NOTE_NAMES) {
      const fullNote = `${note}${octave}`;
      const pitch = PITCH_RANGES[fullNote as keyof typeof PITCH_RANGES];

      if (pitch && pitch.midi >= minPitch.midi && pitch.midi <= maxPitch.midi) {
        notes.push(fullNote);

        // Add accidentals based on setting
        if (accidentals !== 'natural') {
          // Sharp version
          if ((accidentals === 'sharps' || accidentals === 'all') && SHARP_NOTES.includes(`${note}#`)) {
            notes.push(`${note}#${octave}`);
          }
          // Flat version
          if ((accidentals === 'flats' || accidentals === 'all') && FLAT_NOTES.includes(`${note}b`)) {
            notes.push(`${note}b${octave}`);
          }
        }
      }
    }
  }

  return notes;
}

// Convert Tone.js note format (C4) to VexFlow format (c/4)
export function toneToVex(toneNote: string): string {
  const match = toneNote.match(/^([A-Ga-g][#b]?)(\d)$/);
  if (!match) return 'c/4';
  return match[1].toLowerCase() + '/' + match[2];
}

// Convert VexFlow note format (c/4) to Tone.js format (C4)
export function vexToTone(vexNote: string): string {
  const [noteName, octave] = vexNote.split('/');
  return noteName.toUpperCase() + octave;
}

// Get the note name without octave (C4 -> C)
export function getNoteNameOnly(note: string): string {
  return note.replace(/\d+$/, '');
}

// Get the octave from a note (C4 -> 4)
export function getOctave(note: string): number {
  const match = note.match(/(\d+)$/);
  return match ? parseInt(match[1]) : 4;
}

// Calculate semitones between two notes
export function getSemitonesBetween(note1: string, note2: string): number {
  const midi1 = noteToMidi(note1);
  const midi2 = noteToMidi(note2);
  return Math.abs(midi2 - midi1);
}

// Convert note to MIDI number
export function noteToMidi(note: string): number {
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4, 'E#': 5,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11, 'B#': 0,
  };

  const noteName = getNoteNameOnly(note);
  const octave = getOctave(note);
  const noteValue = noteMap[noteName] ?? 0;

  return (octave + 1) * 12 + noteValue;
}

// Convert MIDI number to note
export function midiToNote(midi: number, preferSharp: boolean = true): string {
  const noteNames = preferSharp
    ? ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    : ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;

  return noteNames[noteIndex] + octave;
}

// Add semitones to a note
export function addSemitones(note: string, semitones: number, preferSharp: boolean = true): string {
  const midi = noteToMidi(note);
  return midiToNote(midi + semitones, preferSharp);
}

// Letter names in order for interval calculations
const LETTER_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Semitones from C for each natural note
const NATURAL_SEMITONES: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

// Interval ID to letter steps (unison=0, 2nd=1, 3rd=2, etc.)
const INTERVAL_LETTER_STEPS: Record<string, number> = {
  'm2': 1, 'M2': 1,  // 2nds go up 1 letter
  'm3': 2, 'M3': 2,  // 3rds go up 2 letters
  'P4': 3,           // 4ths go up 3 letters
  'TT': 3,           // Tritone (augmented 4th) - use 3 letters
  'P5': 4,           // 5ths go up 4 letters
  'm6': 5, 'M6': 5,  // 6ths go up 5 letters
  'm7': 6, 'M7': 6,  // 7ths go up 6 letters
  'P8': 7,           // Octave goes up 7 letters (same letter, next octave)
};

/**
 * Calculate the properly spelled second note of an interval.
 * This ensures C to Eb is a minor 3rd, not C to D# (which would be augmented 2nd).
 */
export function getIntervalNote(baseNote: string, intervalId: string, ascending: boolean): string {
  const interval = getIntervalById(intervalId);
  if (!interval) throw new Error(`Unknown interval: ${intervalId}`);

  const baseLetter = getNoteNameOnly(baseNote).charAt(0).toUpperCase();
  const baseAccidental = getNoteNameOnly(baseNote).slice(1); // '', '#', or 'b'
  const baseOctave = getOctave(baseNote);

  // Get the letter index of the base note
  const baseLetterIndex = LETTER_NAMES.indexOf(baseLetter);
  if (baseLetterIndex === -1) throw new Error(`Invalid base note: ${baseNote}`);

  // Calculate target letter based on interval type
  const letterSteps = INTERVAL_LETTER_STEPS[intervalId] || 0;
  const direction = ascending ? 1 : -1;

  // Calculate target letter index
  let targetLetterIndex = baseLetterIndex + (letterSteps * direction);
  let octaveAdjustment = 0;

  // Handle octave wrapping
  while (targetLetterIndex >= 7) {
    targetLetterIndex -= 7;
    octaveAdjustment += 1;
  }
  while (targetLetterIndex < 0) {
    targetLetterIndex += 7;
    octaveAdjustment -= 1;
  }

  const targetLetter = LETTER_NAMES[targetLetterIndex];
  // octaveAdjustment already accounts for direction through letter wrapping
  const targetOctave = baseOctave + octaveAdjustment;

  // Calculate the base semitone of the base note (including its accidental)
  let baseSemitone = NATURAL_SEMITONES[baseLetter];
  if (baseAccidental === '#') baseSemitone += 1;
  else if (baseAccidental === 'b') baseSemitone -= 1;

  // Calculate target semitone
  const targetSemitone = (baseSemitone + (interval.semitones * direction) + 120) % 12;

  // Calculate what the natural target letter's semitone would be
  const naturalTargetSemitone = NATURAL_SEMITONES[targetLetter];

  // Determine what accidental is needed
  let semitoneDiff = (targetSemitone - naturalTargetSemitone + 12) % 12;
  if (semitoneDiff > 6) semitoneDiff -= 12; // Handle wrap-around (-1 instead of 11)

  let targetAccidental = '';
  if (semitoneDiff === 1) targetAccidental = '#';
  else if (semitoneDiff === -1 || semitoneDiff === 11) targetAccidental = 'b';
  else if (semitoneDiff === 2) targetAccidental = '##';
  else if (semitoneDiff === -2 || semitoneDiff === 10) targetAccidental = 'bb';
  // semitoneDiff === 0 means natural (no accidental)

  return `${targetLetter}${targetAccidental}${targetOctave}`;
}

// Detect the format/category of an answer for smart distractor matching
function detectAnswerFormat(answer: string): {
  hasSharp: boolean;
  hasFlat: boolean;
  isMinor: boolean;
  isMajor: boolean;
  baseNote: string;
} {
  const hasSharp = answer.includes('#') || answer.includes('♯');
  const hasFlat = answer.includes('b') || answer.includes('♭');
  const isMinor = answer.toLowerCase().includes('minor') || (answer.includes('m') && !answer.includes('major') && !answer.includes('dim') && !answer.includes('aug'));
  const isMajor = answer.toLowerCase().includes('major');
  // Extract base note (first letter, possibly with accidental)
  const baseMatch = answer.match(/^([A-Ga-g][#♯b♭]?)/);
  const baseNote = baseMatch ? baseMatch[1].toUpperCase().replace('♯', '#').replace('♭', 'b') : '';

  return { hasSharp, hasFlat, isMinor, isMajor, baseNote };
}

// Generate distractor options (wrong answers that are plausible and similarly formatted)
export function generateDistractors(
  correctAnswer: string,
  pool: string[],
  count: number
): string[] {
  // Remove duplicates from pool and filter out correct answer
  const uniquePool = [...new Set(pool)].filter(item => item !== correctAnswer);

  if (uniquePool.length === 0) return [];
  if (uniquePool.length <= count) return shuffleArray(uniquePool);

  const correctFormat = detectAnswerFormat(correctAnswer);

  // Score each potential distractor by how similar it is to the correct answer
  const scoredDistractors = uniquePool.map(item => {
    const itemFormat = detectAnswerFormat(item);
    let score = 0;

    // Prioritize matching accidental type (sharp with sharp, flat with flat)
    if (correctFormat.hasSharp && itemFormat.hasSharp) score += 10;
    if (correctFormat.hasFlat && itemFormat.hasFlat) score += 10;

    // If correct has no accidental, slightly prefer no accidental options
    if (!correctFormat.hasSharp && !correctFormat.hasFlat) {
      if (!itemFormat.hasSharp && !itemFormat.hasFlat) score += 3;
    }

    // Prioritize matching key type (minor with minor, major with major)
    if (correctFormat.isMinor && itemFormat.isMinor) score += 10;
    if (correctFormat.isMajor && itemFormat.isMajor) score += 10;

    // Add small random variation to prevent always picking same distractors
    score += Math.random() * 2;

    return { item, score };
  });

  // Sort by score (highest first) and take top candidates
  scoredDistractors.sort((a, b) => b.score - a.score);

  // Select distractors, ensuring variety
  const selected: string[] = [];
  const usedBaseNotes = new Set<string>();
  usedBaseNotes.add(correctFormat.baseNote); // Don't use same base note as correct

  // First pass: try to get high-scoring distractors with different base notes
  for (const { item } of scoredDistractors) {
    if (selected.length >= count) break;

    const itemFormat = detectAnswerFormat(item);

    // Prefer different base notes for variety
    if (!usedBaseNotes.has(itemFormat.baseNote)) {
      selected.push(item);
      usedBaseNotes.add(itemFormat.baseNote);
    }
  }

  // Second pass: if we need more, allow same base notes
  if (selected.length < count) {
    for (const { item } of scoredDistractors) {
      if (selected.length >= count) break;
      if (!selected.includes(item)) {
        selected.push(item);
      }
    }
  }

  return selected;
}

// Create answer options with the correct answer in a random position (ensures uniqueness)
export function createAnswerOptions(
  correctAnswer: string,
  distractors: string[]
): string[] {
  // Ensure all options are unique
  const uniqueDistractors = distractors.filter(d => d !== correctAnswer);
  const uniqueOptions = [...new Set([correctAnswer, ...uniqueDistractors])];
  return shuffleArray(uniqueOptions);
}

// Get interval info by ID
export function getIntervalById(intervalId: string) {
  return ALL_INTERVALS.find(i => i.id === intervalId);
}

// Get interval name from semitones
export function getIntervalFromSemitones(semitones: number): string {
  const interval = ALL_INTERVALS.find(i => i.semitones === semitones);
  return interval?.name || 'Unknown';
}

// Get chord info by ID
export function getChordById(chordId: string) {
  return ALL_CHORD_TYPES.find(c => c.id === chordId);
}

// Get scale info by ID
export function getScaleById(scaleId: string) {
  return ALL_SCALE_TYPES.find(s => s.id === scaleId);
}

// Semitones to letter steps for chord/scale building
// This maps semitones to the correct letter interval
const SEMITONES_TO_LETTER_STEPS: Record<number, number> = {
  0: 0,   // Unison
  1: 1,   // Minor 2nd
  2: 1,   // Major 2nd
  3: 2,   // Minor 3rd
  4: 2,   // Major 3rd
  5: 3,   // Perfect 4th
  6: 4,   // Diminished 5th (in chord context, treat as d5 not A4)
  7: 4,   // Perfect 5th
  8: 5,   // Minor 6th
  9: 5,   // Major 6th
  10: 6,  // Minor 7th
  11: 6,  // Major 7th
};

/**
 * Get a properly spelled chord/scale tone from a root and semitone interval.
 * This ensures F + 3 semitones = Ab (minor 3rd), not G#.
 */
function getChordTone(root: string, semitones: number): string {
  if (semitones === 0) return root;

  const rootLetter = getNoteNameOnly(root).charAt(0).toUpperCase();
  const rootAccidental = getNoteNameOnly(root).slice(1);
  const rootOctave = getOctave(root);

  const rootLetterIndex = LETTER_NAMES.indexOf(rootLetter);
  if (rootLetterIndex === -1) throw new Error(`Invalid root: ${root}`);

  // Get letter steps for this interval
  const letterSteps = SEMITONES_TO_LETTER_STEPS[semitones % 12] || 0;

  // Calculate target letter
  let targetLetterIndex = rootLetterIndex + letterSteps;
  let octaveAdjustment = 0;

  while (targetLetterIndex >= 7) {
    targetLetterIndex -= 7;
    octaveAdjustment += 1;
  }

  const targetLetter = LETTER_NAMES[targetLetterIndex];
  const targetOctave = rootOctave + octaveAdjustment + Math.floor(semitones / 12);

  // Calculate root's absolute semitone value
  let rootSemitone = NATURAL_SEMITONES[rootLetter];
  if (rootAccidental === '#') rootSemitone += 1;
  else if (rootAccidental === 'b') rootSemitone -= 1;

  // Calculate target semitone
  const targetSemitone = (rootSemitone + semitones) % 12;

  // Calculate natural semitone of target letter
  const naturalTargetSemitone = NATURAL_SEMITONES[targetLetter];

  // Determine accidental needed
  let semitoneDiff = (targetSemitone - naturalTargetSemitone + 12) % 12;
  if (semitoneDiff > 6) semitoneDiff -= 12;

  let targetAccidental = '';
  if (semitoneDiff === 1) targetAccidental = '#';
  else if (semitoneDiff === -1 || semitoneDiff === 11) targetAccidental = 'b';
  else if (semitoneDiff === 2) targetAccidental = '##';
  else if (semitoneDiff === -2 || semitoneDiff === 10) targetAccidental = 'bb';

  return `${targetLetter}${targetAccidental}${targetOctave}`;
}

// Build a chord from a root note with proper spelling
export function buildChord(root: string, chordType: string): string[] {
  const chord = getChordById(chordType);
  if (!chord) return [root];

  return chord.intervals.map(semitones => getChordTone(root, semitones));
}

// Build a scale from a root note with proper spelling
export function buildScale(root: string, scaleType: string): string[] {
  const scale = getScaleById(scaleType);
  if (!scale) return [root];

  return scale.intervals.map(semitones => getChordTone(root, semitones));
}

// Get a random clef based on settings
export function getRandomClef(clefSetting: Clef): 'treble' | 'bass' {
  if (clefSetting === 'both') {
    return Math.random() < 0.5 ? 'treble' : 'bass';
  }
  return clefSetting;
}

// Ensure we don't repeat the same question consecutively
let lastQuestionId = '';
export function setLastQuestionId(id: string) {
  lastQuestionId = id;
}
export function getLastQuestionId(): string {
  return lastQuestionId;
}

// Format note name for display (with proper music symbols)
export function formatNoteDisplay(note: string): string {
  return note
    .replace(/#/g, '♯')
    .replace(/b/g, '♭');
}

// Format interval name for display
export function formatIntervalDisplay(intervalId: string): string {
  const interval = getIntervalById(intervalId);
  return interval?.name || intervalId;
}

// Format chord name for display
export function formatChordDisplay(chordId: string): string {
  const chord = getChordById(chordId);
  return chord?.name || chordId;
}

// Format scale name for display
export function formatScaleDisplay(scaleId: string): string {
  const scale = getScaleById(scaleId);
  return scale?.name || scaleId.replace(/_/g, ' ');
}

// VexFlow key signature format
export function getVexFlowKeySignature(key: string): string {
  // VexFlow uses format like 'C', 'G', 'F', 'Bb', 'Am', 'Em', etc.
  // For flats, use lowercase b
  return key.replace('♭', 'b');
}
