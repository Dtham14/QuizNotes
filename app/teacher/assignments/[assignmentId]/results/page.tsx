'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeacherNav from '@/components/TeacherNav';

type StudentResult = {
  studentId: string;
  studentName: string | null;
  studentEmail: string;
  completed: boolean;
  attemptCount: number;
  bestScore: number | null;
  totalQuestions: number | null;
  bestPercentage: number | null;
  lastAttemptAt: Date | null;
};

type Assignment = {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string | null;
  quizType: string | null;
  dueDate: Date | null;
  createdAt: Date | null;
};

type Stats = {
  totalStudents: number;
  completedCount: number;
  completionRate: number;
  averageScore: number | null;
};

export default function AssignmentResultsPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchResults();
  }, [assignmentId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/teacher/assignments/${assignmentId}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          router.push('/dashboard');
          return;
        }
        setError(data.error || 'Failed to fetch results');
        return;
      }

      setAssignment(data.assignment);
      setResults(data.results);
      setStats(data.stats);
    } catch (err) {
      setError('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.studentName || '').localeCompare(b.studentName || '');
        break;
      case 'score':
        comparison = (a.bestPercentage || 0) - (b.bestPercentage || 0);
        break;
      case 'status':
        comparison = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'name' | 'score' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-white">
        <TeacherNav />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Assignment not found'}</p>
            <Link href="/teacher/assignments" className="text-brand hover:text-brand-dark">
              Back to Assignments
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
          <Link
            href={`/teacher/classes/${assignment.classId}`}
            className="text-brand hover:text-brand-dark text-sm mb-2 inline-block"
          >
            &larr; Back to {assignment.className}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-gray-600 mb-2">{assignment.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Class: {assignment.className}</span>
            {assignment.quizType && <span>Quiz Type: {assignment.quizType}</span>}
            {assignment.dueDate && (
              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completionRate}%</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-brand">
                {stats.averageScore !== null ? `${stats.averageScore}%` : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Student Results</h2>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No students enrolled in this class</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="text-left py-3 px-6 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      Student {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-center py-3 px-6 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-center py-3 px-6 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('score')}
                    >
                      Best Score {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">
                      Attempts
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                      Last Attempt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((student) => (
                    <tr
                      key={student.studentId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">
                          {student.studentName || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">{student.studentEmail}</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {student.completed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                            Not Started
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {student.bestPercentage !== null ? (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              student.bestPercentage >= 80
                                ? 'bg-green-100 text-green-800'
                                : student.bestPercentage >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {student.bestScore}/{student.totalQuestions} ({student.bestPercentage}%)
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-600">
                        {student.attemptCount}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {student.lastAttemptAt
                          ? new Date(student.lastAttemptAt).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
