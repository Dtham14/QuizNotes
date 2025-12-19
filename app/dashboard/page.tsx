'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type QuizAttempt = {
  id: string;
  quizType: string;
  score: number;
  totalQuestions: number;
  createdAt: Date;
};

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
};

type EnrolledClass = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  teacherName: string | null;
  createdAt: Date;
};

type StudentAssignment = {
  id: string;
  classId: string;
  className: string;
  quizId: string | null;
  quizType: string | null;
  title: string;
  description: string | null;
  dueDate: Date | null;
  createdAt: Date;
  completed: boolean;
  score: number | null;
  totalQuestions: number | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<EnrolledClass[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignment[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        const attemptsRes = await fetch('/api/quiz/attempts');
        if (attemptsRes.ok) {
          const attemptsData = await attemptsRes.json();
          setAttempts(attemptsData.attempts);
        }

        if (userData.user.role === 'student') {
          const classesRes = await fetch('/api/student/enroll');
          if (classesRes.ok) {
            const classesData = await classesRes.json();
            setClasses(classesData.classes || []);
          }

          const assignmentsRes = await fetch('/api/student/assignments');
          if (assignmentsRes.ok) {
            const assignmentsData = await assignmentsRes.json();
            setStudentAssignments(assignmentsData.assignments || []);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEnrollInClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: classCode }),
      });

      if (res.ok) {
        setShowEnrollModal(false);
        setClassCode('');
        // Refresh classes
        const classesRes = await fetch('/api/student/enroll');
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClasses(classesData.classes || []);
        }
        // Refresh assignments (new class may have assignments)
        const assignmentsRes = await fetch('/api/student/assignments');
        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json();
          setStudentAssignments(assignmentsData.assignments || []);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to enroll in class');
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
      alert('Failed to enroll in class');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalQuizzes = attempts.length;
  const averageScore =
    totalQuizzes > 0
      ? Math.round(
          attempts.reduce((acc, attempt) => acc + (attempt.score / attempt.totalQuestions) * 100, 0) /
            totalQuizzes
        )
      : 0;

  const quizTypeStats = attempts.reduce((acc, attempt) => {
    if (!acc[attempt.quizType]) {
      acc[attempt.quizType] = { count: 0, totalScore: 0, totalQuestions: 0 };
    }
    acc[attempt.quizType].count++;
    acc[attempt.quizType].totalScore += attempt.score;
    acc[attempt.quizType].totalQuestions += attempt.totalQuestions;
    return acc;
  }, {} as Record<string, { count: number; totalScore: number; totalQuestions: number }>);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <Link href="/quiz" className="text-gray-700 hover:text-gray-900 text-sm font-semibold">
                  Quizzes
                </Link>
                <span className="text-gray-700 text-sm font-semibold">
                  Welcome, {user.name || user.email}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-semibold"
                >
                  Admin Panel
                </Link>
              )}
              {user.role === 'teacher' && (
                <Link
                  href="/teacher"
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-semibold"
                >
                  Teacher Portal
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Dashboard</h2>
          <p className="text-gray-600">
            {user.role === 'admin' && 'Manage users and oversee the platform'}
            {user.role === 'teacher' && 'Manage your classes, quizzes, and assignments'}
            {user.role === 'student' && 'Track your progress and review your quiz history'}
          </p>
        </div>

        {user.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome, Admin!</h3>
            <p className="text-gray-600 mb-6">
              Use the Admin Panel to manage users, assign roles, and oversee all platform activity.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/admin"
                className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
              >
                Go to Admin Panel
              </Link>
            </div>
          </div>
        )}

        {user.role === 'teacher' && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Teacher Quick Links</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                href="/teacher"
                className="p-6 bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors"
              >
                <h4 className="font-bold text-brand mb-2">My Classes</h4>
                <p className="text-sm text-brand/80">Manage your classes and view enrolled students</p>
              </Link>
              <Link
                href="/teacher/quizzes"
                className="p-6 bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors"
              >
                <h4 className="font-bold text-brand mb-2">My Quizzes</h4>
                <p className="text-sm text-brand/80">Create and manage custom quizzes</p>
              </Link>
              <Link
                href="/teacher/assignments"
                className="p-6 bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors"
              >
                <h4 className="font-bold text-brand mb-2">Assignments</h4>
                <p className="text-sm text-brand/80">Assign quizzes to your classes</p>
              </Link>
            </div>
          </div>
        )}

        {user.role === 'student' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">My Classes</h3>
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-semibold"
                >
                  Join Class
                </button>
              </div>

              {classes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You haven't joined any classes yet</p>
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                  >
                    Join Your First Class
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((cls) => (
                    <div key={cls.id} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">{cls.name}</h4>
                      {cls.description && (
                        <p className="text-sm text-gray-600 mb-3">{cls.description}</p>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Teacher: {cls.teacherName || 'Unknown'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {studentAssignments.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Assignments</h3>
                <div className="space-y-4">
                  {studentAssignments.map((assignment) => {
                    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
                    const percentage = assignment.score !== null && assignment.totalQuestions !== null
                      ? Math.round((assignment.score / assignment.totalQuestions) * 100)
                      : null;
                    return (
                      <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-gray-900">{assignment.title}</h4>
                            <p className="text-sm text-gray-600">{assignment.className}</p>
                          </div>
                          <div className="flex gap-2">
                            {assignment.completed && (
                              <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-700">
                                Completed
                              </span>
                            )}
                            {!assignment.completed && assignment.dueDate && (
                              <span
                                className={`text-sm px-2 py-1 rounded ${
                                  isOverdue
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-brand/20 text-brand'
                                }`}
                              >
                                {isOverdue ? 'Overdue' : `Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
                              </span>
                            )}
                          </div>
                        </div>
                        {assignment.description && (
                          <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                        )}
                        {assignment.completed ? (
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              percentage !== null && percentage >= 70
                                ? 'bg-green-100 text-green-700'
                                : percentage !== null && percentage >= 50
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              Score: {assignment.score}/{assignment.totalQuestions} ({percentage}%)
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={
                              assignment.quizId
                                ? `/quiz/${assignment.quizId}?assignmentId=${assignment.id}`
                                : assignment.quizType
                                ? `/quiz?type=${assignment.quizType}&assignmentId=${assignment.id}`
                                : '/quiz'
                            }
                            className="inline-block px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-semibold"
                          >
                            Start Quiz
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Quizzes</p>
                    <p className="text-3xl font-bold text-gray-900">{totalQuizzes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-3xl font-bold text-gray-900">{averageScore}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Topics Studied</p>
                    <p className="text-3xl font-bold text-gray-900">{Object.keys(quizTypeStats).length}</p>
                  </div>
                </div>
              </div>
            </div>

            {Object.keys(quizTypeStats).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Performance by Topic</h3>
                <div className="space-y-4">
                  {Object.entries(quizTypeStats).map(([type, stats]) => {
                    const percentage = Math.round((stats.totalScore / stats.totalQuestions) * 100);
                    return (
                      <div key={type}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-700 capitalize">{type}</span>
                          <span className="text-sm text-gray-600">
                            {stats.count} {stats.count === 1 ? 'quiz' : 'quizzes'} • {percentage}% average
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-brand h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Recent Quiz Attempts</h3>
                <Link
                  href="/quiz"
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-semibold"
                >
                  Take New Quiz
                </Link>
              </div>

              {attempts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">You haven't taken any quizzes yet</p>
                  <Link
                    href="/quiz"
                    className="inline-block px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
                  >
                    Start Your First Quiz
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Topic</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Percentage</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((attempt) => {
                        const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                        return (
                          <tr key={attempt.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 capitalize text-gray-900">{attempt.quizType}</td>
                            <td className="py-3 px-4 text-gray-900">
                              {attempt.score}/{attempt.totalQuestions}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-sm font-semibold ${
                                  percentage >= 70
                                    ? 'bg-green-100 text-green-700'
                                    : percentage >= 50
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {new Date(attempt.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Join a Class</h3>
            <form onSubmit={handleEnrollInClass} className="space-y-4">
              <div>
                <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Class Code
                </label>
                <input
                  id="classCode"
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900 uppercase"
                  placeholder="Enter 6-character code"
                  maxLength={6}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEnrollModal(false);
                    setClassCode('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
                >
                  Join Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/quiznotes logo.jpg"
                alt="QuizNotes Logo"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="text-sm font-semibold text-white">QuizNotes</span>
            </div>
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} QuizNotes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
