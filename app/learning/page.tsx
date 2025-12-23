'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/components/ProfileDropdown'
import { initializeAudio, playNote, playChord } from '@/lib/audio/toneUtils'

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  avatar?: string | null
  avatarUrl?: string | null
  themeColor?: string | null
  subscriptionStatus?: 'none' | 'active' | 'canceled' | 'expired' | null
}

interface LearningSection {
  id: string
  title: string
  icon: string
  description: string
  content: {
    subtitle: string
    text: string
    list?: string[]
    visual?: React.ReactNode
    tip?: string
  }[]
}

// Visual Aid Components
function SoundWaveVisual() {
  return (
    <div className="my-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
      <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Sound Waves → Pitch → Notes</p>
      <div className="space-y-6">
        {/* Sound wave */}
        <div className="bg-white p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2 text-center">1. Vibrations (Sound Waves)</p>
          <svg viewBox="0 0 300 60" className="w-full max-w-md mx-auto">
            <path
              d="M 10 30 Q 30 10, 50 30 T 90 30 T 130 30 T 170 30 T 210 30 T 250 30 T 290 30"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <svg width="30" height="30" viewBox="0 0 30 30">
            <path d="M 15 5 L 15 25 M 15 25 L 10 20 M 15 25 L 20 20" fill="none" stroke="#6b7280" strokeWidth="2" />
          </svg>
        </div>

        {/* Pitch representation */}
        <div className="bg-white p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-3 text-center">2. Organized into High/Low Pitches</p>
          <div className="flex justify-center items-end gap-2">
            <div className="w-8 h-12 bg-blue-300 rounded"></div>
            <div className="w-8 h-20 bg-blue-400 rounded"></div>
            <div className="w-8 h-32 bg-blue-500 rounded"></div>
            <div className="w-8 h-24 bg-blue-400 rounded"></div>
            <div className="w-8 h-16 bg-blue-300 rounded"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center">
          <svg width="30" height="30" viewBox="0 0 30 30">
            <path d="M 15 5 L 15 25 M 15 25 L 10 20 M 15 25 L 20 20" fill="none" stroke="#6b7280" strokeWidth="2" />
          </svg>
        </div>

        {/* Named notes */}
        <div className="bg-white p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-3 text-center">3. Given Letter Names (Notes)</p>
          <div className="flex justify-center gap-2">
            {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note) => (
              <div key={note} className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MusicalAlphabetVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playingNote, setPlayingNote] = useState<string | null>(null)
  const [playingScale, setPlayingScale] = useState(false)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      console.log('Initializing audio...')
      const success = await initializeAudio()
      console.log('Audio initialized:', success)
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const getEnharmonicNames = (note: string) => {
    const enharmonics: Record<string, string> = {
      'A': 'A♯/B♭',
      'C': 'C♯/D♭',
      'D': 'D♯/E♭',
      'F': 'F♯/G♭',
      'G': 'G♯/A♭'
    }
    return enharmonics[note] || ''
  }

  const playNoteSound = useCallback(async (note: string, octave: number = 4) => {
    await ensureAudio()
    const toneNote = `${note}${octave}`
    setPlayingNote(toneNote)
    console.log('Playing note:', toneNote)
    await playNote(toneNote, '8n')
    setTimeout(() => setPlayingNote(null), 300)
  }, [ensureAudio])

  const playFullScale = useCallback(async () => {
    await ensureAudio()
    setPlayingScale(true)
    const scale = ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5']
    scale.forEach((note, index) => {
      setTimeout(() => {
        playNote(note, '8n')
      }, index * 400)
    })
    setTimeout(() => setPlayingScale(false), scale.length * 400 + 500)
  }, [ensureAudio])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
      <p className="text-sm font-semibold text-gray-700 mb-4 text-center">The Musical Alphabet (7 Letters, Repeating)</p>
      <p className="text-xs text-gray-600 mb-4 text-center">Click any key to hear its sound!</p>

      {/* Piano keyboard showing the pattern */}
      <div className="relative mb-6">
        <div className="flex justify-center">
          <div className="relative flex h-40 w-full max-w-2xl">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'].map((note, index) => {
              const octave = index < 2 ? 4 : 5
              const toneNote = `${note}${octave}`
              const blackKeyAfter = ['A', 'C', 'D', 'F', 'G'].includes(note) && index < 9
              const blackNote = note + (['A', 'C', 'D', 'F', 'G'].includes(note) ? '#' : '')
              const blackToneNote = `${blackNote}${octave}`

              return (
                <div key={`${note}-${index}`} className="relative flex-1 h-full">
                  <button
                    onClick={() => playNoteSound(note, octave)}
                    className={`absolute inset-0 ${
                      playingNote === toneNote ? 'bg-purple-100 border-purple-500' : 'bg-white border-gray-800'
                    } border-2 rounded-b-lg flex flex-col items-center justify-end pb-2 hover:bg-gray-50 transition-colors cursor-pointer`}
                  >
                    <span className="text-sm font-bold text-gray-700">{note}</span>
                  </button>
                  {blackKeyAfter && (
                    <button
                      onClick={() => playNoteSound(blackNote, octave)}
                      className={`absolute left-full -translate-x-1/2 w-[60%] h-[65%] ${
                        playingNote === blackToneNote ? 'bg-purple-600' : 'bg-gray-900'
                      } rounded-b-md z-10 flex flex-col items-center justify-end pb-2 hover:bg-gray-700 transition-colors cursor-pointer`}
                    >
                      <span className="text-[8px] font-bold text-white leading-tight text-center">
                        {getEnharmonicNames(note)}
                      </span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Pattern indicator */}
        <div className="mt-4 flex justify-center gap-8">
          <div className="text-center">
            <div className="inline-block px-4 py-2 bg-purple-100 rounded-lg border-2 border-purple-400">
              <p className="font-bold text-purple-700">A B C D E F G</p>
            </div>
            <p className="text-xs text-gray-600 mt-2">...then repeats!</p>
          </div>
          <button
            onClick={playFullScale}
            disabled={playingScale}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              playingScale
                ? 'bg-purple-600 text-white'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            } disabled:opacity-50`}
          >
            {playingScale ? '🔊 Playing...' : '▶️ Play A-B-C-D-E-F-G'}
          </button>
        </div>
      </div>

      {/* Sharps and flats explanation */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">♯</span>
            <span className="font-semibold text-gray-700">Sharp</span>
          </div>
          <p className="text-sm text-gray-600">One step <span className="font-semibold">higher</span></p>
          <p className="text-xs text-gray-500 mt-1">C♯ = higher than C</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">♭</span>
            <span className="font-semibold text-gray-700">Flat</span>
          </div>
          <p className="text-sm text-gray-600">One step <span className="font-semibold">lower</span></p>
          <p className="text-xs text-gray-500 mt-1">D♭ = lower than D</p>
        </div>
      </div>
    </div>
  )
}

function RhythmConceptsVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playingTempo, setPlayingTempo] = useState<'slow' | 'medium' | 'fast' | null>(null)
  const [tempoTimeout, setTempoTimeout] = useState<NodeJS.Timeout | null>(null)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const playTempo = useCallback(async (bpm: number, tempoName: 'slow' | 'medium' | 'fast') => {
    await ensureAudio()

    // Stop any existing tempo
    if (tempoTimeout) {
      clearTimeout(tempoTimeout)
    }

    setPlayingTempo(tempoName)
    const interval = (60 / bpm) * 1000 // milliseconds per beat

    // Play 8 beats
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        playNote('C5', '32n') // Short click sound
      }, i * interval)
    }

    const timeout = setTimeout(() => {
      setPlayingTempo(null)
    }, 8 * interval + 500)

    setTempoTimeout(timeout)
  }, [ensureAudio, tempoTimeout])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
      <p className="text-sm font-semibold text-gray-700 mb-6 text-center">Understanding Rhythm: Beat, Tempo, and Meter</p>

      <div className="space-y-6">
        {/* Beat */}
        <div className="bg-white p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💓</span>
            <span className="font-semibold text-gray-700">Beat: The Steady Pulse</span>
          </div>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-white font-bold animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                {i}
              </div>
            ))}
          </div>
        </div>

        {/* Tempo */}
        <div className="bg-white p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚡</span>
            <span className="font-semibold text-gray-700">Tempo: How Fast?</span>
          </div>
          <p className="text-xs text-gray-600 mb-3 text-center">Click to hear the tempo!</p>
          <div className="space-y-2">
            <button
              onClick={() => playTempo(60, 'slow')}
              disabled={playingTempo !== null}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 border-2 border-transparent hover:border-blue-300"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Slow (ballad)</span>
                {playingTempo === 'slow' && <span className="text-xs text-blue-600 font-semibold">🔊 Playing...</span>}
              </div>
              <span className="text-xs font-mono text-gray-600">60 BPM</span>
            </button>
            <button
              onClick={() => playTempo(100, 'medium')}
              disabled={playingTempo !== null}
              className="w-full flex items-center justify-between p-3 bg-green-50 rounded hover:bg-green-100 transition-colors disabled:opacity-50 border-2 border-transparent hover:border-green-300"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Medium (walking)</span>
                {playingTempo === 'medium' && <span className="text-xs text-green-600 font-semibold">🔊 Playing...</span>}
              </div>
              <span className="text-xs font-mono text-gray-600">100 BPM</span>
            </button>
            <button
              onClick={() => playTempo(160, 'fast')}
              disabled={playingTempo !== null}
              className="w-full flex items-center justify-between p-3 bg-red-50 rounded hover:bg-red-100 transition-colors disabled:opacity-50 border-2 border-transparent hover:border-red-300"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Fast (running)</span>
                {playingTempo === 'fast' && <span className="text-xs text-red-600 font-semibold">🔊 Playing...</span>}
              </div>
              <span className="text-xs font-mono text-gray-600">160 BPM</span>
            </button>
          </div>
        </div>

        {/* Meter (4/4 example) */}
        <div className="bg-white p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📊</span>
            <span className="font-semibold text-gray-700">Meter: How Beats Group Together</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">4</div>
              <div className="w-12 h-0.5 bg-gray-400 my-1"></div>
              <div className="text-4xl font-bold text-green-600">4</div>
            </div>
            <div className="text-gray-400 text-2xl">=</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-10 h-10 ${i === 1 ? 'bg-green-500' : 'bg-green-300'} rounded flex items-center justify-center text-white font-bold`}>
                  {i}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-center text-gray-500 mt-3">4 beats per measure, quarter note = 1 beat</p>
        </div>
      </div>
    </div>
  )
}

function NoteLengthsVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playingNote, setPlayingNote] = useState<string | null>(null)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const noteData = [
    { name: 'Whole Note', beats: 4, duration: '1n', svg: <circle cx="15" cy="15" r="8" fill="none" stroke="#f59e0b" strokeWidth="2.5" />, width: 'w-full' },
    { name: 'Half Note', beats: 2, duration: '2n', svg: <><circle cx="12" cy="22" r="6" fill="none" stroke="#f59e0b" strokeWidth="2.5" /><line x1="18" y1="22" x2="18" y2="5" stroke="#f59e0b" strokeWidth="2.5" /></>, width: 'w-1/2' },
    { name: 'Quarter Note', beats: 1, duration: '4n', svg: <><circle cx="12" cy="22" r="6" fill="#f59e0b" /><line x1="18" y1="22" x2="18" y2="5" stroke="#f59e0b" strokeWidth="2.5" /></>, width: 'w-1/4' },
    { name: 'Eighth Note', beats: 0.5, duration: '8n', svg: <><circle cx="12" cy="22" r="6" fill="#f59e0b" /><line x1="18" y1="22" x2="18" y2="5" stroke="#f59e0b" strokeWidth="2.5" /><path d="M 18 5 Q 25 8, 25 14" fill="none" stroke="#f59e0b" strokeWidth="2.5" /></>, width: 'w-1/8' }
  ]

  const playNoteLength = useCallback(async (noteName: string, duration: string, beats: number) => {
    await ensureAudio()
    setPlayingNote(noteName)
    playNote('C4', duration as any)
    setTimeout(() => setPlayingNote(null), beats * 500)
  }, [ensureAudio])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
      <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Note Lengths (in 4/4 time)</p>
      <p className="text-xs text-gray-600 mb-6 text-center">Click to hear how long each note lasts!</p>
      <div className="space-y-4 max-w-2xl mx-auto">
        {noteData.map((note, index) => (
          <button
            key={index}
            onClick={() => playNoteLength(note.name, note.duration, note.beats)}
            disabled={playingNote !== null}
            className="w-full bg-white p-4 rounded-lg flex items-center gap-4 hover:bg-amber-50 transition-all disabled:opacity-50 border-2 border-transparent hover:border-amber-300"
          >
            <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
              <svg width="30" height="30" viewBox="0 0 30 30">
                {note.svg}
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-700">{note.name}</p>
              <p className="text-sm text-gray-600">{note.beats} {note.beats === 1 ? 'beat' : 'beats'}</p>
              {playingNote === note.name && (
                <p className="text-xs text-amber-600 font-semibold mt-1">🔊 Playing...</p>
              )}
            </div>
            <div className={`${note.width} h-8 bg-amber-400 rounded transition-all`}></div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StaffClefsVisual() {
  return (
    <div className="my-6 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
      <p className="text-sm font-semibold text-gray-700 mb-6 text-center">The Staff: 5 Lines, 4 Spaces</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Treble Clef */}
        <div className="bg-white p-4 rounded-lg">
          <p className="text-sm font-semibold text-indigo-600 mb-3 text-center">Treble Clef 𝄞</p>
          <svg viewBox="0 0 200 120" className="w-full">
            {[0, 1, 2, 3, 4].map((line) => (
              <line key={line} x1="10" y1={20 + line * 20} x2="190" y2={20 + line * 20} stroke="#333" strokeWidth="1" />
            ))}
            <text x="20" y="70" fontSize="50" fill="#6366f1" fontWeight="bold">𝄞</text>
            <text x="80" y="35" fontSize="12" fill="#374151">Higher sounds</text>
            <text x="80" y="50" fontSize="10" fill="#6b7280">melodies, vocals</text>
            <text x="80" y="65" fontSize="10" fill="#6b7280">violin, flute</text>
          </svg>
        </div>

        {/* Bass Clef */}
        <div className="bg-white p-4 rounded-lg">
          <p className="text-sm font-semibold text-indigo-600 mb-3 text-center">Bass Clef 𝄢</p>
          <svg viewBox="0 0 200 120" className="w-full">
            {[0, 1, 2, 3, 4].map((line) => (
              <line key={line} x1="10" y1={20 + line * 20} x2="190" y2={20 + line * 20} stroke="#333" strokeWidth="1" />
            ))}
            <text x="20" y="70" fontSize="50" fill="#6366f1" fontWeight="bold">𝄢</text>
            <text x="80" y="35" fontSize="12" fill="#374151">Lower sounds</text>
            <text x="80" y="50" fontSize="10" fill="#6b7280">bass lines</text>
            <text x="80" y="65" fontSize="10" fill="#6b7280">cello, trombone</text>
          </svg>
        </div>
      </div>
    </div>
  )
}

function HalfWholeStepKeyboardVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playingNote, setPlayingNote] = useState<string | null>(null)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const playNoteWithHighlight = useCallback(async (note: string) => {
    await ensureAudio()
    setPlayingNote(note)
    playNote(note, '8n')
    setTimeout(() => setPlayingNote(null), 300)
  }, [ensureAudio])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
      <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Half Steps & Whole Steps on the Keyboard</p>

      <div className="space-y-6">
        {/* Half Step Example */}
        <div className="bg-white p-4 rounded-lg">
          <p className="text-sm font-semibold text-orange-600 mb-3 text-center">Half Step = Smallest Distance</p>
          <p className="text-xs text-gray-600 mb-3 text-center">Click the keys to hear!</p>

          <div className="flex justify-center mb-4">
            <div className="relative flex h-32 w-64">
              {/* C */}
              <div className="relative flex-1 h-full">
                <button
                  onClick={() => playNoteWithHighlight('C4')}
                  className={`absolute inset-0 bg-white border-2 ${playingNote === 'C4' ? 'border-orange-500 bg-orange-50' : 'border-gray-800'} rounded-b-lg flex flex-col items-center justify-end pb-2 hover:bg-gray-50 transition-colors`}
                >
                  <span className="text-sm font-bold text-gray-700">C</span>
                </button>
                {/* C# */}
                <button
                  onClick={() => playNoteWithHighlight('C#4')}
                  className={`absolute left-full -translate-x-1/2 w-[60%] h-[65%] ${playingNote === 'C#4' ? 'bg-orange-600' : 'bg-gray-900'} rounded-b-md z-10 flex flex-col items-center justify-end pb-1 hover:bg-gray-700 transition-colors`}
                >
                  <span className="text-[8px] font-bold text-white">C♯/D♭</span>
                </button>
              </div>
              {/* D */}
              <div className="relative flex-1 h-full">
                <div className="absolute inset-0 bg-gray-100 border-2 border-gray-300 rounded-b-lg flex flex-col items-center justify-end pb-2">
                  <span className="text-sm font-bold text-gray-400">D</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mb-1">C</div>
            </div>
            <div className="flex items-center">
              <svg className="w-12 h-12" viewBox="0 0 48 48">
                <path d="M 12 24 L 36 24 M 36 24 L 30 18 M 36 24 L 30 30" fill="none" stroke="#f97316" strokeWidth="3" />
              </svg>
              <span className="text-xs font-semibold text-orange-600">Half</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mb-1 text-sm">C♯</div>
            </div>
          </div>
        </div>

        {/* Whole Step Example */}
        <div className="bg-white p-4 rounded-lg">
          <p className="text-sm font-semibold text-cyan-600 mb-3 text-center">Whole Step = Two Half Steps</p>
          <p className="text-xs text-gray-600 mb-3 text-center">Click the keys to hear!</p>

          <div className="flex justify-center mb-4">
            <div className="relative flex h-32 w-64">
              {/* C */}
              <div className="relative flex-1 h-full">
                <button
                  onClick={() => playNoteWithHighlight('C4')}
                  className={`absolute inset-0 bg-white border-2 ${playingNote === 'C4' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-800'} rounded-b-lg flex flex-col items-center justify-end pb-2 hover:bg-gray-50 transition-colors`}
                >
                  <span className="text-sm font-bold text-gray-700">C</span>
                </button>
                <div className="absolute left-full -translate-x-1/2 w-[60%] h-[65%] bg-gray-300 rounded-b-md z-10 flex flex-col items-center justify-end pb-1 pointer-events-none">
                  <span className="text-[8px] font-bold text-gray-500">C♯/D♭</span>
                </div>
              </div>
              {/* D */}
              <div className="relative flex-1 h-full">
                <button
                  onClick={() => playNoteWithHighlight('D4')}
                  className={`absolute inset-0 bg-white border-2 ${playingNote === 'D4' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-800'} rounded-b-lg flex flex-col items-center justify-end pb-2 hover:bg-gray-50 transition-colors`}
                >
                  <span className="text-sm font-bold text-gray-700">D</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold mb-1">C</div>
            </div>
            <div className="flex items-center">
              <svg className="w-12 h-12" viewBox="0 0 48 48">
                <path d="M 12 24 L 36 24 M 36 24 L 30 18 M 36 24 L 30 30" fill="none" stroke="#06b6d4" strokeWidth="3" />
              </svg>
              <span className="text-xs font-semibold text-cyan-600">Whole</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold mb-1">D</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MajorMinorComparisonVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playing, setPlaying] = useState<'major' | 'minor' | null>(null)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const playMajorChord = useCallback(async () => {
    await ensureAudio()
    setPlaying('major')
    playChord(['C4', 'E4', 'G4'], '2n')
    setTimeout(() => setPlaying(null), 2000)
  }, [ensureAudio])

  const playMinorChord = useCallback(async () => {
    await ensureAudio()
    setPlaying('minor')
    playChord(['C4', 'Eb4', 'G4'], '2n')
    setTimeout(() => setPlaying(null), 2000)
  }, [ensureAudio])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
      <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Hear the Difference: Major vs Minor</p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Major */}
        <div className="bg-white p-6 rounded-lg border-2 border-transparent hover:border-violet-300 transition-all">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-violet-600 mb-2">Major Chord</h3>
            <p className="text-sm text-gray-600">Bright & Happy</p>
          </div>

          <div className="flex justify-center gap-2 mb-4">
            <div className="w-12 h-16 bg-violet-400 text-white rounded flex items-center justify-center font-bold">C</div>
            <div className="w-12 h-16 bg-violet-500 text-white rounded flex items-center justify-center font-bold">E</div>
            <div className="w-12 h-16 bg-violet-600 text-white rounded flex items-center justify-center font-bold">G</div>
          </div>

          <button
            onClick={playMajorChord}
            disabled={playing !== null}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              playing === 'major'
                ? 'bg-violet-600 text-white'
                : 'bg-violet-500 text-white hover:bg-violet-600'
            } disabled:opacity-50`}
          >
            {playing === 'major' ? '🔊 Playing...' : '▶️ Play Major'}
          </button>
        </div>

        {/* Minor */}
        <div className="bg-white p-6 rounded-lg border-2 border-transparent hover:border-indigo-300 transition-all">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-indigo-600 mb-2">Minor Chord</h3>
            <p className="text-sm text-gray-600">Darker & Emotional</p>
          </div>

          <div className="flex justify-center gap-2 mb-4">
            <div className="w-12 h-16 bg-indigo-400 text-white rounded flex items-center justify-center font-bold">C</div>
            <div className="w-12 h-16 bg-indigo-500 text-white rounded flex items-center justify-center font-bold text-sm">E♭</div>
            <div className="w-12 h-16 bg-indigo-600 text-white rounded flex items-center justify-center font-bold">G</div>
          </div>

          <button
            onClick={playMinorChord}
            disabled={playing !== null}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              playing === 'minor'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            } disabled:opacity-50`}
          >
            {playing === 'minor' ? '🔊 Playing...' : '▶️ Play Minor'}
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-violet-50 rounded-lg border border-violet-200">
        <p className="text-sm text-center text-gray-700">
          <span className="font-semibold">Notice the difference?</span> The only change is the middle note (E vs E♭), but it completely changes the mood!
        </p>
      </div>
    </div>
  )
}

function MajorScalePatternVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playingScale, setPlayingScale] = useState(false)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const playMajorScale = useCallback(async () => {
    await ensureAudio()
    setPlayingScale(true)

    const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
    scale.forEach((note, index) => {
      setTimeout(() => {
        playNote(note, '8n')
      }, index * 400)
    })

    setTimeout(() => setPlayingScale(false), scale.length * 400 + 500)
  }, [ensureAudio])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-200">
      <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Major Scale: Consistent Step Pattern</p>

      <div className="bg-white p-6 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-center text-sm text-gray-600 flex-1">C Major Scale</p>
          <button
            onClick={playMajorScale}
            disabled={playingScale}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              playingScale
                ? 'bg-cyan-600 text-white'
                : 'bg-cyan-500 text-white hover:bg-cyan-600'
            } disabled:opacity-50`}
          >
            {playingScale ? '🔊 Playing...' : '▶️ Play Scale'}
          </button>
        </div>
        <div className="flex justify-center items-end gap-1">
          {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'].map((note, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-cyan-500 text-white rounded-lg flex items-center justify-center font-bold text-lg mb-2">
                {note}
              </div>
              {index < 7 && (
                <div className={`text-xs font-semibold px-2 py-1 rounded ${
                  ['W', 'W', 'H', 'W', 'W', 'W', 'H'][index] === 'W'
                    ? 'bg-cyan-200 text-cyan-800'
                    : 'bg-orange-200 text-orange-800'
                }`}>
                  {['W', 'W', 'H', 'W', 'W', 'W', 'H'][index]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-cyan-100 p-3 rounded-lg text-center">
          <p className="font-semibold text-cyan-800">W = Whole Step</p>
          <p className="text-xs text-cyan-700">2 half steps apart</p>
        </div>
        <div className="bg-orange-100 p-3 rounded-lg text-center">
          <p className="font-semibold text-orange-800">H = Half Step</p>
          <p className="text-xs text-orange-700">1 half step apart</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
        <p className="text-sm text-center text-gray-700">
          <span className="font-semibold">Pattern:</span> W – W – H – W – W – W – H
        </p>
        <p className="text-xs text-center text-gray-600 mt-1">
          (This pattern gives major scales their bright, happy sound!)
        </p>
      </div>
    </div>
  )
}

function IntervalsSimpleVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playingInterval, setPlayingInterval] = useState<string | null>(null)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const intervals = [
    { name: '2nd', from: 'C4', to: 'D4', color: 'bg-blue-400', label: '2nd' },
    { name: '3rd', from: 'C4', to: 'E4', color: 'bg-green-400', label: '3rd' },
    { name: '5th', from: 'C4', to: 'G4', color: 'bg-purple-400', label: '5th' },
    { name: 'Octave', from: 'C4', to: 'C5', color: 'bg-red-400', label: 'Octave' }
  ]

  const playInterval = useCallback(async (from: string, to: string, name: string) => {
    await ensureAudio()
    setPlayingInterval(name)

    // Play notes in sequence
    playNote(from, '4n')
    setTimeout(() => {
      playNote(to, '4n')
    }, 500)

    setTimeout(() => setPlayingInterval(null), 1500)
  }, [ensureAudio])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-200">
      <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Intervals: Distance Between Notes</p>
      <p className="text-xs text-gray-600 mb-4 text-center">Click to hear each interval!</p>

      <div className="grid md:grid-cols-2 gap-4">
        {intervals.map((interval) => (
          <button
            key={interval.name}
            onClick={() => playInterval(interval.from, interval.to, interval.name)}
            disabled={playingInterval !== null}
            className="bg-white p-4 rounded-lg border border-rose-100 hover:border-rose-300 transition-all disabled:opacity-50"
          >
            <div className="flex justify-center items-center gap-3 mb-2">
              <div className={`w-14 h-14 ${interval.color} text-white rounded-full flex items-center justify-center font-bold text-lg`}>
                {interval.from.replace('4', '').replace('5', '')}
              </div>
              <div className="flex flex-col items-center">
                <svg width="30" height="20" viewBox="0 0 30 20">
                  <path d="M 2 10 L 25 10 L 20 6 M 25 10 L 20 14" fill="none" stroke="#6b7280" strokeWidth="2" />
                </svg>
                <span className="text-xs font-semibold text-gray-600">{interval.label}</span>
              </div>
              <div className={`w-14 h-14 ${interval.color} text-white rounded-full flex items-center justify-center font-bold text-lg`}>
                {interval.to.replace('4', '').replace('5', '')}
              </div>
            </div>
            {playingInterval === interval.name && (
              <p className="text-xs text-rose-600 font-semibold">🔊 Playing...</p>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-rose-50 rounded-lg border border-rose-200">
        <p className="text-xs text-center text-gray-700">
          Intervals create the feeling of music—whether it sounds tense, calm, bright, or dark
        </p>
      </div>
    </div>
  )
}

function TriadVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playing, setPlaying] = useState<'major' | 'minor' | null>(null)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const playMajorChord = useCallback(async () => {
    await ensureAudio()
    setPlaying('major')
    playChord(['C4', 'E4', 'G4'], '2n')
    setTimeout(() => setPlaying(null), 2000)
  }, [ensureAudio])

  const playMinorChord = useCallback(async () => {
    await ensureAudio()
    setPlaying('minor')
    playChord(['C4', 'Eb4', 'G4'], '2n')
    setTimeout(() => setPlaying(null), 2000)
  }, [ensureAudio])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
      <p className="text-sm font-semibold text-gray-700 mb-6 text-center">Building a Triad: Stack Every Other Note</p>

      <div className="bg-white p-6 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-center text-sm text-gray-600 flex-1">C Major Scale → C Major Chord</p>
          <button
            onClick={playMajorChord}
            disabled={playing !== null}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              playing === 'major'
                ? 'bg-violet-600 text-white'
                : 'bg-violet-500 text-white hover:bg-violet-600'
            } disabled:opacity-50`}
          >
            {playing === 'major' ? '🔊 Playing...' : '▶️ Play Chord'}
          </button>
        </div>

        {/* Scale */}
        <div className="flex justify-center gap-1 mb-6">
          {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note, index) => {
            const isInChord = [0, 2, 4].includes(index) // C, E, G
            return (
              <div key={note} className="flex flex-col items-center">
                <div className={`w-10 h-10 ${
                  isInChord ? 'bg-violet-500 ring-2 ring-violet-300' : 'bg-gray-300'
                } text-white rounded-lg flex items-center justify-center font-bold`}>
                  {note}
                </div>
                {isInChord && index < 4 && (
                  <svg className="mt-1" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M 10 5 L 10 15 L 7 12 M 10 15 L 13 12" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>

        {/* Resulting chord */}
        <div className="flex justify-center items-end gap-2">
          <div className="w-16 h-24 bg-violet-500 text-white rounded-t-lg flex items-center justify-center font-bold text-xl">
            C
          </div>
          <div className="w-16 h-20 bg-violet-500 text-white rounded-t-lg flex items-center justify-center font-bold text-xl">
            E
          </div>
          <div className="w-16 h-16 bg-violet-500 text-white rounded-t-lg flex items-center justify-center font-bold text-xl">
            G
          </div>
        </div>
        <p className="text-center text-sm font-semibold text-violet-600 mt-3">C Major Chord</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={playMajorChord}
          disabled={playing !== null}
          className="bg-violet-100 p-4 rounded-lg text-center hover:bg-violet-200 transition-colors disabled:opacity-50 border-2 border-transparent hover:border-violet-400"
        >
          <p className="font-semibold text-violet-800">Major Chord</p>
          <p className="text-xs text-violet-700">Brighter sound</p>
          {playing === 'major' && <p className="text-xs text-violet-600 font-semibold mt-1">🔊 Playing...</p>}
        </button>
        <button
          onClick={playMinorChord}
          disabled={playing !== null}
          className="bg-indigo-100 p-4 rounded-lg text-center hover:bg-indigo-200 transition-colors disabled:opacity-50 border-2 border-transparent hover:border-indigo-400"
        >
          <p className="font-semibold text-indigo-800">Minor Chord</p>
          <p className="text-xs text-indigo-700">Darker sound</p>
          {playing === 'minor' && <p className="text-xs text-indigo-600 font-semibold mt-1">🔊 Playing...</p>}
        </button>
      </div>
    </div>
  )
}

function KeyConceptVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playingResolution, setPlayingResolution] = useState(false)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const playKeyResolution = useCallback(async () => {
    await ensureAudio()
    setPlayingResolution(true)

    // Play a sequence that creates tension and resolves to C
    const sequence = ['G4', 'F4', 'E4', 'D4', 'C4'] // Walking down to home
    sequence.forEach((note, index) => {
      setTimeout(() => {
        playNote(note, index === sequence.length - 1 ? '1n' : '4n') // Longer note on C
      }, index * 600)
    })

    setTimeout(() => setPlayingResolution(false), sequence.length * 600 + 1500)
  }, [ensureAudio])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
      <p className="text-sm font-semibold text-gray-700 mb-6 text-center">Key: The Musical "Home Base"</p>

      <div className="bg-white p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <p className="text-center text-sm text-gray-600 flex-1">In the key of C Major...</p>
          <button
            onClick={playKeyResolution}
            disabled={playingResolution}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              playingResolution
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            } disabled:opacity-50`}
          >
            {playingResolution ? '🔊 Playing...' : '▶️ Hear Resolution'}
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Home */}
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex flex-col items-center justify-center border-4 border-emerald-300">
              <span className="text-3xl font-bold">C</span>
              <span className="text-xs">HOME</span>
            </div>
            <div className="absolute -top-2 -right-2 text-3xl">🏠</div>
          </div>

          {/* Other notes pulling back */}
          <div className="flex gap-3">
            {['D', 'E', 'F', 'G', 'A', 'B'].map((note) => (
              <div key={note} className="relative">
                <div className="w-12 h-12 bg-emerald-200 text-emerald-800 rounded-full flex items-center justify-center font-bold">
                  {note}
                </div>
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" width="60" height="60" viewBox="0 0 60 60">
                  <path d="M 30 30 L 30 -10" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                  <path d="M 30 -10 L 27 -5 M 30 -10 L 33 -5" stroke="#10b981" strokeWidth="1" opacity="0.5" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-sm text-center text-gray-700">
            C feels like <span className="font-semibold">home</span>. Other notes create movement and <span className="font-semibold">pull back to C</span>.
          </p>
          <p className="text-xs text-center text-gray-600 mt-1">This "pull" is called tonality. Listen to how the notes resolve back to C!</p>
        </div>
      </div>
    </div>
  )
}

function ChordProgressionVisual() {
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [playingProgression, setPlayingProgression] = useState(false)

  const ensureAudio = useCallback(async () => {
    if (!isAudioReady) {
      const success = await initializeAudio()
      setIsAudioReady(success)
      return success
    }
    return true
  }, [isAudioReady])

  const playProgression = useCallback(async () => {
    await ensureAudio()
    setPlayingProgression(true)

    const progression = [
      ['C4', 'E4', 'G4'],  // C major
      ['G3', 'B3', 'D4'],  // G major
      ['A3', 'C4', 'E4'],  // A minor
      ['F3', 'A3', 'C4']   // F major
    ]

    progression.forEach((chord, index) => {
      setTimeout(() => {
        playChord(chord, '2n')
      }, index * 2000)
    })

    setTimeout(() => setPlayingProgression(false), progression.length * 2000 + 500)
  }, [ensureAudio])

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-200">
      <p className="text-sm font-semibold text-gray-700 mb-6 text-center">Chord Progressions: Musical Storytelling</p>

      <div className="bg-white p-6 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <p className="text-center text-sm text-gray-600">Common Progression: I → V → vi → IV</p>
            <p className="text-center text-xs text-gray-500">(In C Major: C → G → Am → F)</p>
          </div>
          <button
            onClick={playProgression}
            disabled={playingProgression}
            className={`ml-4 px-4 py-2 rounded-lg font-semibold transition-all ${
              playingProgression
                ? 'bg-sky-600 text-white'
                : 'bg-sky-500 text-white hover:bg-sky-600'
            } disabled:opacity-50`}
          >
            {playingProgression ? '🔊 Playing...' : '▶️ Play Progression'}
          </button>
        </div>

        {/* Progression flow */}
        <div className="flex justify-center items-center gap-3 flex-wrap">
          {[
            { roman: 'I', chord: 'C', feeling: 'Stable', color: 'bg-green-500' },
            { roman: 'V', chord: 'G', feeling: 'Tension', color: 'bg-yellow-500' },
            { roman: 'vi', chord: 'Am', feeling: 'Movement', color: 'bg-blue-500' },
            { roman: 'IV', chord: 'F', feeling: 'Pull back', color: 'bg-purple-500' }
          ].map((item, index) => (
            <div key={item.roman} className="flex items-center gap-2">
              <div className="text-center">
                <div className={`w-20 h-20 ${item.color} text-white rounded-lg flex flex-col items-center justify-center`}>
                  <span className="text-xl font-bold">{item.chord}</span>
                  <span className="text-xs">{item.roman}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{item.feeling}</p>
              </div>
              {index < 3 && (
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path d="M 2 10 L 15 10 L 12 7 M 15 10 L 12 13" fill="none" stroke="#6b7280" strokeWidth="2" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
        <p className="text-sm text-center text-gray-700">
          Like a story: <span className="font-semibold">Start stable → Create tension → Resolve</span>
        </p>
      </div>
    </div>
  )
}

function MusicLayersVisual() {
  return (
    <div className="my-6 p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
      <p className="text-sm font-semibold text-gray-700 mb-6 text-center">Three Lenses for Understanding Music</p>

      <div className="space-y-4">
        {/* Melody */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-red-400">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎵</span>
            <span className="font-semibold text-gray-700">Melody</span>
          </div>
          <p className="text-sm text-gray-600">The main tune you can sing or hum</p>
          <div className="mt-3 flex gap-1">
            {[1, 2, 1.5, 2.5, 2, 1.5, 1].map((height, i) => (
              <div key={i} className="flex-1 bg-red-300 rounded-t" style={{ height: `${height * 20}px` }}></div>
            ))}
          </div>
        </div>

        {/* Harmony */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎹</span>
            <span className="font-semibold text-gray-700">Harmony</span>
          </div>
          <p className="text-sm text-gray-600">The chords underneath that support the melody</p>
          <div className="mt-3 flex gap-2">
            {['C', 'G', 'Am', 'F'].map((chord, i) => (
              <div key={i} className="flex-1 flex flex-col gap-1">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-6 bg-blue-300 rounded"></div>
                ))}
                <p className="text-xs text-center text-gray-600 mt-1">{chord}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-green-400">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📋</span>
            <span className="font-semibold text-gray-700">Form</span>
          </div>
          <p className="text-sm text-gray-600">How sections are organized</p>
          <div className="mt-3 flex gap-2">
            {[
              { label: 'Verse', color: 'bg-green-300' },
              { label: 'Chorus', color: 'bg-green-500' },
              { label: 'Verse', color: 'bg-green-300' },
              { label: 'Chorus', color: 'bg-green-500' }
            ].map((section, i) => (
              <div key={i} className={`flex-1 h-12 ${section.color} rounded flex items-center justify-center text-xs font-semibold text-white`}>
                {section.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const LEARNING_SECTIONS: LearningSection[] = [
  {
    id: 'intro',
    title: 'What is Music Theory?',
    icon: '💡',
    description: 'Understanding the language of music',
    content: [
      {
        subtitle: 'Music Theory = Grammar for Music',
        text: 'Music theory is just a simple language for describing music—the same way grammar describes how sentences work. You don\'t need it to enjoy music, but it helps you understand what you\'re hearing, communicate with other musicians, and create your own music with confidence.',
      }
    ]
  },
  {
    id: 'building-blocks',
    title: 'Building Blocks: Sound → Notes',
    icon: '🔊',
    description: 'How sound becomes music',
    content: [
      {
        subtitle: 'From Vibrations to Notes',
        text: 'Music starts as vibrations (sound waves). We organize those sounds into pitches (high/low). A note is simply a named pitch.',
        visual: <SoundWaveVisual />
      },
      {
        subtitle: 'The Musical Alphabet',
        text: 'We label pitches with 7 letter names that repeat:',
        list: [
          'A B C D E F G (then it repeats)',
          'Between many notes are "in-between" pitches called sharps (♯) and flats (♭)',
          'C♯ = one step higher than C',
          'D♭ = one step lower than D',
          '(C♯ and D♭ are the same piano key—called enharmonic!)'
        ],
        visual: <MusicalAlphabetVisual />
      },
      {
        subtitle: 'Understanding Half Steps and Whole Steps',
        text: 'The distance between notes is measured in steps. This is crucial for understanding scales!',
        visual: <HalfWholeStepKeyboardVisual />,
        tip: 'On a piano, a half step is from any key to the very next key (including black keys). A whole step skips one key in between.'
      }
    ]
  },
  {
    id: 'rhythm',
    title: 'Rhythm: Music in Time',
    icon: '⏱️',
    description: 'When notes happen',
    content: [
      {
        subtitle: 'If Pitch is "What," Rhythm is "When"',
        text: 'Rhythm controls the timing of music. Three key concepts help us understand rhythm:',
        visual: <RhythmConceptsVisual />
      },
      {
        subtitle: 'Note Lengths',
        text: 'Different note shapes tell us how long to hold each note (in 4/4 time):',
        list: [
          'Whole note = 4 beats',
          'Half note = 2 beats',
          'Quarter note = 1 beat',
          'Eighth note = 1/2 beat'
        ],
        visual: <NoteLengthsVisual />,
        tip: 'Think of beats like slices of a pizza—a whole note gets the entire pizza, while eighth notes get small slices!'
      }
    ]
  },
  {
    id: 'staff',
    title: 'The Staff: How We Write Music',
    icon: '📝',
    description: 'Reading musical notation',
    content: [
      {
        subtitle: '5 Lines and 4 Spaces',
        text: 'Most Western music is written on a staff: 5 horizontal lines and 4 spaces between them. Each line and space represents a different pitch.',
      },
      {
        subtitle: 'Clefs Tell You Which Pitches',
        text: 'Clefs are symbols that tell you which notes the staff represents:',
        list: [
          'Treble clef (𝄞): Higher sounds (many melodies, vocals, violin)',
          'Bass clef (𝄢): Lower sounds (bass lines, left hand piano, cello)'
        ],
        visual: <StaffClefsVisual />
      }
    ]
  },
  {
    id: 'scales',
    title: 'Scales: The "Home Set" of Notes',
    icon: '🎹',
    description: 'Notes that belong together',
    content: [
      {
        subtitle: 'What is a Scale?',
        text: 'A scale is a pattern of notes that sounds like it belongs together—like the "alphabet" for a piece of music.',
      },
      {
        subtitle: 'Major Scale: Bright and Stable',
        text: 'The major scale follows a consistent spacing pattern. You don\'t have to memorize it right away—just know: major has a recognizable "happy/bright" sound.',
        visual: <MajorScalePatternVisual />,
        tip: 'Try playing a C major scale on a piano—it\'s all the white keys from C to C!'
      },
      {
        subtitle: 'Minor Scale: Darker and Emotional',
        text: 'Minor scales sound different because the pattern of steps is different. They tend to sound more emotional or serious compared to major scales.',
        visual: <MajorMinorComparisonVisual />,
        tip: 'Listen to the audio examples above. The emotional difference between major and minor is one of the most important concepts in music!'
      }
    ]
  },
  {
    id: 'intervals',
    title: 'Intervals: Distance Between Notes',
    icon: '📏',
    description: 'Measuring pitch distance',
    content: [
      {
        subtitle: 'What is an Interval?',
        text: 'An interval is how far apart two notes are. Intervals are the core of melody and harmony: they explain why something sounds tense, calm, bright, or dark.',
        list: [
          'C to D = 2nd',
          'C to E = 3rd',
          'C to G = 5th',
          'C to C (higher) = octave'
        ],
        visual: <IntervalsSimpleVisual />,
        tip: 'Intervals create emotion! A 5th sounds strong and stable, while a 2nd can sound tense.'
      }
    ]
  },
  {
    id: 'chords',
    title: 'Chords: Notes Stacked Together',
    icon: '🎸',
    description: 'Playing notes simultaneously',
    content: [
      {
        subtitle: 'What is a Chord?',
        text: 'A chord is when you play multiple notes at once. The most common chord is a triad—built by stacking every other note in a scale (building in "thirds").',
        visual: <TriadVisual />
      },
      {
        subtitle: 'Two Common Flavors',
        text: 'Chords come in different types that create different feelings:',
        list: [
          'Major chord: Brighter, happier sound (like C-E-G)',
          'Minor chord: Darker, more serious sound (lower the middle note by half step)'
        ],
        tip: 'In C major, the C major chord is C-E-G. For C minor, just lower the E to E♭!'
      }
    ]
  },
  {
    id: 'keys',
    title: 'Keys: The "Home Base" of a Song',
    icon: '🏠',
    description: 'Musical center of gravity',
    content: [
      {
        subtitle: 'What is a Key?',
        text: 'A key is the scale that a piece of music is centered around—its musical "home." In the key of C major, the note C feels like home, and many chords and melodies will lead you back to C.',
        visual: <KeyConceptVisual />
      },
      {
        subtitle: 'Tonality: The Pull Toward Home',
        text: 'That "pull" toward the home note is called tonality. It\'s what makes music feel resolved when it ends on the home chord.',
        tip: 'Try humming a major scale but stop before the last note—you\'ll feel the tension wanting to resolve!'
      }
    ]
  },
  {
    id: 'progressions',
    title: 'Chord Progressions: Harmony That Moves',
    icon: '🔄',
    description: 'Creating musical movement',
    content: [
      {
        subtitle: 'Music as a Story',
        text: 'Music often works like a story: it starts somewhere stable, creates movement or tension, then resolves.',
      },
      {
        subtitle: 'A Chord Progression',
        text: 'A chord progression is the sequence of chords that creates that feeling. One very common progression is I → V → vi → IV (in C major: C → G → Am → F).',
        visual: <ChordProgressionVisual />,
        tip: 'This progression is everywhere in pop music! Try listening for it in your favorite songs.'
      },
      {
        subtitle: 'Roman Numerals',
        text: 'Roman numerals (I, V, vi, IV) represent chords built from the scale. You don\'t need to know them right away—just know they help us talk about progressions in any key.',
      }
    ]
  },
  {
    id: 'layers',
    title: 'Melody + Harmony + Form',
    icon: '🎭',
    description: 'The three lenses of music',
    content: [
      {
        subtitle: 'Three Ways to Understand Music',
        text: 'Most music can be understood through three big lenses:',
        visual: <MusicLayersVisual />
      }
    ]
  },
  {
    id: 'mindset',
    title: 'A Beginner\'s Goal',
    icon: '🎯',
    description: 'What to focus on first',
    content: [
      {
        subtitle: 'You Don\'t Need to Memorize Everything',
        text: 'Music theory isn\'t a set of rules—it\'s a set of names for patterns you can hear. A good beginner goal is:',
        list: [
          'Identify notes on the staff',
          'Clap simple rhythms in a time signature',
          'Recognize major vs minor sound',
          'Build basic chords and play common progressions'
        ],
        tip: 'Focus on listening! Theory makes more sense when you can hear what you\'re learning about.'
      }
    ]
  }
]

export default function LearningPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>('intro')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sectionRefs = useState<{ [key: string]: HTMLButtonElement | null }>({})[0]

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()

        if (!data.user) {
          router.push('/login')
          return
        }

        if (data.user.role !== 'student') {
          router.push('/profile')
          return
        }

        setUser(data.user)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleSectionToggle = (sectionId: string) => {
    const wasExpanded = expandedSection === sectionId
    const buttonElement = sectionRefs[sectionId]

    if (buttonElement && !wasExpanded) {
      // Store the button's position before expansion
      const buttonRect = buttonElement.getBoundingClientRect()
      const scrollY = window.scrollY
      const buttonTop = buttonRect.top + scrollY

      setExpandedSection(sectionId)

      // After a short delay to let the content render, scroll to keep the button in view
      requestAnimationFrame(() => {
        const navHeight = 64 // Height of sticky nav
        const offset = 20 // Small offset from top
        window.scrollTo({
          top: buttonTop - navHeight - offset,
          behavior: 'smooth'
        })
      })
    } else {
      setExpandedSection(wasExpanded ? null : sectionId)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/images/quiznotes logo.jpg"
                  alt="QuizNotes Logo"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-gray-900">QuizNotes</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/profile" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors">
                  Dashboard
                </Link>
                <Link href="/quiz" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors">
                  Quizzes
                </Link>
                <span className="text-brand font-semibold text-sm">Learning</span>
                {user.subscriptionStatus === 'active' && (
                  <Link href="/tools/piano" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors flex items-center gap-1">
                    <span>👑</span>
                    Premium Tools
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProfileDropdown user={user} />
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-gray-900"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold"
              >
                Dashboard
              </Link>
              <Link
                href="/quiz"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold"
              >
                Quizzes
              </Link>
              <Link
                href="/learning"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-brand hover:bg-gray-50 rounded-lg text-sm font-semibold"
              >
                Learning
              </Link>
              {user.subscriptionStatus === 'active' && (
                <Link
                  href="/tools/piano"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold flex items-center gap-1"
                >
                  <span>👑</span>
                  Premium Tools
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Music Theory Made Simple
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The language of music, explained clearly for beginners. No prior experience needed!
          </p>
        </div>

        {/* Learning Sections */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {LEARNING_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              {/* Section Header */}
              <button
                ref={(el) => { sectionRefs[section.id] = el }}
                onClick={(e) => {
                  e.preventDefault()
                  handleSectionToggle(section.id)
                }}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{section.icon}</div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-sm text-gray-500">{section.description}</p>
                  </div>
                </div>
                <svg
                  className={`w-6 h-6 text-gray-400 transition-transform ${
                    expandedSection === section.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Section Content */}
              {expandedSection === section.id && (
                <div className="px-6 pb-6 space-y-6 border-t border-gray-100">
                  {section.content.map((item, index) => (
                    <div key={index} className="pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.subtitle}</h3>
                      <p className="text-gray-700 mb-3">{item.text}</p>
                      {item.list && (
                        <ul className="space-y-2 ml-4 mb-3">
                          {item.list.map((listItem, listIndex) => (
                            <li key={listIndex} className="flex items-start gap-2">
                              <span className="text-brand mt-1">•</span>
                              <span className="text-gray-600">{listItem}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.visual && (
                        <div className="mt-4">
                          {item.visual}
                        </div>
                      )}
                      {item.tip && (
                        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                          <p className="text-sm text-blue-900">
                            <span className="font-semibold">💡 Tip:</span> {item.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-brand to-purple-600 rounded-xl p-8 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Ready to Practice What You Learned?</h2>
          <p className="text-lg mb-6 opacity-90">
            Test your knowledge with our interactive music theory quizzes!
          </p>
          <Link
            href="/quiz"
            className="inline-block px-8 py-3 bg-white text-brand font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Take a Quiz
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/quiznotes logo.jpg"
                alt="QuizNotes Logo"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="text-sm font-semibold text-white">QuizNotes</span>
            </div>
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} QuizNotes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
