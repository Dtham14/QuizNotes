'use client'

import Link from 'next/link'
import Image from 'next/image'
import ProfileDropdown from './ProfileDropdown'

interface ForumNavProps {
  user: {
    id: string
    email: string
    name?: string | null
    role?: string
    avatar?: string | null
    avatar_url?: string | null
    theme_color?: string | null
  }
}

export default function ForumNav({ user }: ForumNavProps) {
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
              <Link href="/profile" className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors">
                Dashboard
              </Link>
              <Link href="/quiz" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                Quizzes
              </Link>
              <span className="text-brand font-semibold text-sm">Forum</span>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                Learning Plans
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                Contact Me
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProfileDropdown
              user={{
                ...user,
                avatarUrl: user.avatar_url,
                themeColor: user.theme_color,
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}
