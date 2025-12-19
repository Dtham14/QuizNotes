'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AnonymousQuiz from './AnonymousQuiz';
import { QuizType } from '@/lib/quizData';

type User = {
  id: string;
  email: string;
  name?: string | null;
};

type LandingPageClientProps = {
  user: User | null;
};

export default function LandingPageClient({ user }: LandingPageClientProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizType, setSelectedQuizType] = useState<QuizType | undefined>(undefined);

  const openQuiz = (type?: QuizType) => {
    setSelectedQuizType(type);
    setShowQuiz(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/quiznotes logo.jpg"
                  alt="QuizNotes Logo"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-gray-900">QuizNotes</span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => openQuiz()}
                  className="text-gray-700 hover:text-gray-900 text-sm font-semibold"
                >
                  Quizzes
                </button>
                <Link href="/pricing" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                  Teacher Plans
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 text-sm font-semibold hover:text-gray-900"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login?tab=register"
                    className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                  >
                    Sign up free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              The best way to learn music theory
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Interactive quizzes with real sheet music notation. Master intervals, chords, scales, and more.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={() => openQuiz()}
                className="px-8 py-4 bg-brand text-white text-lg font-semibold rounded-lg hover:bg-brand-dark transition-colors"
              >
                Start learning for free
              </button>
              {!user && (
                <Link
                  href="/login?tab=register"
                  className="px-8 py-4 bg-white text-brand text-lg font-semibold rounded-lg border-2 border-brand hover:bg-brand/10 transition-colors"
                >
                  Create account
                </Link>
              )}
            </div>

            <p className="text-sm text-gray-500">
              No account required to start practicing
            </p>
          </div>
        </div>
      </section>

      {/* Quiz Topics - Clean Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Choose a topic to practice
            </h2>
            <p className="text-gray-600">
              Click any topic to start a free quiz instantly
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            <button
              onClick={() => openQuiz('intervals')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Intervals</h3>
              <p className="text-sm text-gray-500 flex-grow">Identify distances between notes</p>
            </button>

            <button
              onClick={() => openQuiz('chords')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Chords</h3>
              <p className="text-sm text-gray-500 flex-grow">Major, minor, and more</p>
            </button>

            <button
              onClick={() => openQuiz('scales')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Scales</h3>
              <p className="text-sm text-gray-500 flex-grow">Learn scale degrees</p>
            </button>

            <button
              onClick={() => openQuiz('noteIdentification')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Note Reading</h3>
              <p className="text-sm text-gray-500 flex-grow">Treble and bass clef</p>
            </button>

            <button
              onClick={() => openQuiz('ear-training')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Ear Training</h3>
              <p className="text-sm text-gray-500 flex-grow">Identify sounds by ear</p>
            </button>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => openQuiz('mixed')}
              className="text-brand font-medium hover:text-brand-dark hover:underline"
            >
              Or try a mixed quiz with all topics →
            </button>
          </div>
        </div>
      </section>

      {/* Features - Clean Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Why QuizNotes works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real notation</h3>
              <p className="text-gray-600 text-sm">
                Practice with professional sheet music, not simplified diagrams
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Instant feedback</h3>
              <p className="text-gray-600 text-sm">
                Know immediately if you're right with helpful explanations
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Track progress</h3>
              <p className="text-gray-600 text-sm">
                Create a free account to save your scores and see improvement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Teachers */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              For music teachers
            </h2>
            <p className="text-gray-600 mb-6">
              Create classes, assign quizzes, and track your students' progress.
              Students always learn for free.
            </p>
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Learn more about teacher tools
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-brand">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start learning music theory today
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Join students who are mastering music theory with interactive quizzes
          </p>
          <button
            onClick={() => openQuiz()}
            className="px-8 py-4 bg-white text-brand text-lg font-semibold rounded-lg hover:bg-white/90 transition-colors"
          >
            Get started free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image
                  src="/images/quiznotes logo.jpg"
                  alt="QuizNotes Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-lg font-semibold text-white">QuizNotes</span>
              </div>
              <p className="text-gray-400 text-sm max-w-xs">
                The free way to learn music theory with real sheet music notation.
              </p>
            </div>

            <div className="flex gap-12">
              <div>
                <h4 className="text-white font-medium mb-3 text-sm">Learn</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => openQuiz('intervals')} className="text-gray-400 hover:text-white">Intervals</button></li>
                  <li><button onClick={() => openQuiz('chords')} className="text-gray-400 hover:text-white">Chords</button></li>
                  <li><button onClick={() => openQuiz('scales')} className="text-gray-400 hover:text-white">Scales</button></li>
                  <li><button onClick={() => openQuiz('noteIdentification')} className="text-gray-400 hover:text-white">Note Reading</button></li>
                  <li><button onClick={() => openQuiz('ear-training')} className="text-gray-400 hover:text-white">Ear Training</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-3 text-sm">Account</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login" className="text-gray-400 hover:text-white">Log in</Link></li>
                  <li><Link href="/login?tab=register" className="text-gray-400 hover:text-white">Sign up</Link></li>
                  <li><Link href="/pricing" className="text-gray-400 hover:text-white">Teacher Plans</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-6">
            <p className="text-gray-500 text-sm text-center">
              &copy; {new Date().getFullYear()} QuizNotes. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Anonymous Quiz Modal */}
      {showQuiz && (
        <AnonymousQuiz
          onClose={() => {
            setShowQuiz(false);
            setSelectedQuizType(undefined);
          }}
          initialType={selectedQuizType}
        />
      )}
    </div>
  );
}
