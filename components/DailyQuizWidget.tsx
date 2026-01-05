'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { DailyQuiz } from '@/lib/types/database'

interface User {
  id: string
  email: string
  name?: string | null
  role?: string
}

interface DailyQuizWidgetProps {
  user?: User | null
}

interface DailyQuizData {
  quiz: DailyQuiz
  userAttempt: {
    completed: boolean
    score?: number
    completedAt?: string
  }
}

export default function DailyQuizWidget({ user }: DailyQuizWidgetProps) {
  const [quizData, setQuizData] = useState<DailyQuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDailyQuiz() {
      try {
        const response = await fetch('/api/quiz/daily')

        if (!response.ok) {
          if (response.status === 404) {
            setError('No daily quiz available yet')
          } else {
            setError('Failed to load daily quiz')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setQuizData(data)
      } catch (err) {
        console.error('Error fetching daily quiz:', err)
        setError('Failed to load daily quiz')
      } finally {
        setLoading(false)
      }
    }

    fetchDailyQuiz()
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200 animate-pulse">
        <div className="h-24"></div>
      </div>
    )
  }

  if (error || !quizData) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <h3 className="text-xl font-bold text-gray-700">Daily Quiz</h3>
            <p className="text-sm text-gray-500">{error || 'Coming soon!'}</p>
          </div>
        </div>
      </div>
    )
  }

  const { quiz, userAttempt } = quizData

  // If user has completed the quiz
  if (userAttempt.completed) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Daily Quiz Completed!</h3>
            <p className="text-sm text-gray-600">Come back tomorrow for a new challenge</p>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          {quiz.quiz_format === 'wordle' || quiz.quiz_format === 'connections' ? (
            <div className="bg-white rounded-lg p-3 flex-1">
              <p className="text-2xl font-bold text-green-600">Completed!</p>
              <p className="text-xs text-gray-500">Nice work!</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-3 flex-1">
              <p className="text-2xl font-bold text-green-600">
                {userAttempt.score}/{quiz.questions ? (quiz.questions as any[]).length : 10}
              </p>
              <p className="text-xs text-gray-500">Your Score</p>
            </div>
          )}
          {!user && (
            <div className="bg-blue-50 rounded-lg p-3 flex-1 border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">Sign up to earn 2x XP!</p>
              <Link href="/login?tab=register" className="text-xs text-blue-600 hover:underline">
                Create account →
              </Link>
            </div>
          )}
          {user && (
            <div className="bg-violet-50 rounded-lg p-3 flex-1 border border-violet-200">
              <p className="text-sm font-semibold text-violet-900">2x XP Earned! 🎉</p>
              <p className="text-xs text-gray-600">Double rewards unlocked</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Get format-friendly name
  const formatName =
    quiz.quiz_format === 'standard'
      ? 'Music Quiz'
      : quiz.quiz_format === 'connections'
      ? 'Connections'
      : 'Wordle'

  // If quiz hasn't been completed yet
  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎵</span>
            <h3 className="text-xl font-bold text-gray-900">Daily Quiz</h3>
            <span className="px-2 py-0.5 bg-violet-500 text-white text-xs font-semibold rounded-full uppercase">
              New
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {formatName} • {quiz.difficulty} • Same for everyone today!
          </p>
          <p className="text-xs text-gray-500 mt-1">
            New quiz every day at midnight UTC
          </p>
        </div>
        {user && (
          <div className="px-3 py-1.5 bg-yellow-100 rounded-lg border border-yellow-300">
            <p className="text-xs font-bold text-yellow-800">2x XP Today!</p>
          </div>
        )}
      </div>

      <Link
        href="/quiz/daily"
        className="block w-full px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors text-center"
      >
        Take Today's Quiz
      </Link>

      {!user && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Not logged in? You can still play!{' '}
          <Link href="/login" className="text-violet-600 hover:underline font-medium">
            Sign up
          </Link>{' '}
          to earn 2x XP
        </p>
      )}
    </div>
  )
}
