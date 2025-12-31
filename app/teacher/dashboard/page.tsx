'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/StatsCard';
import ProfileCard from '@/components/ProfileCard';

interface DashboardStats {
  classCount: number;
  studentCount: number;
  quizCount: number;
  assignmentCount: number;
}

interface Enrollment {
  enrolled_at: string;
  student_id: string;
  class_id: string;
  classes: { name: string };
  profiles: { name: string; email: string };
}

interface UpcomingAssignment {
  id: string;
  title: string;
  due_date: string;
  classes: { name: string };
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

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<UpcomingAssignment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/teacher/dashboard/stats'),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
          setRecentEnrollments(data.recentActivity.enrollments);
          setUpcomingAssignments(data.recentActivity.upcomingAssignments);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

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
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your classes.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard value={stats?.classCount || 0} label="Classes" icon="🏫" color="blue" />
        <StatsCard value={stats?.studentCount || 0} label="Students" icon="👥" color="green" />
        <StatsCard value={stats?.quizCount || 0} label="Quizzes" icon="📝" color="amber" />
        <StatsCard value={stats?.assignmentCount || 0} label="Assignments" icon="📋" color="purple" />
      </div>

      {/* Profile Card */}
      {user && (
        <ProfileCard
          user={user}
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
            href="/teacher/classes/new"
            className="block p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-violet-500 hover:bg-violet-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-violet-900">Create Class</h3>
                <p className="text-sm text-gray-500">Start a new class</p>
              </div>
            </div>
          </Link>

          <Link
            href="/teacher/quizzes/create"
            className="block p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-900">Create Quiz</h3>
                <p className="text-sm text-gray-500">Build a custom quiz</p>
              </div>
            </div>
          </Link>

          <Link
            href="/teacher/assignments/new"
            className="block p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-amber-500 hover:bg-amber-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-900">Create Assignment</h3>
                <p className="text-sm text-gray-500">Assign work to students</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout for Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Enrollments</h2>
            <Link href="/teacher/classes" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
              View All
            </Link>
          </div>
          {recentEnrollments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent enrollments</p>
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((enrollment, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {enrollment.profiles.name?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{enrollment.profiles.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      Joined {enrollment.classes.name} • {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Due Dates</h2>
            <Link href="/teacher/assignments" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
              View All
            </Link>
          </div>
          {upcomingAssignments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming due dates</p>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map((assignment) => {
                const dueDate = new Date(assignment.due_date);
                const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isDueSoon = daysUntilDue <= 3;

                return (
                  <Link
                    key={assignment.id}
                    href={`/teacher/assignments/${assignment.id}/results`}
                    className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{assignment.title}</p>
                        <p className="text-xs text-gray-500 truncate">{assignment.classes.name}</p>
                      </div>
                      <div className={`text-xs font-medium whitespace-nowrap ${
                        isDueSoon ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {daysUntilDue === 0 ? 'Due today' : daysUntilDue === 1 ? 'Due tomorrow' : `${daysUntilDue} days`}
                      </div>
                    </div>
                  </Link>
                );
              })}
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">Get Started with Your First Class</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first class to start organizing students, assignments, and quizzes all in one place.
          </p>
          <Link
            href="/teacher/classes/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Class
          </Link>
        </div>
      )}
    </div>
  );
}
