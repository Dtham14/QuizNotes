'use client'

import { useEffect, useState } from 'react'
import LevelBadge from './LevelBadge'

interface LeaderboardEntry {
  id: string
  user_id: string
  xp_earned: number
  quizzes_completed: number
  perfect_scores: number
  profile: {
    id: string
    name: string | null
    email: string
  }
  rank: number
}

interface LeaderboardPeriod {
  id: string
  period_type: 'weekly' | 'monthly'
  start_date: string
  end_date: string
}

interface PeriodInfo {
  startDate: string
  endDate: string
  daysRemaining: number
}

interface LeaderboardTableProps {
  type?: 'weekly' | 'monthly'
  classId?: string
  showPeriodSelector?: boolean
  limit?: number
  currentUserId?: string
}

export default function LeaderboardTable({
  type: initialType = 'weekly',
  classId,
  showPeriodSelector = true,
  limit = 50,
  currentUserId,
}: LeaderboardTableProps) {
  const [type, setType] = useState<'weekly' | 'monthly'>(initialType)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState<LeaderboardPeriod | null>(null)
  const [periodInfo, setPeriodInfo] = useState<PeriodInfo | null>(null)
  const [userRank, setUserRank] = useState<number | null>(null)
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)

      try {
        const url = classId
          ? `/api/gamification/leaderboards/class/${classId}?type=${type}&limit=${limit}`
          : `/api/gamification/leaderboards/global?type=${type}&limit=${limit}`

        const res = await fetch(url)
        if (!res.ok) {
          throw new Error('Failed to fetch leaderboard')
        }

        const data = await res.json()
        setEntries(data.leaderboard?.entries || [])
        setPeriod(data.leaderboard?.period || null)
        setPeriodInfo(data.periodInfo || null)
        setUserRank(data.leaderboard?.userRank || null)
        setUserEntry(data.leaderboard?.userEntry || null)
      } catch (err) {
        setError('Failed to load leaderboard')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [type, classId, limit])

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
    return 'bg-gray-100 text-gray-700'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {classId ? 'Class Leaderboard' : 'Global Leaderboard'}
          </h3>
          {showPeriodSelector && (
            <div className="flex gap-2">
              <button
                onClick={() => setType('weekly')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  type === 'weekly'
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setType('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  type === 'monthly'
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
            </div>
          )}
        </div>

        {periodInfo && (
          <p className="text-sm text-gray-500 mt-2">
            {periodInfo.daysRemaining === 0
              ? 'Ends today!'
              : `${periodInfo.daysRemaining} day${periodInfo.daysRemaining === 1 ? '' : 's'} remaining`}
          </p>
        )}
      </div>

      {/* Leaderboard entries */}
      {entries.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-gray-500">No entries yet for this period</p>
          <p className="text-sm text-gray-400 mt-1">Complete quizzes to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries.map((entry) => {
            const isCurrentUser = currentUserId && entry.user_id === currentUserId
            const displayName = entry.profile.name || entry.profile.email.split('@')[0]

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 ${
                  isCurrentUser ? 'bg-brand/5' : 'hover:bg-gray-50'
                } transition-colors`}
              >
                {/* Rank */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankStyle(
                    entry.rank
                  )}`}
                >
                  {getRankIcon(entry.rank) || entry.rank}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-gray-900 truncate ${isCurrentUser ? 'text-brand' : ''}`}>
                      {displayName}
                      {isCurrentUser && ' (You)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{entry.quizzes_completed} quizzes</span>
                    {entry.perfect_scores > 0 && (
                      <span className="text-yellow-600">
                        {entry.perfect_scores} perfect
                      </span>
                    )}
                  </div>
                </div>

                {/* XP */}
                <div className="text-right">
                  <span className="text-lg font-bold text-brand">{entry.xp_earned.toLocaleString()}</span>
                  <span className="text-sm text-gray-500 ml-1">XP</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* User's position if not in top */}
      {userEntry && userRank && userRank > limit && (
        <div className="border-t-2 border-dashed border-gray-200">
          <div className="flex items-center gap-4 p-4 bg-brand/5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-brand text-white">
              {userRank}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-brand">Your Position</span>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{userEntry.quizzes_completed} quizzes</span>
                {userEntry.perfect_scores > 0 && (
                  <span className="text-yellow-600">
                    {userEntry.perfect_scores} perfect
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-brand">{userEntry.xp_earned.toLocaleString()}</span>
              <span className="text-sm text-gray-500 ml-1">XP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
