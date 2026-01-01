'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DiscussionPreview from '@/components/DiscussionPreview';
import ClassCard from '@/components/ClassCard';
import ProfileCard from '@/components/ProfileCard';
import { formatQuizType } from '@/lib/quizBuilder/utils';
import type { UserAchievementWithDetails } from '@/lib/types/database';

interface DashboardStats {
  classCount: number;
  totalAssignments: number;
  completedAssignments: number;
  xp: number;
  level: number;
  streak: number;
  quizzesToday: number;
}

interface Class {
  id: string;
  name: string;
  description: string | null;
  code: string;
  teacher_name: string;
}

interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  themeColor?: string | null;
  role: string;
}

interface QuizAttempt {
  id: string;
  quizType: string;
  score: number;
  totalQuestions: number;
  createdAt: string;
  pdfUrl?: string | null;
}

export default function StudentDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentClasses, setRecentClasses] = useState<Class[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [earned, setEarned] = useState<UserAchievementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [journeyTab, setJourneyTab] = useState<'quizzes' | 'downloads'>('quizzes');
  const [pdfStats, setPdfStats] = useState<{
    downloadsUsed: number;
    downloadsRemaining: number;
    dailyLimit: number;
    isPremium: boolean;
  } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const achievementIconMap: Record<string, React.ReactElement> = {
    star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    fire: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />,
    trophy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [userRes, statsRes, classesRes, attemptsRes, achievementsRes, pdfStatsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/student/dashboard/stats'),
          fetch('/api/student/enroll'),
          fetch('/api/quiz/attempts'),
          fetch('/api/gamification/achievements'),
          fetch('/api/quiz/pdf/stats'),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }

        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setRecentClasses((classesData.classes || []).slice(0, 3));
        }

        if (attemptsRes.ok) {
          const attemptsData = await attemptsRes.json();
          setAttempts(attemptsData.attempts || []);
        }

        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json();
          setEarned(achievementsData.earned || []);
        }

        if (pdfStatsRes.ok) {
          const pdfData = await pdfStatsRes.json();
          setPdfStats({
            downloadsUsed: pdfData.downloadsUsed,
            downloadsRemaining: pdfData.dailyLimit - pdfData.downloadsUsed,
            dailyLimit: pdfData.dailyLimit,
            isPremium: pdfData.isPremium,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const handlePdfDownload = async (attemptId: string) => {
    setDownloadingPdf(attemptId);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/quiz/pdf/${attemptId}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setDownloadError(data.upgradeMessage || 'Daily download limit reached');
        } else {
          setDownloadError(data.error || 'Failed to download PDF');
        }
        return;
      }

      setPdfStats({
        downloadsUsed: data.downloadsUsed,
        downloadsRemaining: data.dailyLimit - data.downloadsUsed,
        dailyLimit: data.dailyLimit,
        isPremium: data.isPremium,
      });

      window.open(data.url, '_blank');
    } catch (error) {
      setDownloadError('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const totalQuizzes = attempts.length;
  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / attempts.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your progress and stay on top of your assignments</p>
      </div>

      {/* Profile Card */}
      {user && (
        <ProfileCard
          user={user}
          stats={stats ? {
            level: stats.level,
            xp: stats.xp,
            streak: stats.streak,
            classCount: stats.classCount,
            completedAssignments: stats.completedAssignments,
            totalAssignments: stats.totalAssignments,
          } : null}
          quizStats={{
            totalQuizzes,
            averageScore,
          }}
          achievementCount={earned.length}
          onUpdate={() => {
            fetch('/api/auth/me').then(res => res.json()).then(data => {
              if (data.user) setUser(data.user);
            });
          }}
        />
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/quiz"
            className="block p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-violet-500 hover:bg-violet-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-violet-900">Practice Quiz</h3>
                <p className="text-sm text-gray-500">Improve your skills</p>
              </div>
            </div>
          </Link>

          <Link
            href="/student/classes"
            className="block p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-900">Join a Class</h3>
                <p className="text-sm text-gray-500">Enter class code</p>
              </div>
            </div>
          </Link>

          <Link
            href="/forum"
            className="block p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-amber-500 hover:bg-amber-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-900">Community Forum</h3>
                <p className="text-sm text-gray-500">Ask questions</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Classes Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">My Classes</h2>
            <Link href="/student/classes" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
              View All
            </Link>
          </div>
          {recentClasses.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-2xl">
                🏫
              </div>
              <p className="text-gray-500 text-sm mb-3">No classes yet</p>
              <Link
                href="/student/classes"
                className="text-violet-600 hover:text-violet-700 font-medium text-sm"
              >
                Join your first class →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClasses.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  id={classItem.id}
                  name={classItem.name}
                  description={classItem.description}
                  code={classItem.code}
                  teacherName={classItem.teacher_name}
                  role="student"
                  variant="compact"
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Discussions */}
        <DiscussionPreview />
      </div>

      {/* Two Column Layout - Achievements and Quiz Journey */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Achievements
            </h2>
            <Link
              href="/achievements"
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              View All
            </Link>
          </div>

          {earned.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-2xl">
                🎖️
              </div>
              <p className="text-gray-500 text-sm">Complete quizzes to earn achievements!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earned.slice(0, 4).map((ua) => {
                const iconPath = achievementIconMap[ua.achievement.icon] || achievementIconMap.star;
                return (
                  <div
                    key={ua.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {iconPath}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{ua.achievement.name}</p>
                      <p className="text-xs text-gray-500">+{ua.achievement.xp_reward} XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{earned.length}</span> achievements earned
            </p>
          </div>
        </div>

        {/* Quiz Journey */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Your Journey
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="text-2xl font-bold text-blue-600">{totalQuizzes}</p>
              <p className="text-xs text-gray-600 mt-1">Quizzes Completed</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-100">
              <p className="text-2xl font-bold text-green-600">{averageScore}%</p>
              <p className="text-xs text-gray-600 mt-1">Average Score</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setJourneyTab('quizzes')}
              className={`px-4 py-2 font-semibold text-sm transition-colors ${
                journeyTab === 'quizzes'
                  ? 'text-violet-600 border-b-2 border-violet-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Recent Quizzes
            </button>
            <button
              onClick={() => setJourneyTab('downloads')}
              className={`px-4 py-2 font-semibold text-sm transition-colors ${
                journeyTab === 'downloads'
                  ? 'text-violet-600 border-b-2 border-violet-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              PDF Downloads
            </button>
          </div>

          {/* Recent Quizzes Tab */}
          {journeyTab === 'quizzes' && (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {attempts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No quizzes completed yet</p>
                  <Link href="/quiz" className="text-violet-600 font-semibold hover:underline mt-2 inline-block text-sm">
                    Take your first quiz
                  </Link>
                </div>
              ) : (
                (() => {
                  const seenTypes = new Set<string>();
                  const uniqueAttempts = attempts.filter((attempt) => {
                    if (seenTypes.has(attempt.quizType)) return false;
                    seenTypes.add(attempt.quizType);
                    return true;
                  });
                  return uniqueAttempts.slice(0, 5).map((attempt) => {
                    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                    const quizName = formatQuizType(attempt.quizType);
                    return (
                      <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm ${
                            percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}>
                            {percentage}%
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{quizName}</p>
                            <p className="text-xs text-gray-500">
                              {attempt.score}/{attempt.totalQuestions} correct • {new Date(attempt.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          )}

          {/* PDF Downloads Tab */}
          {journeyTab === 'downloads' && (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {/* Download Stats */}
              {pdfStats && (
                <div className={`p-3 rounded-xl border ${pdfStats.downloadsRemaining === 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{pdfStats.isPremium ? '👑' : '📄'}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {pdfStats.downloadsRemaining} of {pdfStats.dailyLimit} downloads remaining today
                        </p>
                        <p className="text-xs text-gray-500">
                          {pdfStats.isPremium ? 'Premium Plan' : 'Free Plan'} • Resets daily
                        </p>
                      </div>
                    </div>
                    {!pdfStats.isPremium && (
                      <Link
                        href="/pricing"
                        className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                      >
                        Upgrade
                      </Link>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pdfStats.downloadsRemaining === 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${(pdfStats.downloadsRemaining / pdfStats.dailyLimit) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Download Error */}
              {downloadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-700">{downloadError}</p>
                    <button
                      onClick={() => setDownloadError(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {attempts.filter(a => a.pdfUrl).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No PDF reports available</p>
                  <p className="text-xs text-gray-400 mt-1">Complete quizzes to generate downloadable reports</p>
                </div>
              ) : (
                attempts.filter(a => a.pdfUrl).slice(0, 10).map((attempt) => {
                  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                  const quizName = formatQuizType(attempt.quizType);
                  const isDownloading = downloadingPdf === attempt.id;
                  const isDisabled = isDownloading || (pdfStats?.downloadsRemaining === 0);
                  return (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{quizName}</p>
                          <p className="text-xs text-gray-500">
                            Score: {percentage}% • {new Date(attempt.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePdfDownload(attempt.id)}
                        disabled={isDisabled}
                        className="px-3 py-1.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Loading...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Getting Started (shown if no classes) */}
      {stats && stats.classCount === 0 && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4 text-3xl">
            🎓
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to QuizNotes!</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get started by joining your first class. Ask your teacher for a class code to begin your music theory journey.
          </p>
          <Link
            href="/student/classes"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold"
          >
            Join a Class
          </Link>
        </div>
      )}
    </div>
  );
}
