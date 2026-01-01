'use client'

import Link from 'next/link'
import Image from 'next/image'
import StudentNav from '@/components/StudentNav'

interface User {
  id: string
  email: string
  role: string
  avatar_url?: string | null
  theme_color?: string | null
  avatar?: string | null
  name?: string | null
}

interface ContactNavProps {
  user: User | null
}

export function ContactNav({ user }: ContactNavProps) {
  // If user is logged in as a student, use StudentNav
  if (user && user.role === 'student') {
    return <StudentNav user={{
      ...user,
      avatarUrl: user.avatar_url,
      themeColor: user.theme_color,
    }} />
  }

  // For non-logged-in users or non-students, show simplified nav
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
          </div>
        </div>
      </div>
    </nav>
  )
}
