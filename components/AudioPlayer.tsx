'use client';

import { useState, useCallback, useEffect } from 'react';
import type { EarTrainingSubtype, EarTrainingAudioData } from '@/lib/types/earTraining';
import {
  playEarTraining,
  initializeAudio,
  INSTRUMENTS,
  getCurrentInstrument,
  setCurrentInstrument,
  type InstrumentType
} from '@/lib/audio/toneUtils';

interface AudioPlayerProps {
  subtype: EarTrainingSubtype;
  audioData: EarTrainingAudioData;
  onPlay?: () => void;
}

export default function AudioPlayer({ subtype, audioData, onPlay }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('piano');

  // Load saved instrument preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('earTrainingInstrument') as InstrumentType | null;
    if (saved && INSTRUMENTS.some(i => i.id === saved)) {
      setSelectedInstrument(saved);
      setCurrentInstrument(saved);
    }
  }, []);

  const handleInstrumentChange = (instrument: InstrumentType) => {
    setSelectedInstrument(instrument);
    setCurrentInstrument(instrument);
    localStorage.setItem('earTrainingInstrument', instrument);
  };

  const handlePlay = useCallback(async () => {
    if (isPlaying || isInitializing) return;

    console.log('Play button clicked - starting audio initialization...');
    setIsInitializing(true);

    try {
      // Initialize audio context on first play (requires user gesture)
      console.log('Initializing audio...');
      const initialized = await initializeAudio();
      console.log('Audio initialized:', initialized);

      if (!initialized) {
        throw new Error('Failed to initialize audio');
      }

      setIsInitializing(false);
      setIsPlaying(true);

      console.log('Playing ear training audio:', subtype, audioData);
      await playEarTraining(subtype, audioData);
      console.log('Audio playback started');

      // Wait for audio to finish before allowing replay
      // Longer durations for piano-like sustained sounds
      const duration = subtype === 'interval' ? 3000 : 2500;
      setTimeout(() => {
        setIsPlaying(false);
        setHasPlayed(true);
        onPlay?.();
        console.log('Audio playback finished');
      }, duration);
    } catch (error) {
      console.error('Failed to play audio:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'no stack'
      });
      alert('Audio error: ' + (error instanceof Error ? error.message : 'Unknown error') + '\n\nPlease check console for details.');
      setIsInitializing(false);
      setIsPlaying(false);
    }
  }, [subtype, audioData, isPlaying, isInitializing, onPlay]);

  const getButtonText = () => {
    const instrumentLabel = INSTRUMENTS.find(i => i.id === selectedInstrument)?.label || 'Piano';
    if (isInitializing) return `Loading ${instrumentLabel.toLowerCase()}...`;
    if (isPlaying) return 'Playing...';
    if (hasPlayed) return 'Click to replay';
    return 'Click to play';
  };

  const getSubtypeLabel = () => {
    switch (subtype) {
      case 'note':
        return 'Note';
      case 'chord':
        return 'Chord';
      case 'interval':
        return 'Interval';
      case 'sequence':
        return 'Sequence';
      default:
        return 'Sound';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handlePlay}
        disabled={isPlaying || isInitializing}
        className={`
          w-24 h-24 rounded-full flex items-center justify-center
          transition-all duration-200 shadow-lg touch-manipulation
          ${isPlaying
            ? 'bg-brand scale-110 animate-pulse'
            : 'bg-brand hover:bg-brand-dark hover:scale-105 active:scale-95'
          }
          ${isInitializing ? 'cursor-wait' : 'cursor-pointer'}
          disabled:cursor-not-allowed disabled:opacity-50
        `}
        aria-label={`Play ${getSubtypeLabel()}`}
        type="button"
      >
        {isPlaying ? (
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        ) : (
          <svg
            className="w-12 h-12 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <p className="text-sm text-gray-600 font-medium">
        {getButtonText()}
      </p>
      <p className="text-xs text-gray-400">
        Listen to the {getSubtypeLabel().toLowerCase()}
      </p>

      {/* Instrument Selector */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {INSTRUMENTS.map((instrument) => (
          <button
            key={instrument.id}
            onClick={() => handleInstrumentChange(instrument.id)}
            disabled={isPlaying || isInitializing}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-full transition-all touch-manipulation
              ${selectedInstrument === instrument.id
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            type="button"
          >
            {instrument.label}
          </button>
        ))}
      </div>
    </div>
  );
}
