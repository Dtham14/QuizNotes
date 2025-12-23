'use client'

import { useState, useCallback } from 'react'

interface PianoKeyProps {
  note: string
  isBlack: boolean
  isPressed: boolean
  onNoteStart: (note: string) => void
  onNoteEnd: (note: string) => void
  keyboardShortcut?: string
}

export default function PianoKey({
  note,
  isBlack,
  isPressed,
  onNoteStart,
  onNoteEnd,
  keyboardShortcut,
}: PianoKeyProps) {
  const [isMouseDown, setIsMouseDown] = useState(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsMouseDown(true)
    onNoteStart(note)
  }, [note, onNoteStart])

  const handlePointerUp = useCallback(() => {
    setIsMouseDown(false)
    onNoteEnd(note)
  }, [note, onNoteEnd])

  const handlePointerLeave = useCallback(() => {
    if (isMouseDown) {
      setIsMouseDown(false)
      onNoteEnd(note)
    }
  }, [isMouseDown, note, onNoteEnd])

  const isActive = isPressed || isMouseDown

  if (isBlack) {
    return (
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`
          absolute z-10 rounded-b-md
          transition-all duration-75 select-none touch-none
          ${isActive
            ? 'bg-gray-600 translate-y-0.5 shadow-sm'
            : 'bg-gray-900 shadow-lg hover:bg-gray-800'
          }
        `}
        style={{
          touchAction: 'none',
          width: '60%',
          height: '60%',
          left: '100%',
          top: 0,
          transform: 'translateX(-50%)',
        }}
      >
        {keyboardShortcut && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-mono">
            {keyboardShortcut}
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`
        relative w-full h-full border-r border-gray-300 rounded-b-lg
        transition-all duration-75 select-none touch-none
        first:rounded-bl-lg last:rounded-br-lg
        ${isActive
          ? 'bg-blue-100 shadow-inner'
          : 'bg-white shadow-md hover:bg-gray-50'
        }
      `}
      style={{ touchAction: 'none' }}
    >
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-mono">
        {keyboardShortcut}
      </span>
    </button>
  )
}
