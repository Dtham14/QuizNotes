'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AnonymousQuiz from './AnonymousQuiz';
import ProfileDropdown from './ProfileDropdown';
import { QuizType } from '@/lib/quizData';

type User = {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  theme_color?: string | null;
};

type LandingPageClientProps = {
  user: User | null;
};

export default function LandingPageClient({ user }: LandingPageClientProps) {
  const router = useRouter();
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizType, setSelectedQuizType] = useState<QuizType | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openQuiz = (type?: QuizType) => {
    // Logged-in users go to the quiz page with full features
    if (user) {
      const url = type ? `/quiz?type=${type}` : '/quiz';
      router.push(url);
      return;
    }
    // Anonymous users see the anonymous quiz modal
    setSelectedQuizType(type);
    setShowQuiz(true);
    setMobileMenuOpen(false);
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
                  Learning Plans
                </Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                  Contact Me
                </Link>
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
                    className="hidden sm:block px-4 py-2 text-gray-700 text-sm font-semibold hover:text-gray-900"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login?tab=register"
                    className="hidden sm:block px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors"
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
              <button
                onClick={() => {
                  openQuiz();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold"
              >
                Quizzes
              </button>
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
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold"
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

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Gamify your music theory learning
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Master music theory through interactive quizzes. Earn XP, unlock achievements, climb leaderboards, and track your progress with our variety of staff identification and ear training exercises.
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

      {/* Quiz Selection - Matching Student Quiz Page Format */}
      <section id="quizzes" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Choose a Quiz Topic
            </h2>
            <p className="text-gray-600">
              Click any topic to start a free quiz instantly
            </p>
          </div>

          {/* Quick Start */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Start</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Mixed Staff Identification Quiz */}
              <button
                onClick={() => openQuiz('mixed')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">🎼</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Mixed Staff Identification Quiz</h3>
                <p className="text-sm text-gray-500 flex-grow">Random staff notation questions (10 questions)</p>
              </button>

              {/* Mixed Ear Training Quiz */}
              <button
                onClick={() => openQuiz('ear-training')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">👂</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Mixed Ear Training Quiz</h3>
                <p className="text-sm text-gray-500 flex-grow">Random ear training questions (10 questions)</p>
              </button>

              {/* Mixed Quiz */}
              <button
                onClick={() => openQuiz('mixed')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Mixed Quiz</h3>
                <p className="text-sm text-gray-500 flex-grow">Random questions from all topics (10 questions)</p>
              </button>
            </div>
          </div>

          {/* Staff Identification */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Staff Identification</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => openQuiz('noteIdentification')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">🎵</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Note Identification</h3>
                <p className="text-sm text-gray-500 flex-grow">Identify notes on the musical staff</p>
              </button>

              <button
                onClick={() => openQuiz('keySignature')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">🎼</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Key Signature</h3>
                <p className="text-sm text-gray-500 flex-grow">Identify key signatures and their names</p>
              </button>

              <button
                onClick={() => openQuiz('intervals')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">📏</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Interval Identification</h3>
                <p className="text-sm text-gray-500 flex-grow">Identify intervals between notes</p>
              </button>

              <button
                onClick={() => openQuiz('chords')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">🎹</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Chord Identification</h3>
                <p className="text-sm text-gray-500 flex-grow">Identify chord types from notation</p>
              </button>

              <button
                onClick={() => openQuiz('scales')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">🎚️</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Scale Identification</h3>
                <p className="text-sm text-gray-500 flex-grow">Identify scale types and modes</p>
              </button>
            </div>
          </div>

          {/* Ear Training */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ear Training</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => openQuiz('earTrainingNote')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">👂</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Note Recognition</h3>
                <p className="text-sm text-gray-500 flex-grow">Identify notes by ear</p>
              </button>

              <button
                onClick={() => openQuiz('earTrainingInterval')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">🔊</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Interval Recognition</h3>
                <p className="text-sm text-gray-500 flex-grow">Identify intervals by ear</p>
              </button>

              <button
                onClick={() => openQuiz('earTrainingChord')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">🎧</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Chord Recognition</h3>
                <p className="text-sm text-gray-500 flex-grow">Identify chord types by ear</p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Clean Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Why QuizNotes works
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Earn XP & Level Up</h3>
              <p className="text-gray-600 text-sm">
                Gain experience points with every quiz and watch your level grow
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Unlock Achievements</h3>
              <p className="text-gray-600 text-sm">
                Complete challenges and collect achievements as you master skills
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔥</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Build Streaks</h3>
              <p className="text-gray-600 text-sm">
                Practice daily to build your streak and stay motivated
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Climb Leaderboards</h3>
              <p className="text-gray-600 text-sm">
                Compete with others and see where you rank globally
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-16 bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Advanced Learning Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Customize your learning experience with powerful tools and detailed analytics
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quiz Customization</h3>
              <p className="text-gray-600 text-sm mb-3">
                Tailor your practice sessions with customizable quiz settings
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Choose from 10+ quiz types (staff notation, ear training, theory)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Mix and match question types for comprehensive practice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Adjust difficulty levels to match your skill</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Interactive Learning</h3>
              <p className="text-gray-600 text-sm mb-3">
                Access comprehensive learning resources with audio examples
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Step-by-step music theory lessons for beginners</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Interactive audio demonstrations of concepts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Visual aids with clickable keyboards and notation</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Detailed Analytics</h3>
              <p className="text-gray-600 text-sm mb-3">
                Track your progress with comprehensive performance insights
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Real-time score tracking and accuracy percentages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Performance breakdown by quiz type and topic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Streak tracking and achievement progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">•</span>
                  <span>Historical data to track improvement over time</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* For Teachers */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/80 text-sm font-medium mb-4">
              <span>👩‍🏫</span>
              For Educators
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Powerful tools for music teachers
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Everything you need to create engaging music theory assignments and track your students' progress. Your students learn completely free.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🏫</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Class Management</h3>
              <p className="text-gray-400 text-sm">
                Create classes with unique join codes. Students enroll instantly and you see them in your roster.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Custom Quiz Builder</h3>
              <p className="text-gray-400 text-sm">
                Build quizzes with staff notation and ear training questions. Use our generators or create your own.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Flexible Assignments</h3>
              <p className="text-gray-400 text-sm">
                Assign quizzes with due dates and attempt limits. Use custom quizzes or standard quiz types.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Progress Tracking</h3>
              <p className="text-gray-400 text-sm">
                See completion rates, average scores, and individual student results at a glance.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">VexFlow Notation</h3>
              <p className="text-gray-400 text-sm">
                Professional music notation rendering. Students see real sheet music, not simplified diagrams.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎧</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Ear Training Audio</h3>
              <p className="text-gray-400 text-sm">
                Audio playback for ear training exercises. Test intervals, chords, and note recognition.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/pricing?tab=teachers"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              View Teacher Plans
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <p className="text-gray-400 text-sm mt-4">
              Students always learn for free. No hidden costs.
            </p>
          </div>
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
                The fun way to learn music theory through gamifying your journey.
              </p>
            </div>

            <div className="flex gap-12">
              <div>
                <h4 className="text-white font-medium mb-3 text-sm">Staff Identification</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => openQuiz('noteIdentification')} className="text-gray-400 hover:text-white">Note Identification</button></li>
                  <li><button onClick={() => openQuiz('keySignature')} className="text-gray-400 hover:text-white">Key Signatures</button></li>
                  <li><button onClick={() => openQuiz('intervals')} className="text-gray-400 hover:text-white">Intervals</button></li>
                  <li><button onClick={() => openQuiz('chords')} className="text-gray-400 hover:text-white">Chords</button></li>
                  <li><button onClick={() => openQuiz('scales')} className="text-gray-400 hover:text-white">Scales</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-3 text-sm">Ear Training</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => openQuiz('earTrainingNote')} className="text-gray-400 hover:text-white">Note Recognition</button></li>
                  <li><button onClick={() => openQuiz('earTrainingInterval')} className="text-gray-400 hover:text-white">Interval Recognition</button></li>
                  <li><button onClick={() => openQuiz('earTrainingChord')} className="text-gray-400 hover:text-white">Chord Recognition</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-3 text-sm">Account</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login" className="text-gray-400 hover:text-white">Log in</Link></li>
                  <li><Link href="/login?tab=register" className="text-gray-400 hover:text-white">Sign up</Link></li>
                  <li><Link href="/pricing" className="text-gray-400 hover:text-white">Learning Plans</Link></li>
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
