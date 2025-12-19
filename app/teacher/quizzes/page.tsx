'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TeacherNav />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">My Custom Quizzes</h2>
            <p className="text-gray-600">Create and manage your custom music theory quizzes</p>
          </div>
          <Link
            href="/teacher/quizzes/create"
            className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
          >
            Create Quiz
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't created any custom quizzes yet</p>
            <Link
              href="/teacher/quizzes/create"
              className="inline-block px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
            >
              Create Your First Quiz
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              // Handle both string and object formats for questions
              const questions = typeof quiz.questions === 'string'
                ? JSON.parse(quiz.questions)
                : quiz.questions;
              const questionCount = Array.isArray(questions) ? questions.length : 0;
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
                  <div className="bg-brand/10 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Questions</p>
                    <p className="text-2xl font-bold text-brand">{questionCount}</p>
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

      {/* Footer */}
      <footer className="bg-gray-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/quiznotes logo.jpg"
                alt="QuizNotes Logo"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="text-sm font-semibold text-white">QuizNotes</span>
            </div>
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} QuizNotes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
