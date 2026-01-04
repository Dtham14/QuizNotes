'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MusicNotation from '@/components/MusicNotation'
import AudioPlayer from '@/components/AudioPlayer'
import ConnectionsGame from '@/components/games/ConnectionsGame'
import WordleGame from '@/components/games/WordleGame'
import DailyQuizLeaderboard from '@/components/DailyQuizLeaderboard'
import type { DailyQuiz } from '@/lib/types/database'
import type { GeneratedQuestion } from '@/lib/quizBuilder/types'

interface DailyQuizData {
  quiz: DailyQuiz
  userAttempt: {
    completed: boolean
    score?: number
    completedAt?: string
  }
}

export default function DailyQuizPage() {
  const router = useRouter()
  const [quizData, setQuizData] = useState<DailyQuizData | null>(null)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [gamification, setGamification] = useState<any>(null)

  useEffect(() => {
    async function fetchDailyQuiz() {
      try {
        const response = await fetch('/api/quiz/daily')

        if (!response.ok) {
          router.push('/')
          return
        }

        const data: DailyQuizData = await response.json()

        setQuizData(data)

        // Parse questions from JSONB (needed for displaying results too)
        const parsedQuestions = data.quiz.questions as any as GeneratedQuestion[]
        setQuestions(parsedQuestions)

        if (data.userAttempt.completed) {
          // Already completed, show completion screen
          setShowResult(true)
          setScore(data.userAttempt.score || 0)
          setLoading(false)
          return
        }

        // Not completed yet, set up for taking the quiz
        setAnswers(new Array(parsedQuestions.length).fill(null))
        setLoading(false)
      } catch (error) {
        console.error('Error fetching daily quiz:', error)
        router.push('/')
      }
    }

    fetchDailyQuiz()
  }, [router])

  const currentQuestion = questions[currentQuestionIndex]

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    setShowFeedback(true)

    // Update answers array
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answerIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(answers[currentQuestionIndex + 1])
      setShowFeedback(answers[currentQuestionIndex + 1] !== null)
    } else {
      // Last question, submit the quiz
      submitQuiz()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setSelectedAnswer(answers[currentQuestionIndex - 1])
      setShowFeedback(answers[currentQuestionIndex - 1] !== null)
    }
  }

  const submitQuiz = async () => {
    if (!quizData) return

    setSubmitting(true)

    // Calculate score
    let correctCount = 0
    questions.forEach((question, index) => {
      const userAnswer = answers[index]
      const correctAnswer =
        typeof question.correctAnswer === 'string'
          ? question.options.indexOf(question.correctAnswer)
          : question.correctAnswer

      if (userAnswer === correctAnswer) {
        correctCount++
      }
    })

    setScore(correctCount)

    // Submit to API
    try {
      const response = await fetch('/api/quiz/daily/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyQuizId: quizData.quiz.id,
          score: correctCount,
          totalQuestions: questions.length,
          answers,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setGamification(result.gamification)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setSubmitting(false)
      setShowResult(true)
    }
  }

  // Handlers for Connections and Wordle games
  const handleConnectionsComplete = async (finalScore: number, mistakes: number) => {
    if (!quizData) return

    setScore(finalScore)
    setSubmitting(true)

    try {
      const response = await fetch('/api/quiz/daily/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyQuizId: quizData.quiz.id,
          score: finalScore,
          totalQuestions: 10, // Max score for connections
          answers: [], // Not applicable for connections
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setGamification(result.gamification)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setSubmitting(false)
      setShowResult(true)
    }
  }

  const handleWordleComplete = async (finalScore: number, attempts: number) => {
    if (!quizData) return

    setScore(finalScore)
    setSubmitting(true)

    try {
      const response = await fetch('/api/quiz/daily/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyQuizId: quizData.quiz.id,
          score: finalScore,
          totalQuestions: 10, // Max score for wordle
          answers: [], // Not applicable for wordle
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setGamification(result.gamification)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setSubmitting(false)
      setShowResult(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading daily quiz...</p>
        </div>
      </div>
    )
  }

  if (showResult) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Results Card */}
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">
                  {percentage === 100 ? '🎉' : percentage >= 80 ? '🌟' : percentage >= 60 ? '👍' : '📚'}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {percentage === 100
                    ? 'Perfect Score!'
                    : percentage >= 80
                    ? 'Great Job!'
                    : percentage >= 60
                    ? 'Good Effort!'
                    : 'Keep Practicing!'}
                </h1>
                <p className="text-xl text-gray-600">
                  You scored {score} out of {questions.length} ({percentage}%)
                </p>
              </div>

              {gamification && (
                <div className="bg-violet-50 rounded-lg p-6 mb-6 border-2 border-violet-200">
                  <h3 className="font-bold text-lg text-violet-900 mb-3">🎯 Rewards Earned</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-2xl font-bold text-violet-600">+{gamification.xpAwarded} XP</p>
                      <p className="text-xs text-gray-500">2x Daily Bonus!</p>
                    </div>
                    {gamification.leveledUp && (
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <p className="text-lg font-bold text-yellow-700">Level {gamification.newLevel}!</p>
                        <p className="text-xs text-gray-600">You leveled up!</p>
                      </div>
                    )}
                  </div>
                  {gamification.streak && (
                    <div className="mt-3 text-sm text-gray-600">
                      🔥 Current Streak: {gamification.streak.current} days
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Link
                  href="/"
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-center"
                >
                  Back to Home
                </Link>
                <Link
                  href="/student/dashboard"
                  className="flex-1 px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors text-center"
                >
                  View Dashboard
                </Link>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6">
                Come back tomorrow for a new daily quiz!
              </p>
            </div>

            {/* Leaderboard Card */}
            <div className="lg:row-span-2">
              <DailyQuizLeaderboard />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Route to appropriate game based on format
  if (quizData && !showResult) {
    if (quizData.quiz.quiz_format === 'connections') {
      const metadata = quizData.quiz.metadata as any
      if (!metadata || !metadata.groups) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Data Error</h2>
              <p className="text-gray-600">The quiz data is incomplete. Please try again later.</p>
            </div>
          </div>
        )
      }
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <ConnectionsGame
            groups={metadata.groups}
            onComplete={handleConnectionsComplete}
          />
        </div>
      )
    }

    if (quizData.quiz.quiz_format === 'wordle') {
      const metadata = quizData.quiz.metadata as any
      if (!metadata || !metadata.answer) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Data Error</h2>
              <p className="text-gray-600">The quiz data is incomplete. Please try again later.</p>
            </div>
          </div>
        )
      }
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <WordleGame
            answer={metadata.answer}
            answerType={metadata.answerType}
            maxAttempts={metadata.maxAttempts}
            hints={metadata.hints}
            onComplete={handleWordleComplete}
          />
        </div>
      )
    }
  }

  // Standard quiz format
  if (!currentQuestion) {
    return null
  }

  const correctAnswerIndex =
    typeof currentQuestion.correctAnswer === 'string'
      ? currentQuestion.options.indexOf(currentQuestion.correctAnswer)
      : currentQuestion.correctAnswer

  const isCorrect = selectedAnswer === correctAnswerIndex

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daily Quiz 🎵</h1>
              <p className="text-sm text-gray-600">
                {quizData?.quiz.quiz_format === 'standard' ? 'Music Theory' : quizData?.quiz.quiz_format} •{' '}
                {quizData?.quiz.difficulty}
              </p>
            </div>
            <div className="px-4 py-2 bg-violet-100 rounded-lg">
              <p className="text-sm font-semibold text-violet-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQuestion.question}</h2>

          {/* Music Notation */}
          {currentQuestion.notes && currentQuestion.notes.length > 0 && (
            <div className="mb-6 flex justify-center">
              <MusicNotation
                notes={currentQuestion.notes.map(note => ({
                  keys: [note],
                  duration: 'w'
                }))}
                clef={currentQuestion.clef || 'treble'}
                keySignature={currentQuestion.keySignature}
              />
            </div>
          )}

          {/* Audio Player */}
          {currentQuestion.audioData && (
            <div className="mb-6">
              <AudioPlayer
                subtype={currentQuestion.audioData.subtype}
                audioData={currentQuestion.audioData}
              />
            </div>
          )}

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrectOption = index === correctAnswerIndex
              const showAsCorrect = showFeedback && isCorrectOption
              const showAsWrong = showFeedback && isSelected && !isCorrect

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={`p-4 rounded-lg border-2 text-left font-medium transition-all ${
                    showAsCorrect
                      ? 'bg-green-50 border-green-500 text-green-900'
                      : showAsWrong
                      ? 'bg-red-50 border-red-500 text-red-900'
                      : isSelected
                      ? 'bg-violet-50 border-violet-500 text-violet-900'
                      : 'bg-gray-50 border-gray-200 text-gray-900 hover:border-violet-300 hover:bg-violet-50'
                  } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm ${
                        showAsCorrect
                          ? 'bg-green-500 border-green-500 text-white'
                          : showAsWrong
                          ? 'bg-red-500 border-red-500 text-white'
                          : isSelected
                          ? 'bg-violet-500 border-violet-500 text-white'
                          : 'border-gray-400'
                      }`}
                    >
                      {showAsCorrect ? '✓' : showAsWrong ? '✗' : String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
              }`}
            >
              <p className={`font-semibold ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              {currentQuestion.explanation && (
                <p className="text-sm text-gray-700 mt-2">{currentQuestion.explanation}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4">
            {currentQuestionIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!showFeedback || submitting}
              className="flex-1 px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Submitting...'
                : currentQuestionIndex === questions.length - 1
                ? 'Finish Quiz'
                : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
