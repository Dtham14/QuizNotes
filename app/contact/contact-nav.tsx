'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import StudentNav from '@/components/StudentNav'
import TeacherNav from '@/components/TeacherNav'

interface User {
  id: string
  email: string
  role: string
  avatar_url?: string | null
  theme_color?: string | null
  avatar?: string | null
  name?: string | null
  subscriptionStatus?: 'none' | 'active' | 'canceled' | 'expired' | null
  subscription_status?: 'none' | 'active' | 'canceled' | 'expired' | null
}

interface ContactNavProps {
  user: User | null
}

export function ContactNav({ user }: ContactNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // If user is logged in as a student, use StudentNav
  if (user && user.role === 'student') {
    return <StudentNav user={user} />
  }

  // If user is logged in as a teacher, use TeacherNav
  if (user && (user.role === 'teacher' || user.role === 'admin')) {
    return <TeacherNav user={user} stats={{
      classCount: 0,
      studentCount: 0,
      quizCount: 0,
      assignmentCount: 0,
    }} />
  }

  // For non-logged-in users, show simplified nav with mobile menu
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/images/quiznotes logo.jpg"
                alt="QuizNotes Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-lg sm:text-xl font-bold text-gray-900">QuizNotes</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/#quizzes" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                Quizzes
              </Link>
              <Link href="/forum" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                Forum
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                Learning Plans
              </Link>
              <span className="text-brand text-sm font-semibold">
                Contact
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block px-3 sm:px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-semibold"
            >
              Log in
            </Link>
            <Link
              href="/login?tab=register"
              className="hidden sm:block px-3 sm:px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-semibold whitespace-nowrap"
            >
              Sign up free
            </Link>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
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
              href="/#quizzes"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Quizzes
            </Link>
            <Link
              href="/forum"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Forum
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Learning Plans
            </Link>
            <div className="block px-3 py-2 rounded-lg text-sm font-semibold text-brand bg-brand/5">
              Contact
            </div>
            <div className="pt-2 border-t border-gray-200">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 text-center"
              >
                Log in
              </Link>
              <Link
                href="/login?tab=register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 mt-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-semibold text-center"
              >
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
