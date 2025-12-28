'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from '@/components/ProfileDropdown'

interface User {
  id: string
  email: string
  role: string
  avatar_url?: string | null
  theme_color?: string | null
}

interface ContactNavProps {
  user: User | null
}

export function ContactNav({ user }: ContactNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Link href={user ? "/quiz" : "/#quizzes"} className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                Quizzes
              </Link>
              {user && (
                <Link href="/forum" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                  Forum
                </Link>
              )}
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                Learning Plans
              </Link>
              <span className="text-brand text-sm font-semibold">
                Contact Me
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <ProfileDropdown user={{
                ...user,
                avatarUrl: user.avatar_url,
                themeColor: user.theme_color,
              }} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-semibold"
                >
                  Log in
                </Link>
                <Link
                  href="/login?tab=register"
                  className="hidden sm:block px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-semibold"
                >
                  Sign up free
                </Link>
              </>
            )}
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
          <div className="px-4 py-3 space-y-3">
            <Link
              href={user ? "/quiz" : "/#quizzes"}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold"
            >
              Quizzes
            </Link>
            {user && (
              <Link
                href="/forum"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold"
              >
                Forum
              </Link>
            )}
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold"
            >
              Learning Plans
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-brand hover:bg-gray-50 rounded-lg text-sm font-semibold"
            >
              Contact Me
            </Link>
            {!user && (
              <>
                <div className="pt-3 border-t border-gray-200">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-center text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login?tab=register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block mt-2 px-3 py-2 text-center bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-dark"
                  >
                    Sign up free
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
