export type EarTrainingSubtype = 'note' | 'chord' | 'interval';

export interface EarTrainingAudioData {
  notes: string[];  // Tone.js format: ['C4'], ['C4', 'E4', 'G4'], ['C4', 'E4']
  duration?: string; // e.g., '2n', '4n' - defaults to '2n'
}

export interface EarTrainingQuestion {
  type: 'ear-training';
  subtype: EarTrainingSubtype;
  question: string;
  audioData: EarTrainingAudioData;
  options: string[];
  correctAnswer: number;
}

// For quiz data compatibility
export interface EarTrainingQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  earTraining?: {
    subtype: EarTrainingSubtype;
    audioData: EarTrainingAudioData;
  };
}
