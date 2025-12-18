import { Note } from '@/components/MusicNotation';

export type IntervalOption = {
  name: string;
  semitones: number;
  notes: Note[];
  clef: 'treble' | 'bass';
};

export type ChordOption = {
  name: string;
  type: 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant7' | 'major7' | 'minor7';
  notes: Note[];
  clef: 'treble' | 'bass';
};

export type NoteOption = {
  name: string;
  notes: Note[];
  clef: 'treble' | 'bass';
};

// Interval options with their VexFlow note representations
export const intervalOptions: IntervalOption[] = [
  {
    name: 'Minor 2nd',
    semitones: 1,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['db/4'], duration: 'w', accidental: 'b' },
    ],
    clef: 'treble',
  },
  {
    name: 'Major 2nd',
    semitones: 2,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['d/4'], duration: 'w' },
    ],
    clef: 'treble',
  },
  {
    name: 'Minor 3rd',
    semitones: 3,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['eb/4'], duration: 'w', accidental: 'b' },
    ],
    clef: 'treble',
  },
  {
    name: 'Major 3rd',
    semitones: 4,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['e/4'], duration: 'w' },
    ],
    clef: 'treble',
  },
  {
    name: 'Perfect 4th',
    semitones: 5,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['f/4'], duration: 'w' },
    ],
    clef: 'treble',
  },
  {
    name: 'Augmented 4th (Tritone)',
    semitones: 6,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['f#/4'], duration: 'w', accidental: '#' },
    ],
    clef: 'treble',
  },
  {
    name: 'Perfect 5th',
    semitones: 7,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['g/4'], duration: 'w' },
    ],
    clef: 'treble',
  },
  {
    name: 'Minor 6th',
    semitones: 8,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['ab/4'], duration: 'w', accidental: 'b' },
    ],
    clef: 'treble',
  },
  {
    name: 'Major 6th',
    semitones: 9,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['a/4'], duration: 'w' },
    ],
    clef: 'treble',
  },
  {
    name: 'Minor 7th',
    semitones: 10,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['bb/4'], duration: 'w', accidental: 'b' },
    ],
    clef: 'treble',
  },
  {
    name: 'Major 7th',
    semitones: 11,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['b/4'], duration: 'w' },
    ],
    clef: 'treble',
  },
  {
    name: 'Octave',
    semitones: 12,
    notes: [
      { keys: ['c/4'], duration: 'w' },
      { keys: ['c/5'], duration: 'w' },
    ],
    clef: 'treble',
  },
];

// Chord options with their VexFlow note representations
// Using accidentals array for per-key accidentals
export const chordOptions: ChordOption[] = [
  // C Major: C, E, G (no accidentals)
  {
    name: 'C Major',
    type: 'major',
    notes: [{ keys: ['c/4', 'e/4', 'g/4'], duration: 'w' }],
    clef: 'treble',
  },
  // C Minor: C, Eb, G (flat on middle note only)
  {
    name: 'C Minor',
    type: 'minor',
    notes: [{ keys: ['c/4', 'eb/4', 'g/4'], duration: 'w', accidentals: [null, 'b', null] }],
    clef: 'treble',
  },
  // D Major: D, F#, A (sharp on middle note only)
  {
    name: 'D Major',
    type: 'major',
    notes: [{ keys: ['d/4', 'f#/4', 'a/4'], duration: 'w', accidentals: [null, '#', null] }],
    clef: 'treble',
  },
  // D Minor: D, F, A (no accidentals)
  {
    name: 'D Minor',
    type: 'minor',
    notes: [{ keys: ['d/4', 'f/4', 'a/4'], duration: 'w' }],
    clef: 'treble',
  },
  // E Major: E, G#, B (sharp on middle note only)
  {
    name: 'E Major',
    type: 'major',
    notes: [{ keys: ['e/4', 'g#/4', 'b/4'], duration: 'w', accidentals: [null, '#', null] }],
    clef: 'treble',
  },
  // E Minor: E, G, B (no accidentals)
  {
    name: 'E Minor',
    type: 'minor',
    notes: [{ keys: ['e/4', 'g/4', 'b/4'], duration: 'w' }],
    clef: 'treble',
  },
  // F Major: F, A, C (no accidentals)
  {
    name: 'F Major',
    type: 'major',
    notes: [{ keys: ['f/4', 'a/4', 'c/5'], duration: 'w' }],
    clef: 'treble',
  },
  // F Minor: F, Ab, C (flat on middle note only)
  {
    name: 'F Minor',
    type: 'minor',
    notes: [{ keys: ['f/4', 'ab/4', 'c/5'], duration: 'w', accidentals: [null, 'b', null] }],
    clef: 'treble',
  },
  // G Major: G, B, D (no accidentals)
  {
    name: 'G Major',
    type: 'major',
    notes: [{ keys: ['g/4', 'b/4', 'd/5'], duration: 'w' }],
    clef: 'treble',
  },
  // G Minor: G, Bb, D (flat on middle note only)
  {
    name: 'G Minor',
    type: 'minor',
    notes: [{ keys: ['g/4', 'bb/4', 'd/5'], duration: 'w', accidentals: [null, 'b', null] }],
    clef: 'treble',
  },
  // A Major: A, C#, E (sharp on middle note only)
  {
    name: 'A Major',
    type: 'major',
    notes: [{ keys: ['a/4', 'c#/5', 'e/5'], duration: 'w', accidentals: [null, '#', null] }],
    clef: 'treble',
  },
  // A Minor: A, C, E (no accidentals)
  {
    name: 'A Minor',
    type: 'minor',
    notes: [{ keys: ['a/4', 'c/5', 'e/5'], duration: 'w' }],
    clef: 'treble',
  },
  // B Major: B, D#, F# (sharps on middle and top notes)
  {
    name: 'B Major',
    type: 'major',
    notes: [{ keys: ['b/4', 'd#/5', 'f#/5'], duration: 'w', accidentals: [null, '#', '#'] }],
    clef: 'treble',
  },
  // B Minor: B, D, F# (sharp on top note only)
  {
    name: 'B Minor',
    type: 'minor',
    notes: [{ keys: ['b/4', 'd/5', 'f#/5'], duration: 'w', accidentals: [null, null, '#'] }],
    clef: 'treble',
  },
  // C Diminished: C, Eb, Gb (flats on middle and top notes)
  {
    name: 'C Diminished',
    type: 'diminished',
    notes: [{ keys: ['c/4', 'eb/4', 'gb/4'], duration: 'w', accidentals: [null, 'b', 'b'] }],
    clef: 'treble',
  },
  // C Augmented: C, E, G# (sharp on top note only)
  {
    name: 'C Augmented',
    type: 'augmented',
    notes: [{ keys: ['c/4', 'e/4', 'g#/4'], duration: 'w', accidentals: [null, null, '#'] }],
    clef: 'treble',
  },
];

// Note identification options (treble and bass clef)
export const noteOptions: NoteOption[] = [
  // ---------- TREBLE CLEF ----------
  { name: "C4", notes: [{ keys: ["c/4"], duration: "w" }], clef: "treble" },

  { name: "C#4", notes: [{ keys: ["c#/4"], duration: "w", accidentals: ["#"] }], clef: "treble" },
  { name: "Db4", notes: [{ keys: ["db/4"], duration: "w", accidentals: ["b"] }], clef: "treble" },

  { name: "D4", notes: [{ keys: ["d/4"], duration: "w" }], clef: "treble" },

  { name: "D#4", notes: [{ keys: ["d#/4"], duration: "w", accidentals: ["#"] }], clef: "treble" },
  { name: "Eb4", notes: [{ keys: ["eb/4"], duration: "w", accidentals: ["b"] }], clef: "treble" },

  { name: "E4", notes: [{ keys: ["e/4"], duration: "w" }], clef: "treble" },
  { name: "F4", notes: [{ keys: ["f/4"], duration: "w" }], clef: "treble" },

  { name: "F#4", notes: [{ keys: ["f#/4"], duration: "w", accidentals: ["#"] }], clef: "treble" },
  { name: "Gb4", notes: [{ keys: ["gb/4"], duration: "w", accidentals: ["b"] }], clef: "treble" },

  { name: "G4", notes: [{ keys: ["g/4"], duration: "w" }], clef: "treble" },

  { name: "G#4", notes: [{ keys: ["g#/4"], duration: "w", accidentals: ["#"] }], clef: "treble" },
  { name: "Ab4", notes: [{ keys: ["ab/4"], duration: "w", accidentals: ["b"] }], clef: "treble" },

  { name: "A4", notes: [{ keys: ["a/4"], duration: "w" }], clef: "treble" },

  { name: "A#4", notes: [{ keys: ["a#/4"], duration: "w", accidentals: ["#"] }], clef: "treble" },
  { name: "Bb4", notes: [{ keys: ["bb/4"], duration: "w", accidentals: ["b"] }], clef: "treble" },

  { name: "B4", notes: [{ keys: ["b/4"], duration: "w" }], clef: "treble" },
  { name: "C5", notes: [{ keys: ["c/5"], duration: "w" }], clef: "treble" },

  // ---------- BASS CLEF ----------
  { name: "C3", notes: [{ keys: ["c/3"], duration: "w" }], clef: "bass" },

  { name: "C#3", notes: [{ keys: ["c#/3"], duration: "w", accidentals: ["#"] }], clef: "bass" },
  { name: "Db3", notes: [{ keys: ["db/3"], duration: "w", accidentals: ["b"] }], clef: "bass" },

  { name: "D3", notes: [{ keys: ["d/3"], duration: "w" }], clef: "bass" },

  { name: "D#3", notes: [{ keys: ["d#/3"], duration: "w", accidentals: ["#"] }], clef: "bass" },
  { name: "Eb3", notes: [{ keys: ["eb/3"], duration: "w", accidentals: ["b"] }], clef: "bass" },

  { name: "E3", notes: [{ keys: ["e/3"], duration: "w" }], clef: "bass" },
  { name: "F3", notes: [{ keys: ["f/3"], duration: "w" }], clef: "bass" },

  { name: "F#3", notes: [{ keys: ["f#/3"], duration: "w", accidentals: ["#"] }], clef: "bass" },
  { name: "Gb3", notes: [{ keys: ["gb/3"], duration: "w", accidentals: ["b"] }], clef: "bass" },

  { name: "G3", notes: [{ keys: ["g/3"], duration: "w" }], clef: "bass" },

  { name: "G#3", notes: [{ keys: ["g#/3"], duration: "w", accidentals: ["#"] }], clef: "bass" },
  { name: "Ab3", notes: [{ keys: ["ab/3"], duration: "w", accidentals: ["b"] }], clef: "bass" },

  { name: "A3", notes: [{ keys: ["a/3"], duration: "w" }], clef: "bass" },

  { name: "A#3", notes: [{ keys: ["a#/3"], duration: "w", accidentals: ["#"] }], clef: "bass" },
  { name: "Bb3", notes: [{ keys: ["bb/3"], duration: "w", accidentals: ["b"] }], clef: "bass" },

  { name: "B3", notes: [{ keys: ["b/3"], duration: "w" }], clef: "bass" },
  { name: "C4 (Middle C)", notes: [{ keys: ["c/4"], duration: "w" }], clef: "bass" },
];

// Helper function to get options based on quiz type
export function getOptionsForType(type: 'interval' | 'note' | 'chord') {
  switch (type) {
    case 'interval':
      return intervalOptions;
    case 'chord':
      return chordOptions;
    case 'note':
      return noteOptions;
    default:
      return [];
  }
}

// Generate wrong answer options for intervals
export function generateIntervalDistractors(correctInterval: string): string[] {
  const allIntervals = intervalOptions.map(i => i.name);
  const distractors = allIntervals.filter(i => i !== correctInterval);
  // Shuffle and take 3
  return distractors.sort(() => Math.random() - 0.5).slice(0, 3);
}

// Generate wrong answer options for chords
export function generateChordDistractors(correctChord: string): string[] {
  const allChords = chordOptions.map(c => c.name);
  const distractors = allChords.filter(c => c !== correctChord);
  return distractors.sort(() => Math.random() - 0.5).slice(0, 3);
}

// Generate wrong answer options for notes
export function generateNoteDistractors(correctNote: string, clef: 'treble' | 'bass'): string[] {
  const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const correctNoteName = correctNote.charAt(0);
  const distractors = noteNames.filter(n => n !== correctNoteName);
  return distractors.sort(() => Math.random() - 0.5).slice(0, 3);
}
