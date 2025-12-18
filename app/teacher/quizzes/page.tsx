'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeacherNav from '@/components/TeacherNav';

type CustomQuiz = {
  id: string;
  teacherId: string;
  title: string;
  description: string | null;
  questions: string;
  createdAt: Date;
};

export default function TeacherQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<CustomQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    fetchCurrentUser();
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

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/teacher/quizzes');
      const data = await res.json();
      if (data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This will affect all assignments using it.')) {
      return;
    }

    try {
      const res = await fetch('/api/teacher/quizzes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      });

      if (res.ok) {
        fetchQuizzes();
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error);
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Custom Quizzes</h2>
            <p className="text-gray-600">Create and manage your custom music theory quizzes</p>
          </div>
          <Link
            href="/teacher/quizzes/create"
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Quiz
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't created any custom quizzes yet</p>
            <Link
              href="/teacher/quizzes/create"
              className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Your First Quiz
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const questionCount = JSON.parse(quiz.questions).length;
              return (
                <div key={quiz.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  {quiz.description && (
                    <p className="text-gray-600 mb-4">{quiz.description}</p>
                  )}
                  <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Questions</p>
                    <p className="text-2xl font-bold text-indigo-600">{questionCount}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
