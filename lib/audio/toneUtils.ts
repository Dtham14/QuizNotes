import type { EarTrainingSubtype, EarTrainingAudioData } from '@/lib/types/earTraining';

let ToneModule: typeof import('tone') | null = null;
let synth: import('tone').PolySynth | null = null;
let isInitialized = false;

// Dynamically import Tone.js (client-side only)
async function loadTone() {
  if (!ToneModule) {
    ToneModule = await import('tone');
  }
  return ToneModule;
}

// Initialize audio context - must be called after user gesture
export async function initializeAudio(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    const Tone = await loadTone();
    await Tone.start();

    // Create a polyphonic synth for playing chords
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8
      }
    }).toDestination();

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    return false;
  }
}

// Check if audio is ready
export function isAudioReady(): boolean {
  return isInitialized && synth !== null;
}

// Play a single note
export async function playNote(note: string, duration: string = '2n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  if (synth) {
    const Tone = await loadTone();
    synth.triggerAttackRelease(note, duration, Tone.now());
  }
}

// Play a chord (all notes simultaneously)
export async function playChord(notes: string[], duration: string = '2n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  if (synth) {
    const Tone = await loadTone();
    synth.triggerAttackRelease(notes, duration, Tone.now());
  }
}

// Play an interval (notes sequentially)
export async function playInterval(notes: string[], duration: string = '4n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  if (synth) {
    const Tone = await loadTone();
    const now = Tone.now();

    notes.forEach((note, index) => {
      synth!.triggerAttackRelease(note, duration, now + index * 0.5);
    });
  }
}

// Main play function that handles different subtypes
export async function playEarTraining(
  subtype: EarTrainingSubtype,
  audioData: EarTrainingAudioData
): Promise<void> {
  const duration = audioData.duration || '2n';

  switch (subtype) {
    case 'note':
      await playNote(audioData.notes[0], duration);
      break;
    case 'chord':
      await playChord(audioData.notes, duration);
      break;
    case 'interval':
      await playInterval(audioData.notes, duration);
      break;
  }
}

// Convert VexFlow note format (c/4) to Tone.js format (C4)
export function vexToTone(vexNote: string): string {
  const [noteName, octave] = vexNote.split('/');
  return noteName.toUpperCase() + octave;
}

// Convert Tone.js format (C4) to VexFlow format (c/4)
export function toneToVex(toneNote: string): string {
  const match = toneNote.match(/^([A-Ga-g][#b]?)(\d)$/);
  if (!match) return 'c/4';
  return match[1].toLowerCase() + '/' + match[2];
}
