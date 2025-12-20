// Chord Identification Question Generator

import type { ChordSettings, GeneratedQuestion } from '../types';
import { ALL_CHORD_TYPES } from '../types';
import {
  generateId,
  getRandomFromArray,
  generateDistractors,
  createAnswerOptions,
  getRandomClef,
  getChordById,
  buildChord,
  toneToVex,
  formatChordDisplay,
  formatNoteDisplay,
  getNoteNameOnly,
} from '../utils';

// Root notes for chord generation
const CHORD_ROOTS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
const BASS_CHORD_ROOTS = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3'];

// Inversion names
const INVERSION_NAMES = ['Root position', '1st inversion', '2nd inversion', '3rd inversion'];

// Generate an inverted chord
function invertChord(notes: string[], inversion: number): string[] {
  if (inversion === 0 || notes.length === 0) return notes;

  const inverted = [...notes];
  for (let i = 0; i < inversion && i < notes.length - 1; i++) {
    // Move the bottom note up an octave
    const bottomNote = inverted.shift()!;
    const noteName = getNoteNameOnly(bottomNote);
    const octave = parseInt(bottomNote.slice(-1)) + 1;
    inverted.push(`${noteName}${octave}`);
  }
  return inverted;
}

// Generate a single chord identification question
export function generateChordQuestion(settings: ChordSettings): GeneratedQuestion {
  const { chordTypes, inversions, clef: clefSetting } = settings;

  // Get the clef to use
  const clef = clefSetting ? getRandomClef(clefSetting) : 'treble';

  // Select roots based on clef
  const roots = clef === 'bass' ? BASS_CHORD_ROOTS : CHORD_ROOTS;

  // Select a random chord type
  const chordTypeId = getRandomFromArray(chordTypes);
  const chordType = getChordById(chordTypeId);

  if (!chordType) {
    throw new Error(`Invalid chord type: ${chordTypeId}`);
  }

  // Select a random root
  const root = getRandomFromArray(roots);
  const rootName = getNoteNameOnly(root);

  // Build the chord
  let chordNotes = buildChord(root, chordTypeId);

  // Apply inversion if allowed
  let inversion = 0;
  if (inversions === 'all' && chordNotes.length > 1) {
    const maxInversion = Math.min(chordNotes.length - 1, 2);
    inversion = Math.floor(Math.random() * (maxInversion + 1));
    chordNotes = invertChord(chordNotes, inversion);
  }

  // Convert to VexFlow format
  const vexNotes = chordNotes.map(toneToVex);

  // Format the chord name for display
  const chordDisplay = `${formatNoteDisplay(rootName)} ${chordType.name}`;

  // Generate distractors - same root, different chord types
  const sameRootChords = chordTypes.map(typeId => {
    const type = getChordById(typeId);
    return `${formatNoteDisplay(rootName)} ${type?.name || typeId}`;
  });

  // Also add some distractors with different roots but same chord type
  const otherRoots = roots.filter(r => r !== root).slice(0, 2);
  const differentRootChords = otherRoots.map(otherRoot => {
    const otherRootName = getNoteNameOnly(otherRoot);
    return `${formatNoteDisplay(otherRootName)} ${chordType.name}`;
  });

  // Combine and deduplicate the pool
  const allChordNames = [...new Set([...sameRootChords, ...differentRootChords])];

  const distractors = generateDistractors(chordDisplay, allChordNames, settings.answerChoices - 1);
  const options = createAnswerOptions(chordDisplay, distractors);

  let question = 'What chord is shown?';
  if (inversions === 'all' && inversion > 0) {
    question = `What chord is shown? (${INVERSION_NAMES[inversion]})`;
  }

  return {
    id: generateId(),
    type: 'chordIdentification',
    question,
    notes: vexNotes,
    options,
    correctAnswer: chordDisplay,
    clef,
    explanation: `This is a ${chordDisplay}${
      inversion > 0 ? ` in ${INVERSION_NAMES[inversion].toLowerCase()}` : ''
    }. The notes are ${chordNotes.map(formatNoteDisplay).join(', ')}.`,
  };
}

// Generate multiple chord identification questions
export function generateChordQuestions(
  settings: ChordSettings,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const recentChords: string[] = [];

  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion;
    let attempts = 0;

    do {
      question = generateChordQuestion(settings);
      attempts++;
    } while (
      recentChords.includes(question.correctAnswer) &&
      attempts < 10
    );

    recentChords.push(question.correctAnswer);
    if (recentChords.length > 3) {
      recentChords.shift();
    }

    questions.push(question);
  }

  return questions;
}
