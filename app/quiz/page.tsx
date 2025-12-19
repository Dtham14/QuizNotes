'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MusicNotation from '@/components/MusicNotation';
import AudioPlayer from '@/components/AudioPlayer';
import { getQuizQuestions, QuizType, QuizQuestion } from '@/lib/quizData';
import { getEarTrainingQuestions, EarTrainingQuizQuestion } from '@/lib/earTrainingQuizData';

type CombinedQuestion = QuizQuestion | EarTrainingQuizQuestion;

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quizType, setQuizType] = useState<QuizType | null>(null);
  const [questions, setQuestions] = useState<CombinedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

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

  // Handle URL parameters for assignment-based quizzes
  useEffect(() => {
    if (initialized || !user) return;

    const typeParam = searchParams.get('type');
    const assignmentIdParam = searchParams.get('assignmentId');

    if (assignmentIdParam) {
      setAssignmentId(assignmentIdParam);
    }

    if (typeParam) {
      const validTypes: QuizType[] = ['intervals', 'chords', 'scales', 'noteIdentification', 'ear-training', 'mixed'];
      // Map URL params to quiz types
      const typeMap: Record<string, QuizType> = {
        'intervals': 'intervals',
        'interval-quiz': 'intervals',
        'chords': 'chords',
        'scales': 'scales',
        'noteIdentification': 'noteIdentification',
        'note-identification': 'noteIdentification',
        'ear-training': 'ear-training',
        'mixed': 'mixed',
        'mixed-quiz': 'mixed',
      };

      const mappedType = typeMap[typeParam];
      if (mappedType && validTypes.includes(mappedType)) {
        let quizQuestions: CombinedQuestion[];
        if (mappedType === 'ear-training') {
          quizQuestions = getEarTrainingQuestions(10);
        } else {
          quizQuestions = getQuizQuestions(mappedType, 10);
        }
        setQuizType(mappedType);
        setQuestions(quizQuestions);
        setAnswers(new Array(quizQuestions.length).fill(null));
      }
    }

    setInitialized(true);
  }, [searchParams, user, initialized]);

  const startQuiz = (type: QuizType) => {
    let quizQuestions: CombinedQuestion[];
    if (type === 'ear-training') {
      quizQuestions = getEarTrainingQuestions(10);
    } else {
      quizQuestions = getQuizQuestions(type, 10);
    }
    setQuizType(type);
    setQuestions(quizQuestions);
    setAnswers(new Array(quizQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!quizType) {
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

        <main className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Choose a Quiz Topic</h2>
          <p className="text-center text-gray-600 mb-12">
            Select a topic to test your music theory knowledge (10 randomized questions each)
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <button
              onClick={() => startQuiz('intervals')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Intervals</h3>
              <p className="text-sm text-gray-500 flex-grow">Identify distances between notes</p>
            </button>

            <button
              onClick={() => startQuiz('chords')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Chords</h3>
              <p className="text-sm text-gray-500 flex-grow">Major, minor, and more</p>
            </button>

            <button
              onClick={() => startQuiz('scales')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Scales</h3>
              <p className="text-sm text-gray-500 flex-grow">Learn scale degrees</p>
            </button>

            <button
              onClick={() => startQuiz('noteIdentification')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Note Reading</h3>
              <p className="text-sm text-gray-500 flex-grow">Treble and bass clef</p>
            </button>

            <button
              onClick={() => startQuiz('ear-training')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Ear Training</h3>
              <p className="text-sm text-gray-500 flex-grow">Identify sounds by ear</p>
            </button>

            <button
              onClick={() => startQuiz('mixed')}
              className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Mixed Quiz</h3>
              <p className="text-sm text-gray-500 flex-grow">Random questions from all topics</p>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Loading state while questions are being populated
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading quiz...</p>
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
    const calculatedScore = finalAnswers.reduce<number>((acc, answer, index) => {
      return answer === questions[index].correctAnswer ? acc + 1 : acc;
    }, 0);
    setScore(calculatedScore);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizType,
          score: calculatedScore,
          totalQuestions: questions.length,
          answers: finalAnswers,
          assignmentId: assignmentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Quiz submission error:', data);
        if (data.error === 'Attempt limit reached') {
          alert(data.message);
        } else {
          console.error('Failed to save quiz result:', data.error, data.details);
        }
      }
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">{percentage >= 70 ? '🎉' : '📚'}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-xl text-gray-600">
              You scored <span className="font-bold text-brand">{score}</span> out of{' '}
              <span className="font-bold">{questions.length}</span>
            </p>
            <p className="text-3xl font-bold text-brand mt-2">{percentage}%</p>
          </div>

          <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
            {questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              const questionId = 'id' in question ? question.id : `q-${index}`;
              return (
                <div
                  key={questionId}
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
                          <span className="text-red-600">Your answer: {question.options[userAnswer ?? -1] || 'No answer'}</span>
                          <br />
                          <span className="text-green-600">
                            Correct: {question.options[question.correctAnswer]}
                          </span>
                        </p>
                      )}
                      {'explanation' in question && question.explanation && (
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
              className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
            >
              Take Another Quiz
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white text-brand font-semibold rounded-lg hover:bg-gray-50 transition-colors border-2 border-brand"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if this is an ear training question
  const isEarTraining = 'earTraining' in currentQuestion && currentQuestion.earTraining;

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
              <span className="px-3 py-1 bg-brand/20 text-brand rounded-full text-sm font-semibold">
                {quizType === 'ear-training' ? 'Ear Training' : quizType.charAt(0).toUpperCase() + quizType.slice(1)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-brand h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex justify-center mb-8">
            {isEarTraining ? (
              <AudioPlayer
                subtype={currentQuestion.earTraining!.subtype}
                audioData={currentQuestion.earTraining!.audioData}
              />
            ) : 'notes' in currentQuestion ? (
              <MusicNotation
                notes={currentQuestion.notes}
                clef={currentQuestion.clef || 'treble'}
                width={500}
                height={180}
              />
            ) : null}
          </div>

          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? 'bg-brand/10 border-brand text-brand'
                    : 'bg-white border-gray-200 hover:border-brand/50 text-gray-700'
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
              className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
