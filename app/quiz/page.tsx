'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MusicNotation from '@/components/MusicNotation';
import { getQuizQuestions, QuizType } from '@/lib/quizData';

export default function QuizPage() {
  const router = useRouter();
  const [quizType, setQuizType] = useState<QuizType | null>(null);
  const [questions, setQuestions] = useState<ReturnType<typeof getQuizQuestions>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!quizType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <nav className="border-b bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer">QuizNotes</h1>
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Choose a Quiz Topic</h2>
          <p className="text-center text-gray-600 mb-12">
            Select a topic to test your music theory knowledge
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => {
                const quizQuestions = getQuizQuestions('intervals');
                setQuizType('intervals');
                setQuestions(quizQuestions);
                setAnswers(new Array(quizQuestions.length).fill(null));
              }}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-600 text-left"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Intervals</h3>
              <p className="text-gray-600">Identify intervals between notes</p>
              <p className="text-sm text-indigo-600 mt-4 font-semibold">
                {getQuizQuestions('intervals').length} questions
              </p>
            </button>

            <button
              onClick={() => {
                const quizQuestions = getQuizQuestions('chords');
                setQuizType('chords');
                setQuestions(quizQuestions);
                setAnswers(new Array(quizQuestions.length).fill(null));
              }}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-600 text-left"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎹</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chords</h3>
              <p className="text-gray-600">Recognize chord types and qualities</p>
              <p className="text-sm text-purple-600 mt-4 font-semibold">
                {getQuizQuestions('chords').length} questions
              </p>
            </button>

            <button
              onClick={() => {
                const quizQuestions = getQuizQuestions('scales');
                setQuizType('scales');
                setQuestions(quizQuestions);
                setAnswers(new Array(quizQuestions.length).fill(null));
              }}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-pink-600 text-left"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎼</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Scales</h3>
              <p className="text-gray-600">Learn scale degrees and patterns</p>
              <p className="text-sm text-pink-600 mt-4 font-semibold">
                {getQuizQuestions('scales').length} questions
              </p>
            </button>

            <button
              onClick={() => {
                const quizQuestions = getQuizQuestions('noteIdentification');
                setQuizType('noteIdentification');
                setQuestions(quizQuestions);
                setAnswers(new Array(quizQuestions.length).fill(null));
              }}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-teal-600 text-left"
            >
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Note Identification</h3>
              <p className="text-gray-600">Identify notes on treble and bass clef</p>
              <p className="text-sm text-teal-600 mt-4 font-semibold">
                {getQuizQuestions('noteIdentification').length} questions
              </p>
            </button>

            <button
              onClick={() => {
                const quizQuestions = getQuizQuestions('mixed');
                setQuizType('mixed');
                setQuestions(quizQuestions);
                setAnswers(new Array(quizQuestions.length).fill(null));
              }}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-orange-600 text-left"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎲</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mixed Quiz</h3>
              <p className="text-gray-600">Random questions from all topics</p>
              <p className="text-sm text-orange-600 mt-4 font-semibold">
                {getQuizQuestions('mixed').length} questions
              </p>
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1]);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const handlePrevious = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);

    setCurrentQuestionIndex(currentQuestionIndex - 1);
    setSelectedAnswer(answers[currentQuestionIndex - 1]);
  };

  const submitQuiz = async (finalAnswers: (number | null)[]) => {
    setLoading(true);
    const calculatedScore = finalAnswers.reduce((acc, answer, index) => {
      return answer === questions[index].correctAnswer ? acc + 1 : acc;
    }, 0);
    setScore(calculatedScore);

    try {
      await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizType,
          score: calculatedScore,
          totalQuestions: questions.length,
          answers: finalAnswers,
        }),
      });
    } catch (error) {
      console.error('Failed to save quiz:', error);
    } finally {
      setLoading(false);
      setShowResult(true);
    }
  };

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">{percentage >= 70 ? '🎉' : '📚'}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-xl text-gray-600">
              You scored <span className="font-bold text-indigo-600">{score}</span> out of{' '}
              <span className="font-bold">{questions.length}</span>
            </p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{percentage}%</p>
          </div>

          <div className="space-y-4 mb-8">
            {questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{isCorrect ? '✓' : '✗'}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Question {index + 1}</p>
                      <p className="text-sm text-gray-600">{question.question}</p>
                      {!isCorrect && (
                        <p className="text-sm mt-1">
                          <span className="text-red-600">Your answer: {question.options[userAnswer ?? -1]}</span>
                          <br />
                          <span className="text-green-600">
                            Correct: {question.options[question.correctAnswer]}
                          </span>
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-sm text-gray-500 mt-1 italic">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setQuizType(null);
                setQuestions([]);
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setAnswers([]);
                setShowResult(false);
                setScore(0);
              }}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Take Another Quiz
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors border-2 border-indigo-600"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-indigo-600 cursor-pointer">QuizNotes</h1>
            </Link>
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{currentQuestion.question}</h2>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold">
                {quizType.charAt(0).toUpperCase() + quizType.slice(1)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <MusicNotation
              notes={currentQuestion.notes}
              clef={currentQuestion.clef || 'treble'}
              width={500}
              height={180}
            />
          </div>

          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                    : 'bg-white border-gray-200 hover:border-indigo-300 text-gray-700'
                }`}
              >
                <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
