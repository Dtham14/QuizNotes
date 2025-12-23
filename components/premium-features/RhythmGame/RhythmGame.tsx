'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { initializeAudio } from '@/lib/audio/toneUtils'
import { type Difficulty, type RhythmPattern, getRandomPattern } from './rhythmPatterns'

interface FallingNote {
  id: number
  beatTime: number // When the note should be hit (in ms from start)
  y: number // Current y position
  hit: boolean
  missed: boolean
  hitQuality?: 'perfect' | 'good' | 'miss'
}

interface GameState {
  isPlaying: boolean
  isPaused: boolean
  score: number
  combo: number
  maxCombo: number
  perfectHits: number
  goodHits: number
  misses: number
}

const LANE_WIDTH = 120
const NOTE_SIZE = 50
const HIT_LINE_Y = 400 // Where notes should be hit
const PERFECT_WINDOW = 50 // ms
const GOOD_WINDOW = 120 // ms
const FALL_SPEED = 200 // pixels per second at 60 BPM (scales with BPM)

const PREMIUM_BLUE = '#439FDD'

export default function RhythmGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const gameStartTime = useRef<number>(0)
  const lastFrameTime = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const notesRef = useRef<FallingNote[]>([])
  const hitFeedbackRef = useRef<{ quality: string; timestamp: number } | null>(null)
  const nextNoteIdRef = useRef<number>(0)
  const nextBeatTimeRef = useRef<number>(0)

  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [currentPattern, setCurrentPattern] = useState<RhythmPattern | null>(null)
  const [notes, setNotes] = useState<FallingNote[]>([])
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectHits: 0,
    goodHits: 0,
    misses: 0,
  })
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [hitFeedback, setHitFeedback] = useState<{ quality: string; timestamp: number } | null>(null)

  // Initialize audio
  useEffect(() => {
    initializeAudio()
  }, [])

  // Play hit sound
  const playHitSound = useCallback((quality: 'perfect' | 'good' | 'miss') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    if (quality === 'perfect') {
      oscillator.frequency.value = 880 // A5
      gainNode.gain.value = 0.3
    } else if (quality === 'good') {
      oscillator.frequency.value = 660 // E5
      gainNode.gain.value = 0.2
    } else {
      oscillator.frequency.value = 220 // A3
      gainNode.gain.value = 0.15
    }

    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    oscillator.stop(ctx.currentTime + 0.1)
  }, [])

  // Start game with countdown
  const startGame = useCallback(() => {
    const pattern = getRandomPattern(difficulty)
    setCurrentPattern(pattern)
    setShowResults(false)
    setGameState({
      isPlaying: false,
      isPaused: false,
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectHits: 0,
      goodHits: 0,
      misses: 0,
    })

    // Reset endless mode counters
    nextNoteIdRef.current = 0
    const msPerBeat = (60 / pattern.bpm) * 1000
    const leadTime = 2000 // 2 seconds of falling time
    nextBeatTimeRef.current = leadTime

    // Start with a few initial notes
    const initialNotes: FallingNote[] = pattern.beats.slice(0, 4).map((beat, index) => ({
      id: nextNoteIdRef.current++,
      beatTime: beat * msPerBeat + leadTime,
      y: -NOTE_SIZE,
      hit: false,
      missed: false,
    }))

    setNotes(initialNotes)
    notesRef.current = initialNotes

    // Countdown
    setCountdown(3)
    let count = 3
    const countdownInterval = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else {
        setCountdown(null)
        clearInterval(countdownInterval)
        // Start the game
        gameStartTime.current = performance.now()
        lastFrameTime.current = gameStartTime.current
        nextBeatTimeRef.current = leadTime + (4 * msPerBeat)
        setGameState(prev => ({ ...prev, isPlaying: true }))
      }
    }, 1000)
  }, [difficulty])

  // Keep refs in sync with state
  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  useEffect(() => {
    hitFeedbackRef.current = hitFeedback
  }, [hitFeedback])

  // Draw game - pass currentNotes as parameter to avoid stale closure
  const drawGame = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, currentNotes: FallingNote[], currentFeedback: { quality: string; timestamp: number } | null) => {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, height)

    // Draw lane
    const laneX = (width - LANE_WIDTH) / 2
    ctx.fillStyle = '#16213e'
    ctx.fillRect(laneX, 0, LANE_WIDTH, height)

    // Draw lane borders
    ctx.strokeStyle = '#0f3460'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(laneX, 0)
    ctx.lineTo(laneX, height)
    ctx.moveTo(laneX + LANE_WIDTH, 0)
    ctx.lineTo(laneX + LANE_WIDTH, height)
    ctx.stroke()

    // Draw hit line
    ctx.strokeStyle = PREMIUM_BLUE
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(laneX - 20, HIT_LINE_Y)
    ctx.lineTo(laneX + LANE_WIDTH + 20, HIT_LINE_Y)
    ctx.stroke()

    // Draw hit zone
    ctx.fillStyle = `${PREMIUM_BLUE}20`
    ctx.fillRect(laneX, HIT_LINE_Y - 30, LANE_WIDTH, 60)

    // Draw notes
    currentNotes.forEach(note => {
      if (note.y < -NOTE_SIZE || note.y > height) return

      const noteX = (width - NOTE_SIZE) / 2

      if (note.hit) {
        // Hit note - fade out
        ctx.globalAlpha = Math.max(0, 1 - (note.y - HIT_LINE_Y) / 100)
        ctx.fillStyle = note.hitQuality === 'perfect' ? '#10b981' : '#f59e0b'
      } else if (note.missed) {
        ctx.globalAlpha = 0.3
        ctx.fillStyle = '#ef4444'
      } else {
        ctx.globalAlpha = 1
        ctx.fillStyle = PREMIUM_BLUE
      }

      // Draw note circle
      ctx.beginPath()
      ctx.arc(noteX + NOTE_SIZE / 2, note.y, NOTE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()

      // Note border
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.globalAlpha = 1
    })

    // Draw hit feedback
    if (currentFeedback && Date.now() - currentFeedback.timestamp < 500) {
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = currentFeedback.quality === 'Perfect!' ? '#10b981' :
                      currentFeedback.quality === 'Good!' ? '#f59e0b' : '#ef4444'
      ctx.fillText(currentFeedback.quality, width / 2, HIT_LINE_Y - 50)
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pattern = currentPattern
    if (!pattern) return

    const msPerBeat = (60 / pattern.bpm) * 1000
    const pixelsPerMs = (FALL_SPEED * (pattern.bpm / 60)) / 1000

    const gameLoop = (timestamp: number) => {
      const elapsed = timestamp - gameStartTime.current
      lastFrameTime.current = timestamp

      // Spawn new notes continuously
      while (elapsed >= nextBeatTimeRef.current) {
        const patternIndex = (nextNoteIdRef.current - 4) % pattern.beats.length
        const beatOffset = pattern.beats[patternIndex]
        const newNote: FallingNote = {
          id: nextNoteIdRef.current++,
          beatTime: nextBeatTimeRef.current,
          y: -NOTE_SIZE,
          hit: false,
          missed: false,
        }
        notesRef.current = [...notesRef.current, newNote]
        nextBeatTimeRef.current += msPerBeat
      }

      // Update note positions using ref to get latest notes
      const currentNotes = notesRef.current
      let updatedNotes = currentNotes.map(note => {
        if (note.hit || note.missed) return note

        // Calculate y position based on time
        const timeUntilHit = note.beatTime - elapsed
        const newY = HIT_LINE_Y - (timeUntilHit * pixelsPerMs)

        // Check if note was missed (passed the hit line by too much)
        if (newY > HIT_LINE_Y + GOOD_WINDOW * pixelsPerMs && !note.missed) {
          setGameState(prev => ({
            ...prev,
            misses: prev.misses + 1,
            combo: 0,
          }))
          playHitSound('miss')
          return { ...note, y: newY, missed: true, hitQuality: 'miss' as const }
        }

        return { ...note, y: newY }
      })

      // Remove notes that are far off screen to prevent memory issues
      updatedNotes = updatedNotes.filter(note => note.y < 700)

      // Update notes state and ref
      notesRef.current = updatedNotes
      setNotes(updatedNotes)

      // Draw with current notes and feedback
      drawGame(ctx, canvas.width, canvas.height, updatedNotes, hitFeedbackRef.current)

      if (gameState.isPlaying && !gameState.isPaused) {
        animationRef.current = requestAnimationFrame(gameLoop)
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [gameState.isPlaying, gameState.isPaused, currentPattern, playHitSound, drawGame])

  // Stop game manually
  const stopGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPlaying: false }))
    setShowResults(true)
  }, [])

  // Handle tap/click
  const handleTap = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return

    const now = performance.now() - gameStartTime.current

    // Find the closest unhit note using ref
    const currentNotes = notesRef.current
    let closestNote: FallingNote | null = null
    let closestDiff = Infinity

    currentNotes.forEach(note => {
      if (note.hit || note.missed) return
      const diff = Math.abs(note.beatTime - now)
      if (diff < closestDiff) {
        closestDiff = diff
        closestNote = note
      }
    })

    if (closestNote && closestDiff <= GOOD_WINDOW) {
      const quality: 'perfect' | 'good' = closestDiff <= PERFECT_WINDOW ? 'perfect' : 'good'
      const points = quality === 'perfect' ? 100 : 50

      // Update both state and ref
      const updatedNotes: FallingNote[] = currentNotes.map(n =>
        n.id === closestNote!.id ? { ...n, hit: true, hitQuality: quality } : n
      )
      notesRef.current = updatedNotes
      setNotes(updatedNotes)

      setGameState(prev => {
        const newCombo = prev.combo + 1
        return {
          ...prev,
          score: prev.score + points * (1 + Math.floor(newCombo / 10) * 0.1),
          combo: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
          perfectHits: quality === 'perfect' ? prev.perfectHits + 1 : prev.perfectHits,
          goodHits: quality === 'good' ? prev.goodHits + 1 : prev.goodHits,
        }
      })

      playHitSound(quality)
      setHitFeedback({ quality: quality === 'perfect' ? 'Perfect!' : 'Good!', timestamp: Date.now() })
    } else {
      // Missed tap (no note nearby)
      playHitSound('miss')
      setHitFeedback({ quality: 'Miss!', timestamp: Date.now() })
    }
  }, [gameState.isPlaying, gameState.isPaused, playHitSound])

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        handleTap()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleTap])

  const accuracy = gameState.perfectHits + gameState.goodHits + gameState.misses > 0
    ? Math.round(((gameState.perfectHits + gameState.goodHits * 0.5) / (gameState.perfectHits + gameState.goodHits + gameState.misses)) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Controls */}
      {!gameState.isPlaying && !countdown && !showResults && (
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Difficulty:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="easy">Easy (60 BPM)</option>
              <option value="medium">Medium (80-90 BPM)</option>
              <option value="hard">Hard (100-120 BPM)</option>
            </select>
          </div>
          <button
            onClick={startGame}
            className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Score display during game */}
      {(gameState.isPlaying || countdown) && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-4 items-center">
            <span className="text-lg font-bold">Score: {Math.round(gameState.score)}</span>
            <span className="text-lg font-bold text-amber-500">Combo: {gameState.combo}x</span>
            {gameState.isPlaying && (
              <button
                onClick={stopGame}
                className="px-4 py-1 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
              >
                Stop Game
              </button>
            )}
          </div>
          {currentPattern && (
            <span className="text-sm text-gray-500">{currentPattern.name} - {currentPattern.bpm} BPM</span>
          )}
        </div>
      )}

      {/* Game canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          onClick={handleTap}
          className="mx-auto rounded-xl cursor-pointer"
          style={{ touchAction: 'none' }}
        />

        {/* Countdown overlay */}
        {countdown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
            <span className="text-8xl font-bold text-white animate-pulse">{countdown}</span>
          </div>
        )}

        {/* Results overlay */}
        {showResults && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl">
            <div className="text-center text-white p-6">
              <h3 className="text-3xl font-bold mb-4">Game Over!</h3>
              <div className="space-y-2 mb-6">
                <p className="text-2xl">Score: <span className="text-amber-400">{Math.round(gameState.score)}</span></p>
                <p>Accuracy: <span className="text-green-400">{accuracy}%</span></p>
                <p>Max Combo: <span className="text-blue-400">{gameState.maxCombo}x</span></p>
                <div className="flex justify-center gap-4 text-sm mt-2">
                  <span className="text-green-400">Perfect: {gameState.perfectHits}</span>
                  <span className="text-amber-400">Good: {gameState.goodHits}</span>
                  <span className="text-red-400">Miss: {gameState.misses}</span>
                </div>
              </div>
              <button
                onClick={startGame}
                className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500 text-center">
        <p><strong>Tap/Click</strong> the game area or press <strong>Space/Enter</strong> when notes reach the blue line!</p>
      </div>
    </div>
  )
}
