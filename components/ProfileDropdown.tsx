'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Avatar options with musical themes
const AVATAR_OPTIONS: Record<string, { icon: string; color: string }> = {
  'treble-clef': { icon: '𝄞', color: 'from-violet-500 to-purple-600' },
  'bass-clef': { icon: '𝄢', color: 'from-blue-500 to-cyan-600' },
  'quarter-note': { icon: '♩', color: 'from-amber-500 to-orange-600' },
  'eighth-notes': { icon: '♫', color: 'from-rose-500 to-pink-600' },
  'piano': { icon: '🎹', color: 'from-slate-600 to-slate-800' },
  'guitar': { icon: '🎸', color: 'from-amber-600 to-yellow-500' },
  'violin': { icon: '🎻', color: 'from-orange-700 to-amber-600' },
  'trumpet': { icon: '🎺', color: 'from-yellow-500 to-amber-500' },
  'microphone': { icon: '🎤', color: 'from-pink-500 to-rose-600' },
  'headphones': { icon: '🎧', color: 'from-indigo-500 to-blue-600' },
  'composer': { icon: '🎼', color: 'from-emerald-500 to-teal-600' },
  'conductor': { icon: '🪄', color: 'from-purple-600 to-violet-700' },
}

// Default gradient color for custom avatars
const DEFAULT_THEME_COLOR = '#8b5cf6' // violet-500

// Helper to darken/lighten a hex color
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

interface ProfileDropdownProps {
  user: {
    id: string
    email: string
    name?: string | null
    role?: string
    avatar?: string | null
    avatarUrl?: string | null
    themeColor?: string | null
  }
  stats?: {
    current_level: number
    total_xp: number
    current_streak: number
    level_info?: {
      name: string
      color: string
    }
  } | null
}

export default function ProfileDropdown({ user, stats }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Check if user has a custom avatar image
  const hasCustomAvatar = !!user.avatarUrl
  const avatarId = user.avatar || 'treble-clef'
  const avatarData = AVATAR_OPTIONS[avatarId] || AVATAR_OPTIONS['treble-clef']

  // Use theme color for custom avatars, or predefined gradient for icon avatars
  const themeColor = user.themeColor || DEFAULT_THEME_COLOR
  const gradientStyle = hasCustomAvatar
    ? { background: `linear-gradient(135deg, ${themeColor}, ${adjustColor(themeColor, -30)})` }
    : undefined
  const gradientClass = hasCustomAvatar ? '' : `bg-gradient-to-br ${avatarData.color}`

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleLogout = async () => {
    setIsOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-xl ${gradientClass} flex items-center justify-center text-xl text-white shadow-md hover:shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 overflow-hidden`}
        style={gradientStyle}
        aria-label="Open profile menu"
        aria-expanded={isOpen}
      >
        {hasCustomAvatar ? (
          <Image
            src={user.avatarUrl!}
            alt="Avatar"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          avatarData.icon
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Header */}
          <div className={`p-4 ${gradientClass}`} style={gradientStyle ? { background: `linear-gradient(to right, ${themeColor}, ${adjustColor(themeColor, -30)})` } : undefined}>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl text-white border-2 border-white/30 overflow-hidden">
                {hasCustomAvatar ? (
                  <Image
                    src={user.avatarUrl!}
                    alt="Avatar"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  avatarData.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">
                  {user.name || 'Music Learner'}
                </p>
                <p className="text-sm text-white/80 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats - Only show for non-admin users */}
          {stats && user.role !== 'admin' && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-violet-600">{stats.current_level}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Level</p>
                    <p className="text-sm font-semibold text-gray-700">{stats.level_info?.name || 'Beginner'}</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-amber-600">{stats.total_xp.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">XP</p>
                </div>
                {stats.current_streak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-lg">
                    <span className="text-sm">🔥</span>
                    <span className="text-sm font-bold text-orange-600">{stats.current_streak}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.role === 'admin' ? 'Dashboard' : 'View Profile'}</p>
                <p className="text-xs text-gray-500">{user.role === 'admin' ? 'Go to admin dashboard' : 'See your full progress and stats'}</p>
              </div>
            </Link>

            {/* Admin-specific menu items */}
            {user.role === 'admin' ? (
              <>
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Admin Panel</p>
                    <p className="text-xs text-gray-500">Manage users and analytics</p>
                  </div>
                </Link>

                <Link
                  href="/admin?tab=analytics"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Quiz Analytics</p>
                    <p className="text-xs text-gray-500">View usage statistics</p>
                  </div>
                </Link>

                <Link
                  href="/admin?tab=users"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">User Management</p>
                    <p className="text-xs text-gray-500">Manage registered users</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/achievements"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <span className="text-lg">🏆</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Achievements</p>
                    <p className="text-xs text-gray-500">View badges and rewards</p>
                  </div>
                </Link>

                <Link
                  href="/leaderboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Leaderboard</p>
                    <p className="text-xs text-gray-500">See how you rank</p>
                  </div>
                </Link>
              </>
            )}

            <Link
              href="/forum"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Forum</p>
                <p className="text-xs text-gray-500">Discuss music theory</p>
              </div>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-red-600">Sign Out</p>
                <p className="text-xs text-gray-500">Log out of your account</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
