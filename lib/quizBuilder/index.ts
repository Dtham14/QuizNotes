// Quiz Builder - Main Entry Point

// Re-export types
export * from './types';
export * from './presets';
export * from './utils';
export * from './mixedQuizGenerator';

// Import generators
import { generateNoteQuestions } from './generators/noteGenerator';
import { generateKeySignatureQuestions } from './generators/keySignatureGenerator';
import { generateIntervalQuestions } from './generators/intervalGenerator';
import { generateChordQuestions } from './generators/chordGenerator';
import { generateScaleQuestions } from './generators/scaleGenerator';
import {
  generateEarTrainingNoteQuestions,
  generateEarTrainingIntervalQuestions,
  generateEarTrainingChordQuestions,
} from './generators/earTrainingGenerator';

import type {
  QuizSettings,
  GeneratedQuestion,
  NoteIdentificationSettings,
  KeySignatureSettings,
  IntervalSettings,
  ChordSettings,
  ScaleSettings,
  EarTrainingNoteSettings,
} from './types';

// Main function to generate questions based on settings
export function generateQuestions(settings: QuizSettings): GeneratedQuestion[] {
  const count = settings.questionCount;

  switch (settings.quizType) {
    case 'noteIdentification':
      return generateNoteQuestions(settings as NoteIdentificationSettings, count);

    case 'keySignature':
      return generateKeySignatureQuestions(settings as KeySignatureSettings, count);

    case 'intervalIdentification':
      return generateIntervalQuestions(settings as IntervalSettings, count);

    case 'chordIdentification':
      return generateChordQuestions(settings as ChordSettings, count);

    case 'scaleIdentification':
      return generateScaleQuestions(settings as ScaleSettings, count);

    case 'earTrainingNote':
      return generateEarTrainingNoteQuestions(settings as EarTrainingNoteSettings, count);

    case 'earTrainingInterval':
      return generateEarTrainingIntervalQuestions(settings as IntervalSettings, count);

    case 'earTrainingChord':
      return generateEarTrainingChordQuestions(settings as ChordSettings, count);

    default:
      throw new Error(`Unknown quiz type: ${(settings as QuizSettings).quizType}`);
  }
}

// Export individual generators for direct use
export {
  generateNoteQuestions,
  generateKeySignatureQuestions,
  generateIntervalQuestions,
  generateChordQuestions,
  generateScaleQuestions,
  generateEarTrainingNoteQuestions,
  generateEarTrainingIntervalQuestions,
  generateEarTrainingChordQuestions,
};
