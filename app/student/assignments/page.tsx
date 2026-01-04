'use client';

import { useEffect, useState } from 'react';
import AssignmentCard from '@/components/AssignmentCard';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  quiz_type: string | null;
  quiz_id: string | null;
  due_date: string | null;
  max_attempts: number | null;
  class_name: string;
  best_score: number | null;
  attempt_count: number;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      const response = await fetch('/api/student/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === 'active') return assignment.best_score === null;
    if (filter === 'completed') return assignment.best_score !== null;
    return true;
  });

  const activeCount = assignments.filter(a => a.best_score === null).length;
  const completedCount = assignments.filter(a => a.best_score !== null).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-gray-600 mt-2">Complete your assignments and track your progress</p>
      </div>

      {/* Filter Tabs */}
      {assignments.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      )}

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 text-3xl">
            📋
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {filter === 'completed' && assignments.length > 0 ? 'No Completed Assignments' : filter === 'active' && assignments.length > 0 ? 'No Active Assignments' : 'No Assignments Yet'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {filter === 'completed' && assignments.length > 0 ? 'Complete your active assignments to see them here.' : filter === 'active' && assignments.length > 0 ? 'Great job! You\'ve completed all your assignments.' : 'Your teachers will assign quizzes for you to complete. Check back here when assignments are available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              id={assignment.id}
              title={assignment.title}
              description={assignment.description}
              className={assignment.class_name}
              quizType={assignment.quiz_type}
              quizId={assignment.quiz_id}
              dueDate={assignment.due_date}
              maxAttempts={assignment.max_attempts}
              attemptCount={assignment.attempt_count}
              bestScore={assignment.best_score}
              role="student"
            />
          ))}
        </div>
      )}
    </div>
  );
}
