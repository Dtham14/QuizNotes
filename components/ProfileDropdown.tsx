'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
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

interface ProfileDropdownProps {
  user: {
    id: string
    email: string
    name?: string | null
    avatar?: string | null
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

  const avatarId = user.avatar || 'treble-clef'
  const avatarData = AVATAR_OPTIONS[avatarId] || AVATAR_OPTIONS['treble-clef']

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
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarData.color} flex items-center justify-center text-xl text-white shadow-md hover:shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2`}
        aria-label="Open profile menu"
        aria-expanded={isOpen}
      >
        {avatarData.icon}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Header */}
          <div className={`p-4 bg-gradient-to-r ${avatarData.color}`}>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl text-white border-2 border-white/30">
                {avatarData.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">
                  {user.name || 'Music Learner'}
                </p>
                <p className="text-sm text-white/80 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
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
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">View Profile</p>
                <p className="text-xs text-gray-500">See your full progress and stats</p>
              </div>
            </Link>

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
