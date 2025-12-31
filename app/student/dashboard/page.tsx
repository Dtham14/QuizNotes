'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/StatsCard';
import DiscussionPreview from '@/components/DiscussionPreview';
import ClassCard from '@/components/ClassCard';

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

export default function StudentDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentClasses, setRecentClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, classesRes] = await Promise.all([
          fetch('/api/student/dashboard/stats'),
          fetch('/api/student/enroll'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }

        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setRecentClasses((classesData.classes || []).slice(0, 3));
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
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your progress and stay on top of your assignments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard value={stats?.level || 1} label="Level" icon="⭐" color="violet" />
        <StatsCard value={stats?.xp || 0} label="Total XP" icon="🎯" color="emerald" />
        <StatsCard value={stats?.classCount || 0} label="My Classes" icon="🏫" color="blue" />
        <StatsCard value={`${stats?.completedAssignments || 0}/${stats?.totalAssignments || 0}`} label="Assignments" icon="📋" color="amber" />
      </div>

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
