'use client';

import Link from 'next/link';
import { useState } from 'react';

interface AssignmentCardProps {
  id: string;
  title: string;
  description?: string | null;
  className?: string;
  quizType?: string | null;
  quizId?: string | null;
  dueDate?: string | null;
  role: 'teacher' | 'student';
  // Teacher-specific props
  completionRate?: number;
  averageScore?: number;
  totalStudents?: number;
  completedCount?: number;
  // Student-specific props
  maxAttempts?: number | null;
  attemptCount?: number;
  bestScore?: number | null;
  totalQuestions?: number | null;
  attemptsRemaining?: number;
  completed?: boolean;
  onDelete?: () => void;
}

export default function AssignmentCard({
  id,
  title,
  description,
  className,
  quizType,
  quizId,
  dueDate,
  role,
  completionRate,
  averageScore,
  totalStudents,
  completedCount,
  maxAttempts,
  attemptCount = 0,
  bestScore,
  totalQuestions,
  attemptsRemaining = 0,
  completed = false,
  onDelete,
}: AssignmentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/teacher/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: id }),
      });

      if (response.ok) {
        onDelete?.();
      } else {
        alert('Failed to delete assignment');
        setIsDeleting(false);
      }
    } catch (error) {
      alert('Error deleting assignment');
      setIsDeleting(false);
    }
  };

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const isDueSoon = dueDate && new Date(dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const isOverdue = dueDate && new Date(dueDate) < new Date();

  const canAttempt = attemptsRemaining > 0;
  const isReviewMode = completed && attemptsRemaining === 0;

  // Calculate percentage score
  const bestScorePercentage = bestScore !== null && bestScore !== undefined && totalQuestions
    ? Math.round((bestScore / totalQuestions) * 100)
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all group">
      {/* Assignment Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-2xl">
          📋
        </div>
        {role === 'teacher' && onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-600 disabled:opacity-50"
            title="Delete assignment"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Assignment Info */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {className && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-medium">
              {className}
            </span>
          )}
          {quizType && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
              {quizType}
            </span>
          )}
        </div>
      </div>

      {/* Due Date */}
      {formattedDueDate && (
        <div className={`mb-4 flex items-center gap-2 text-sm ${
          isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : 'text-gray-600'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">
            {isOverdue ? 'Overdue' : 'Due'} {formattedDueDate}
          </span>
        </div>
      )}

      {/* Teacher View: Stats */}
      {role === 'teacher' && (
        <div className="space-y-2">
          {completionRate !== undefined && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Completion</span>
                <span className="font-semibold text-gray-900">{completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {completedCount} of {totalStudents} students completed
              </p>
            </div>
          )}
          {averageScore !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Average Score</span>
              <span className="font-semibold text-gray-900">{averageScore}%</span>
            </div>
          )}
          <Link
            href={`/teacher/assignments/${id}/results`}
            className="block mt-4 w-full text-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-semibold"
          >
            View Results
          </Link>
        </div>
      )}

      {/* Student View: Progress and Action */}
      {role === 'student' && (
        <div className="space-y-3">
          {bestScorePercentage !== null ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Best Score</span>
              <span className={`font-bold ${
                bestScorePercentage >= 80 ? 'text-green-600' : bestScorePercentage >= 60 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {bestScorePercentage}%
              </span>
            </div>
          ) : null}
          {maxAttempts && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Attempts</span>
              <span>{attemptCount} / {maxAttempts}</span>
            </div>
          )}
          <Link
            href={`/quiz?assignmentId=${id}${quizId ? `&quizId=${quizId}` : quizType ? `&type=${quizType}` : ''}${isReviewMode ? '&review=true' : ''}`}
            className={`block w-full text-center px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
              canAttempt || isReviewMode
                ? isReviewMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'
            }`}
          >
            {isReviewMode ? 'Review Assignment' : bestScorePercentage !== null ? 'Retry' : 'Start'} {isReviewMode ? '' : 'Assignment'}
          </Link>
          {!canAttempt && !isReviewMode && (
            <p className="text-xs text-red-600 text-center">Maximum attempts reached</p>
          )}
        </div>
      )}
    </div>
  );
}
