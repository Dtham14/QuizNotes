import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { ContactNav } from './contact-nav'

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const user = await getSession()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <ContactNav user={user} />

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600">
              Questions, suggestions, or just want to say hello?
            </p>
          </div>

          {/* Why I Created QuizNotes */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 md:p-12 mb-12 border border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-brand/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Why I Created QuizNotes</h2>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                As a music educator and developer, I've always been passionate about making music theory accessible and engaging
                for students of all levels. I noticed that traditional music theory learning often felt disconnected from the
                actual experience of making music—too much rote memorization, not enough hands-on practice.
              </p>

              <p>
                QuizNotes was born from the idea that learning music theory should be interactive, gamified, and fun. By combining
                professional notation rendering (VexFlow), real audio playback (Tone.js), and game-like progression systems,
                I wanted to create a platform where students could practice music theory the same way they'd practice an instrument—
                through repetition, immediate feedback, and measurable progress.
              </p>

              <p>
                For teachers, I built powerful classroom management tools that make it easy to create custom quizzes, assign homework,
                and track student progress—all while keeping the student experience completely free. Every feature in QuizNotes
                is designed with real classroom needs in mind.
              </p>

              <p className="font-semibold text-gray-900">
                My goal is simple: make music theory education better for everyone, one quiz at a time.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Email Card */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Me</h3>
              <p className="text-gray-600 mb-4">
                Send me your questions, feature requests, or feedback
              </p>
              <a
                href="mailto:daniel@quiznotes.ca"
                className="inline-flex items-center gap-2 text-brand hover:text-brand-dark font-semibold transition-colors break-all"
              >
                daniel@quiznotes.ca
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            {/* LinkedIn Card */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
              <div className="w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect on LinkedIn</h3>
              <p className="text-gray-600 mb-4">
                Let's connect professionally
              </p>
              <a
                href="https://www.linkedin.com/in/dtham14/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand hover:text-brand-dark font-semibold transition-colors"
              >
                View Profile
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Feedback Card */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Your Ideas</h3>
              <p className="text-gray-600 mb-4">
                Have suggestions for new features or improvements?
              </p>
              <a
                href="mailto:daniel@quiznotes.ca?subject=Feature Suggestion"
                className="inline-flex items-center gap-2 text-brand hover:text-brand-dark font-semibold transition-colors"
              >
                Send a suggestion
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>

          {/* What to Contact About */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">What Can You Contact Me About?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Feature Requests</h4>
                  <p className="text-sm text-gray-600">Ideas for new quiz types, tools, or features</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Bug Reports</h4>
                  <p className="text-sm text-gray-600">Found an issue? Let me know so I can fix it</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">School Partnerships</h4>
                  <p className="text-sm text-gray-600">Bulk licensing and institutional pricing</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">General Questions</h4>
                  <p className="text-sm text-gray-600">How to use features, pricing, or anything else</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Feedback</h4>
                  <p className="text-sm text-gray-600">Your thoughts on what's working or what could be better</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Just Say Hi!</h4>
                  <p className="text-sm text-gray-600">I'd love to hear from fellow music educators</p>
                </div>
              </div>
            </div>
          </div>

          {/* Response Time Notice */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              I typically respond within 24-48 hours. Looking forward to hearing from you!
            </p>
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
