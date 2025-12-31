'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/components/ProfileDropdown'

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
  const [loading, setLoading] = useState(true)
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

        // Check premium status
        if (data.user.subscriptionStatus !== 'active') {
          router.push('/student-premium')
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

  const currentTool = PREMIUM_TOOLS.find(t => pathname.includes(t.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
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
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors">
                  Dashboard
                </Link>
                <Link href="/quiz" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors">
                  Quizzes
                </Link>
                <Link href="/learning" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors">
                  Learning
                </Link>

                {/* Premium Tools Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${PREMIUM_BLUE} 0%, ${PREMIUM_BLUE_DARK} 100%)`,
                      color: 'white'
                    }}
                  >
                    <span>👑</span>
                    {currentTool ? currentTool.title : 'Premium Tools'}
                    <svg
                      className={`w-4 h-4 transition-transform ${toolsDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {toolsDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden z-50">
                      <div
                        className="px-4 py-3 border-b border-blue-100"
                        style={{ background: `linear-gradient(135deg, #e8f4fc 0%, #d0e8f7 100%)` }}
                      >
                        <div className="flex items-center gap-2">
                          <span>👑</span>
                          <p className="text-sm font-bold" style={{ color: PREMIUM_BLUE }}>Premium Tools</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Exclusive features for premium members</p>
                      </div>
                      {PREMIUM_TOOLS.map(tool => (
                        <Link
                          key={tool.id}
                          href={tool.path}
                          onClick={() => setToolsDropdownOpen(false)}
                          className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left border-b border-gray-50 last:border-b-0 ${
                            pathname === tool.path ? 'bg-blue-50' : 'hover:bg-blue-50'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              pathname === tool.path ? 'ring-2 ring-offset-1 ring-blue-400' : ''
                            }`}
                            style={{
                              background: `linear-gradient(135deg, #e8f4fc 0%, #d0e8f7 100%)`
                            }}
                          >
                            <span className="text-xl">{tool.icon}</span>
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${pathname === tool.path ? 'text-blue-600' : 'text-gray-900'}`}>
                              {tool.title}
                            </p>
                            <p className="text-xs text-gray-500">{tool.description}</p>
                          </div>
                          {pathname === tool.path && (
                            <svg className="w-5 h-5 ml-auto" style={{ color: PREMIUM_BLUE }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ProfileDropdown user={user} />
          </div>
        </div>
      </nav>

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
