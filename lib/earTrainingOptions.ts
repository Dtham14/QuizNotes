// Note options for ear training (white keys from C4 to C5)
export const noteOptions = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

// Note names for display
export const noteNames: Record<string, string> = {
  'C4': 'C (Middle C)',
  'D4': 'D',
  'E4': 'E',
  'F4': 'F',
  'G4': 'G',
  'A4': 'A',
  'B4': 'B',
  'C5': 'C (High)',
};

// Chord types with their intervals from root
export const chordTypes = {
  'Major': [0, 4, 7],      // Root, Major 3rd, Perfect 5th
  'Minor': [0, 3, 7],      // Root, Minor 3rd, Perfect 5th
  'Diminished': [0, 3, 6], // Root, Minor 3rd, Diminished 5th
  'Augmented': [0, 4, 8],  // Root, Major 3rd, Augmented 5th
};

// Interval types with semitone distances
export const intervalTypes: Record<string, { semitones: number; name: string }> = {
  'm2': { semitones: 1, name: 'Minor 2nd' },
  'M2': { semitones: 2, name: 'Major 2nd' },
  'm3': { semitones: 3, name: 'Minor 3rd' },
  'M3': { semitones: 4, name: 'Major 3rd' },
  'P4': { semitones: 5, name: 'Perfect 4th' },
  'TT': { semitones: 6, name: 'Tritone' },
  'P5': { semitones: 7, name: 'Perfect 5th' },
  'm6': { semitones: 8, name: 'Minor 6th' },
  'M6': { semitones: 9, name: 'Major 6th' },
  'm7': { semitones: 10, name: 'Minor 7th' },
  'M7': { semitones: 11, name: 'Major 7th' },
  'P8': { semitones: 12, name: 'Octave' },
};

// All chromatic notes for calculations
const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Calculate note from root + semitones
export function getNoteFromInterval(root: string, semitones: number): string {
  const match = root.match(/^([A-G][#b]?)(\d)$/);
  if (!match) return root;

  const [, noteName, octaveStr] = match;
  let noteIndex = chromaticNotes.indexOf(noteName);
  let octave = parseInt(octaveStr);

  if (noteIndex === -1) return root;

  noteIndex += semitones;
  while (noteIndex >= 12) {
    noteIndex -= 12;
    octave++;
  }

  return chromaticNotes[noteIndex] + octave;
}

// Build a chord from root note and chord type
export function buildChord(root: string, type: keyof typeof chordTypes): string[] {
  const intervals = chordTypes[type];
  return intervals.map(semitones => getNoteFromInterval(root, semitones));
}

// Build an interval from root note
export function buildInterval(root: string, intervalType: keyof typeof intervalTypes): string[] {
  const { semitones } = intervalTypes[intervalType];
  return [root, getNoteFromInterval(root, semitones)];
}
