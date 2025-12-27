import type { EarTrainingSubtype, EarTrainingAudioData } from '@/lib/types/earTraining';

export type InstrumentType = 'piano' | 'violin' | 'flute';

export const INSTRUMENTS: { id: InstrumentType; label: string }[] = [
  { id: 'piano', label: 'Piano' },
  { id: 'violin', label: 'Violin' },
  { id: 'flute', label: 'Flute' },
];

let ToneModule: typeof import('tone') | null = null;
let piano: import('tone').Sampler | null = null;
let synths: Map<InstrumentType, import('tone').PolySynth> = new Map();
let currentInstrument: InstrumentType = 'piano';
let isInitialized = false;
let isLoading = false;
let isMobile = false;

// Detect if we're on mobile
function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
}

// Detect if we're on iOS
function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

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

    // Detect if we're on mobile
    isMobile = detectMobile();

    // Start audio context - required for mobile browsers
    await Tone.start();

    // iOS-specific: Force unlock the audio context
    if (isIOS()) {
      // Create a silent buffer and play it to unlock audio on iOS
      const buffer = Tone.context.createBuffer(1, 1, 22050);
      const source = Tone.context.createBufferSource();
      source.buffer = buffer;
      // Use the raw Web Audio API destination
      const rawContext = Tone.context.rawContext as AudioContext;
      source.connect(rawContext.destination);
      source.start(0);

      // Multiple resume attempts for iOS
      for (let i = 0; i < 3; i++) {
        if (Tone.context.state === 'suspended') {
          await Tone.context.resume();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    // Explicitly resume audio context if suspended (for all browsers)
    if (Tone.context.state === 'suspended') {
      await Tone.context.resume();
    }

    // On mobile, use lightweight synth instead of heavy samples
    if (isMobile) {
      // iOS-specific: Use even simpler synth for better compatibility
      if (isIOS()) {
        const simpleSynth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 }
        }).toDestination();
        simpleSynth.volume.value = 0;  // Full volume for iOS
        piano = simpleSynth as any;
      } else {
        // Android and other mobile: Use richer synth
        const mobilePianoSynth = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: 'triangle8'  // Richer harmonics for piano-like sound
          },
          envelope: {
            attack: 0.005,     // Quick attack like a piano
            decay: 0.3,        // Moderate decay
            sustain: 0.4,      // Lower sustain
            release: 1.2       // Longer release for piano-like tail
          }
        }).toDestination();
        mobilePianoSynth.volume.value = -8;
        piano = mobilePianoSynth as any;
      }
    } else {
      // Desktop: Use real piano samples from CDN
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
        release: 1
      }).toDestination();

      // Wait for samples to load
      await Tone.loaded();
    }

    // Create synths for other instruments
    // Violin - warm, string-like sound using FM synthesis
    const violinSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.2, decay: 0.3, sustain: 0.8, release: 1.2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.5, decay: 0.1, sustain: 0.5, release: 0.5 }
    }).toDestination();
    violinSynth.volume.value = -14;
    synths.set('violin', violinSynth);

    // Flute - pure, airy tone with sine wave
    const fluteSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.8 }
    }).toDestination();
    fluteSynth.volume.value = -12;
    synths.set('flute', fluteSynth);

    isInitialized = true;
    isLoading = false;
    return true;
  } catch (error) {
    isLoading = false;
    return false;
  }
}

// Check if audio is ready
export function isAudioReady(): boolean {
  return isInitialized && piano !== null;
}

// Get current instrument
export function getCurrentInstrument(): InstrumentType {
  return currentInstrument;
}

// Set current instrument
export function setCurrentInstrument(instrument: InstrumentType): void {
  currentInstrument = instrument;
}

// Get the active instrument for playback
function getActiveInstrument(): import('tone').Sampler | import('tone').PolySynth | null {
  if (currentInstrument === 'piano') {
    return piano;
  }
  return synths.get(currentInstrument) || null;
}

// Play a single note
export async function playNote(note: string, duration: string = '2n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  const instrument = getActiveInstrument();

  if (instrument) {
    const Tone = await loadTone();

    // iOS-specific: Always resume on iOS before playing
    if (isIOS() && Tone.context.state !== 'running') {
      await Tone.context.resume();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Ensure audio context is resumed (mobile fix)
    if (Tone.context.state === 'suspended') {
      await Tone.context.resume();
    }

    // Final check - if still not running, try one more time
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }

    instrument.triggerAttackRelease(note, duration, Tone.now());
  }
}

// Play a chord (all notes simultaneously)
export async function playChord(notes: string[], duration: string = '2n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  const instrument = getActiveInstrument();
  if (instrument) {
    const Tone = await loadTone();

    // iOS-specific: Always resume on iOS before playing
    if (isIOS() && Tone.context.state !== 'running') {
      await Tone.context.resume();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Ensure audio context is resumed (mobile fix)
    if (Tone.context.state === 'suspended') {
      await Tone.context.resume();
    }

    instrument.triggerAttackRelease(notes, duration, Tone.now());
  }
}

// Play an interval (notes sequentially)
export async function playInterval(notes: string[], duration: string = '2n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  const instrument = getActiveInstrument();
  if (instrument) {
    const Tone = await loadTone();

    // iOS-specific: Always resume on iOS before playing
    if (isIOS() && Tone.context.state !== 'running') {
      await Tone.context.resume();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Ensure audio context is resumed (mobile fix)
    if (Tone.context.state === 'suspended') {
      await Tone.context.resume();
    }

    const now = Tone.now();

    notes.forEach((note, index) => {
      instrument.triggerAttackRelease(note, duration, now + index * 0.8);
    });
  }
}

// Play a sequence of note groups (each group plays together, groups play in sequence)
// noteGroups: array of arrays - each inner array is played as a chord, groups are sequential
export async function playSequence(noteGroups: string[][], duration: string = '2n'): Promise<void> {
  if (!isAudioReady()) {
    await initializeAudio();
  }

  const instrument = getActiveInstrument();
  if (instrument) {
    const Tone = await loadTone();

    // iOS-specific: Always resume on iOS before playing
    if (isIOS() && Tone.context.state !== 'running') {
      await Tone.context.resume();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Ensure audio context is resumed (mobile fix)
    if (Tone.context.state === 'suspended') {
      await Tone.context.resume();
    }

    const now = Tone.now();

    noteGroups.forEach((group, index) => {
      if (group.length === 1) {
        instrument.triggerAttackRelease(group[0], duration, now + index * 0.8);
      } else {
        instrument.triggerAttackRelease(group, duration, now + index * 0.8);
      }
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
    case 'sequence':
      // For sequence, audioData.noteGroups should be an array of arrays
      if (audioData.noteGroups) {
        await playSequence(audioData.noteGroups, duration);
      } else {
        // Fallback: treat each note as individual
        await playInterval(audioData.notes, duration);
      }
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
