'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { initializeAudio, playNote, playSequence } from '@/lib/audio/toneUtils'
import {
  type Composition,
  type CompositionNote,
  type NoteDuration,
  type Clef,
  createEmptyComposition,
  generateNoteId,
  TIME_SIGNATURES,
  KEY_SIGNATURES,
  NOTE_DURATIONS,
  TREBLE_STAFF_NOTES,
  BASS_STAFF_NOTES,
} from './compositionTypes'

const PREMIUM_BLUE = '#439FDD'

// Staff rendering constants
const STAFF_START_X = 80
const STAFF_WIDTH = 600
const LINE_SPACING = 12
const MEASURE_WIDTH = 140

export default function SandboxComposition() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [composition, setComposition] = useState<Composition>(createEmptyComposition())
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter')
  const [selectedMeasure, setSelectedMeasure] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayingBeat, setCurrentPlayingBeat] = useState<number | null>(null)
  const [audioReady, setAudioReady] = useState(false)
  const playbackRef = useRef<NodeJS.Timeout[]>([])

  // Initialize audio
  useEffect(() => {
    initializeAudio().then(setAudioReady)
  }, [])

  // Get staff notes based on clef
  const staffNotes = composition.clef === 'treble' ? TREBLE_STAFF_NOTES : BASS_STAFF_NOTES

  // Draw the staff and notes
  const drawStaff = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, width, height)

    // Draw staff lines
    const staffTop = 60
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1

    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * LINE_SPACING
      ctx.beginPath()
      ctx.moveTo(STAFF_START_X - 20, y)
      ctx.lineTo(STAFF_START_X + STAFF_WIDTH, y)
      ctx.stroke()
    }

    // Draw clef symbol
    ctx.font = '48px serif'
    ctx.fillStyle = '#333'
    if (composition.clef === 'treble') {
      ctx.fillText('𝄞', STAFF_START_X - 15, staffTop + 42)
    } else {
      ctx.fillText('𝄢', STAFF_START_X - 15, staffTop + 32)
    }

    // Draw time signature
    ctx.font = 'bold 20px sans-serif'
    ctx.fillStyle = '#333'
    ctx.fillText(composition.timeSignature[0].toString(), STAFF_START_X + 35, staffTop + 18)
    ctx.fillText(composition.timeSignature[1].toString(), STAFF_START_X + 35, staffTop + 40)

    // Draw measure lines
    for (let i = 0; i <= composition.measures.length; i++) {
      const x = STAFF_START_X + 60 + i * MEASURE_WIDTH
      ctx.strokeStyle = '#666'
      ctx.lineWidth = i === composition.measures.length ? 3 : 1
      ctx.beginPath()
      ctx.moveTo(x, staffTop)
      ctx.lineTo(x, staffTop + 4 * LINE_SPACING)
      ctx.stroke()
    }

    // Draw measure numbers
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#999'
    for (let i = 0; i < composition.measures.length; i++) {
      const x = STAFF_START_X + 60 + i * MEASURE_WIDTH + MEASURE_WIDTH / 2
      ctx.fillText((i + 1).toString(), x - 4, staffTop - 10)
    }

    // Highlight selected measure
    if (selectedMeasure < composition.measures.length) {
      const x = STAFF_START_X + 60 + selectedMeasure * MEASURE_WIDTH
      ctx.fillStyle = `${PREMIUM_BLUE}20`
      ctx.fillRect(x + 1, staffTop - 5, MEASURE_WIDTH - 2, 4 * LINE_SPACING + 10)
    }

    // Draw notes
    composition.measures.forEach((measure, measureIndex) => {
      const measureStartX = STAFF_START_X + 60 + measureIndex * MEASURE_WIDTH

      measure.notes.forEach(note => {
        // Find note position on staff
        const pitchWithoutOctave = note.pitch.replace(/[0-9]/g, '')
        const octave = parseInt(note.pitch.match(/[0-9]/)?.[0] || '4')
        const fullPitch = pitchWithoutOctave + octave

        const noteIndex = staffNotes.indexOf(fullPitch)
        if (noteIndex === -1) return

        // Calculate y position
        const noteY = staffTop - LINE_SPACING + noteIndex * (LINE_SPACING / 2)

        // Calculate x position based on beat
        const beatWidth = MEASURE_WIDTH / composition.timeSignature[0]
        const noteX = measureStartX + 20 + note.startBeat * beatWidth

        // Draw note
        const noteRadius = 6
        ctx.fillStyle = currentPlayingBeat !== null &&
          measureIndex * composition.timeSignature[0] + note.startBeat <= currentPlayingBeat &&
          measureIndex * composition.timeSignature[0] + note.startBeat + getDurationBeats(note.duration) > currentPlayingBeat
          ? PREMIUM_BLUE : '#333'

        // Note head
        ctx.beginPath()
        ctx.ellipse(noteX, noteY, noteRadius + 1, noteRadius, -0.3, 0, Math.PI * 2)

        if (note.duration === 'whole' || note.duration === 'half') {
          ctx.strokeStyle = ctx.fillStyle
          ctx.lineWidth = 2
          ctx.stroke()
        } else {
          ctx.fill()
        }

        // Stem (except for whole notes)
        if (note.duration !== 'whole') {
          ctx.strokeStyle = ctx.fillStyle
          ctx.lineWidth = 1.5
          ctx.beginPath()
          const stemUp = noteY > staffTop + 2 * LINE_SPACING
          if (stemUp) {
            ctx.moveTo(noteX + noteRadius, noteY)
            ctx.lineTo(noteX + noteRadius, noteY - 30)
          } else {
            ctx.moveTo(noteX - noteRadius, noteY)
            ctx.lineTo(noteX - noteRadius, noteY + 30)
          }
          ctx.stroke()

          // Flags for eighth and sixteenth notes
          if (note.duration === 'eighth' || note.duration === 'sixteenth') {
            ctx.beginPath()
            if (stemUp) {
              ctx.moveTo(noteX + noteRadius, noteY - 30)
              ctx.quadraticCurveTo(noteX + noteRadius + 15, noteY - 20, noteX + noteRadius + 5, noteY - 10)
            } else {
              ctx.moveTo(noteX - noteRadius, noteY + 30)
              ctx.quadraticCurveTo(noteX - noteRadius + 15, noteY + 20, noteX - noteRadius + 5, noteY + 10)
            }
            ctx.stroke()
          }

          if (note.duration === 'sixteenth') {
            ctx.beginPath()
            if (stemUp) {
              ctx.moveTo(noteX + noteRadius, noteY - 24)
              ctx.quadraticCurveTo(noteX + noteRadius + 15, noteY - 14, noteX + noteRadius + 5, noteY - 4)
            } else {
              ctx.moveTo(noteX - noteRadius, noteY + 24)
              ctx.quadraticCurveTo(noteX - noteRadius + 15, noteY + 14, noteX - noteRadius + 5, noteY + 4)
            }
            ctx.stroke()
          }
        }

        // Ledger lines if needed
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        // Above staff
        if (noteY < staffTop) {
          for (let ledgerY = staffTop - LINE_SPACING; ledgerY >= noteY; ledgerY -= LINE_SPACING) {
            ctx.beginPath()
            ctx.moveTo(noteX - 12, ledgerY)
            ctx.lineTo(noteX + 12, ledgerY)
            ctx.stroke()
          }
        }
        // Below staff (middle C ledger line for treble)
        if (noteY > staffTop + 4 * LINE_SPACING) {
          for (let ledgerY = staffTop + 5 * LINE_SPACING; ledgerY <= noteY; ledgerY += LINE_SPACING) {
            ctx.beginPath()
            ctx.moveTo(noteX - 12, ledgerY)
            ctx.lineTo(noteX + 12, ledgerY)
            ctx.stroke()
          }
        }
      })
    })

  }, [composition, selectedMeasure, staffNotes, currentPlayingBeat])

  // Redraw when composition changes
  useEffect(() => {
    drawStaff()
  }, [drawStaff])

  // Get duration in beats
  function getDurationBeats(duration: NoteDuration): number {
    return NOTE_DURATIONS.find(d => d.value === duration)?.beats || 1
  }

  // Handle canvas click to add note
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const staffTop = 60

    // Determine which measure was clicked
    const measureAreaStart = STAFF_START_X + 60
    if (x < measureAreaStart || x > measureAreaStart + composition.measures.length * MEASURE_WIDTH) return

    const measureIndex = Math.floor((x - measureAreaStart) / MEASURE_WIDTH)
    if (measureIndex < 0 || measureIndex >= composition.measures.length) return

    // Determine beat position within measure
    const measureX = (x - measureAreaStart) % MEASURE_WIDTH
    const beatPosition = Math.floor((measureX / MEASURE_WIDTH) * composition.timeSignature[0])

    // Determine pitch from y position
    const noteIndex = Math.round((y - staffTop + LINE_SPACING) / (LINE_SPACING / 2))
    if (noteIndex < 0 || noteIndex >= staffNotes.length) return

    const pitch = staffNotes[noteIndex]

    // Check if there's already a note at this position
    const existingNoteIndex = composition.measures[measureIndex].notes.findIndex(
      n => n.startBeat === beatPosition
    )

    if (existingNoteIndex !== -1) {
      // Remove existing note
      setComposition(prev => ({
        ...prev,
        measures: prev.measures.map((m, i) =>
          i === measureIndex
            ? { ...m, notes: m.notes.filter((_, ni) => ni !== existingNoteIndex) }
            : m
        ),
      }))
    } else {
      // Add new note
      const newNote: CompositionNote = {
        id: generateNoteId(),
        pitch,
        duration: selectedDuration,
        startBeat: beatPosition,
      }

      // Play the note
      if (audioReady) {
        playNote(pitch, '8n')
      }

      setComposition(prev => ({
        ...prev,
        measures: prev.measures.map((m, i) =>
          i === measureIndex
            ? { ...m, notes: [...m.notes, newNote].sort((a, b) => a.startBeat - b.startBeat) }
            : m
        ),
      }))
    }

    setSelectedMeasure(measureIndex)
  }, [composition, selectedDuration, staffNotes, audioReady])

  // Playback composition
  const playComposition = useCallback(async () => {
    if (!audioReady || isPlaying) return

    await initializeAudio()
    setIsPlaying(true)
    setCurrentPlayingBeat(0)

    const msPerBeat = (60 / composition.tempo) * 1000
    let currentBeat = 0

    // Clear any existing playback
    playbackRef.current.forEach(clearTimeout)
    playbackRef.current = []

    // Schedule all notes
    composition.measures.forEach((measure, measureIndex) => {
      measure.notes.forEach(note => {
        const globalBeat = measureIndex * composition.timeSignature[0] + note.startBeat
        const delay = globalBeat * msPerBeat

        const timeout = setTimeout(() => {
          playNote(note.pitch, note.duration === 'whole' ? '1n' :
                              note.duration === 'half' ? '2n' :
                              note.duration === 'quarter' ? '4n' :
                              note.duration === 'eighth' ? '8n' : '16n')
          setCurrentPlayingBeat(globalBeat)
        }, delay)

        playbackRef.current.push(timeout)
      })
    })

    // Update beat indicator
    const totalBeats = composition.measures.length * composition.timeSignature[0]
    for (let beat = 0; beat <= totalBeats; beat++) {
      const timeout = setTimeout(() => {
        setCurrentPlayingBeat(beat)
      }, beat * msPerBeat)
      playbackRef.current.push(timeout)
    }

    // End playback
    const endTimeout = setTimeout(() => {
      setIsPlaying(false)
      setCurrentPlayingBeat(null)
    }, totalBeats * msPerBeat + 500)
    playbackRef.current.push(endTimeout)

  }, [audioReady, isPlaying, composition])

  const stopPlayback = useCallback(() => {
    playbackRef.current.forEach(clearTimeout)
    playbackRef.current = []
    setIsPlaying(false)
    setCurrentPlayingBeat(null)
  }, [])

  // Clear composition
  const clearComposition = useCallback(() => {
    stopPlayback()
    setComposition(createEmptyComposition())
    setSelectedMeasure(0)
  }, [stopPlayback])

  // Add measure
  const addMeasure = useCallback(() => {
    setComposition(prev => ({
      ...prev,
      measures: [...prev.measures, { id: generateNoteId(), notes: [] }],
    }))
  }, [])

  // Remove last measure
  const removeMeasure = useCallback(() => {
    if (composition.measures.length > 1) {
      setComposition(prev => ({
        ...prev,
        measures: prev.measures.slice(0, -1),
      }))
      if (selectedMeasure >= composition.measures.length - 1) {
        setSelectedMeasure(composition.measures.length - 2)
      }
    }
  }, [composition.measures.length, selectedMeasure])

  return (
    <div className="space-y-4">
      {/* Controls Row 1: Composition Settings */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Clef:</label>
          <select
            value={composition.clef}
            onChange={(e) => setComposition(prev => ({ ...prev, clef: e.target.value as Clef }))}
            className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="treble">Treble</option>
            <option value="bass">Bass</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Time:</label>
          <select
            value={`${composition.timeSignature[0]}/${composition.timeSignature[1]}`}
            onChange={(e) => {
              const [beats, unit] = e.target.value.split('/').map(Number)
              setComposition(prev => ({ ...prev, timeSignature: [beats, unit] as [number, number] }))
            }}
            className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
          >
            {TIME_SIGNATURES.map(([beats, unit]) => (
              <option key={`${beats}/${unit}`} value={`${beats}/${unit}`}>
                {beats}/{unit}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Key:</label>
          <select
            value={composition.keySignature}
            onChange={(e) => setComposition(prev => ({ ...prev, keySignature: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
          >
            {KEY_SIGNATURES.map(ks => (
              <option key={ks.key} value={ks.key}>{ks.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Tempo:</label>
          <input
            type="number"
            value={composition.tempo}
            onChange={(e) => setComposition(prev => ({ ...prev, tempo: Math.max(40, Math.min(200, parseInt(e.target.value) || 120)) }))}
            className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm"
            min={40}
            max={200}
          />
          <span className="text-sm text-gray-500">BPM</span>
        </div>
      </div>

      {/* Controls Row 2: Note Duration & Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Note:</label>
          <div className="flex gap-1">
            {NOTE_DURATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => setSelectedDuration(d.value)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedDuration === d.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={addMeasure}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
          >
            + Measure
          </button>
          <button
            onClick={removeMeasure}
            disabled={composition.measures.length <= 1}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            - Measure
          </button>
        </div>
      </div>

      {/* Staff Canvas */}
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 p-4">
        <canvas
          ref={canvasRef}
          width={Math.max(700, STAFF_START_X + 80 + composition.measures.length * MEASURE_WIDTH)}
          height={160}
          onClick={handleCanvasClick}
          className="cursor-crosshair"
        />
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-3">
        {!isPlaying ? (
          <button
            onClick={playComposition}
            disabled={composition.measures.every(m => m.notes.length === 0)}
            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
        ) : (
          <button
            onClick={stopPlayback}
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            Stop
          </button>
        )}
        <button
          onClick={clearComposition}
          disabled={isPlaying}
          className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          Clear All
        </button>
        <span className="text-sm text-gray-500 ml-auto">
          {composition.measures.reduce((acc, m) => acc + m.notes.length, 0)} notes
        </span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500 space-y-1">
        <p><strong>Click</strong> on the staff to add notes. Click an existing note to remove it.</p>
        <p>Select a note duration before placing. Adjust tempo, time signature, and key as needed.</p>
      </div>
    </div>
  )
}
