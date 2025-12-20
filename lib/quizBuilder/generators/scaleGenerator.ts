// Scale Identification Question Generator

import type { ScaleSettings, GeneratedQuestion } from '../types';
import { ALL_SCALE_TYPES } from '../types';
import {
  generateId,
  getRandomFromArray,
  generateDistractors,
  createAnswerOptions,
  getRandomClef,
  getScaleById,
  buildScale,
  toneToVex,
  formatScaleDisplay,
  formatNoteDisplay,
  getNoteNameOnly,
} from '../utils';

// Root notes for scale generation
const SCALE_ROOTS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
const BASS_SCALE_ROOTS = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3'];

// Generate a single scale identification question
export function generateScaleQuestion(settings: ScaleSettings): GeneratedQuestion {
  const { scaleTypes, clef: clefSetting } = settings;

  // Get the clef to use
  const clef = getRandomClef(clefSetting);

  // Select roots based on clef
  const roots = clef === 'bass' ? BASS_SCALE_ROOTS : SCALE_ROOTS;

  // Select a random scale type
  const scaleTypeId = getRandomFromArray(scaleTypes);
  const scaleType = getScaleById(scaleTypeId);

  if (!scaleType) {
    throw new Error(`Invalid scale type: ${scaleTypeId}`);
  }

  // Select a random root
  const root = getRandomFromArray(roots);
  const rootName = getNoteNameOnly(root);

  // Build the scale (includes 8 notes for full octave)
  const scaleNotes = buildScale(root, scaleTypeId);

  // Add the octave
  const octaveNote = `${rootName}${parseInt(root.slice(-1)) + 1}`;
  scaleNotes.push(octaveNote);

  // Convert to VexFlow format
  const vexNotes = scaleNotes.map(toneToVex);

  // Format the scale name for display
  const scaleDisplay = `${formatNoteDisplay(rootName)} ${scaleType.name}`;

  // Generate distractors from ALL scale types (not just selected ones) to ensure enough options
  // Use same root but different scale types
  const allScaleNames = [...new Set(ALL_SCALE_TYPES.map(type =>
    `${formatNoteDisplay(rootName)} ${type.name}`
  ))];

  const distractors = generateDistractors(scaleDisplay, allScaleNames, settings.answerChoices - 1);
  const options = createAnswerOptions(scaleDisplay, distractors);

  return {
    id: generateId(),
    type: 'scaleIdentification',
    question: 'What scale is shown?',
    notes: vexNotes,
    options,
    correctAnswer: scaleDisplay,
    clef,
    explanation: `This is a ${scaleDisplay}. The scale pattern defines the sequence of whole and half steps.`,
  };
}

// Generate multiple scale identification questions
export function generateScaleQuestions(
  settings: ScaleSettings,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const recentScales: string[] = [];

  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion;
    let attempts = 0;

    do {
      question = generateScaleQuestion(settings);
      attempts++;
    } while (
      recentScales.includes(question.correctAnswer) &&
      attempts < 10
    );

    recentScales.push(question.correctAnswer);
    if (recentScales.length > 3) {
      recentScales.shift();
    }

    questions.push(question);
  }

  return questions;
}
