// Key Signature Question Generator

import type { KeySignatureSettings, GeneratedQuestion } from '../types';
import { KEY_SIGNATURES } from '../types';
import {
  generateId,
  getRandomFromArray,
  generateDistractors,
  createAnswerOptions,
  getRandomClef,
  shuffleArray,
} from '../utils';

// Get available keys based on settings
function getAvailableKeys(settings: KeySignatureSettings) {
  let keys: typeof KEY_SIGNATURES.major = [];

  if (settings.keyTypes === 'major' || settings.keyTypes === 'both') {
    keys.push(...KEY_SIGNATURES.major);
  }
  if (settings.keyTypes === 'minor' || settings.keyTypes === 'both') {
    keys.push(...KEY_SIGNATURES.minor);
  }

  // Default to 7 if maxSharps/maxFlats not set (for saved settings without these fields)
  const maxSharps = settings.maxSharps ?? 7;
  const maxFlats = settings.maxFlats ?? 7;

  // Filter by max sharps and flats
  keys = keys.filter(key => {
    if (key.sharps > 0) {
      return key.sharps <= maxSharps;
    }
    if (key.flats > 0) {
      return key.flats <= maxFlats;
    }
    // C major / A minor (no sharps or flats) - always include if either limit > 0
    return maxSharps > 0 || maxFlats > 0;
  });

  return keys;
}

// Generate a "staff to name" question (show key signature, identify key)
function generateStaffToNameQuestion(
  settings: KeySignatureSettings,
  availableKeys: typeof KEY_SIGNATURES.major
): GeneratedQuestion {
  const clef = getRandomClef(settings.clef);
  const selectedKey = getRandomFromArray(availableKeys);

  // Format the key name for display
  const keyDisplay = selectedKey.key.includes('m')
    ? `${selectedKey.key.replace('m', '')} minor`
    : `${selectedKey.key} major`;

  // Generate distractors from other keys (deduplicated)
  const allKeyNames = [...new Set(availableKeys.map(k =>
    k.key.includes('m') ? `${k.key.replace('m', '')} minor` : `${k.key} major`
  ))];
  const distractors = generateDistractors(keyDisplay, allKeyNames, settings.answerChoices - 1);
  const options = createAnswerOptions(keyDisplay, distractors);

  // Determine the VexFlow key signature format
  let vexKey = selectedKey.key;
  if (selectedKey.key.includes('m')) {
    // Minor key - VexFlow uses the relative major's key signature
    // But we can also pass the minor key directly in some versions
    vexKey = selectedKey.key;
  }

  return {
    id: generateId(),
    type: 'keySignature',
    question: 'What key is represented by this key signature?',
    keySignature: vexKey,
    options,
    correctAnswer: keyDisplay,
    clef,
    explanation: `This key signature has ${
      selectedKey.sharps > 0
        ? `${selectedKey.sharps} sharp${selectedKey.sharps > 1 ? 's' : ''}`
        : selectedKey.flats > 0
        ? `${selectedKey.flats} flat${selectedKey.flats > 1 ? 's' : ''}`
        : 'no sharps or flats'
    }, indicating ${keyDisplay}.`,
  };
}

// Helper to get unique display value for a key signature
function getKeySignatureDisplay(keyInfo: typeof KEY_SIGNATURES.major[0]): string {
  if (keyInfo.sharps > 0) {
    return `${keyInfo.sharps} sharp${keyInfo.sharps > 1 ? 's' : ''}`;
  }
  if (keyInfo.flats > 0) {
    return `${keyInfo.flats} flat${keyInfo.flats > 1 ? 's' : ''}`;
  }
  return 'No sharps/flats';
}

// Generate a "name to staff" question (show key name, identify signature)
function generateNameToStaffQuestion(
  settings: KeySignatureSettings,
  availableKeys: typeof KEY_SIGNATURES.major
): GeneratedQuestion {
  const clef = getRandomClef(settings.clef);
  const selectedKey = getRandomFromArray(availableKeys);

  // Format the key name for the question
  const keyDisplay = selectedKey.key.includes('m')
    ? `${selectedKey.key.replace('m', '')} minor`
    : `${selectedKey.key} major`;

  const correctDisplay = getKeySignatureDisplay(selectedKey);

  // Filter available keys to only those with UNIQUE display values (different # of sharps/flats)
  // This prevents duplicates like C major and A minor both showing "No sharps/flats"
  const usedDisplays = new Set<string>();
  usedDisplays.add(correctDisplay);

  const uniqueDistractorKeys: typeof KEY_SIGNATURES.major = [];

  // Shuffle available keys to get random selection
  const shuffledKeys = shuffleArray(availableKeys.filter(k => k.key !== selectedKey.key));

  for (const key of shuffledKeys) {
    const display = getKeySignatureDisplay(key);
    if (!usedDisplays.has(display)) {
      usedDisplays.add(display);
      uniqueDistractorKeys.push(key);
    }
    if (uniqueDistractorKeys.length >= settings.answerChoices - 1) {
      break;
    }
  }

  // Create option notations for visual display
  const allOptionKeys = shuffleArray([selectedKey, ...uniqueDistractorKeys]);
  const optionNotations = allOptionKeys.map(keyInfo => {
    const display = getKeySignatureDisplay(keyInfo);
    return { key: keyInfo.key, display };
  });

  return {
    id: generateId(),
    type: 'keySignature',
    question: `Which key signature represents ${keyDisplay}?`,
    options: optionNotations.map(o => o.display),
    optionNotations,
    correctAnswer: correctDisplay,
    clef,
    explanation: `${keyDisplay} has ${
      selectedKey.sharps > 0
        ? `${selectedKey.sharps} sharp${selectedKey.sharps > 1 ? 's' : ''}: ${selectedKey.signature}`
        : selectedKey.flats > 0
        ? `${selectedKey.flats} flat${selectedKey.flats > 1 ? 's' : ''}: ${selectedKey.signature}`
        : 'no sharps or flats'
    }.`,
  };
}

// Generate a single key signature question
export function generateKeySignatureQuestion(settings: KeySignatureSettings): GeneratedQuestion {
  const availableKeys = getAvailableKeys(settings);

  if (availableKeys.length === 0) {
    throw new Error('No keys available with the specified settings');
  }

  // Determine question direction
  let direction = settings.direction;
  if (direction === 'both') {
    direction = Math.random() < 0.5 ? 'staffToName' : 'nameToStaff';
  }

  if (direction === 'staffToName') {
    return generateStaffToNameQuestion(settings, availableKeys);
  } else {
    return generateNameToStaffQuestion(settings, availableKeys);
  }
}

// Generate multiple key signature questions
export function generateKeySignatureQuestions(
  settings: KeySignatureSettings,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const usedKeys = new Set<string>();

  for (let i = 0; i < count; i++) {
    let question: GeneratedQuestion;
    let attempts = 0;

    do {
      question = generateKeySignatureQuestion(settings);
      attempts++;
    } while (
      usedKeys.has(question.keySignature || question.correctAnswer) &&
      attempts < 10
    );

    usedKeys.add(question.keySignature || question.correctAnswer);
    if (usedKeys.size > count / 2) {
      const first = usedKeys.values().next().value;
      if (first) usedKeys.delete(first);
    }

    questions.push(question);
  }

  return questions;
}
