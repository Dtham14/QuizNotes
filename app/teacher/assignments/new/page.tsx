'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Class {
  id: string;
  name: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: any[];
}

const BUILT_IN_QUIZ_TYPES = [
  { id: 'note-identification', name: 'Note Identification' },
  { id: 'interval-quiz', name: 'Interval Quiz' },
  { id: 'chord-identification', name: 'Chord Identification' },
  { id: 'scale-quiz', name: 'Scale Quiz' },
  { id: 'key-signature-quiz', name: 'Key Signature Quiz' },
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [customQuizzes, setCustomQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedClass, setSelectedClass] = useState('');
  const [quizSource, setQuizSource] = useState<'built-in' | 'custom'>('built-in');
  const [selectedQuizType, setSelectedQuizType] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [classesRes, quizzesRes] = await Promise.all([
        fetch('/api/teacher/classes'),
        fetch('/api/teacher/quizzes'),
      ]);

      if (classesRes.ok && quizzesRes.ok) {
        const classesData = await classesRes.json();
        const quizzesData = await quizzesRes.json();
        setClasses(classesData.classes || []);
        setCustomQuizzes(quizzesData.quizzes || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          quizType: quizSource === 'built-in' ? selectedQuizType : undefined,
          quizId: quizSource === 'custom' ? selectedQuizId : undefined,
          title,
          description: description || undefined,
          dueDate: dueDate || undefined,
          maxAttempts: maxAttempts ? parseInt(maxAttempts) : undefined,
        }),
      });

      if (response.ok) {
        router.push('/teacher/assignments');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create assignment');
        setIsSubmitting(false);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-3xl">
            🏫
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Classes Available</h3>
          <p className="text-gray-600 mb-6">
            You need to create a class before you can create assignments.
          </p>
          <Link
            href="/teacher/classes/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold"
          >
            Create Your First Class
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/teacher/assignments" className="hover:text-violet-600">
          Assignments
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">Create New Assignment</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Assignment</h1>
        <p className="text-gray-600 mt-2">Assign a quiz to your students</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        {/* Step 1: Select Class */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Step 1: Select Class <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900"
          >
            <option value="">Choose a class...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Select Quiz */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Step 2: Select Quiz <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setQuizSource('built-in')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                quizSource === 'built-in'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Built-in Quizzes
            </button>
            <button
              type="button"
              onClick={() => setQuizSource('custom')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                quizSource === 'custom'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Custom Quizzes
            </button>
          </div>

          {quizSource === 'built-in' ? (
            <select
              value={selectedQuizType}
              onChange={(e) => setSelectedQuizType(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900"
            >
              <option value="">Choose a quiz type...</option>
              {BUILT_IN_QUIZ_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          ) : (
            <>
              {customQuizzes.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-600 mb-3">No custom quizzes yet</p>
                  <Link
                    href="/teacher/quizzes/create"
                    className="text-violet-600 hover:text-violet-700 font-medium text-sm"
                  >
                    Create a custom quiz →
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900"
                >
                  <option value="">Choose a custom quiz...</option>
                  {customQuizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title} ({quiz.questions?.length || 0} questions)
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>

        {/* Step 3: Assignment Details */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Step 3: Assignment Details
          </label>

          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title *"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Due Date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Attempts (optional)</label>
              <input
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="Unlimited"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Assignment'}
          </button>
          <Link
            href="/teacher/assignments"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
