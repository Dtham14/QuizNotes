'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckoutButton } from './checkout-button'

interface User {
  id: string
  email: string
  role: string
  subscription_status?: string | null
  subscription_plan?: string | null
}

interface PricingTabsProps {
  user: User | null
  hasActiveSubscription: boolean
  isTeacher: boolean
}

export function PricingTabs({ user, hasActiveSubscription, isTeacher }: PricingTabsProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const defaultTab = tabParam === 'teachers' ? 'teachers' : (isTeacher ? 'teachers' : 'students')
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>(defaultTab)

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam === 'teachers') {
      setActiveTab('teachers')
    } else if (tabParam === 'students') {
      setActiveTab('students')
    }
  }, [tabParam])

  return (
    <div className="mb-20">
      {/* Tab Buttons */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'students'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            For Students
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'teachers'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            For Teachers
          </button>
        </div>
      </div>

      {/* Student Plans */}
      {activeTab === 'students' && (
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Free</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/forever</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Perfect for getting started</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Unlimited quizzes</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">All quiz types</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Progress tracking</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Achievements & XP</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Join teacher classes</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-400">5 PDF downloads/day</span>
              </li>
            </ul>

            {!user ? (
              <Link
                href="/login?tab=register"
                className="block w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-center"
              >
                Get Started Free
              </Link>
            ) : !hasActiveSubscription ? (
              <div className="text-center py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold">
                Current Plan
              </div>
            ) : (
              <div className="text-center py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold">
                Free Tier
              </div>
            )}
          </div>

          {/* Premium Student Plan */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-brand relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-brand text-white text-sm font-semibold rounded-full">
                Most Popular
              </span>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-brand mb-2">Premium</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">$5</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Billed monthly</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Everything in Free</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 font-medium">🎹 Interactive Piano (2 octaves, recording)</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 font-medium">🎮 Rhythm Game (timing training)</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 font-medium">🎼 Sandbox Composition (notation editor)</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 font-medium">20 PDF downloads/day</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 font-medium">Premium badge & priority leaderboard</span>
              </li>
            </ul>

            {hasActiveSubscription && user?.subscription_plan === 'student_premium' ? (
              <div className="text-center py-3 bg-green-100 text-green-700 rounded-xl font-semibold">
                Current Plan
              </div>
            ) : user ? (
              <CheckoutButton plan="student_premium" variant="primary" />
            ) : (
              <Link
                href="/login?tab=register&plan=student_premium"
                className="block w-full py-4 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors text-center"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Teacher Plans */}
      {activeTab === 'teachers' && (
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Monthly</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">$12</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Billed monthly</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Unlimited classes</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Unlimited students</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Unlimited assignments</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Custom quiz builder</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Student progress tracking</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Detailed analytics</span>
              </li>
            </ul>

            {hasActiveSubscription && user?.subscription_plan === 'monthly' ? (
              <div className="text-center py-3 bg-green-100 text-green-700 rounded-xl font-semibold">
                Current Plan
              </div>
            ) : user ? (
              <CheckoutButton plan="monthly" variant="secondary" />
            ) : (
              <Link
                href="/login?tab=register&plan=monthly"
                className="block w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-center"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-brand relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-brand text-white text-sm font-semibold rounded-full">
                Save 44%
              </span>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-brand mb-2">Yearly</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-gray-900">$80</span>
                <span className="text-gray-600">/year</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">$6.67/month, billed annually</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Unlimited classes</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Unlimited students</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Unlimited assignments</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Custom quiz builder</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Student progress tracking</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Detailed analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 font-medium">Priority support</span>
              </li>
            </ul>

            {hasActiveSubscription && user?.subscription_plan === 'yearly' ? (
              <div className="text-center py-3 bg-green-100 text-green-700 rounded-xl font-semibold">
                Current Plan
              </div>
            ) : user ? (
              <CheckoutButton plan="yearly" variant="primary" />
            ) : (
              <Link
                href="/login?tab=register&plan=yearly"
                className="block w-full py-4 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-colors text-center"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
