'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
};

type AnonymousAttempt = {
  id: string;
  sessionId: string;
  quizType: string;
  score: number;
  totalQuestions: number;
  createdAt: string;
};

type Analytics = {
  anonymous: {
    totalAttempts: number;
    uniqueSessions: number;
    byQuizType: Record<string, { count: number; totalScore: number; totalQuestions: number }>;
    recentAttempts: AnonymousAttempt[];
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
  registered: {
    totalAttempts: number;
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
  comparison: {
    anonymousPercentage: number;
  };
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'analytics'>('analytics');

  useEffect(() => {
    async function initializePage() {
      try {
        // First, verify user is authenticated and is admin
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();

        if (!userData.user || userData.user.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setCurrentUser(userData.user);

        // Now fetch admin data in parallel
        const [usersRes, analyticsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/analytics'),
        ]);

        const usersData = await usersRes.json();
        if (usersData.users) {
          setUsers(usersData.users);
        }

        const analyticsData = await analyticsRes.json();
        if (analyticsRes.ok) {
          setAnalytics(analyticsData);
        } else if (analyticsRes.status === 401 || analyticsRes.status === 403) {
          // Session expired or user lost admin access - redirect silently
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Failed to initialize admin page:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    initializePage();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

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
                <span className="text-gray-700 text-sm font-semibold">Admin Panel</span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-1 font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'text-brand border-b-2 border-brand'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Quiz Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 font-semibold transition-colors ${
              activeTab === 'users'
                ? 'text-brand border-b-2 border-brand'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            User Management
          </button>
        </div>

        {activeTab === 'analytics' && (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Analytics</h2>
              <p className="text-gray-600">Track anonymous and registered user quiz activity</p>
            </div>

            {/* Overview Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Anonymous Attempts</h3>
                </div>
                <p className="text-3xl font-bold text-brand">{analytics?.anonymous.totalAttempts || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics?.anonymous.uniqueSessions || 0} unique sessions
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Registered Attempts</h3>
                </div>
                <p className="text-3xl font-bold text-green-600">{analytics?.registered.totalAttempts || 0}</p>
                <p className="text-sm text-gray-500 mt-1">from {users.length} users</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Last 24 Hours</h3>
                </div>
                <p className="text-3xl font-bold text-brand">
                  {(analytics?.anonymous.last24Hours || 0) + (analytics?.registered.last24Hours || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analytics?.anonymous.last24Hours || 0} anonymous / {analytics?.registered.last24Hours || 0} registered
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500">Anonymous Rate</h3>
                </div>
                <p className="text-3xl font-bold text-orange-600">{analytics?.comparison.anonymousPercentage || 0}%</p>
                <p className="text-sm text-gray-500 mt-1">of all quiz attempts</p>
              </div>
            </div>

            {/* Anonymous Usage Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-brand rounded-full"></span>
                Anonymous Usage Breakdown
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* By Time Period */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">By Time Period</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Last 24 Hours</span>
                      <span className="font-bold text-brand">{analytics?.anonymous.last24Hours || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Last 7 Days</span>
                      <span className="font-bold text-brand">{analytics?.anonymous.last7Days || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Last 30 Days</span>
                      <span className="font-bold text-brand">{analytics?.anonymous.last30Days || 0}</span>
                    </div>
                  </div>
                </div>

                {/* By Quiz Type */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">By Quiz Type</h4>
                  <div className="space-y-3">
                    {analytics?.anonymous.byQuizType && Object.entries(analytics.anonymous.byQuizType).length > 0 ? (
                      Object.entries(analytics.anonymous.byQuizType).map(([type, stats]) => {
                        const avgScore = stats.totalQuestions > 0
                          ? Math.round((stats.totalScore / stats.totalQuestions) * 100)
                          : 0;
                        return (
                          <div key={type} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-700 capitalize">{type}</span>
                              <span className="font-bold text-brand">{stats.count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-brand h-1.5 rounded-full"
                                style={{ width: `${avgScore}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Avg: {avgScore}%</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-4">No anonymous attempts yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Anonymous Attempts */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand rounded-full"></span>
                  Recent Anonymous Attempts
                </h3>
              </div>

              {analytics?.anonymous.recentAttempts && analytics.anonymous.recentAttempts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-6 font-semibold text-gray-700">Session</th>
                        <th className="text-left py-3 px-6 font-semibold text-gray-700">Quiz Type</th>
                        <th className="text-left py-3 px-6 font-semibold text-gray-700">Score</th>
                        <th className="text-left py-3 px-6 font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.anonymous.recentAttempts.map((attempt) => {
                        const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                        return (
                          <tr key={attempt.id} className="border-t hover:bg-gray-50">
                            <td className="py-3 px-6 text-gray-900 font-mono text-sm">
                              {attempt.sessionId.slice(0, 12)}...
                            </td>
                            <td className="py-3 px-6 text-gray-900 capitalize">{attempt.quizType}</td>
                            <td className="py-3 px-6">
                              <span
                                className={`px-2 py-1 rounded-full text-sm font-semibold ${
                                  percentage >= 70
                                    ? 'bg-green-100 text-green-700'
                                    : percentage >= 50
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {attempt.score}/{attempt.totalQuestions} ({percentage}%)
                              </span>
                            </td>
                            <td className="py-3 px-6 text-gray-900">
                              {new Date(attempt.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No anonymous quiz attempts yet. Users can try quizzes from the landing page without creating an account.
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">User Management</h2>
              <p className="text-gray-600">Manage user accounts and roles</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Role</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Joined</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t hover:bg-gray-50">
                        <td className="py-4 px-6 text-gray-900">{user.email}</td>
                        <td className="py-4 px-6 text-gray-900">{user.name || '-'}</td>
                        <td className="py-4 px-6">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-gray-900 text-sm"
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
                <p className="text-4xl font-bold text-brand">{users.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Teachers</h3>
                <p className="text-4xl font-bold text-brand">
                  {users.filter((u) => u.role === 'teacher').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Students</h3>
                <p className="text-4xl font-bold text-brand">
                  {users.filter((u) => u.role === 'student').length}
                </p>
              </div>
            </div>
          </>
        )}
      </main>

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
