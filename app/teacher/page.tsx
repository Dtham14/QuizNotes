'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeacherNav from '@/components/TeacherNav';

type Class = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  studentCount: number;
  createdAt: Date;
};

export default function TeacherPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');

  useEffect(() => {
    fetchCurrentUser();
    fetchClasses();
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

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/teacher/classes');
      const data = await res.json();
      if (data.classes) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClassName,
          description: newClassDescription,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewClassName('');
        setNewClassDescription('');
        fetchClasses();
      }
    } catch (error) {
      console.error('Failed to create class:', error);
    }
  };

  const handleDeleteClass = async (e: React.MouseEvent, classId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this class? This will remove all students and assignments.')) {
      return;
    }

    try {
      const res = await fetch('/api/teacher/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });

      if (res.ok) {
        fetchClasses();
      }
    } catch (error) {
      console.error('Failed to delete class:', error);
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Classes</h2>
            <p className="text-gray-600">Manage your classes and view student progress</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Class
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't created any classes yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Your First Class
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer block"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                  <button
                    onClick={(e) => handleDeleteClass(e, cls.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                {cls.description && (
                  <p className="text-gray-600 mb-4">{cls.description}</p>
                )}
                <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Class Code</p>
                  <p className="text-2xl font-bold text-indigo-600 font-mono">{cls.code}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{cls.studentCount} students</span>
                  <span>Created {new Date(cls.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-indigo-600 text-sm font-medium">View student progress →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name
                </label>
                <input
                  id="className"
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                  placeholder="e.g., Music Theory 101"
                />
              </div>
              <div>
                <label htmlFor="classDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="classDescription"
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                  placeholder="Brief description of your class"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewClassName('');
                    setNewClassDescription('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
