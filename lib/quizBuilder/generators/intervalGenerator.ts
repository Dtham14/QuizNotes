// Interval Identification Question Generator

import type { IntervalSettings, GeneratedQuestion } from '../types';
import {
  generateId,
  getRandomFromArray,
  generateDistractors,
  createAnswerOptions,
  getRandomClef,
  getIntervalById,
  getIntervalNote,
  toneToVex,
  getOctave,
} from '../utils';

// Base notes for interval generation (middle range) - natural notes only for cleaner intervals
const BASE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
const BASS_BASE_NOTES = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3'];

// Generate a single interval identification question
export function generateIntervalQuestion(settings: IntervalSettings): GeneratedQuestion {
  const { intervals, direction: directionSetting, clef: clefSetting } = settings;

  // Get the clef to use
  const clef = clefSetting ? getRandomClef(clefSetting) : 'treble';

  // Select base notes based on clef
  const baseNotes = clef === 'bass' ? BASS_BASE_NOTES : BASE_NOTES;

  // Select a random interval from the allowed list
  const intervalId = getRandomFromArray(intervals);
  const interval = getIntervalById(intervalId);

  if (!interval) {
    throw new Error(`Invalid interval: ${intervalId}`);
  }

  // Determine direction
  let direction = directionSetting;
  if (direction === 'both') {
    direction = Math.random() < 0.5 ? 'ascending' : 'descending';
  }

  const isAscending = direction === 'ascending';

  // Select a base note that allows the interval within range
  let baseNote: string;
  let secondNote: string;
  let attempts = 0;

  do {
    baseNote = getRandomFromArray(baseNotes);
    // Use proper interval spelling
    secondNote = getIntervalNote(baseNote, intervalId, isAscending);
    attempts++;
  } while (
    (getOctave(secondNote) < 2 || getOctave(secondNote) > 6) &&
    attempts < 20
  );

  // Create the notes array for display (lower note first, then higher note)
  const notes = isAscending
    ? [toneToVex(baseNote), toneToVex(secondNote)]
    : [toneToVex(secondNote), toneToVex(baseNote)];

  // Generate distractors from other intervals in the settings (deduplicated)
  const allIntervalNames = [...new Set(intervals.map(id => getIntervalById(id)?.name || id))];
  const distractorNames = generateDistractors(
    interval.name,
    allIntervalNames,
    settings.answerChoices - 1
  );

  const options = createAnswerOptions(interval.name, distractorNames);

  const directionText = direction === 'ascending' ? 'ascending' : 'descending';

  return {
    id: generateId(),
    type: 'intervalIdentification',
    question: `What is the interval between these two notes? (${directionText})`,
    notes,
    options,
    correctAnswer: interval.name,
    clef,
    explanation: `The interval from ${baseNote} to ${secondNote} is a ${interval.name} (${interval.semitones} semitones).`,
  };
}

// Generate multiple interval identification questions
export function generateIntervalQuestions(
  settings: IntervalSettings,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const recentIntervals: string[] = [];

  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion;
    let attempts = 0;

    // Try to avoid repeating the same interval consecutively
    do {
      question = generateIntervalQuestion(settings);
      attempts++;
    } while (
      recentIntervals.includes(question.correctAnswer) &&
      attempts < 10
    );

    // Track recent intervals
    recentIntervals.push(question.correctAnswer);
    if (recentIntervals.length > 3) {
      recentIntervals.shift();
    }

    questions.push(question);
  }

  return questions;
}
