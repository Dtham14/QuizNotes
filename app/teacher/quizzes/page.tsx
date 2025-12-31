'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QuizCard from '@/components/QuizCard';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: any[];
  created_at: string;
}

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      const response = await fetch('/api/teacher/quizzes');
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes(quizzes.filter(q => q.id !== quizId));
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
          <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
          <p className="text-gray-600 mt-2">Create and manage custom quizzes for your students</p>
        </div>
        <Link
          href="/teacher/quizzes/create"
          className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Quiz
        </Link>
      </div>

      {/* Quizzes Grid */}
      {quizzes.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 text-3xl">
            📝
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Custom Quizzes Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create custom quizzes tailored to your curriculum. You can use built-in quiz types or build your own from scratch.
          </p>
          <Link
            href="/teacher/quizzes/create"
            className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              id={quiz.id}
              title={quiz.title}
              description={quiz.description}
              questionCount={quiz.questions?.length || 0}
              createdAt={quiz.created_at}
              onDelete={() => handleDeleteQuiz(quiz.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
