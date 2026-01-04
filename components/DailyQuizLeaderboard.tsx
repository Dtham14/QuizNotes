'use client'

import { useState, useEffect } from 'react'

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  avatarUrl?: string
  themeColor?: string
  totalScore: number
  quizzesCompleted: number
  perfectDays: number
  currentStreak: number
  bestStreak: number
}

interface LeaderboardData {
  period: 'weekly' | 'all_time'
  periodStart: string | null
  leaderboard: LeaderboardEntry[]
}

export default function DailyQuizLeaderboard() {
  const [period, setPeriod] = useState<'weekly' | 'all_time'>('weekly')
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      try {
        const response = await fetch(`/api/quiz/daily/leaderboard?period=${period}`)
        if (response.ok) {
          const data: LeaderboardData = await response.json()
          setLeaderboard(data)
        } else {
          console.error('Leaderboard fetch failed:', response.status)
          setLeaderboard(null)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        setLeaderboard(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [period])

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-400'
    if (rank === 2) return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-400'
    if (rank === 3) return 'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-400'
    return 'bg-white border-gray-200'
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with Period Tabs */}
      <div className="border-b border-gray-200">
        <div className="p-6 pb-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 Daily Quiz Leaderboard</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                period === 'weekly'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('all_time')}
              className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                period === 'all_time'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        ) : leaderboard && leaderboard.leaderboard && leaderboard.leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md ${getRankStyle(
                  entry.rank
                )}`}
              >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                    {getRankBadge(entry.rank) ? (
                      <span className="text-3xl">{getRankBadge(entry.rank)}</span>
                    ) : (
                      <span className="text-xl font-bold text-gray-600">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt={entry.userName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                        style={{ backgroundColor: entry.themeColor || '#8b5cf6' }}
                      >
                        {entry.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{entry.userName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="text-violet-600 font-semibold">{entry.totalScore}</span> pts
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>{entry.quizzesCompleted} quizzes</span>
                      {entry.perfectDays > 0 && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            ⭐ {entry.perfectDays} perfect
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Streak Badge */}
                  {entry.currentStreak > 0 && (
                    <div className="flex-shrink-0 bg-orange-100 border border-orange-300 rounded-lg px-3 py-2">
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">
                          🔥 {entry.currentStreak}
                        </div>
                        <div className="text-xs text-orange-700">day streak</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No entries yet</h3>
            <p className="text-gray-600">
              {period === 'weekly'
                ? 'Be the first to complete a daily quiz this week!'
                : 'Be the first to complete a daily quiz!'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {leaderboard && leaderboard.leaderboard.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <p className="text-sm text-gray-600 text-center">
            {period === 'weekly' ? (
              <>
                Weekly leaderboard resets every Monday. Keep your streak alive!
              </>
            ) : (
              <>
                Showing top {leaderboard.leaderboard.length} players of all time
              </>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
