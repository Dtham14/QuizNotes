// Types for the Sandbox Composition tool

export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
export type NoteValue = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type Accidental = 'natural' | 'sharp' | 'flat'
export type Clef = 'treble' | 'bass'

export interface CompositionNote {
  id: string
  pitch: string // e.g., "C4", "D#5"
  duration: NoteDuration
  startBeat: number // Position in the measure (0-based)
}

export interface Measure {
  id: string
  notes: CompositionNote[]
}

export interface Composition {
  title: string
  timeSignature: [number, number] // [beats per measure, beat unit]
  keySignature: string // e.g., "C", "G", "F", "D", etc.
  clef: Clef
  tempo: number // BPM
  measures: Measure[]
}

export const TIME_SIGNATURES: [number, number][] = [
  [4, 4],
  [3, 4],
  [2, 4],
  [6, 8],
]

export const KEY_SIGNATURES = [
  { key: 'C', label: 'C Major / A minor', sharps: 0, flats: 0 },
  { key: 'G', label: 'G Major / E minor', sharps: 1, flats: 0 },
  { key: 'D', label: 'D Major / B minor', sharps: 2, flats: 0 },
  { key: 'A', label: 'A Major / F# minor', sharps: 3, flats: 0 },
  { key: 'F', label: 'F Major / D minor', sharps: 0, flats: 1 },
  { key: 'Bb', label: 'Bb Major / G minor', sharps: 0, flats: 2 },
  { key: 'Eb', label: 'Eb Major / C minor', sharps: 0, flats: 3 },
]

export const NOTE_DURATIONS: { value: NoteDuration; label: string; beats: number }[] = [
  { value: 'whole', label: 'Whole', beats: 4 },
  { value: 'half', label: 'Half', beats: 2 },
  { value: 'quarter', label: 'Quarter', beats: 1 },
  { value: 'eighth', label: 'Eighth', beats: 0.5 },
  { value: 'sixteenth', label: 'Sixteenth', beats: 0.25 },
]

// Staff line positions for treble clef (middle C = C4)
export const TREBLE_STAFF_NOTES = [
  'E6', 'D6', 'C6', 'B5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'
]

export const BASS_STAFF_NOTES = [
  'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'B2', 'A2', 'G2', 'F2', 'E2'
]

export function createEmptyComposition(): Composition {
  return {
    title: 'Untitled',
    timeSignature: [4, 4],
    keySignature: 'C',
    clef: 'treble',
    tempo: 120,
    measures: [
      { id: '1', notes: [] },
      { id: '2', notes: [] },
      { id: '3', notes: [] },
      { id: '4', notes: [] },
    ],
  }
}

export function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
