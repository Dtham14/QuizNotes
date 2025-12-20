// Mixed Quiz Generator - Creates random questions from multiple quiz types

import { generateQuestions } from './index';
import { getDefaultSettings } from './presets';
import type { QuizType, GeneratedQuestion, Difficulty } from './types';

// Visual quiz types
const VISUAL_QUIZ_TYPES: QuizType[] = [
  'noteIdentification',
  'keySignature',
  'intervalIdentification',
  'chordIdentification',
  'scaleIdentification',
];

// Ear training quiz types
const EAR_TRAINING_QUIZ_TYPES: QuizType[] = [
  'earTrainingNote',
  'earTrainingInterval',
  'earTrainingChord',
];

// All quiz types
const ALL_QUIZ_TYPES: QuizType[] = [...VISUAL_QUIZ_TYPES, ...EAR_TRAINING_QUIZ_TYPES];

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export type MixedQuizCategory = 'visual' | 'earTraining' | 'all';

/**
 * Generate a mixed quiz with random questions from specified category
 * @param category - Which category of quizzes to include
 * @param totalQuestions - Total number of questions (default 10)
 * @param difficulty - Difficulty level (default 'intermediate')
 */
export function generateMixedQuiz(
  category: MixedQuizCategory,
  totalQuestions: number = 10,
  difficulty: Difficulty = 'intermediate'
): GeneratedQuestion[] {
  // Select quiz types based on category
  let quizTypes: QuizType[];
  switch (category) {
    case 'visual':
      quizTypes = VISUAL_QUIZ_TYPES;
      break;
    case 'earTraining':
      quizTypes = EAR_TRAINING_QUIZ_TYPES;
      break;
    case 'all':
    default:
      quizTypes = ALL_QUIZ_TYPES;
      break;
  }

  // Calculate questions per type to get a good distribution
  const questionsPerType = Math.max(2, Math.ceil(totalQuestions / quizTypes.length));

  // Generate questions from each type
  const allQuestions: GeneratedQuestion[] = [];

  for (const quizType of quizTypes) {
    try {
      const settings = getDefaultSettings(quizType, difficulty);
      // Generate a few questions from each type
      const typeQuestions = generateQuestions({
        ...settings,
        questionCount: questionsPerType,
      });
      allQuestions.push(...typeQuestions);
    } catch (error) {
      console.warn(`Failed to generate questions for ${quizType}:`, error);
    }
  }

  // Shuffle all questions
  const shuffled = shuffleArray(allQuestions);

  // Return the requested number of questions
  return shuffled.slice(0, totalQuestions);
}

// Export constants for use in UI
export { VISUAL_QUIZ_TYPES, EAR_TRAINING_QUIZ_TYPES, ALL_QUIZ_TYPES };
