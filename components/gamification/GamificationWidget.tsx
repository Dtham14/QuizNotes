'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import XPProgressBar from './XPProgressBar'
import LevelBadge from './LevelBadge'
import StreakCounter from './StreakCounter'
import DailyGoalProgress from './DailyGoalProgress'
import AchievementCard from './AchievementCard'
import type { GamificationStats } from '@/lib/types/database'

interface GamificationWidgetProps {
  compact?: boolean
}

export default function GamificationWidget({ compact = false }: GamificationWidgetProps) {
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/gamification/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
        } else {
          setError('Failed to load gamification data')
        }
      } catch (err) {
        setError('Failed to load gamification data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (error || !stats) {
    return null // Don't show widget if there's an error
  }

  // Calculate streak status
  const today = new Date().toISOString().split('T')[0]
  const isActiveToday = stats.last_activity_date === today

  // Determine if streak will expire
  let willExpireToday = false
  if (stats.last_activity_date && !isActiveToday && stats.current_streak > 0) {
    const lastDate = new Date(stats.last_activity_date)
    const todayDate = new Date(today)
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    willExpireToday = daysDiff === 1
  }

  // Calculate XP progress for next level
  const currentLevelXp = stats.level_info?.xp_required || 0
  const nextLevelXp = stats.next_level_xp

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-brand/5 to-brand/10 rounded-xl p-4 border border-brand/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <LevelBadge
              level={stats.current_level}
              name={stats.level_info?.name || 'Beginner'}
              color={stats.level_info?.color || 'gray'}
              size="sm"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {stats.total_xp.toLocaleString()} XP
              </span>
            </div>
          </div>
          <StreakCounter
            currentStreak={stats.current_streak}
            isActiveToday={isActiveToday}
            willExpireToday={willExpireToday}
            size="sm"
          />
        </div>
        <div className="mt-3">
          <XPProgressBar
            currentXP={stats.total_xp}
            currentLevelXP={currentLevelXp}
            nextLevelXP={nextLevelXp}
            progress={stats.xp_progress}
            level={stats.current_level}
            levelName={stats.level_info?.name || 'Beginner'}
            showDetails={false}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Your Progress</h3>
        <Link
          href="/achievements"
          className="text-sm font-semibold text-brand hover:text-brand-dark"
        >
          View All
        </Link>
      </div>

      {/* Level and XP Section - Enhanced */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-6 border border-purple-100">
        <div className="flex items-center justify-between mb-3">
          <LevelBadge
            level={stats.current_level}
            name={stats.level_info?.name || 'Beginner'}
            color={stats.level_info?.color || 'gray'}
          />
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{stats.total_xp.toLocaleString()} XP</p>
            <p className="text-xs text-gray-500">{stats.total_quizzes_completed} quizzes completed</p>
          </div>
        </div>
        <XPProgressBar
          currentXP={stats.total_xp}
          currentLevelXP={currentLevelXp}
          nextLevelXP={nextLevelXp}
          progress={stats.xp_progress}
          level={stats.current_level}
          levelName={stats.level_info?.name || 'Beginner'}
          color={stats.level_info?.color || 'brand'}
        />
        {nextLevelXp && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm">
            <span className="text-gray-600">Next level:</span>
            <span className="font-bold text-purple-600">{(nextLevelXp - stats.total_xp).toLocaleString()} XP needed</span>
            <span className="text-gray-400">→</span>
            <span className="font-semibold text-gray-700">Level {stats.current_level + 1}</span>
          </div>
        )}
      </div>

      {/* Login Streak Progress - Enhanced */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 mb-6 border border-orange-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-semibold text-gray-800">Activity Streak</p>
              <p className="text-xs text-gray-500">Complete quizzes daily to build your streak</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-orange-500">{stats.current_streak}</p>
            <p className="text-xs text-gray-500">day{stats.current_streak !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Visual streak indicator - last 7 days */}
        <div className="flex gap-1 mb-2">
          {[...Array(7)].map((_, i) => {
            const dayIndex = 6 - i // Reverse so most recent is on right
            const isCompleted = dayIndex < stats.current_streak
            const isToday = dayIndex === 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-orange-500 text-white'
                      : isToday && !isActiveToday
                      ? 'bg-orange-200 text-orange-600 border-2 border-dashed border-orange-400'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? '✓' : isToday ? '?' : ''}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  {isToday ? 'Today' : dayIndex === 1 ? 'Yday' : `-${dayIndex}d`}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {willExpireToday && !isActiveToday ? (
              <span className="text-orange-600 font-medium animate-pulse">⚠️ Complete a quiz today to keep your streak!</span>
            ) : isActiveToday ? (
              <span className="text-green-600">✓ You've been active today!</span>
            ) : (
              <span className="text-gray-500">Complete a quiz to maintain your streak</span>
            )}
          </span>
          <span className="text-gray-500">Best: <span className="font-bold text-orange-600">{stats.longest_streak} days</span></span>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <DailyGoalProgress
            quizzesToday={stats.quizzes_today}
            dailyGoal={stats.daily_goal}
            goalMet={stats.daily_goal_met}
          />
        </div>
      </div>

      {/* Daily Goal Streak Progress (toward 7-day achievement) */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="font-semibold text-gray-800">Daily Goal Streak</span>
          </div>
          <span className="text-sm font-bold text-green-600">
            {stats.daily_goal_streak}/7 days
          </span>
        </div>
        <div className="flex gap-1 mb-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-3 rounded-full transition-all ${
                i < stats.daily_goal_streak
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600">
          {stats.daily_goal_streak >= 7
            ? '🎉 You earned the "Consistent" achievement!'
            : stats.daily_goal_streak === 0
            ? 'Meet your daily goal to start building your streak!'
            : `${7 - stats.daily_goal_streak} more day${7 - stats.daily_goal_streak > 1 ? 's' : ''} to earn the "Consistent" achievement!`}
        </p>
      </div>

      {/* Recent Achievements */}
      {stats.recent_achievements && stats.recent_achievements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Achievements</h4>
          <div className="space-y-2">
            {stats.recent_achievements.map((ua) => (
              <AchievementCard
                key={ua.id}
                achievement={ua.achievement}
                earned
                earnedAt={ua.earned_at}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total_quizzes_completed}</p>
            <p className="text-xs text-gray-500">Quizzes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total_perfect_scores}</p>
            <p className="text-xs text-gray-500">Perfect Scores</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.longest_streak}</p>
            <p className="text-xs text-gray-500">Best Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}
