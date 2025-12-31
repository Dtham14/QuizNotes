'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

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

interface StudentNavProps {
  user?: {
    id: string;
    email: string;
    name?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
    theme_color?: string | null;
  } | null;
  level?: number;
  xp?: number;
}

export default function StudentNav({ user, level, xp }: StudentNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [learnMenuOpen, setLearnMenuOpen] = useState(false);
  const [classesMenuOpen, setClassesMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const learnMenuRef = useRef<HTMLDivElement>(null);
  const classesMenuRef = useRef<HTMLDivElement>(null);

  // Check if user has a custom avatar image
  const hasCustomAvatar = !!user?.avatar_url;
  const avatarId = user?.avatar || 'conductor';
  const avatarData = AVATAR_OPTIONS[avatarId] || AVATAR_OPTIONS['conductor'];

  // Use theme color for custom avatars, or predefined gradient for icon avatars
  const themeColor = user?.theme_color || DEFAULT_THEME_COLOR;
  const gradientStyle = hasCustomAvatar
    ? { background: `linear-gradient(135deg, ${themeColor}, ${adjustColor(themeColor, -30)})` }
    : undefined;
  const gradientClass = hasCustomAvatar ? '' : `bg-gradient-to-br ${avatarData.color}`;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (learnMenuRef.current && !learnMenuRef.current.contains(event.target as Node)) {
        setLearnMenuOpen(false);
      }
      if (classesMenuRef.current && !classesMenuRef.current.contains(event.target as Node)) {
        setClassesMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setLearnMenuOpen(false);
        setClassesMenuOpen(false);
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
            <div className="hidden md:flex items-center gap-6">
              {/* Dashboard Link */}
              <Link
                href="/student/dashboard"
                className={`text-sm font-semibold transition-colors ${
                  pathname === '/student/dashboard'
                    ? 'text-violet-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>

              {/* Classes Dropdown */}
              <div className="relative" ref={classesMenuRef}>
                <button
                  onClick={() => setClassesMenuOpen(!classesMenuOpen)}
                  className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
                    pathname?.startsWith('/student/classes') || pathname?.startsWith('/class/') || pathname?.startsWith('/student/assignments')
                      ? 'text-violet-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Classes
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {classesMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                    <Link
                      href="/student/classes"
                      onClick={() => setClassesMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                    >
                      <div className="font-semibold">My Classes</div>
                      <div className="text-xs text-gray-500">View all enrolled classes</div>
                    </Link>
                    <Link
                      href="/student/assignments"
                      onClick={() => setClassesMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                    >
                      <div className="font-semibold">Assignments</div>
                      <div className="text-xs text-gray-500">View all assignments</div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Learn Dropdown */}
              <div className="relative" ref={learnMenuRef}>
                <button
                  onClick={() => setLearnMenuOpen(!learnMenuOpen)}
                  className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
                    pathname === '/quiz' || pathname === '/learning' || pathname === '/leaderboard'
                      ? 'text-violet-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Learn
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {learnMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                    <Link
                      href="/quiz"
                      onClick={() => setLearnMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                    >
                      <div className="font-semibold">Practice Quizzes</div>
                      <div className="text-xs text-gray-500">Improve your skills</div>
                    </Link>
                    <Link
                      href="/learning"
                      onClick={() => setLearnMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                    >
                      <div className="font-semibold">Learning Materials</div>
                      <div className="text-xs text-gray-500">Study resources</div>
                    </Link>
                    <Link
                      href="/leaderboard"
                      onClick={() => setLearnMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                    >
                      <div className="font-semibold">Leaderboard</div>
                      <div className="text-xs text-gray-500">Top performers</div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Forum Link */}
              <Link
                href="/forum"
                className={`text-sm font-semibold transition-colors ${
                  pathname === '/forum'
                    ? 'text-violet-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Forum
              </Link>

              {/* Learning Plans Link */}
              <Link
                href="/pricing"
                className={`text-sm font-semibold transition-colors ${
                  pathname === '/pricing'
                    ? 'text-violet-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Learning Plans
              </Link>

              {/* Contact Link */}
              <Link
                href="/contact"
                className={`text-sm font-semibold transition-colors ${
                  pathname === '/contact'
                    ? 'text-violet-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="flex items-center gap-3">
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
                  src={user!.avatar_url!}
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
                          src={user!.avatar_url!}
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
                        {user?.name || 'Student'}
                      </p>
                      <p className="text-sm text-white/80 truncate">{user?.email || ''}</p>
                      {level !== undefined && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
                          Level {level}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                {(level !== undefined || xp !== undefined) && (
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      {level !== undefined && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{level}</p>
                          <p className="text-xs text-gray-500">Level</p>
                        </div>
                      )}
                      {xp !== undefined && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{xp}</p>
                          <p className="text-xs text-gray-500">XP</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    href="/student/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Dashboard</p>
                      <p className="text-xs text-gray-500">Back to your dashboard</p>
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
                      <p className="text-xs text-gray-500">Improve your skills</p>
                    </div>
                  </Link>

                  <Link
                    href="/forum"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Forum</p>
                      <p className="text-xs text-gray-500">Join the community</p>
                    </div>
                  </Link>

                  <Link
                    href="/leaderboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Leaderboard</p>
                      <p className="text-xs text-gray-500">View top performers</p>
                    </div>
                  </Link>

                  <Link
                    href="/learning"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Learning</p>
                      <p className="text-xs text-gray-500">Study materials</p>
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
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link
              href="/student/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/student/dashboard'
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/student/classes"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname?.startsWith('/student/classes') || pathname?.startsWith('/class/')
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              My Classes
            </Link>
            <Link
              href="/student/assignments"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname?.startsWith('/student/assignments')
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Assignments
            </Link>
            <Link
              href="/quiz"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/quiz'
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Practice
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
