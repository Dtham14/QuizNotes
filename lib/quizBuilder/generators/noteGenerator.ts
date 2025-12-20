// Note Identification Question Generator

import type { NoteIdentificationSettings, GeneratedQuestion } from '../types';
import {
  generateId,
  getNotesInRange,
  getRandomFromArray,
  generateDistractors,
  createAnswerOptions,
  toneToVex,
  formatNoteDisplay,
  getNoteNameOnly,
  getRandomClef,
} from '../utils';

// Clef-specific pitch ranges
const TREBLE_RANGE = { min: 'C4', max: 'C6' };
const BASS_RANGE = { min: 'C2', max: 'C4' };

// Constrain a pitch range to the clef's valid range
function constrainRangeToClef(
  pitchRange: { min: string; max: string },
  clef: 'treble' | 'bass'
): { min: string; max: string } {
  const clefRange = clef === 'treble' ? TREBLE_RANGE : BASS_RANGE;

  // Helper to compare notes (assumes format like 'C4', 'D5', etc.)
  const noteValue = (note: string): number => {
    const letter = note.charAt(0);
    const octave = parseInt(note.slice(-1));
    const letterValues: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    return octave * 7 + (letterValues[letter] || 0);
  };

  const minVal = noteValue(pitchRange.min);
  const maxVal = noteValue(pitchRange.max);
  const clefMinVal = noteValue(clefRange.min);
  const clefMaxVal = noteValue(clefRange.max);

  // Constrain to clef range
  const constrainedMin = minVal < clefMinVal ? clefRange.min : (minVal > clefMaxVal ? clefRange.max : pitchRange.min);
  const constrainedMax = maxVal > clefMaxVal ? clefRange.max : (maxVal < clefMinVal ? clefRange.min : pitchRange.max);

  return { min: constrainedMin, max: constrainedMax };
}

// Generate a single note identification question
export function generateNoteQuestion(settings: NoteIdentificationSettings): GeneratedQuestion {
  const { pitchRange, accidentals, clef: clefSetting } = settings;

  // Get the clef to use first (so we can constrain the range)
  const clef = getRandomClef(clefSetting);

  // Constrain pitch range to the selected clef's valid range
  const effectiveRange = clefSetting === 'both'
    ? constrainRangeToClef(pitchRange, clef)
    : pitchRange;

  // Get available notes based on constrained range
  const availableNotes = getNotesInRange(effectiveRange.min, effectiveRange.max, accidentals);

  if (availableNotes.length === 0) {
    throw new Error('No notes available in the specified range');
  }

  // Select a random note
  const selectedNote = getRandomFromArray(availableNotes);
  const noteName = getNoteNameOnly(selectedNote);

  // Generate distractor note names (without octave)
  const allNoteNames = [...new Set(availableNotes.map(getNoteNameOnly))];
  const distractors = generateDistractors(noteName, allNoteNames, settings.answerChoices - 1);

  // Create answer options
  const options = createAnswerOptions(noteName, distractors);

  return {
    id: generateId(),
    type: 'noteIdentification',
    question: 'What note is shown on the staff?',
    notes: [toneToVex(selectedNote)],
    options: options.map(formatNoteDisplay),
    correctAnswer: formatNoteDisplay(noteName),
    clef,
    explanation: `The note shown is ${formatNoteDisplay(noteName)}.`,
  };
}

// Generate multiple note identification questions
export function generateNoteQuestions(
  settings: NoteIdentificationSettings,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const usedNotes = new Set<string>();

  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion;
    let attempts = 0;

    // Try to generate a unique question (avoid immediate repeats)
    do {
      question = generateNoteQuestion(settings);
      attempts++;
    } while (
      usedNotes.has(question.notes?.[0] || '') &&
      attempts < 10 &&
      usedNotes.size < count
    );

    // Track used notes to reduce repetition
    if (question.notes?.[0]) {
      usedNotes.add(question.notes[0]);
      // Clear old entries if set gets too large
      if (usedNotes.size > count / 2) {
        const first = usedNotes.values().next().value;
        if (first) usedNotes.delete(first);
      }
    }

    questions.push(question);
  }

  return questions;
}
