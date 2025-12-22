'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const planParam = searchParams.get('plan')

  const [activeTab, setActiveTab] = useState(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const initiateCheckout = async (plan: string) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        // If checkout fails, redirect to pricing
        router.push('/pricing')
      }
    } catch {
      router.push('/pricing')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // If plan parameter exists, redirect to Stripe checkout
      if (planParam && ['monthly', 'yearly', 'student_premium'].includes(planParam)) {
        await initiateCheckout(planParam)
      } else {
        // Redirect to profile for all users
        router.push('/profile')
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            role: role,
          },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      // Check if email confirmation is required
      setSuccess('Account created successfully! Please check your email to confirm your account.')

      // If no email confirmation required, redirect to checkout or profile
      setTimeout(async () => {
        if (planParam && ['monthly', 'yearly', 'student_premium'].includes(planParam)) {
          await initiateCheckout(planParam)
        } else {
          router.push('/profile')
          router.refresh()
        }
      }, 2000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      // Store plan in localStorage for OAuth callback
      if (planParam && ['monthly', 'yearly', 'student_premium'].includes(planParam)) {
        localStorage.setItem('checkout_plan', planParam)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-brand cursor-pointer">QuizNotes</h1>
          </Link>
          <p className="text-gray-600 mt-2">Master music theory one quiz at a time</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex border-b mb-6">
            <button
              className={`flex-1 pb-3 text-center font-semibold transition-colors ${activeTab === 'login'
                  ? 'text-brand border-b-2 border-brand'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              className={`flex-1 pb-3 text-center font-semibold transition-colors ${activeTab === 'register'
                  ? 'text-brand border-b-2 border-brand'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-3 rounded-lg border-2 transition-all ${role === 'student'
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                  >
                    <div className="text-2xl mb-1">🎓</div>
                    <div className="font-medium">Student</div>
                    <div className="text-xs text-gray-500">Learn for free</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`p-3 rounded-lg border-2 transition-all ${role === 'teacher'
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                  >
                    <div className="text-2xl mb-1">👩‍🏫</div>
                    <div className="font-medium">Teacher</div>
                    <div className="text-xs text-gray-500">Manage classes</div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* OAuth divider - uncomment when Google OAuth is configured in Supabase */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
          </div>


          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-brand hover:text-brand-dark">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
