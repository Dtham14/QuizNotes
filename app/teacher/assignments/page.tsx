'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeacherNav from '@/components/TeacherNav';

type Assignment = {
  id: string;
  classId: string;
  className: string;
  quizId: string | null;
  quizType: string | null;
  title: string;
  description: string | null;
  dueDate: Date | null;
  createdAt: Date;
};

type Class = {
  id: string;
  name: string;
};

type CustomQuiz = {
  id: string;
  title: string;
};

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [quizzes, setQuizzes] = useState<CustomQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    classId: '',
    quizId: '',
    quizType: '',
    title: '',
    description: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchAssignments();
    fetchClasses();
    fetchQuizzes();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user && data.user.role === 'teacher') {
        setCurrentUser(data.user);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      router.push('/dashboard');
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/teacher/assignments');
      const data = await res.json();
      if (data.assignments) {
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/teacher/classes');
      const data = await res.json();
      if (data.classes) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/teacher/quizzes');
      const data = await res.json();
      if (data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAssignment.classId || !newAssignment.title) {
      alert('Please fill in all required fields');
      return;
    }

    if (!newAssignment.quizId && !newAssignment.quizType) {
      alert('Please select either a custom quiz or a quiz type');
      return;
    }

    try {
      const res = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: newAssignment.classId,
          quizId: newAssignment.quizId || null,
          quizType: newAssignment.quizType || null,
          title: newAssignment.title,
          description: newAssignment.description,
          dueDate: newAssignment.dueDate || null,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewAssignment({
          classId: '',
          quizId: '',
          quizType: '',
          title: '',
          description: '',
          dueDate: '',
        });
        fetchAssignments();
      } else {
        alert('Failed to create assignment');
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const res = await fetch('/api/teacher/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      });

      if (res.ok) {
        fetchAssignments();
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <TeacherNav />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Assignments</h2>
            <p className="text-gray-600">Assign quizzes to your classes</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Assignment
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't created any assignments yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Your First Assignment
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{assignment.title}</h3>
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                {assignment.description && (
                  <p className="text-gray-600 mb-4">{assignment.description}</p>
                )}
                <div className="space-y-2 mb-4">
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">Class</p>
                    <p className="font-semibold text-indigo-600">{assignment.className}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">Quiz Type</p>
                    <p className="font-semibold text-gray-900">
                      {assignment.quizType ? assignment.quizType.replace('-', ' ').toUpperCase() : 'Custom Quiz'}
                    </p>
                  </div>
                </div>
                {assignment.dueDate && (
                  <div className="text-sm text-gray-600">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                  placeholder="e.g., Week 3 Intervals Quiz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={newAssignment.classId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, classId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Type
                </label>
                <select
                  value={newAssignment.quizType}
                  onChange={(e) => {
                    setNewAssignment({ ...newAssignment, quizType: e.target.value, quizId: '' });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                >
                  <option value="">Built-in Quiz Types</option>
                  <option value="interval-quiz">Interval Quiz</option>
                  <option value="note-identification">Note Identification</option>
                  <option value="mixed-quiz">Mixed Quiz</option>
                </select>
              </div>

              <div className="text-center text-sm text-gray-500">OR</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Quiz
                </label>
                <select
                  value={newAssignment.quizId}
                  onChange={(e) => {
                    setNewAssignment({ ...newAssignment, quizId: e.target.value, quizType: '' });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                >
                  <option value="">Select a custom quiz</option>
                  {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                  placeholder="Additional instructions for students"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAssignment({
                      classId: '',
                      quizId: '',
                      quizType: '',
                      title: '',
                      description: '',
                      dueDate: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
