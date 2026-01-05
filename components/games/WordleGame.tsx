'use client'

import { useState } from 'react'

interface WordleHint {
  attemptNumber: number
  hint: string
}

interface WordleGameProps {
  answer: string
  answerType: 'chord' | 'note' | 'interval' | 'scale'
  maxAttempts: number
  hints: WordleHint[]
  onComplete: (score: number, attempts: number) => void
}

type FeedbackType = 'correct' | 'present' | 'absent'

interface Attempt {
  guess: string
  feedback: FeedbackType[]
}

// Possible guesses for validation (simplified - you can expand this)
const VALID_CHORDS = [
  'C', 'D', 'E', 'F', 'G', 'A', 'B',
  'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm',
  'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
  'Cmin7', 'Dmin7', 'Emin7', 'Fmin7', 'Gmin7', 'Amin7', 'Bmin7',
  'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
  'Cdim', 'Ddim', 'Edim', 'Fdim', 'Gdim', 'Adim', 'Bdim',
  'Caug', 'Daug', 'Eaug', 'Faug', 'Gaug', 'Aaug', 'Baug',
]

export default function WordleGame({
  answer,
  answerType,
  maxAttempts,
  hints,
  onComplete,
}: WordleGameProps) {
  const [currentGuess, setCurrentGuess] = useState('')
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showHint, setShowHint] = useState(false)

  const currentAttemptNumber = attempts.length + 1
  const availableHint = hints.find((h) => h.attemptNumber === currentAttemptNumber)

  const calculateFeedback = (guess: string): FeedbackType[] => {
    const feedback: FeedbackType[] = []
    const answerChars = answer.split('')
    const guessChars = guess.split('')

    // First pass: mark correct positions
    const answerUsed = new Array(answerChars.length).fill(false)
    const guessUsed = new Array(guessChars.length).fill(false)

    for (let i = 0; i < guessChars.length; i++) {
      if (guessChars[i] === answerChars[i]) {
        feedback[i] = 'correct'
        answerUsed[i] = true
        guessUsed[i] = true
      }
    }

    // Second pass: mark present characters
    for (let i = 0; i < guessChars.length; i++) {
      if (guessUsed[i]) continue

      const charIndex = answerChars.findIndex(
        (c, idx) => c === guessChars[i] && !answerUsed[idx]
      )

      if (charIndex !== -1) {
        feedback[i] = 'present'
        answerUsed[charIndex] = true
      } else {
        feedback[i] = 'absent'
      }
    }

    return feedback
  }

  const handleSubmit = () => {
    if (currentGuess.length === 0) {
      setErrorMessage('Please enter a guess')
      return
    }

    // Validate guess (simplified - just check if it's in our list for chords)
    if (answerType === 'chord' && !VALID_CHORDS.includes(currentGuess)) {
      setErrorMessage('Invalid chord format! Check examples below for correct spelling.')
      return
    }

    setErrorMessage('')

    const feedback = calculateFeedback(currentGuess)
    const newAttempts = [...attempts, { guess: currentGuess, feedback }]
    setAttempts(newAttempts)

    // Check if won
    if (currentGuess === answer) {
      setWon(true)
      setGameOver(true)
      // Score: 10 for try 1, 9 for try 2, ..., 5 for try 6
      const score = Math.max(5, 11 - newAttempts.length)
      onComplete(score, newAttempts.length)
    } else if (newAttempts.length >= maxAttempts) {
      // Out of attempts
      setGameOver(true)
      onComplete(0, newAttempts.length)
    }

    setCurrentGuess('')
  }

  const getFeedbackColor = (type: FeedbackType) => {
    switch (type) {
      case 'correct':
        return 'bg-green-500 text-white border-green-600'
      case 'present':
        return 'bg-yellow-500 text-white border-yellow-600'
      case 'absent':
        return 'bg-gray-400 text-white border-gray-500'
    }
  }

  const getFeedbackEmoji = (type: FeedbackType) => {
    switch (type) {
      case 'correct':
        return '🟩'
      case 'present':
        return '🟨'
      case 'absent':
        return '⬜'
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-white rounded-xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Music Theory Wordle</h1>
          <p className="text-gray-600">Guess the {answerType} in {maxAttempts} tries!</p>

          {/* Instructions */}
          <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-2">📖 How to Play:</p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Type your guess and press Enter or click Submit</li>
              <li>• <span className="inline-block w-4 h-4 bg-green-500 rounded align-middle"></span> <strong className="text-green-700">Green</strong> = correct letter in correct position</li>
              <li>• <span className="inline-block w-4 h-4 bg-yellow-500 rounded align-middle"></span> <strong className="text-yellow-700">Yellow</strong> = correct letter in wrong position</li>
              <li>• <span className="inline-block w-4 h-4 bg-gray-400 rounded align-middle"></span> <strong className="text-gray-700">Gray</strong> = letter not in answer</li>
            </ul>
          </div>
        </div>

        {/* Attempts Display */}
        <div className="space-y-2 mb-6">
          {attempts.map((attempt, idx) => (
            <div key={idx} className="flex gap-1 justify-center">
              {attempt.guess.split('').map((char, charIdx) => (
                <div
                  key={charIdx}
                  className={`w-12 h-12 border-2 rounded flex items-center justify-center font-bold text-lg ${getFeedbackColor(
                    attempt.feedback[charIdx]
                  )}`}
                >
                  {char}
                </div>
              ))}
            </div>
          ))}

          {/* Empty rows */}
          {!gameOver &&
            [...Array(maxAttempts - attempts.length)].map((_, idx) => (
              <div key={`empty-${idx}`} className="flex gap-1 justify-center">
                {[...Array(answer.length)].map((_, charIdx) => (
                  <div
                    key={charIdx}
                    className="w-12 h-12 border-2 border-gray-300 rounded flex items-center justify-center"
                  />
                ))}
              </div>
            ))}
        </div>

        {gameOver ? (
          /* Game Over Screen */
          <div className="text-center">
            <div className="text-6xl mb-4">{won ? '🎉' : '😔'}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {won ? 'You got it!' : 'Game Over'}
            </h2>
            <p className="text-gray-600 mb-4">
              {won
                ? `Solved in ${attempts.length} attempt${attempts.length !== 1 ? 's' : ''}!`
                : `The answer was: ${answer}`}
            </p>
            <div className="text-3xl font-bold text-violet-600 mb-4">
              Score: {won ? Math.max(5, 11 - attempts.length) : 0}/10
            </div>

            {/* Share Results */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Share your result:</p>
              <div className="text-lg">
                {attempts.map((attempt) =>
                  attempt.feedback.map(getFeedbackEmoji).join('')
                ).join('\n')}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Hint */}
            {availableHint && (
              <div className="mb-4">
                {showHint ? (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">💡 Hint:</p>
                    <p className="text-sm text-gray-700">{availableHint.hint}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-900 font-semibold rounded-lg hover:bg-blue-200 transition-colors border-2 border-blue-200"
                  >
                    💡 Show Hint (Available after {availableHint.attemptNumber} attempts)
                  </button>
                )}
              </div>
            )}

            {/* Input */}
            <div className="space-y-3">
              <input
                type="text"
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value.trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit()
                }}
                placeholder={answerType === 'chord' ? 'e.g., Cmaj7, Dm, G7...' : `Enter a ${answerType}...`}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-violet-500 focus:outline-none text-center text-lg font-semibold text-gray-900"
                maxLength={answer.length}
              />

              {errorMessage && (
                <p className="text-sm text-red-600 text-center">{errorMessage}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={currentGuess.length === 0}
                className="w-full px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Guess ({currentAttemptNumber}/{maxAttempts})
              </button>
            </div>

            {/* Examples */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                {answerType === 'chord' ? '🎹 Chord Format Examples:' : 'Examples:'}
              </p>
              {answerType === 'chord' && (
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Major triads:</strong> C, D, E, F, G, A, B</p>
                  <p><strong>Minor triads:</strong> Cm, Dm, Em (lowercase "m")</p>
                  <p><strong>7th chords:</strong> C7, Cmaj7, Cmin7</p>
                  <p><strong>Others:</strong> Cdim, Caug</p>
                  <p className="text-amber-700 mt-2">⚠️ Match exact spelling & capitalization!</p>
                </div>
              )}
              {answerType === 'note' && (
                <p className="text-xs text-gray-600">C, D#, Eb, F, G#, etc.</p>
              )}
              {answerType === 'interval' && (
                <p className="text-xs text-gray-600">M3, P5, m7, etc.</p>
              )}
              {answerType === 'scale' && (
                <p className="text-xs text-gray-600">C Major, D minor, etc.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
