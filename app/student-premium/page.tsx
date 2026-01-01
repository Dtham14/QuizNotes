'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import StudentNav from '@/components/StudentNav'

// Premium tools with paths
const PREMIUM_TOOLS = [
  { id: 'piano', icon: '🎹', title: 'Interactive Piano', description: 'Play, practice, and record melodies with a virtual 2-octave keyboard', path: '/tools/piano' },
  { id: 'rhythm', icon: '🎮', title: 'Rhythm Game', description: 'Test your timing skills with falling notes and build combos', path: '/tools/rhythm' },
  { id: 'composition', icon: '🎼', title: 'Sandbox Composition', description: 'Create your own music with a full notation editor', path: '/tools/composition' },
]

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

// Premium blue color
const PREMIUM_BLUE = '#439FDD'
const PREMIUM_BLUE_DARK = '#2d7ab8'
const PREMIUM_BLUE_LIGHT = '#e8f4fc'

const UPCOMING_FEATURES = [
  {
    icon: '🎯',
    title: 'Personalized Learning Paths',
    description: 'AI-powered study plans tailored to your strengths and weaknesses, adapting as you progress.',
    status: 'Coming Late 2025/Q1 2026'
  },
  {
    icon: '📊',
    title: 'Advanced Analytics Dashboard',
    description: 'Deep insights into your learning patterns, progress trends, and areas needing improvement.',
    status: 'Coming Late 2025/Q1 2026'
  },
  {
    icon: '🎹',
    title: 'Interactive Piano Keyboard',
    description: 'Practice ear training with a built-in virtual piano for hands-on learning experience.',
    status: 'Coming Late 2025/Q1 2026'
  },
  {
    icon: '🎵',
    title: 'Custom Practice Sessions',
    description: 'Create unlimited custom quizzes focusing on specific topics, intervals, or chord types.',
    status: 'Coming Late 2025/Q1 2026'
  },
  {
    icon: '📱',
    title: 'Offline Mode',
    description: 'Download quizzes and practice anywhere, even without an internet connection.',
    status: 'Coming Late 2025/Q1 2026'
  },
  {
    icon: '🏆',
    title: 'Achievement Badges & Rewards',
    description: 'Unlock exclusive premium badges and showcase your musical expertise.',
    status: 'Coming Late 2025/Q1 2026'
  },
  {
    icon: '👥',
    title: 'Study Groups',
    description: 'Join or create study groups with friends to learn together and compete on leaderboards.',
    status: 'Coming Late 2025/Q1 2026'
  },
  {
    icon: '📝',
    title: 'Progress Reports',
    description: 'Weekly and monthly progress reports sent to your email with actionable insights.',
    status: 'Coming Late 2025/Q1 2026'
  },
]

export default function StudentPremiumPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()

        if (!data.user) {
          router.push('/login')
          return
        }

        if (data.user.role !== 'student') {
          router.push('/dashboard')
          return
        }

        setUser(data.user)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
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

  const isPremium = user.subscriptionStatus === 'active'

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex flex-col">
      {/* Navigation */}
      <StudentNav user={user} />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${PREMIUM_BLUE} 0%, ${PREMIUM_BLUE_DARK} 100%)` }}
          ></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-20 text-8xl text-white">♪</div>
            <div className="absolute bottom-10 right-40 text-6xl text-white">♫</div>
            <div className="absolute top-20 right-20 text-5xl text-white">♩</div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            {isPremium ? (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-6">
                  <span className="text-xl">👑</span>
                  <span className="text-white font-semibold">Premium Member</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Your Premium Benefits
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto mb-6">
                  Thank you for being a premium member! Here&apos;s what&apos;s coming to make your learning experience even better.
                </p>
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="text-left">
                    <p className="text-white/70 text-sm">Your Plan</p>
                    <p className="text-white font-bold text-lg">Student Premium - $5/month</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 backdrop-blur-sm rounded-full border border-amber-300/30 mb-6">
                  <span className="text-xl">✨</span>
                  <span className="text-amber-200 font-semibold">Unlock Your Full Potential</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Student Premium
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                  Take your music theory journey to the next level with exclusive features designed for serious learners.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
                  style={{ color: PREMIUM_BLUE }}
                >
                  <span className="text-xl">🚀</span>
                  Upgrade to Premium
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Current Premium Benefits */}
        {isPremium && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Current Benefits</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: PREMIUM_BLUE_LIGHT }}
                >
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Unlimited PDF Uploads</h3>
                <p className="text-gray-600">Upload and practice with as many PDF music sheets as you want.</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: PREMIUM_BLUE_LIGHT }}
                >
                  <span className="text-2xl">🎵</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">All Quiz Types</h3>
                <p className="text-gray-600">Access to all quiz categories including advanced ear training.</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: PREMIUM_BLUE_LIGHT }}
                >
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Priority Support</h3>
                <p className="text-gray-600">Get faster responses when you need help with your learning.</p>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Premium Features */}
        {isPremium && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-sky-50 rounded-full border border-blue-100 mb-4">
                <span>👑</span>
                <span className="text-sm font-semibold" style={{ color: PREMIUM_BLUE }}>Premium Exclusive</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Tools</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Practice and explore music theory with these exclusive interactive features.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PREMIUM_TOOLS.map(tool => (
                <Link
                  key={tool.id}
                  href={tool.path}
                  className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all hover:scale-[1.02] hover:border-blue-200"
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${PREMIUM_BLUE_LIGHT} 0%, #d0e8f7 100%)` }}
                  >
                    <span className="text-4xl">{tool.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                  <div
                    className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
                    style={{ color: PREMIUM_BLUE }}
                  >
                    Open Tool
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Features */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {isPremium ? 'Coming Soon to Your Account' : 'Upcoming Premium Features'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We&apos;re constantly working on new features to enhance your music theory learning experience.
              {!isPremium && ' Upgrade now to get access as soon as they launch!'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {UPCOMING_FEATURES.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `linear-gradient(135deg, ${PREMIUM_BLUE_LIGHT} 0%, #d0e8f7 100%)` }}
                >
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                <span
                  className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                  style={{ backgroundColor: PREMIUM_BLUE_LIGHT, color: PREMIUM_BLUE_DARK }}
                >
                  {feature.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section for Free Users */}
        {!isPremium && (
          <div
            className="py-16"
            style={{ background: `linear-gradient(135deg, ${PREMIUM_BLUE} 0%, ${PREMIUM_BLUE_DARK} 100%)` }}
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Accelerate Your Learning?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of students who are mastering music theory faster with Premium.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
                  style={{ color: PREMIUM_BLUE }}
                >
                  <span className="text-xl">👑</span>
                  Upgrade Now
                </Link>
                <Link
                  href="/quiz"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/30"
                >
                  Continue with Free
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Premium Members Thank You */}
        {isPremium && (
          <div
            className="py-12"
            style={{ background: `linear-gradient(135deg, ${PREMIUM_BLUE_LIGHT} 0%, #d0e8f7 100%)` }}
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{ backgroundColor: 'white' }}
              >
                <span className="text-xl">💝</span>
                <span className="font-semibold" style={{ color: PREMIUM_BLUE }}>Thank You!</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your Support Makes This Possible
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                As a premium member, you&apos;re helping us build the best music theory learning platform.
                We&apos;ll notify you as soon as new features are available!
              </p>
            </div>
          </div>
        )}
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
