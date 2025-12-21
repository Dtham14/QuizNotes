'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LeaderboardTable from '@/components/gamification/LeaderboardTable'
import LevelBadge from '@/components/gamification/LevelBadge'
import ProfileDropdown from '@/components/ProfileDropdown'
import type { GamificationStats } from '@/lib/types/database'

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  avatar?: string | null
  avatarUrl?: string | null
  themeColor?: string | null
}

interface LeaderboardStats {
  weeklyRank: number | null
  weeklyXp: number
  monthlyRank: number | null
  monthlyXp: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)

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

        // Fetch leaderboard stats and gamification stats
        const [weeklyRes, monthlyRes, gamificationRes] = await Promise.all([
          fetch('/api/gamification/leaderboards/global?type=weekly&limit=1'),
          fetch('/api/gamification/leaderboards/global?type=monthly&limit=1'),
          fetch('/api/gamification/stats'),
        ])

        if (weeklyRes.ok && monthlyRes.ok) {
          const weeklyData = await weeklyRes.json()
          const monthlyData = await monthlyRes.json()

          setStats({
            weeklyRank: weeklyData.leaderboard?.userRank || null,
            weeklyXp: weeklyData.leaderboard?.userEntry?.xp_earned || 0,
            monthlyRank: monthlyData.leaderboard?.userRank || null,
            monthlyXp: monthlyData.leaderboard?.userEntry?.xp_earned || 0,
          })
        }

        if (gamificationRes.ok) {
          const gamificationData = await gamificationRes.json()
          setGamificationStats(gamificationData.stats)
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/images/quiznotes logo.jpg"
                  alt="QuizNotes Logo"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-gray-900">QuizNotes</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/profile" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                  Dashboard
                </Link>
                <Link href="/quiz" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                  Quizzes
                </Link>
                <span className="text-brand font-semibold text-sm">Leaderboard</span>
              </div>
            </div>
            {/* Profile Dropdown - Right Corner */}
            <ProfileDropdown user={user} stats={gamificationStats} />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">See how you rank against other students</p>
        </div>

        {/* User's stats summary */}
        {stats && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">This Week</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.weeklyRank ? `#${stats.weeklyRank}` : 'Not ranked'}
                  </p>
                  <p className="text-blue-100 text-sm mt-1">
                    {stats.weeklyXp.toLocaleString()} XP earned
                  </p>
                </div>
                <div className="text-6xl opacity-50">📈</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">This Month</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.monthlyRank ? `#${stats.monthlyRank}` : 'Not ranked'}
                  </p>
                  <p className="text-purple-100 text-sm mt-1">
                    {stats.monthlyXp.toLocaleString()} XP earned
                  </p>
                </div>
                <div className="text-6xl opacity-50">🏆</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <LeaderboardTable currentUserId={user.id} />
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
