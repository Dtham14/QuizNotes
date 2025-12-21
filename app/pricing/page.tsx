import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { CheckoutButton } from './checkout-button'
import { PricingTabs } from './pricing-tabs'
import ProfileDropdown from '@/components/ProfileDropdown'

export default async function PricingPage() {
  const user = await getSession()
  const isTeacher = user?.role === 'teacher'
  const hasActiveSubscription = user?.subscription_status === 'active'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
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
                <span className="text-brand text-sm font-semibold">
                  Learning Plans
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
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-semibold"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login?tab=register"
                    className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-semibold"
                  >
                    Sign up free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

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
                Can I try before I subscribe?
              </h3>
              <p className="text-gray-600">
                You can create a teacher account and explore the platform. To create classes and assign quizzes,
                you'll need an active subscription.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards including Visa, Mastercard, and American Express.
                Payment is processed securely through Stripe.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access
                until the end of your current billing period.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do my students need to pay?
              </h3>
              <p className="text-gray-600">
                No! Students always use QuizNotes for free. They can join your classes, take quizzes,
                and track their progress without any payment.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a discount for schools?
              </h3>
              <p className="text-gray-600">
                Yes, we offer special pricing for schools and institutions. Contact us at
                support@quiznotes.com for more information.
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
