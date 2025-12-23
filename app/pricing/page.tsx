import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { CheckoutButton } from './checkout-button'
import { PricingTabs } from './pricing-tabs'
import ProfileDropdown from '@/components/ProfileDropdown'
import { PricingNav } from './pricing-nav'

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const user = await getSession()
  const isTeacher = user?.role === 'teacher'
  const hasActiveSubscription = user?.subscription_status === 'active'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <PricingNav user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock premium features for students or powerful classroom tools for educators.
          </p>
        </div>

        {/* Tabs */}
        <Suspense fallback={<div className="text-center py-12"><p className="text-gray-500">Loading...</p></div>}>
          <PricingTabs
            user={user}
            hasActiveSubscription={hasActiveSubscription}
            isTeacher={isTeacher}
          />
        </Suspense>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What quiz types are available?
              </h3>
              <p className="text-gray-600">
                QuizNotes offers 10+ quiz types including Staff Notation (note identification, key signatures, intervals, chords, scales),
                Ear Training (note recognition, interval recognition, chord recognition), and Mixed quizzes that combine multiple question types.
                All quizzes feature professional VexFlow notation and Tone.js audio playback.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What premium tools are included for students?
              </h3>
              <p className="text-gray-600">
                Premium students get access to three interactive tools: Interactive Piano (2-octave playable piano with recording and playback),
                Rhythm Game (falling notes timing game with multiple difficulty levels), and Sandbox Composition (full notation editor with playback).
                Plus increased PDF downloads, premium badge, and priority leaderboard placement.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free Learning section?
              </h3>
              <p className="text-gray-600">
                Yes! All students (free and premium) have access to our comprehensive Learning page with beginner-friendly music theory lessons.
                Each lesson includes interactive visuals with clickable keyboards, audio demonstrations of concepts like major vs minor,
                intervals, scales, and chord progressions.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can teachers create custom quizzes?
              </h3>
              <p className="text-gray-600">
                Yes! Teachers with an active subscription can use our Custom Quiz Builder to create quizzes with staff notation and ear training questions.
                Use our generators or create your own questions from scratch. Assign these custom quizzes to your classes alongside standard quiz types.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What analytics are available?
              </h3>
              <p className="text-gray-600">
                Students see real-time score tracking, accuracy percentages, performance breakdown by quiz type, streak tracking, and achievement progress.
                Teachers get detailed class analytics including completion rates, average scores, individual student results, and can track performance over time.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do my students need to pay?
              </h3>
              <p className="text-gray-600">
                No! Students always use QuizNotes for free. They can join your classes, take quizzes, earn XP and achievements,
                access the Learning page, and track their progress without any payment. Only teacher subscriptions and optional student premium upgrades require payment.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards including Visa, Mastercard, and American Express.
                Payment is processed securely through Stripe. You can cancel anytime and retain access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a discount for schools?
              </h3>
              <p className="text-gray-600">
                Yes, we offer special pricing for schools and institutions. Contact us at
                support@quiznotes.com for more information about bulk teacher licenses and school-wide deployment.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/quiznotes logo.jpg"
                alt="QuizNotes Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-white">QuizNotes</span>
            </div>
            <p className="text-gray-500">&copy; {new Date().getFullYear()} QuizNotes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
