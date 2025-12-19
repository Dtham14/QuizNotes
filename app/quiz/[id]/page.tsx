'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MusicNotation, { Note } from '@/components/MusicNotation';
import AudioPlayer from '@/components/AudioPlayer';
import type { EarTrainingSubtype, EarTrainingAudioData } from '@/lib/types/earTraining';

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
  notes?: Note[];
  clef?: 'treble' | 'bass';
  earTraining?: {
    subtype: EarTrainingSubtype;
    audioData: EarTrainingAudioData;
  };
};

type CustomQuiz = {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
};

function CustomQuizContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.id as string;
  const assignmentId = searchParams.get('assignmentId');

  const [quiz, setQuiz] = useState<CustomQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!user || !quizId) return;

    fetch(`/api/quiz/${quizId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.quiz) {
          const parsedQuiz = {
            ...data.quiz,
            questions: typeof data.quiz.questions === 'string'
              ? JSON.parse(data.quiz.questions)
              : data.quiz.questions,
          };
          setQuiz(parsedQuiz);
          setAnswers(new Array(parsedQuiz.questions.length).fill(null));
        } else {
          alert('Quiz not found');
          router.push('/dashboard');
        }
      })
      .catch((error) => {
        console.error('Failed to load quiz:', error);
        alert('Failed to load quiz');
        router.push('/dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, quizId, router]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) {
      alert('Please select an answer before continuing');
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(newAnswers[currentQuestionIndex + 1]);
    } else {
      calculateScore(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1]);
    }
  };

  const calculateScore = async (finalAnswers: (number | null)[]) => {
    let correctCount = 0;
    quiz!.questions.forEach((question, index) => {
      if (finalAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResult(true);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizType: `custom-${quiz!.title}`,
          quizId: quizId,
          score: correctCount,
          totalQuestions: quiz!.questions.length,
          answers: finalAnswers,
          assignmentId: assignmentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === 'Attempt limit reached') {
          alert(data.message);
        }
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  if (loading || !user || !quiz) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="min-h-screen bg-white">
        <nav className="border-b bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/quiznotes logo.jpg"
                  alt="QuizNotes Logo"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <h1 className="text-2xl font-bold text-brand cursor-pointer">QuizNotes</h1>
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-brand hover:text-brand-dark transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div
                className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl ${
                  percentage >= 70
                    ? 'bg-green-100'
                    : percentage >= 50
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
                }`}
              >
                {percentage >= 70 ? '🎉' : percentage >= 50 ? '👍' : '📚'}
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-gray-600 mb-8">{quiz.title}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-brand/10 rounded-xl p-4">
                <p className="text-sm text-brand font-semibold mb-1">Score</p>
                <p className="text-3xl font-bold text-brand">
                  {score}/{quiz.questions.length}
                </p>
              </div>
              <div className="bg-brand/10 rounded-xl p-4">
                <p className="text-sm text-brand font-semibold mb-1">Percentage</p>
                <p className="text-3xl font-bold text-brand">{percentage}%</p>
              </div>
              <div className="bg-brand/10 rounded-xl p-4">
                <p className="text-sm text-brand font-semibold mb-1">Grade</p>
                <p className="text-3xl font-bold text-brand">
                  {percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Review Your Answers</h3>
            <div className="space-y-6">
              {quiz.questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                          isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <p className="font-semibold text-gray-900">{question.question}</p>
                    </div>
                    {question.earTraining ? (
                      <div className="ml-9 mb-3">
                        <AudioPlayer
                          subtype={question.earTraining.subtype}
                          audioData={question.earTraining.audioData}
                        />
                      </div>
                    ) : question.notes ? (
                      <div className="ml-9 mb-3">
                        <MusicNotation
                          notes={question.notes}
                          clef={question.clef || 'treble'}
                          width={300}
                          height={120}
                        />
                      </div>
                    ) : null}
                    <div className="ml-9 space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer === optionIndex;
                        const isCorrectAnswer = question.correctAnswer === optionIndex;
                        return (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded ${
                              isCorrectAnswer
                                ? 'bg-green-100 border border-green-400'
                                : isUserAnswer
                                ? 'bg-red-100 border border-red-400'
                                : 'bg-white'
                            }`}
                          >
                            <span className="text-gray-900">{option}</span>
                            {isCorrectAnswer && (
                              <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <span className="ml-2 text-red-600 font-semibold">✗ Your answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/quiznotes logo.jpg"
                alt="QuizNotes Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold text-brand cursor-pointer">QuizNotes</h1>
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-brand hover:text-brand-dark transition-colors"
            >
              Exit Quiz
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
          </div>
          {quiz.description && <p className="text-gray-600 mb-4">{quiz.description}</p>}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">{currentQuestion.question}</h3>

          {currentQuestion.earTraining ? (
            <div className="flex justify-center mb-6">
              <AudioPlayer
                subtype={currentQuestion.earTraining.subtype}
                audioData={currentQuestion.earTraining.audioData}
              />
            </div>
          ) : currentQuestion.notes ? (
            <div className="flex justify-center mb-6">
              <MusicNotation
                notes={currentQuestion.notes}
                clef={currentQuestion.clef || 'treble'}
                width={350}
                height={130}
              />
            </div>
          ) : null}

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-gray-200 bg-white text-gray-900 hover:border-brand/50 hover:bg-brand/5'
                }`}
              >
                <span className="font-medium">{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors"
          >
            {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function CustomQuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading quiz...</p>
      </div>
    }>
      <CustomQuizContent />
    </Suspense>
  );
}
