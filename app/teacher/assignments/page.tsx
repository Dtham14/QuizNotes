'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AssignmentCard from '@/components/AssignmentCard';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  quiz_type: string;
  due_date: string | null;
  classes: { name: string };
  stats?: {
    total_students: number;
    completed_count: number;
    completion_rate: number;
    average_score: number;
  };
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      const response = await fetch('/api/teacher/assignments');
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

  const handleDeleteAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600 mt-2">Track and manage all assignments across your classes</p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Assignment
        </Link>
      </div>

      {/* Assignments Grid */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 text-3xl">
            📋
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Assignments Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create assignments to give your students quizzes to complete. Track their progress and view detailed results.
          </p>
          <Link
            href="/teacher/assignments/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Assignment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              id={assignment.id}
              title={assignment.title}
              description={assignment.description}
              className={assignment.classes.name}
              quizType={assignment.quiz_type}
              dueDate={assignment.due_date}
              role="teacher"
              completionRate={assignment.stats?.completion_rate}
              averageScore={assignment.stats?.average_score}
              totalStudents={assignment.stats?.total_students}
              completedCount={assignment.stats?.completed_count}
              onDelete={() => handleDeleteAssignment(assignment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
