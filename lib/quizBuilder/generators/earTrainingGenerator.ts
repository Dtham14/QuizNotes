// Ear Training Question Generator

import type {
  EarTrainingNoteSettings,
  IntervalSettings,
  ChordSettings,
  GeneratedQuestion,
} from '../types';
import { ALL_INTERVALS, ALL_CHORD_TYPES } from '../types';
import {
  generateId,
  getRandomFromArray,
  generateDistractors,
  createAnswerOptions,
  getNotesInRange,
  getIntervalById,
  getIntervalNote,
  getChordById,
  buildChord,
  formatNoteDisplay,
  getNoteNameOnly,
} from '../utils';

// ============================================
// Note Recognition
// ============================================

export function generateEarTrainingNoteQuestion(
  settings: EarTrainingNoteSettings
): GeneratedQuestion {
  const { pitchRange } = settings;

  // Get available notes (natural notes only for ear training)
  const availableNotes = getNotesInRange(pitchRange.min, pitchRange.max, 'natural');

  if (availableNotes.length === 0) {
    throw new Error('No notes available in the specified range');
  }

  // Select a random note
  const selectedNote = getRandomFromArray(availableNotes);
  const noteName = getNoteNameOnly(selectedNote);

  // Get all unique note names for options
  const allNoteNames = [...new Set(availableNotes.map(getNoteNameOnly))];
  const distractors = generateDistractors(noteName, allNoteNames, settings.answerChoices - 1);
  const options = createAnswerOptions(noteName, distractors);

  return {
    id: generateId(),
    type: 'earTrainingNote',
    question: 'What note do you hear?',
    options: options.map(formatNoteDisplay),
    correctAnswer: formatNoteDisplay(noteName),
    audioData: {
      subtype: 'note',
      notes: [selectedNote],
      duration: '2n',
    },
    explanation: `The note played was ${formatNoteDisplay(selectedNote)}.`,
  };
}

export function generateEarTrainingNoteQuestions(
  settings: EarTrainingNoteSettings,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const recentNotes: string[] = [];

  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion;
    let attempts = 0;

    do {
      question = generateEarTrainingNoteQuestion(settings);
      attempts++;
    } while (
      recentNotes.includes(question.correctAnswer) &&
      attempts < 10
    );

    recentNotes.push(question.correctAnswer);
    if (recentNotes.length > 3) {
      recentNotes.shift();
    }

    questions.push(question);
  }

  return questions;
}

// ============================================
// Interval Recognition
// ============================================

export function generateEarTrainingIntervalQuestion(
  settings: IntervalSettings
): GeneratedQuestion {
  const { intervals, direction: directionSetting } = settings;

  // Base notes for interval (middle range works well for ear training)
  const baseNotes = ['C4', 'D4', 'E4', 'F4', 'G4'];

  // Select a random interval
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

  // Select a base note and calculate second note with proper interval spelling
  const baseNote = getRandomFromArray(baseNotes);
  const secondNote = getIntervalNote(baseNote, intervalId, isAscending);

  // Notes for audio playback (played sequentially for intervals)
  const audioNotes = [baseNote, secondNote];

  // Generate distractors (deduplicated)
  const allIntervalNames = [...new Set(intervals.map(id => getIntervalById(id)?.name || id))];
  const distractors = generateDistractors(
    interval.name,
    allIntervalNames,
    settings.answerChoices - 1
  );
  const options = createAnswerOptions(interval.name, distractors);

  const directionText = direction === 'ascending' ? 'ascending' : 'descending';

  return {
    id: generateId(),
    type: 'earTrainingInterval',
    question: `What interval do you hear? (${directionText})`,
    options,
    correctAnswer: interval.name,
    audioData: {
      subtype: 'interval',
      notes: audioNotes,
      duration: '2n',
    },
    explanation: `The interval played was a ${interval.name} (${interval.semitones} semitones).`,
  };
}

export function generateEarTrainingIntervalQuestions(
  settings: IntervalSettings,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const recentIntervals: string[] = [];

  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion;
    let attempts = 0;

    do {
      question = generateEarTrainingIntervalQuestion(settings);
      attempts++;
    } while (
      recentIntervals.includes(question.correctAnswer) &&
      attempts < 10
    );

    recentIntervals.push(question.correctAnswer);
    if (recentIntervals.length > 3) {
      recentIntervals.shift();
    }

    questions.push(question);
  }

  return questions;
}

// ============================================
// Chord Recognition
// ============================================

export function generateEarTrainingChordQuestion(
  settings: ChordSettings
): GeneratedQuestion {
  const { chordTypes } = settings;

  // Root notes for chords
  const roots = ['C4', 'D4', 'E4', 'F4', 'G4'];

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
  const chordNotes = buildChord(root, chordTypeId);

  // Format chord name
  const chordDisplay = `${formatNoteDisplay(rootName)} ${chordType.name}`;

  // Generate distractors - same root, different types (deduplicated)
  const allChordNames = [...new Set(chordTypes.map(typeId => {
    const type = getChordById(typeId);
    return `${formatNoteDisplay(rootName)} ${type?.name || typeId}`;
  }))];

  const distractors = generateDistractors(chordDisplay, allChordNames, settings.answerChoices - 1);
  const options = createAnswerOptions(chordDisplay, distractors);

  return {
    id: generateId(),
    type: 'earTrainingChord',
    question: 'What chord do you hear?',
    options,
    correctAnswer: chordDisplay,
    audioData: {
      subtype: 'chord',
      notes: chordNotes,
      duration: '2n',
    },
    explanation: `The chord played was ${chordDisplay}. The notes are ${chordNotes.map(formatNoteDisplay).join(', ')}.`,
  };
}

export function generateEarTrainingChordQuestions(
  settings: ChordSettings,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const recentChords: string[] = [];

  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion;
    let attempts = 0;

    do {
      question = generateEarTrainingChordQuestion(settings);
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
