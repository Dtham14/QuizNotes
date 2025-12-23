'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import PianoKey from './PianoKey'
import { initializeAudio, playNote } from '@/lib/audio/toneUtils'

// Define which white keys have a black key to their right
// In music: C, D, F, G, A have sharps; E and B do not
const WHITE_KEY_HAS_BLACK: Record<string, boolean> = {
  'C': true,  // C#
  'D': true,  // D#
  'E': false, // No E#
  'F': true,  // F#
  'G': true,  // G#
  'A': true,  // A#
  'B': false, // No B#
}

// Piano key definitions for 2 octaves (C3 to B4)
const OCTAVE_3_WHITE = [
  { note: 'C3', keyboard: 'a' },
  { note: 'D3', keyboard: 's' },
  { note: 'E3', keyboard: 'd' },
  { note: 'F3', keyboard: 'f' },
  { note: 'G3', keyboard: 'g' },
  { note: 'A3', keyboard: 'h' },
  { note: 'B3', keyboard: 'j' },
]

const OCTAVE_3_BLACK = [
  { note: 'C#3', keyboard: 'w', afterWhite: 'C3' },
  { note: 'D#3', keyboard: 'e', afterWhite: 'D3' },
  { note: 'F#3', keyboard: 't', afterWhite: 'F3' },
  { note: 'G#3', keyboard: 'y', afterWhite: 'G3' },
  { note: 'A#3', keyboard: 'u', afterWhite: 'A3' },
]

const OCTAVE_4_WHITE = [
  { note: 'C4', keyboard: 'k' },
  { note: 'D4', keyboard: 'l' },
  { note: 'E4', keyboard: ';' },
  { note: 'F4', keyboard: 'z' },
  { note: 'G4', keyboard: 'c' },
  { note: 'A4', keyboard: 'b' },
  { note: 'B4', keyboard: 'm' },
]

const OCTAVE_4_BLACK = [
  { note: 'C#4', keyboard: 'o', afterWhite: 'C4' },
  { note: 'D#4', keyboard: 'p', afterWhite: 'D4' },
  { note: 'F#4', keyboard: 'x', afterWhite: 'F4' },
  { note: 'G#4', keyboard: 'v', afterWhite: 'G4' },
  { note: 'A#4', keyboard: 'n', afterWhite: 'A4' },
]

const ALL_WHITE_KEYS = [...OCTAVE_3_WHITE, ...OCTAVE_4_WHITE]
const ALL_BLACK_KEYS = [...OCTAVE_3_BLACK, ...OCTAVE_4_BLACK]
const ALL_KEYS = [
  ...OCTAVE_3_WHITE.map(k => ({ ...k, isBlack: false })),
  ...OCTAVE_3_BLACK.map(k => ({ ...k, isBlack: true })),
  ...OCTAVE_4_WHITE.map(k => ({ ...k, isBlack: false })),
  ...OCTAVE_4_BLACK.map(k => ({ ...k, isBlack: true })),
]

interface RecordedNote {
  note: string
  timestamp: number
  duration: number
}

export default function InteractivePiano() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [isRecording, setIsRecording] = useState(false)
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

  const recordingStartTime = useRef<number>(0)
  const noteStartTimes = useRef<Map<string, number>>(new Map())
  const playbackTimeouts = useRef<NodeJS.Timeout[]>([])

  // Initialize audio on first interaction
  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  // Handle note start
  const handleNoteStart = useCallback(async (note: string) => {
    await ensureAudio()

    if (!pressedKeys.has(note)) {
      setPressedKeys(prev => new Set(prev).add(note))
      playNote(note, '8n')

      // Record note start time
      if (isRecording) {
        noteStartTimes.current.set(note, Date.now() - recordingStartTime.current)
      }
    }
  }, [ensureAudio, pressedKeys, isRecording])

  // Handle note end
  const handleNoteEnd = useCallback((note: string) => {
    setPressedKeys(prev => {
      const next = new Set(prev)
      next.delete(note)
      return next
    })

    // Record note with duration
    if (isRecording && noteStartTimes.current.has(note)) {
      const startTime = noteStartTimes.current.get(note)!
      const duration = Date.now() - recordingStartTime.current - startTime
      setRecordedNotes(prev => [...prev, {
        note,
        timestamp: startTime,
        duration: Math.max(duration, 100) // Minimum 100ms
      }])
      noteStartTimes.current.delete(note)
    }
  }, [isRecording])

  // Keyboard input handling
  useEffect(() => {
    const keyMap = new Map(ALL_KEYS.map(k => [k.keyboard, k.note]))

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const note = keyMap.get(e.key.toLowerCase())
      if (note) {
        e.preventDefault()
        handleNoteStart(note)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = keyMap.get(e.key.toLowerCase())
      if (note) {
        handleNoteEnd(note)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleNoteStart, handleNoteEnd])

  // Recording controls
  const startRecording = useCallback(() => {
    setRecordedNotes([])
    noteStartTimes.current.clear()
    recordingStartTime.current = Date.now()
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
  }, [])

  // Playback
  const playRecording = useCallback(async () => {
    if (recordedNotes.length === 0) return

    await ensureAudio()
    setIsPlaying(true)

    // Clear any existing playback
    playbackTimeouts.current.forEach(clearTimeout)
    playbackTimeouts.current = []

    // Schedule all notes
    recordedNotes.forEach(({ note, timestamp }) => {
      const timeout = setTimeout(() => {
        playNote(note, '8n')
        setPressedKeys(prev => new Set(prev).add(note))
        setTimeout(() => {
          setPressedKeys(prev => {
            const next = new Set(prev)
            next.delete(note)
            return next
          })
        }, 150)
      }, timestamp)
      playbackTimeouts.current.push(timeout)
    })

    // End playback after last note
    const lastNote = recordedNotes[recordedNotes.length - 1]
    const endTimeout = setTimeout(() => {
      setIsPlaying(false)
    }, lastNote.timestamp + lastNote.duration + 100)
    playbackTimeouts.current.push(endTimeout)
  }, [recordedNotes, ensureAudio])

  const stopPlayback = useCallback(() => {
    playbackTimeouts.current.forEach(clearTimeout)
    playbackTimeouts.current = []
    setPressedKeys(new Set())
    setIsPlaying(false)
  }, [])

  const clearRecording = useCallback(() => {
    setRecordedNotes([])
    stopPlayback()
  }, [stopPlayback])

  // Get black key for a white key if it exists
  const getBlackKeyForWhite = (whiteNote: string) => {
    return ALL_BLACK_KEYS.find(bk => bk.afterWhite === whiteNote)
  }

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isPlaying}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="w-3 h-3 bg-white rounded-full" />
            Record
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <span className="w-3 h-3 bg-red-500 rounded-sm" />
            Stop
          </button>
        )}

        {recordedNotes.length > 0 && !isRecording && (
          <>
            {!isPlaying ? (
              <button
                onClick={playRecording}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </button>
            ) : (
              <button
                onClick={stopPlayback}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
                Stop
              </button>
            )}
            <button
              onClick={clearRecording}
              disabled={isPlaying}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
            <span className="text-sm text-gray-500">
              {recordedNotes.length} note{recordedNotes.length !== 1 ? 's' : ''} recorded
            </span>
          </>
        )}

        {isRecording && (
          <span className="flex items-center gap-2 text-red-500 font-semibold">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Recording...
          </span>
        )}
      </div>

      {/* Piano Keyboard */}
      <div
        className="relative w-full bg-gray-800 rounded-xl p-3 shadow-2xl"
        style={{ minHeight: '200px' }}
      >
        {/* White keys container */}
        <div className="relative flex w-full h-44">
          {ALL_WHITE_KEYS.map((key) => {
            const blackKey = getBlackKeyForWhite(key.note)
            return (
              <div key={key.note} className="relative flex-1 h-full">
                <PianoKey
                  note={key.note}
                  isBlack={false}
                  isPressed={pressedKeys.has(key.note)}
                  onNoteStart={handleNoteStart}
                  onNoteEnd={handleNoteEnd}
                  keyboardShortcut={key.keyboard.toUpperCase()}
                />
                {blackKey && (
                  <PianoKey
                    note={blackKey.note}
                    isBlack={true}
                    isPressed={pressedKeys.has(blackKey.note)}
                    onNoteStart={handleNoteStart}
                    onNoteEnd={handleNoteEnd}
                    keyboardShortcut={blackKey.keyboard.toUpperCase()}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500 space-y-1">
        <p><strong>Click/tap</strong> the keys or use your <strong>keyboard</strong> to play.</p>
        <p className="text-xs">White keys: A S D F G H J K L ; Z C B M | Black keys: W E T Y U O P X V N</p>
      </div>
    </div>
  )
}
