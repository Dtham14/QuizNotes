import type { EarTrainingSubtype, EarTrainingAudioData } from '@/lib/types/earTraining';

let ToneModule: typeof import('tone') | null = null;
let piano: import('tone').Sampler | null = null;
let isInitialized = false;
let isLoading = false;

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
  if (isLoading) {
    // Wait for loading to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return isInitialized;
  }

  isLoading = true;

  try {
    const Tone = await loadTone();
    await Tone.start();

    // Use real piano samples from a CDN (Salamander Grand Piano)
    // These are high-quality piano samples
    const baseUrl = 'https://tonejs.github.io/audio/salamander/';

    piano = new Tone.Sampler({
      urls: {
        'A0': 'A0.mp3',
        'C1': 'C1.mp3',
        'D#1': 'Ds1.mp3',
        'F#1': 'Fs1.mp3',
        'A1': 'A1.mp3',
        'C2': 'C2.mp3',
        'D#2': 'Ds2.mp3',
        'F#2': 'Fs2.mp3',
        'A2': 'A2.mp3',
        'C3': 'C3.mp3',
        'D#3': 'Ds3.mp3',
        'F#3': 'Fs3.mp3',
        'A3': 'A3.mp3',
        'C4': 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        'A4': 'A4.mp3',
        'C5': 'C5.mp3',
        'D#5': 'Ds5.mp3',
        'F#5': 'Fs5.mp3',
        'A5': 'A5.mp3',
        'C6': 'C6.mp3',
        'D#6': 'Ds6.mp3',
        'F#6': 'Fs6.mp3',
        'A6': 'A6.mp3',
        'C7': 'C7.mp3',
        'D#7': 'Ds7.mp3',
        'F#7': 'Fs7.mp3',
        'A7': 'A7.mp3',
        'C8': 'C8.mp3',
      },
      baseUrl,
      release: 1,
      onload: () => {
        console.log('Piano samples loaded');
      }
    }).toDestination();

    // Wait for samples to load
    await Tone.loaded();

    isInitialized = true;
    isLoading = false;
    return true;
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    isLoading = false;
    return false;
  }
}

// Check if audio is ready
export function isAudioReady(): boolean {
  return isInitialized && piano !== null;
}

// Play a single note
export async function playNote(note: string, duration: string = '2n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  if (piano) {
    const Tone = await loadTone();
    piano.triggerAttackRelease(note, duration, Tone.now());
  }
}

// Play a chord (all notes simultaneously)
export async function playChord(notes: string[], duration: string = '2n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  if (piano) {
    const Tone = await loadTone();
    piano.triggerAttackRelease(notes, duration, Tone.now());
  }
}

// Play an interval (notes sequentially)
export async function playInterval(notes: string[], duration: string = '2n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  if (piano) {
    const Tone = await loadTone();
    const now = Tone.now();

    notes.forEach((note, index) => {
      piano!.triggerAttackRelease(note, duration, now + index * 0.8);
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
