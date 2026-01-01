'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import StudentNav from '@/components/StudentNav'
import type { GamificationStats } from '@/lib/types/database'

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  avatar?: string | null
  avatarUrl?: string | null
  themeColor?: string | null
  subscriptionStatus?: 'none' | 'active' | 'canceled' | 'expired' | null
}

const PREMIUM_BLUE = '#439FDD'
const PREMIUM_BLUE_DARK = '#2d7ab8'

const PREMIUM_TOOLS = [
  { id: 'piano', icon: '🎹', title: 'Interactive Piano', description: 'Play and record melodies', path: '/tools/piano' },
  { id: 'rhythm', icon: '🎮', title: 'Rhythm Game', description: 'Test your timing skills', path: '/tools/rhythm' },
  { id: 'composition', icon: '🎼', title: 'Sandbox Composition', description: 'Create your own music', path: '/tools/composition' },
]

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/gamification/stats'),
        ])

        const userData = await userRes.json()

        if (!userData.user) {
          router.push('/login')
          return
        }

        if (userData.user.role !== 'student') {
          router.push('/dashboard')
          return
        }

        // Check premium status
        if (userData.user.subscriptionStatus !== 'active' && userData.user.subscription_status !== 'active') {
          router.push('/student-premium')
          return
        }

        setUser(userData.user)

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setGamificationStats(statsData.stats)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: PREMIUM_BLUE, borderTopColor: 'transparent' }}
          ></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex flex-col">
      {/* Navigation */}
      <StudentNav user={user} level={gamificationStats?.current_level} xp={gamificationStats?.total_xp} />

      {/* Premium Badge Banner */}
      <div
        className="py-2 text-center text-sm font-medium text-white"
        style={{ background: `linear-gradient(135deg, ${PREMIUM_BLUE} 0%, ${PREMIUM_BLUE_DARK} 100%)` }}
      >
        <span className="inline-flex items-center gap-2">
          <span>👑</span>
          Premium Feature - Thank you for being a premium member!
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
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
