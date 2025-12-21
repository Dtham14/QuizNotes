'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Avatar options with musical themes (same as student)
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
};

// Default gradient color for custom avatars
const DEFAULT_THEME_COLOR = '#8b5cf6'; // violet-500

// Helper to darken a hex color
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface TeacherNavProps {
  user?: {
    id: string;
    email: string;
    name?: string | null;
    avatar?: string | null;
    avatarUrl?: string | null;
    themeColor?: string | null;
  } | null;
  stats?: {
    classCount: number;
    studentCount: number;
    quizCount: number;
    assignmentCount: number;
  } | null;
}

export default function TeacherNav({ user, stats }: TeacherNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if user has a custom avatar image
  const hasCustomAvatar = !!user?.avatarUrl;
  const avatarId = user?.avatar || 'conductor';
  const avatarData = AVATAR_OPTIONS[avatarId] || AVATAR_OPTIONS['conductor'];

  // Use theme color for custom avatars, or predefined gradient for icon avatars
  const themeColor = user?.themeColor || DEFAULT_THEME_COLOR;
  const gradientStyle = hasCustomAvatar
    ? { background: `linear-gradient(135deg, ${themeColor}, ${adjustColor(themeColor, -30)})` }
    : undefined;
  const gradientClass = hasCustomAvatar ? '' : `bg-gradient-to-br ${avatarData.color}`;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
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
            <Link href="/profile" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
              Dashboard
            </Link>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`w-10 h-10 rounded-xl ${gradientClass} flex items-center justify-center text-xl text-white shadow-md hover:shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 overflow-hidden`}
              style={gradientStyle}
              aria-label="Open profile menu"
              aria-expanded={isOpen}
            >
              {hasCustomAvatar ? (
                <Image
                  src={user!.avatarUrl!}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarData.icon
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Header */}
                <div className={`p-4 ${gradientClass}`} style={gradientStyle ? { background: `linear-gradient(to right, ${themeColor}, ${adjustColor(themeColor, -30)})` } : undefined}>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl text-white border-2 border-white/30 overflow-hidden">
                      {hasCustomAvatar ? (
                        <Image
                          src={user!.avatarUrl!}
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
                        {user?.name || 'Teacher'}
                      </p>
                      <p className="text-sm text-white/80 truncate">{user?.email || ''}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
                        Teacher Account
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                {stats && (
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{stats.classCount}</p>
                        <p className="text-xs text-gray-500">Classes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{stats.studentCount}</p>
                        <p className="text-xs text-gray-500">Students</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{stats.quizCount}</p>
                        <p className="text-xs text-gray-500">Quizzes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{stats.assignmentCount}</p>
                        <p className="text-xs text-gray-500">Assignments</p>
                      </div>
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
                      <p className="font-semibold text-gray-900">Dashboard</p>
                      <p className="text-xs text-gray-500">Back to your dashboard</p>
                    </div>
                  </Link>

                  <Link
                    href="/teacher/quizzes/create"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Create Quiz</p>
                      <p className="text-xs text-gray-500">Build a new custom quiz</p>
                    </div>
                  </Link>

                  <Link
                    href="/quiz"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Practice Quizzes</p>
                      <p className="text-xs text-gray-500">Take quizzes as a student</p>
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
        </div>
      </div>
    </nav>
  );
}
