'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeacherNav from '@/components/TeacherNav';

type Student = {
  id: string;
  name: string | null;
  email: string;
  enrolledAt: Date | null;
  totalAttempts: number;
  averageScore: number | null;
  recentAttempts: {
    id: string;
    quizType: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    assignmentId: string | null;
    createdAt: Date | null;
  }[];
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  quizType: string | null;
  dueDate: Date | null;
  createdAt: Date | null;
};

type ClassData = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  createdAt: Date | null;
};

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const router = useRouter();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('students');

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const res = await fetch(`/api/teacher/classes/${classId}`);
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
      setStudents(data.students);
      setAssignments(data.assignments);
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
      <div className="min-h-screen bg-white">
        <TeacherNav />
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
    <div className="min-h-screen bg-white">
      <TeacherNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/profile" className="text-brand hover:text-brand-dark text-sm mb-2 inline-block">
            &larr; Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{classData.name}</h1>
              {classData.description && (
                <p className="text-gray-600">{classData.description}</p>
              )}
            </div>
            <div className="bg-brand/10 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Class Code</p>
              <p className="text-2xl font-bold text-brand font-mono">{classData.code}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Assignments</p>
            <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Class Average</p>
            <p className="text-3xl font-bold text-gray-900">
              {students.length > 0
                ? `${Math.round(
                    students
                      .filter((s) => s.averageScore !== null)
                      .reduce((sum, s) => sum + (s.averageScore || 0), 0) /
                      (students.filter((s) => s.averageScore !== null).length || 1)
                  )}%`
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'students'
                    ? 'border-b-2 border-brand text-brand'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Students ({students.length})
              </button>
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
            </nav>
          </div>

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="p-6">
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No students enrolled yet</p>
                  <p className="text-sm text-gray-400">
                    Share the class code <span className="font-mono font-bold">{classData.code}</span> with your students
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Student</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Quiz Attempts</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Average Score</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Recent Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900">{student.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-gray-900">{student.totalAttempts}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {student.averageScore !== null ? (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                  student.averageScore >= 80
                                    ? 'bg-green-100 text-green-800'
                                    : student.averageScore >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {student.averageScore}%
                              </span>
                            ) : (
                              <span className="text-gray-400">No attempts</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {student.recentAttempts.length > 0 ? (
                              <div className="space-y-1">
                                {student.recentAttempts.slice(0, 2).map((attempt) => (
                                  <div key={attempt.id} className="text-sm">
                                    <span className="text-gray-600">{attempt.quizType}</span>
                                    <span className="mx-2 text-gray-400">-</span>
                                    <span
                                      className={
                                        attempt.percentage >= 80
                                          ? 'text-green-600'
                                          : attempt.percentage >= 60
                                          ? 'text-yellow-600'
                                          : 'text-red-600'
                                      }
                                    >
                                      {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No activity</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="p-6">
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No assignments created yet</p>
                  <Link
                    href="/profile"
                    className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
                  >
                    Create Assignment
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-brand/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                          {assignment.description && (
                            <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            {assignment.quizType && (
                              <span>Quiz: {assignment.quizType}</span>
                            )}
                            {assignment.dueDate && (
                              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/teacher/assignments/${assignment.id}/results`}
                          className="px-4 py-2 bg-brand/20 text-brand rounded-lg hover:bg-brand/30 transition-colors text-sm font-medium"
                        >
                          View Results
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
