'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AchievementCard from '@/components/gamification/AchievementCard'
import LevelBadge from '@/components/gamification/LevelBadge'
import XPProgressBar from '@/components/gamification/XPProgressBar'
import StudentNav from '@/components/StudentNav'
import TeacherNav from '@/components/TeacherNav'
import type { AchievementDefinition, UserAchievementWithDetails, GamificationStats } from '@/lib/types/database'

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  avatar?: string | null
  avatarUrl?: string | null
  themeColor?: string | null
  subscriptionStatus?: 'none' | 'active' | 'canceled' | 'expired' | null
  subscription_status?: 'none' | 'active' | 'canceled' | 'expired' | null
}

type AchievementCategory = 'all' | 'quiz' | 'streak' | 'score' | 'milestone' | 'special'

export default function AchievementsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [earned, setEarned] = useState<UserAchievementWithDetails[]>([])
  const [available, setAvailable] = useState<AchievementDefinition[]>([])
  const [progress, setProgress] = useState<Record<string, { current: number; required: number }>>({})
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<AchievementCategory>('all')

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          router.push('/login')
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)

        const [achievementsRes, statsRes] = await Promise.all([
          fetch('/api/gamification/achievements'),
          fetch('/api/gamification/stats'),
        ])

        if (achievementsRes.ok) {
          const data = await achievementsRes.json()
          setEarned(data.earned || [])
          setAvailable(data.available || [])
          setProgress(data.progress || {})
        }

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const filterByCategory = (items: AchievementDefinition[] | UserAchievementWithDetails[]) => {
    if (category === 'all') return items
    return items.filter((item) => {
      const achievement = 'achievement' in item ? item.achievement : item
      return achievement.category === category
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const categories: { value: AchievementCategory; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '🏆' },
    { value: 'quiz', label: 'Quiz', icon: '📝' },
    { value: 'streak', label: 'Streak', icon: '🔥' },
    { value: 'score', label: 'Score', icon: '⭐' },
    { value: 'milestone', label: 'Milestone', icon: '🎯' },
    { value: 'special', label: 'Special', icon: '✨' },
  ]

  const filteredEarned = filterByCategory(earned) as UserAchievementWithDetails[]
  const filteredAvailable = filterByCategory(available) as AchievementDefinition[]

  const totalXpFromAchievements = earned.reduce((sum, ua) => sum + (ua.achievement.xp_reward || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      {user.role === 'student' ? (
        <StudentNav user={user} level={stats?.current_level} xp={stats?.total_xp} />
      ) : (
        <TeacherNav user={user} stats={{ classCount: 0, studentCount: 0, quizCount: 0, assignmentCount: 0 }} />
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
          <p className="text-gray-600">Earn badges and unlock rewards as you learn</p>
        </div>

        {/* Progress sections */}
        {!stats && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800">Unable to load progress data. Please complete a quiz to initialize your stats.</p>
          </div>
        )}
        {stats && (
          <>
            {/* XP Progress Section */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 border border-purple-100">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <LevelBadge
                    level={stats.current_level}
                    name={stats.level_info?.name || 'Beginner'}
                    color={stats.level_info?.color || 'gray'}
                    size="lg"
                  />
                  <div>
                    <p className="text-sm text-gray-500">Total XP</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.total_xp.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <XPProgressBar
                    currentXP={stats.total_xp}
                    currentLevelXP={stats.level_info?.xp_required || 0}
                    nextLevelXP={stats.next_level_xp}
                    progress={stats.xp_progress}
                    level={stats.current_level}
                    levelName={stats.level_info?.name || 'Beginner'}
                  />
                  {stats.next_level_xp && (
                    <div className="mt-2 text-center">
                      <span className="text-sm text-gray-600">
                        <span className="font-bold text-purple-600">{(stats.next_level_xp - stats.total_xp).toLocaleString()} XP</span>
                        {' '}needed for Level {stats.current_level + 1}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Streak Section */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-6 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">Activity Streak</p>
                    <p className="text-sm text-gray-500">Complete quizzes daily to build your streak</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-orange-500">{stats.current_streak}</p>
                  <p className="text-sm text-gray-500">day{stats.current_streak !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Visual streak indicator - last 7 days */}
              <div className="flex gap-2 mb-3">
                {[...Array(7)].map((_, i) => {
                  const dayIndex = 6 - i
                  const isCompleted = dayIndex < stats.current_streak
                  const today = new Date().toISOString().split('T')[0]
                  const isActiveToday = stats.last_activity_date === today
                  const isToday = dayIndex === 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                          isCompleted
                            ? 'bg-orange-500 text-white'
                            : isToday && !isActiveToday
                            ? 'bg-orange-200 text-orange-600 border-2 border-dashed border-orange-400'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {isCompleted ? '✓' : isToday ? '?' : ''}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {isToday ? 'Today' : dayIndex === 1 ? 'Yesterday' : `${dayIndex} days ago`}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-orange-100">
                <span className="text-gray-600">
                  {stats.last_activity_date === new Date().toISOString().split('T')[0] ? (
                    <span className="text-green-600 font-medium">✓ Active today!</span>
                  ) : stats.current_streak > 0 ? (
                    <span className="text-orange-600 font-medium animate-pulse">⚠️ Complete a quiz to keep your streak!</span>
                  ) : (
                    <span className="text-gray-500">Start your streak today!</span>
                  )}
                </span>
                <span className="text-gray-600">
                  Best streak: <span className="font-bold text-orange-600">{stats.longest_streak} days</span>
                </span>
              </div>
            </div>

            {/* Daily Goal Streak (toward 7-day achievement) */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-bold text-gray-800">Daily Goal Streak</p>
                    <p className="text-sm text-gray-500">Meet your daily goal for 7 consecutive days</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {stats.daily_goal_streak}/7 days
                </span>
              </div>
              <div className="flex gap-1 mb-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-4 rounded-full transition-all ${
                      i < stats.daily_goal_streak
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                {stats.daily_goal_streak >= 7
                  ? '🎉 You earned the "Consistent" achievement!'
                  : stats.daily_goal_streak === 0
                  ? 'Meet your daily goal to start building your streak!'
                  : `${7 - stats.daily_goal_streak} more day${7 - stats.daily_goal_streak > 1 ? 's' : ''} to earn the "Consistent" achievement!`}
              </p>
            </div>

            {/* Achievement Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{earned.length}</p>
                  <p className="text-sm text-gray-500">Earned</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{available.length}</p>
                  <p className="text-sm text-gray-500">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand">+{totalXpFromAchievements.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">XP from Badges</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                category === cat.value
                  ? 'bg-brand text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Earned achievements */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Earned ({filteredEarned.length})
          </h2>
          {filteredEarned.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-500">
                {category === 'all'
                  ? "You haven't earned any achievements yet. Complete quizzes to unlock badges!"
                  : `No ${category} achievements earned yet.`}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEarned.map((ua) => (
                <AchievementCard
                  key={ua.id}
                  achievement={ua.achievement}
                  earned
                  earnedAt={ua.earned_at}
                />
              ))}
            </div>
          )}
        </section>

        {/* Available achievements */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Available ({filteredAvailable.length})
          </h2>
          {filteredAvailable.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-500">
                {category === 'all'
                  ? "You've earned all available achievements! Amazing!"
                  : `All ${category} achievements earned!`}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAvailable.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  progress={progress[achievement.id]}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/quiznotes logo.jpg"
                alt="QuizNotes Logo"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="text-sm font-semibold text-white">QuizNotes</span>
            </div>
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} QuizNotes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
