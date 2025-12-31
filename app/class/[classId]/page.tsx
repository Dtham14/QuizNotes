'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StudentNav from '@/components/StudentNav';
import ClassDiscussion from '@/app/teacher/classes/[classId]/ClassDiscussion';

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  quizType: string | null;
  dueDate: Date | null;
  maxAttempts: number | null;
  attemptsUsed: number;
  bestScore: number | null;
};

type ClassData = {
  id: string;
  name: string;
  description: string | null;
  teacherName: string | null;
};

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
};

export default function StudentClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'discussion'>('assignments');
  const [gamificationStats, setGamificationStats] = useState<{ level: number; xp: number } | null>(null);

  useEffect(() => {
    fetchUser();
    fetchClassData();
  }, [classId]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        // Fetch gamification stats for nav
        const statsRes = await fetch('/api/gamification/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setGamificationStats({
            level: statsData.stats.currentLevel,
            xp: statsData.stats.totalXp,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchClassData = async () => {
    try {
      // We'll need to create this API endpoint for students
      const res = await fetch(`/api/student/classes/${classId}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          router.push('/login');
          return;
        }
        setError(data.error || 'Failed to fetch class data');
        return;
      }

      setClassData(data.class);
      setAssignments(data.assignments || []);
    } catch (err) {
      setError('Failed to fetch class data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNav user={user} level={gamificationStats?.level} xp={gamificationStats?.xp} />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Class not found'}</p>
            <Link href="/profile" className="text-brand hover:text-brand-dark">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav user={user} level={gamificationStats?.level} xp={gamificationStats?.xp} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/student/classes" className="text-violet-600 hover:text-violet-700 text-sm mb-2 inline-block">
            &larr; Back to My Classes
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{classData.name}</h1>
              {classData.description && (
                <p className="text-gray-600">{classData.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Teacher: {classData.teacherName || 'Unknown'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">My Class</p>
              <p className="text-2xl font-bold">🎵</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Active Assignments</p>
            <p className="text-3xl font-bold text-gray-900">
              {assignments.filter(a => a.attemptsUsed < (a.maxAttempts || Infinity)).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Completed Assignments</p>
            <p className="text-3xl font-bold text-gray-900">
              {assignments.filter(a => a.bestScore !== null).length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'assignments'
                    ? 'border-b-2 border-brand text-brand'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Assignments ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab('discussion')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'discussion'
                    ? 'border-b-2 border-brand text-brand'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Discussion 💬
              </button>
            </nav>
          </div>

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="p-6">
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No assignments yet</p>
                  <p className="text-sm text-gray-400">
                    Your teacher hasn't posted any assignments for this class.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const isComplete = assignment.attemptsUsed >= (assignment.maxAttempts || Infinity);
                    const hasScore = assignment.bestScore !== null;

                    return (
                      <div
                        key={assignment.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-brand/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                            {assignment.description && (
                              <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              {assignment.dueDate && (
                                <span className="text-gray-500">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {assignment.maxAttempts && (
                                <span className="text-gray-500">
                                  Attempts: {assignment.attemptsUsed}/{assignment.maxAttempts}
                                </span>
                              )}
                              {hasScore && (
                                <span
                                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                                    assignment.bestScore! >= 80
                                      ? 'bg-green-100 text-green-800'
                                      : assignment.bestScore! >= 60
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  Best: {assignment.bestScore}%
                                </span>
                              )}
                            </div>
                          </div>
                          {!isComplete && (
                            <Link
                              href={`/quiz?assignmentId=${assignment.id}`}
                              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-medium whitespace-nowrap ml-4"
                            >
                              {hasScore ? 'Retry' : 'Start'}
                            </Link>
                          )}
                          {isComplete && (
                            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium whitespace-nowrap ml-4">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Discussion Tab */}
          {activeTab === 'discussion' && (
            <div className="p-6">
              <ClassDiscussion
                classId={classId}
                currentUserRole="student"
                currentUserName={user?.name || user?.email || 'Student'}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
