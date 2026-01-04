'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MusicNotation, { Note } from '@/components/MusicNotation';
import AudioPlayer from '@/components/AudioPlayer';
import XPGainAnimation from '@/components/gamification/XPGainAnimation';
import LevelUpCelebration from '@/components/gamification/LevelUpCelebration';
import AchievementUnlockToast from '@/components/gamification/AchievementUnlockToast';
import StudentNav from '@/components/StudentNav';
import TeacherNav from '@/components/TeacherNav';
import { getQuizQuestions, QuizType, QuizQuestion } from '@/lib/quizData';
import { getEarTrainingQuestions, EarTrainingQuizQuestion } from '@/lib/earTrainingQuizData';
import type { GamificationStats } from '@/lib/types/database';
import QuizBuilderModal from '@/components/quiz-builder/QuizBuilderModal';
import type { QuizType as BuilderQuizType, QuizSettings, GeneratedQuestion } from '@/lib/quizBuilder/types';
import { generateQuestions, QUIZ_TYPE_INFO, generateMixedQuiz, type MixedQuizCategory } from '@/lib/quizBuilder';
import { getDefaultSettings } from '@/lib/quizBuilder/presets';
import { generateQuizResultsPdf, uploadQuizPdf, type QuizPdfData } from '@/lib/pdf';

interface GamificationResult {
  xpAwarded: number;
  newTotalXp: number;
  leveledUp: boolean;
  newLevel: number;
  previousLevel?: number;
  levelName?: string;
  levelColor?: string;
  xpBreakdown: { reason: string; amount: number }[];
  streak: {
    current: number;
    longest: number;
    maintained: boolean;
  };
  newAchievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    xpReward: number;
  }[];
}

type CombinedQuestion = QuizQuestion | EarTrainingQuizQuestion | GeneratedQuestion;

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quizType, setQuizType] = useState<QuizType | null>(null);
  const [questions, setQuestions] = useState<CombinedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null; avatar?: string | null; avatarUrl?: string | null; themeColor?: string | null; role?: string; subscriptionStatus?: 'none' | 'active' | 'canceled' | 'expired' | null; subscription_status?: 'none' | 'active' | 'canceled' | 'expired' | null } | null>(null);
  const [gamificationStats, setGamificationStats] = useState<GamificationStats | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [assignmentInfo, setAssignmentInfo] = useState<{ maxAttempts: number; attemptsUsed: number; attemptsRemaining: number } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [gamificationResult, setGamificationResult] = useState<GamificationResult | null>(null);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  // Quiz Builder Modal state
  const [selectedBuilderType, setSelectedBuilderType] = useState<BuilderQuizType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // PDF state
  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  // Timer state
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(60);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  // Review mode state
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/gamification/stats'),
        ]);

        const userData = await userRes.json();
        if (userData.user) {
          setUser(userData.user);
        } else {
          router.push('/login');
          return;
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setGamificationStats(statsData.stats);
        }
      } catch {
        router.push('/login');
      }
    }
    loadUserData();
  }, [router]);

  // Handle URL parameters for assignment-based quizzes and quiz type selection
  useEffect(() => {
    if (initialized || !user) return;

    const typeParam = searchParams.get('type');
    const quizIdParam = searchParams.get('quizId');
    const assignmentIdParam = searchParams.get('assignmentId');
    const reviewParam = searchParams.get('review');

    if (assignmentIdParam) {
      setAssignmentId(assignmentIdParam);

      // Handle review mode
      if (reviewParam === 'true') {
        setIsReviewMode(true);
        setInitialized(true); // Set initialized immediately to prevent quiz selection from showing
        setLoading(true); // Show loading state
        // Fetch the quiz attempt for review
        fetch(`/api/quiz/attempts/assignment/${assignmentIdParam}`)
          .then(res => res.json())
          .then(data => {
            if (data.attempt) {
              const attempt = data.attempt;
              setReviewAttemptId(attempt.id);
              setQuizType(attempt.quizType);
              setQuestions(attempt.questions || []);
              setAnswers(attempt.answers || []);
              setScore(attempt.score);
              setShowResult(true);
              setLoading(false);
            } else {
              console.error('No quiz attempt found');
              setLoading(false);
            }
          })
          .catch(err => {
            console.error('Failed to fetch quiz attempt for review:', err);
            setLoading(false);
          });
        return;
      }

      // Fetch assignment info to get attempt counts and quiz details
      fetch('/api/student/assignments')
        .then(res => res.json())
        .then(data => {
          const assignment = data.assignments?.find((a: { id: string }) => a.id === assignmentIdParam);
          if (assignment) {
            setAssignmentInfo({
              maxAttempts: assignment.max_attempts,
              attemptsUsed: assignment.attempt_count,
              attemptsRemaining: assignment.attemptsRemaining,
            });

            // If no type or quizId in URL, get it from the assignment
            if (!typeParam && !quizIdParam) {
              if (assignment.quiz_id) {
                // Custom quiz - fetch it
                fetch(`/api/quiz/${assignment.quiz_id}`)
                  .then(res => res.json())
                  .then(data => {
                    if (data.quiz && data.quiz.questions) {
                      setQuizType('custom');
                      setQuestions(data.quiz.questions);
                      setAnswers(new Array(data.quiz.questions.length).fill(null));
                      setInitialized(true);
                    }
                  })
                  .catch(err => console.error('Failed to fetch custom quiz:', err));
              } else if (assignment.quiz_type) {
                // Built-in quiz - generate questions
                const builderTypeMap: Record<string, BuilderQuizType> = {
                  'noteIdentification': 'noteIdentification',
                  'note-identification': 'noteIdentification',
                  'keySignature': 'keySignature',
                  'key-signature': 'keySignature',
                  'key-signature-quiz': 'keySignature',
                  'intervals': 'intervalIdentification',
                  'intervalIdentification': 'intervalIdentification',
                  'interval-identification': 'intervalIdentification',
                  'interval-quiz': 'intervalIdentification',
                  'chords': 'chordIdentification',
                  'chordIdentification': 'chordIdentification',
                  'chord-identification': 'chordIdentification',
                  'scales': 'scaleIdentification',
                  'scaleIdentification': 'scaleIdentification',
                  'scale-identification': 'scaleIdentification',
                  'scale-quiz': 'scaleIdentification',
                  'earTrainingNote': 'earTrainingNote',
                  'ear-training-note': 'earTrainingNote',
                  'earTrainingInterval': 'earTrainingInterval',
                  'ear-training-interval': 'earTrainingInterval',
                  'earTrainingChord': 'earTrainingChord',
                  'ear-training-chord': 'earTrainingChord',
                };

                const mappedType = builderTypeMap[assignment.quiz_type];
                if (mappedType) {
                  try {
                    const defaultSettings = getDefaultSettings(mappedType, 'intermediate');
                    const generatedQuestions = generateQuestions(defaultSettings);
                    const typeMap: Record<BuilderQuizType, QuizType> = {
                      'noteIdentification': 'noteIdentification',
                      'keySignature': 'keySignature',
                      'intervalIdentification': 'intervalIdentification',
                      'chordIdentification': 'chordIdentification',
                      'scaleIdentification': 'scaleIdentification',
                      'earTrainingNote': 'earTrainingNote',
                      'earTrainingInterval': 'earTrainingInterval',
                      'earTrainingChord': 'earTrainingChord',
                    };
                    setQuizType(typeMap[mappedType] || 'mixed');
                    setQuestions(generatedQuestions);
                    setAnswers(new Array(generatedQuestions.length).fill(null));
                    setInitialized(true);
                  } catch (error) {
                    console.error('Failed to generate quiz from assignment:', error);
                  }
                }
              }
            }
          }
        })
        .catch(err => console.error('Failed to fetch assignment info:', err));
    }

    // Handle custom quiz loading
    if (quizIdParam) {
      fetch(`/api/quiz/${quizIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.quiz && data.quiz.questions) {
            setQuizType('custom');
            setQuestions(data.quiz.questions);
            setAnswers(new Array(data.quiz.questions.length).fill(null));
          } else {
            console.error('Custom quiz not found or has no questions');
          }
        })
        .catch(err => console.error('Failed to fetch custom quiz:', err));
    } else if (typeParam) {
      // Map URL params to Quiz Builder types for consistent experience
      const builderTypeMap: Record<string, BuilderQuizType> = {
        'noteIdentification': 'noteIdentification',
        'note-identification': 'noteIdentification',
        'keySignature': 'keySignature',
        'key-signature': 'keySignature',
        'key-signature-quiz': 'keySignature',
        'intervals': 'intervalIdentification',
        'intervalIdentification': 'intervalIdentification',
        'interval-identification': 'intervalIdentification',
        'interval-quiz': 'intervalIdentification',
        'chords': 'chordIdentification',
        'chordIdentification': 'chordIdentification',
        'chord-identification': 'chordIdentification',
        'scales': 'scaleIdentification',
        'scaleIdentification': 'scaleIdentification',
        'scale-identification': 'scaleIdentification',
        'scale-quiz': 'scaleIdentification',
        'earTrainingNote': 'earTrainingNote',
        'ear-training-note': 'earTrainingNote',
        'earTrainingInterval': 'earTrainingInterval',
        'ear-training-interval': 'earTrainingInterval',
        'earTrainingChord': 'earTrainingChord',
        'ear-training-chord': 'earTrainingChord',
      };

      const mappedBuilderType = builderTypeMap[typeParam];
      if (mappedBuilderType) {
        // For assignment-based quizzes, auto-start with default (intermediate) settings
        if (assignmentIdParam) {
          try {
            const defaultSettings = getDefaultSettings(mappedBuilderType, 'intermediate');
            const generatedQuestions = generateQuestions(defaultSettings);

            // Map builder quiz type to legacy quiz type for display
            const typeMap: Record<BuilderQuizType, QuizType> = {
              'noteIdentification': 'noteIdentification',
              'keySignature': 'keySignature',
              'intervalIdentification': 'intervalIdentification',
              'chordIdentification': 'chordIdentification',
              'scaleIdentification': 'scaleIdentification',
              'earTrainingNote': 'earTrainingNote',
              'earTrainingInterval': 'earTrainingInterval',
              'earTrainingChord': 'earTrainingChord',
            };

            setQuizType(typeMap[mappedBuilderType] || 'mixed');
            setQuestions(generatedQuestions);
            setAnswers(new Array(generatedQuestions.length).fill(null));
          } catch (error) {
            console.error('Failed to generate assignment quiz:', error);
            // Fallback to modal if generation fails
            setSelectedBuilderType(mappedBuilderType);
            setIsModalOpen(true);
          }
        } else {
          // For non-assignment quizzes, open Quiz Builder modal for the selected type
          setSelectedBuilderType(mappedBuilderType);
          setIsModalOpen(true);
        }
      } else if (typeParam === 'mixed' || typeParam === 'mixed-quiz') {
        // For mixed quizzes, use legacy questions
        const quizQuestions = getQuizQuestions('mixed', 10);
        setQuizType('mixed');
        setQuestions(quizQuestions);
        setAnswers(new Array(quizQuestions.length).fill(null));
      } else if (typeParam === 'ear-training') {
        // For generic ear training, use legacy questions
        const quizQuestions = getEarTrainingQuestions(10);
        setQuizType('ear-training');
        setQuestions(quizQuestions);
        setAnswers(new Array(quizQuestions.length).fill(null));
      }
    }

    // Only set initialized if not loading from assignment data
    if (!assignmentIdParam || typeParam || quizIdParam) {
      setInitialized(true);
    }
  }, [searchParams, user, initialized]);

  // Auto-generate PDF after quiz submission
  useEffect(() => {
    const generatePdfInBackground = async () => {
      if (!quizAttemptId || !showResult || pdfUrl || pdfGenerating || questions.length === 0) {
        return;
      }

      setPdfGenerating(true);

      try {
        // Prepare quiz data for PDF
        const pdfData: QuizPdfData = {
          quizType: quizType || 'mixed',
          score,
          totalQuestions: questions.length,
          questions: questions.map((q) => ({
            id: 'id' in q ? q.id : `q-${Math.random()}`,
            type: 'type' in q ? q.type : undefined,
            question: q.question,
            notes: 'notes' in q ? q.notes as string[] : undefined,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: 'explanation' in q ? q.explanation : undefined,
            clef: 'clef' in q ? q.clef : undefined,
            keySignature: 'keySignature' in q ? (q as { keySignature: string }).keySignature : undefined,
            audioData: 'audioData' in q ? q.audioData : undefined,
          })),
          answers,
          completedAt: new Date(),
        };

        // Generate PDF
        const pdfBlob = await generateQuizResultsPdf(pdfData);

        // Upload to storage
        const uploadResult = await uploadQuizPdf(pdfBlob, quizAttemptId);

        if (uploadResult.success && uploadResult.pdfUrl) {
          setPdfUrl(uploadResult.pdfUrl);
        }
      } catch (error) {
        console.error('Auto PDF generation failed:', error);
      } finally {
        setPdfGenerating(false);
      }
    };

    generatePdfInBackground();
  }, [quizAttemptId, showResult, pdfUrl, pdfGenerating, questions, quizType, score, answers]);

  // Timer countdown logic
  useEffect(() => {
    if (!timerEnabled || timeRemaining === null || showFeedback || showResult) {
      return;
    }

    if (timeRemaining <= 0) {
      // Time's up! Record current answer and submit the entire quiz
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedAnswer;
      setAnswers(newAnswers);
      // Submit the quiz immediately - any unanswered questions will be marked wrong
      submitQuiz(newAnswers);
      return;
    }

    const timerId = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timerEnabled, timeRemaining, showFeedback, showResult, answers, currentQuestionIndex, selectedAnswer]);

  // Reset timer when moving to next question
  useEffect(() => {
    if (timerEnabled && !showFeedback && !showResult) {
      setTimeRemaining(timeLimitSeconds);
    }
  }, [currentQuestionIndex, timerEnabled, timeLimitSeconds, showFeedback, showResult]);

  // Legacy start quiz (fallback for URL-based navigation)
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

  // Open quiz builder modal
  const openQuizBuilder = (type: BuilderQuizType) => {
    setSelectedBuilderType(type);
    setIsModalOpen(true);
  };

  // Start a mixed quiz with random questions from specified category
  const startMixedQuiz = (category: MixedQuizCategory) => {
    try {
      const generatedQuestions = generateMixedQuiz(category, 10, 'intermediate');

      // Map category to quiz type for display
      const categoryTypeMap: Record<MixedQuizCategory, QuizType> = {
        'visual': 'mixed',
        'earTraining': 'ear-training',
        'all': 'mixed',
      };

      setQuizType(categoryTypeMap[category]);
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(null));
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowFeedback(false);
      setScore(0);
    } catch (error) {
      console.error('Failed to generate mixed quiz:', error);
      alert('Failed to generate quiz questions. Please try again.');
    }
  };

  // Start quiz with custom settings from Quiz Builder
  const startQuizWithSettings = (settings: QuizSettings) => {
    try {
      const generatedQuestions = generateQuestions(settings);

      // Map builder quiz type to legacy quiz type for display
      const typeMap: Record<BuilderQuizType, QuizType> = {
        'noteIdentification': 'noteIdentification',
        'keySignature': 'keySignature',
        'intervalIdentification': 'intervalIdentification',
        'chordIdentification': 'chordIdentification',
        'scaleIdentification': 'scaleIdentification',
        'earTrainingNote': 'earTrainingNote',
        'earTrainingInterval': 'earTrainingInterval',
        'earTrainingChord': 'earTrainingChord',
      };

      setQuizType(typeMap[settings.quizType] || 'mixed');
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(null));
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowFeedback(false);
      setScore(0);
      setIsModalOpen(false);
      setSelectedBuilderType(null);
      // Set timer settings
      setTimerEnabled(settings.timerEnabled ?? false);
      setTimeLimitSeconds(settings.timeLimitSeconds ?? 60);
      if (settings.timerEnabled) {
        setTimeRemaining(settings.timeLimitSeconds ?? 60);
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate quiz questions. Please try again.');
    }
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {user?.role === 'student' ? (
          <StudentNav user={user} level={gamificationStats?.current_level} xp={gamificationStats?.total_xp} />
        ) : (
          <TeacherNav user={user} stats={{ classCount: 0, studentCount: 0, quizCount: 0, assignmentCount: 0 }} />
        )}

        <main className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Choose a Quiz Topic</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Choose your challenge, customize the difficulty, and put your music theory skills to the test
          </p>

          {/* Quick Start Quizzes */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Start</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Mixed Staff Identification Quiz */}
              <button
                onClick={() => startMixedQuiz('visual')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">🎼</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Mixed Staff Identification Quiz</h3>
                <p className="text-sm text-gray-500 flex-grow">Random staff notation questions (10 questions)</p>
              </button>

              {/* Mixed Ear Training Quiz */}
              <button
                onClick={() => startMixedQuiz('earTraining')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">👂</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Mixed Ear Training Quiz</h3>
                <p className="text-sm text-gray-500 flex-grow">Random ear training questions (10 questions)</p>
              </button>

              {/* Mixed Quiz */}
              <button
                onClick={() => startMixedQuiz('all')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <svg className="w-6 h-6 text-brand group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Mixed Quiz</h3>
                <p className="text-sm text-gray-500 flex-grow">Random questions from all topics (10 questions)</p>
              </button>
            </div>
          </div>

          {/* Staff Identification Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Staff Identification</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => openQuizBuilder('noteIdentification')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">{QUIZ_TYPE_INFO.noteIdentification.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{QUIZ_TYPE_INFO.noteIdentification.name}</h3>
                <p className="text-sm text-gray-500 flex-grow">{QUIZ_TYPE_INFO.noteIdentification.description}</p>
              </button>

              <button
                onClick={() => openQuizBuilder('keySignature')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">{QUIZ_TYPE_INFO.keySignature.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{QUIZ_TYPE_INFO.keySignature.name}</h3>
                <p className="text-sm text-gray-500 flex-grow">{QUIZ_TYPE_INFO.keySignature.description}</p>
              </button>

              <button
                onClick={() => openQuizBuilder('intervalIdentification')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">{QUIZ_TYPE_INFO.intervalIdentification.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{QUIZ_TYPE_INFO.intervalIdentification.name}</h3>
                <p className="text-sm text-gray-500 flex-grow">{QUIZ_TYPE_INFO.intervalIdentification.description}</p>
              </button>

              <button
                onClick={() => openQuizBuilder('chordIdentification')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">{QUIZ_TYPE_INFO.chordIdentification.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{QUIZ_TYPE_INFO.chordIdentification.name}</h3>
                <p className="text-sm text-gray-500 flex-grow">{QUIZ_TYPE_INFO.chordIdentification.description}</p>
              </button>

              <button
                onClick={() => openQuizBuilder('scaleIdentification')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">{QUIZ_TYPE_INFO.scaleIdentification.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{QUIZ_TYPE_INFO.scaleIdentification.name}</h3>
                <p className="text-sm text-gray-500 flex-grow">{QUIZ_TYPE_INFO.scaleIdentification.description}</p>
              </button>
            </div>
          </div>

          {/* Ear Training Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ear Training</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => openQuizBuilder('earTrainingNote')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">{QUIZ_TYPE_INFO.earTrainingNote.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{QUIZ_TYPE_INFO.earTrainingNote.name}</h3>
                <p className="text-sm text-gray-500 flex-grow">{QUIZ_TYPE_INFO.earTrainingNote.description}</p>
              </button>

              <button
                onClick={() => openQuizBuilder('earTrainingInterval')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">{QUIZ_TYPE_INFO.earTrainingInterval.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{QUIZ_TYPE_INFO.earTrainingInterval.name}</h3>
                <p className="text-sm text-gray-500 flex-grow">{QUIZ_TYPE_INFO.earTrainingInterval.description}</p>
              </button>

              <button
                onClick={() => openQuizBuilder('earTrainingChord')}
                className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <span className="text-2xl">{QUIZ_TYPE_INFO.earTrainingChord.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{QUIZ_TYPE_INFO.earTrainingChord.name}</h3>
                <p className="text-sm text-gray-500 flex-grow">{QUIZ_TYPE_INFO.earTrainingChord.description}</p>
              </button>
            </div>
          </div>
        </main>

        {/* Quiz Builder Modal */}
        {selectedBuilderType && (
          <QuizBuilderModal
            quizType={selectedBuilderType}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedBuilderType(null);
            }}
            onStartQuiz={startQuizWithSettings}
          />
        )}
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

  // Handle both old format (correctAnswer is index) and new format (correctAnswer is string)
  const getCorrectAnswerIndex = (q: CombinedQuestion): number => {
    if (typeof q.correctAnswer === 'number') {
      return q.correctAnswer;
    }
    // For GeneratedQuestion, correctAnswer is a string - find its index
    return q.options.findIndex(opt => opt === q.correctAnswer);
  };

  // Helper to extract accidental from a VexFlow note string (e.g., "c#/4" -> "#", "bb/4" -> "b")
  const extractAccidental = (noteStr: string): string | null => {
    // VexFlow format is like "c#/4" or "bb/4" or "c/4"
    const match = noteStr.match(/^[a-g](#|b)?\/\d+$/i);
    if (match && match[1]) {
      return match[1]; // Returns "#" or "b"
    }
    return null;
  };

  // Helper to convert string[] notes to Note[] for MusicNotation
  // Takes questionType to handle scales (horizontal) vs chords (stacked) differently
  const convertToNotes = (notes: string[] | Note[], questionType?: string): Note[] => {
    if (notes.length === 0) return [];
    // Check if it's already in Note format
    if (typeof notes[0] === 'object' && 'keys' in notes[0]) {
      return notes as Note[];
    }
    // Convert string[] to Note[]
    const stringNotes = notes as string[];

    // For scales, render each note individually (horizontally)
    if (questionType === 'scaleIdentification') {
      return stringNotes.map(noteStr => {
        const accidental = extractAccidental(noteStr);
        const note: Note = { keys: [noteStr], duration: 'q' }; // Quarter notes for scales
        if (accidental) {
          note.accidentals = [accidental];
        }
        return note;
      });
    }

    // For intervals, render notes separately but horizontally as whole notes
    if (questionType === 'intervalIdentification' && stringNotes.length === 2) {
      return stringNotes.map(noteStr => {
        const accidental = extractAccidental(noteStr);
        const note: Note = { keys: [noteStr], duration: 'w' }; // Whole notes for intervals
        if (accidental) {
          note.accidentals = [accidental];
        }
        return note;
      });
    }

    // Extract accidentals for each note
    const accidentals = stringNotes.map(extractAccidental);
    const hasAnyAccidentals = accidentals.some(acc => acc !== null);

    if (stringNotes.length === 1) {
      // Single note
      const note: Note = { keys: stringNotes, duration: 'w' };
      if (hasAnyAccidentals) {
        note.accidentals = accidentals;
      }
      return [note];
    }
    // For chords with multiple notes, create a single chord Note (stacked)
    const note: Note = { keys: stringNotes, duration: 'w' };
    if (hasAnyAccidentals) {
      note.accidentals = accidentals;
    }
    return [note];
  };

  const correctAnswerIndex = currentQuestion ? getCorrectAnswerIndex(currentQuestion) : -1;
  const isCorrect = selectedAnswer === correctAnswerIndex;

  // Handle answer selection - just select, no feedback yet
  const handleAnswer = (answerIndex: number) => {
    if (showFeedback) return; // Don't allow changing answer after feedback shown
    setSelectedAnswer(answerIndex);
  };

  // Show feedback or move to next question
  const handleNext = () => {
    if (!showFeedback) {
      // First click: show feedback and record answer
      setShowFeedback(true);
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedAnswer;
      setAnswers(newAnswers);
    } else {
      // Second click: move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        submitQuiz(answers);
      }
    }
  };

  const submitQuiz = async (finalAnswers: (number | null)[]) => {
    setLoading(true);
    const calculatedScore = finalAnswers.reduce<number>((acc, answer, index) => {
      const correctIdx = getCorrectAnswerIndex(questions[index]);
      return answer === correctIdx ? acc + 1 : acc;
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
          questions: questions,
          assignmentId: assignmentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Quiz submission error:', data);
        if (data.error === 'Attempt limit reached') {
          alert(data.message);
        } else {
          console.error('Failed to save quiz result:', data.error, data.details);
        }
      } else {
        // Store the attempt ID for PDF generation
        if (data.attempt?.id) {
          setQuizAttemptId(data.attempt.id);
        }
      }

      if (data.gamification) {
        // Store gamification result and trigger animations
        const gamification = data.gamification;

        // Fetch level info for the new level if leveled up
        let levelName = 'Beginner';
        let levelColor = 'gray';
        let previousLevel = gamification.newLevel - 1;

        if (gamification.leveledUp) {
          try {
            const statsRes = await fetch('/api/gamification/stats');
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              levelName = statsData.stats?.level_info?.name || 'Beginner';
              levelColor = statsData.stats?.level_info?.color || 'gray';
            }
          } catch (e) {
            console.error('Failed to fetch level info:', e);
          }
        }

        setGamificationResult({
          ...gamification,
          previousLevel,
          levelName,
          levelColor,
        });

        // Show XP animation first
        setShowXPAnimation(true);
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

    const handleXPAnimationComplete = () => {
      setShowXPAnimation(false);
      // Show level up if applicable
      if (gamificationResult?.leveledUp) {
        setShowLevelUp(true);
      } else if (gamificationResult?.newAchievements && gamificationResult.newAchievements.length > 0) {
        setShowAchievements(true);
      }
    };

    const handleLevelUpComplete = () => {
      setShowLevelUp(false);
      // Show achievements after level up
      if (gamificationResult?.newAchievements && gamificationResult.newAchievements.length > 0) {
        setShowAchievements(true);
      }
    };

    const handleAchievementsComplete = () => {
      setShowAchievements(false);
    };

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        {/* Gamification Animations */}
        {showXPAnimation && gamificationResult && (
          <XPGainAnimation
            xpAwarded={gamificationResult.xpAwarded}
            breakdown={gamificationResult.xpBreakdown}
            onComplete={handleXPAnimationComplete}
          />
        )}

        {showLevelUp && gamificationResult?.leveledUp && (
          <LevelUpCelebration
            previousLevel={gamificationResult.previousLevel || 1}
            newLevel={gamificationResult.newLevel}
            levelName={gamificationResult.levelName || 'Beginner'}
            levelColor={gamificationResult.levelColor || 'gray'}
            onComplete={handleLevelUpComplete}
          />
        )}

        {showAchievements && gamificationResult?.newAchievements && gamificationResult.newAchievements.length > 0 && (
          <AchievementUnlockToast
            achievements={gamificationResult.newAchievements}
            onComplete={handleAchievementsComplete}
          />
        )}

        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">{isReviewMode ? '📝' : percentage >= 70 ? '🎉' : '📚'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {isReviewMode ? 'Assignment Review' : 'Quiz Complete!'}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              You scored <span className="font-bold text-brand">{score}</span> out of{' '}
              <span className="font-bold">{questions.length}</span>
            </p>
            <p className="text-3xl font-bold text-brand mt-2">{percentage}%</p>
          </div>

          {/* Gamification Stats Summary */}
          {!isReviewMode && gamificationResult && (
            <div className="bg-gradient-to-r from-brand/10 to-brand/5 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-brand">+{gamificationResult.xpAwarded}</p>
                  <p className="text-xs text-gray-600">XP Earned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">
                    {gamificationResult.streak.current}
                    <span className="text-lg">🔥</span>
                  </p>
                  <p className="text-xs text-gray-600">Day Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">{gamificationResult.newTotalXp.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Total XP</p>
                </div>
              </div>
              {gamificationResult.leveledUp && (
                <div className="mt-3 pt-3 border-t border-brand/20 text-center">
                  <span className="text-sm font-semibold text-brand">
                    🎊 Level Up! You reached Level {gamificationResult.newLevel}!
                  </span>
                </div>
              )}
              {gamificationResult.newAchievements && gamificationResult.newAchievements.length > 0 && (
                <div className="mt-3 pt-3 border-t border-brand/20 text-center">
                  <span className="text-sm font-semibold text-yellow-600">
                    🏆 {gamificationResult.newAchievements.length} New Achievement{gamificationResult.newAchievements.length > 1 ? 's' : ''} Unlocked!
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 mb-8 max-h-[600px] overflow-y-auto pr-2">
            {/* Hide correct answers in results if assignment has more than 1 attempt remaining (show answers on last attempt or perfect score) */}
            {(() => {
              const isPerfectScore = score === questions.length;
              // Always show correct answers in review mode
              const hideAnswersInResults = !isReviewMode && assignmentInfo && assignmentInfo.maxAttempts > 1 && assignmentInfo.attemptsRemaining > 1 && !isPerfectScore;
              return questions.map((question, index) => {
              const userAnswer = answers[index];
              const correctIdx = getCorrectAnswerIndex(question);
              const isCorrect = userAnswer === correctIdx;
              const questionId = 'id' in question ? question.id : `q-${index}`;

              // Determine if this is an ear training question
              const isEarTrainingQ = ('earTraining' in question && question.earTraining) ||
                ('audioData' in question && question.audioData);

              // Get notation data
              const hasNotes = 'notes' in question && question.notes && question.notes.length > 0;
              const hasKeySignature = 'keySignature' in question && question.keySignature;
              const questionType = 'type' in question ? question.type : undefined;
              const questionClef = 'clef' in question ? question.clef : 'treble';

              return (
                <div
                  key={questionId}
                  className={`p-5 rounded-xl border-2 ${
                    isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{isCorrect ? '✓' : '✗'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">Question {index + 1}</p>
                      <p className="text-sm text-gray-600 mb-2">{question.question}</p>

                      {/* Show notation for visual questions */}
                      {!isEarTrainingQ && (hasNotes || hasKeySignature) && (
                        <div className="my-4 flex justify-center bg-white rounded-lg p-3 border border-gray-100">
                          {hasKeySignature && !hasNotes ? (
                            <MusicNotation
                              clef={questionClef || 'treble'}
                              keySignature={(question as { keySignature: string }).keySignature}
                              width={320}
                              height={140}
                            />
                          ) : hasNotes ? (
                            <MusicNotation
                              notes={convertToNotes((question as { notes: string[] }).notes, questionType)}
                              clef={questionClef || 'treble'}
                              width={questionType === 'scaleIdentification' ? 450 : 320}
                              height={140}
                            />
                          ) : null}
                        </div>
                      )}

                      {/* Show audio indicator for ear training */}
                      {isEarTrainingQ && (
                        <div className="my-3 bg-gray-100 rounded-lg py-2 px-4 inline-flex items-center gap-2">
                          <span className="text-lg">🎵</span>
                          <span className="text-sm text-gray-600">Audio-based question</span>
                        </div>
                      )}

                      <div className="text-sm space-y-1">
                        <p>
                          <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                            Your answer: {question.options[userAnswer ?? -1] || 'No answer'}
                          </span>
                        </p>
                        {!isCorrect && !hideAnswersInResults && (
                          <p className="text-green-700 font-medium">
                            Correct answer: {question.options[correctIdx]}
                          </p>
                        )}
                        {!isCorrect && hideAnswersInResults && (
                          <p className="text-gray-500 text-sm italic">
                            You have attempts remaining - correct answer hidden
                          </p>
                        )}
                      </div>
                      {'explanation' in question && question.explanation && !hideAnswersInResults && (
                        <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 p-2 rounded">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
            })()}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {/* In review mode, show Back to Assignments button */}
            {isReviewMode && (
              <Link
                href="/student/assignments"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Assignments
              </Link>
            )}
            {/* Show Retry button for assignments with attempts remaining (not in review mode) */}
            {!isReviewMode && assignmentInfo && assignmentInfo.attemptsRemaining > 1 && (
              <button
                onClick={() => {
                  // Reset quiz state but keep assignment context
                  setQuestions([]);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswer(null);
                  setAnswers([]);
                  setShowResult(false);
                  setShowFeedback(false);
                  setScore(0);
                  setGamificationResult(null);
                  setShowXPAnimation(false);
                  setShowLevelUp(false);
                  setShowAchievements(false);
                  setQuizAttemptId(null);
                  setPdfUrl(null);
                  setPdfGenerating(false);
                  // Re-trigger quiz generation by resetting quizType and re-initializing
                  setQuizType(null);
                  setInitialized(false);
                  // Update attempts info
                  setAssignmentInfo({
                    ...assignmentInfo,
                    attemptsUsed: assignmentInfo.attemptsUsed + 1,
                    attemptsRemaining: assignmentInfo.attemptsRemaining - 1,
                  });
                }}
                className="px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
              >
                Retry Quiz ({assignmentInfo.attemptsRemaining - 1} left)
              </button>
            )}
            {/* Show Submit button for assignments (to finalize score, not in review mode) */}
            {!isReviewMode && assignmentInfo && assignmentInfo.attemptsRemaining > 1 && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/student/assignments/submit', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assignmentId }),
                    });
                    if (res.ok) {
                      // Navigate to profile after successful submission
                      window.location.href = '/profile';
                    } else {
                      const data = await res.json();
                      alert(data.error || 'Failed to submit assignment');
                    }
                  } catch (error) {
                    console.error('Failed to submit:', error);
                    alert('Failed to submit assignment');
                  }
                }}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Submit & Finish
              </button>
            )}
            {/* Show Take Another Quiz for non-assignments or when no retries left (not in review mode) */}
            {!isReviewMode && (!assignmentInfo || assignmentInfo.attemptsRemaining <= 1) && (
              <button
                onClick={() => {
                  setQuizType(null);
                  setQuestions([]);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswer(null);
                  setAnswers([]);
                  setShowResult(false);
                  setScore(0);
                  setGamificationResult(null);
                  setShowXPAnimation(false);
                  setShowLevelUp(false);
                  setShowAchievements(false);
                  // Reset PDF state
                  setQuizAttemptId(null);
                  setPdfUrl(null);
                  setPdfGenerating(false);
                  // Reset assignment context
                  setAssignmentId(null);
                  setAssignmentInfo(null);
                }}
                className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
              >
                Take Another Quiz
              </button>
            )}
            <Link
              href="/dashboard"
              className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                assignmentInfo && assignmentInfo.attemptsRemaining > 1
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-white text-brand hover:bg-gray-50 border-2 border-brand'
              }`}
            >
              {assignmentInfo && assignmentInfo.attemptsRemaining > 1 ? 'Back to Dashboard' : 'View Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if this is an ear training question (handles both old and new formats)
  const isEarTraining = ('earTraining' in currentQuestion && currentQuestion.earTraining) ||
    ('audioData' in currentQuestion && currentQuestion.audioData);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user?.role === 'student' ? (
        <StudentNav user={user} level={gamificationStats?.current_level} xp={gamificationStats?.total_xp} />
      ) : (
        <TeacherNav user={user} stats={{ classCount: 0, studentCount: 0, quizCount: 0, assignmentCount: 0 }} />
      )}

      {/* Exit Quiz Button - Fixed Position */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Mobile-friendly approach: double-tap to exit
                  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                  if (isMobile) {
                    // On mobile: first tap shows warning, second tap exits
                    const exitWarning = (e.currentTarget as HTMLButtonElement).dataset.exitWarning;

                    if (exitWarning === 'shown') {
                      // Second tap - exit immediately
                      setQuizType(null);
                      setQuestions([]);
                      setCurrentQuestionIndex(0);
                      setSelectedAnswer(null);
                      setAnswers([]);
                      setShowFeedback(false);
                      setShowResult(false);
                      setScore(0);
                      window.location.href = '/quiz';
                    } else {
                      // First tap - show warning
                      (e.currentTarget as HTMLButtonElement).dataset.exitWarning = 'shown';
                      (e.currentTarget as HTMLButtonElement).textContent = 'Tap again to exit';
                      (e.currentTarget as HTMLButtonElement).classList.add('animate-pulse');

                      // Reset warning after 3 seconds
                      setTimeout(() => {
                        (e.currentTarget as HTMLButtonElement).dataset.exitWarning = '';
                        const span = (e.currentTarget as HTMLButtonElement).querySelector('span');
                        if (span) {
                          (e.currentTarget as HTMLButtonElement).innerHTML = '';
                          (e.currentTarget as HTMLButtonElement).appendChild(span);
                        } else {
                          (e.currentTarget as HTMLButtonElement).textContent = 'Exit';
                        }
                        (e.currentTarget as HTMLButtonElement).classList.remove('animate-pulse');
                      }, 3000);
                    }
                  } else {
                    // Desktop: use confirm dialog
                    try {
                      const confirmExit = confirm('Are you sure you want to exit? Your progress will be lost.');

                      if (confirmExit) {
                        setQuizType(null);
                        setQuestions([]);
                        setCurrentQuestionIndex(0);
                        setSelectedAnswer(null);
                        setAnswers([]);
                        setShowFeedback(false);
                        setShowResult(false);
                        setScore(0);
                        window.location.href = '/quiz';
                      }
                    } catch (error) {
                      window.location.href = '/quiz';
                    }
                  }
                }}
                className="px-4 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-full transition-all touch-manipulation shadow-lg hover:shadow-xl flex items-center gap-2"
                aria-label="Exit Quiz"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">Exit Quiz</span>
        </button>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <div className="mb-6">
            {/* Category label at top left */}
            <div className="mb-4">
              <span className="px-3 py-1 bg-brand/20 text-brand rounded-full text-sm font-semibold">
                {'type' in currentQuestion && currentQuestion.type === 'keySignature' ? 'Key Signatures' :
                 'type' in currentQuestion && currentQuestion.type === 'scaleIdentification' ? 'Scale Identification' :
                 'type' in currentQuestion && currentQuestion.type === 'intervalIdentification' ? 'Interval Identification' :
                 'type' in currentQuestion && currentQuestion.type === 'chordIdentification' ? 'Chord Identification' :
                 quizType === 'ear-training' ? 'Mixed Ear Training' :
                 quizType === 'mixed' ? 'Mixed Staff Identification' :
                 quizType === 'noteIdentification' ? 'Note Identification' :
                 quizType.charAt(0).toUpperCase() + quizType.slice(1)}
              </span>
            </div>
            {/* Question underneath */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4">{currentQuestion.question}</h2>
            {/* Segmented progress bar */}
            <div className="flex gap-1.5">
              {questions.map((q, index) => {
                const qCorrectIdx = getCorrectAnswerIndex(q);
                return (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      index < currentQuestionIndex
                        ? answers[index] === qCorrectIdx
                          ? 'bg-green-500'
                          : 'bg-red-400'
                        : index === currentQuestionIndex && showFeedback
                        ? isCorrect
                          ? 'bg-green-500'
                          : 'bg-red-400'
                        : 'bg-gray-200'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex justify-center mb-8 overflow-x-auto">
            <div className="min-w-0 w-full max-w-full">
              {isEarTraining ? (
                // Handle both old earTraining format and new audioData format
                'earTraining' in currentQuestion && currentQuestion.earTraining ? (
                  <AudioPlayer
                    subtype={currentQuestion.earTraining.subtype}
                    audioData={currentQuestion.earTraining.audioData}
                  />
                ) : 'audioData' in currentQuestion && currentQuestion.audioData ? (
                  <AudioPlayer
                    subtype={currentQuestion.audioData.subtype}
                    audioData={{ notes: currentQuestion.audioData.notes, duration: currentQuestion.audioData.duration }}
                  />
                ) : null
              ) : 'keySignature' in currentQuestion && currentQuestion.keySignature ? (
                // Key signature questions - show staff with clef and key signature only
                <div className="flex justify-center">
                  <MusicNotation
                    clef={currentQuestion.clef || 'treble'}
                    keySignature={currentQuestion.keySignature}
                    width={Math.min(500, typeof window !== 'undefined' ? window.innerWidth - 80 : 500)}
                    height={180}
                  />
                </div>
              ) : 'notes' in currentQuestion && currentQuestion.notes ? (
                <div className="flex justify-center">
                  <MusicNotation
                    notes={convertToNotes(currentQuestion.notes, 'type' in currentQuestion ? currentQuestion.type : undefined)}
                    clef={currentQuestion.clef || 'treble'}
                    width={Math.min('type' in currentQuestion && currentQuestion.type === 'scaleIdentification' ? 600 : 500, typeof window !== 'undefined' ? window.innerWidth - 80 : 500)}
                    height={180}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {(() => {
              // Hide correct answers if this is an assignment with multiple attempts remaining
              const hideCorrectAnswer = assignmentInfo && assignmentInfo.maxAttempts > 1 && assignmentInfo.attemptsRemaining > 1;

              return currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectOption = index === correctAnswerIndex;

                let buttonClass = 'bg-white border-gray-200 hover:border-brand/50 text-gray-700';

                if (showFeedback) {
                  if (hideCorrectAnswer) {
                    // When hiding answers, only show if the selected answer was correct/incorrect
                    if (isSelected) {
                      buttonClass = isCorrectOption
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-red-50 border-red-500 text-red-700';
                    } else {
                      buttonClass = 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed';
                    }
                  } else {
                    // Normal behavior: show which answer was correct
                    if (isCorrectOption) {
                      buttonClass = 'bg-green-50 border-green-500 text-green-700';
                    } else if (isSelected && !isCorrectOption) {
                      buttonClass = 'bg-red-50 border-red-500 text-red-700';
                    } else {
                      buttonClass = 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed';
                    }
                  }
                } else if (isSelected) {
                  buttonClass = 'bg-brand/10 border-brand text-brand';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${buttonClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {option}
                      </span>
                      {showFeedback && !hideCorrectAnswer && isCorrectOption && (
                        <span className="text-green-600 text-xl">✓</span>
                      )}
                      {showFeedback && isSelected && !isCorrectOption && (
                        <span className="text-red-600 text-xl">✗</span>
                      )}
                    </div>
                  </button>
                );
              });
            })()}
          </div>

          {/* Feedback message */}
          {showFeedback && (() => {
            // Hide correct answers if this is an assignment with multiple attempts remaining
            const hideCorrectAnswer = assignmentInfo && assignmentInfo.maxAttempts > 1 && assignmentInfo.attemptsRemaining > 1;
            return (
              <div className={`mb-6 p-4 rounded-xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{isCorrect ? '🎉' : (hideCorrectAnswer ? '🤔' : '💡')}</span>
                  <div>
                    <p className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {isCorrect ? 'Correct!' : 'Not quite right'}
                    </p>
                    {!isCorrect && !hideCorrectAnswer && (
                      <p className="text-sm text-gray-600">
                        The correct answer is: <span className="font-semibold">{currentQuestion.options[correctAnswerIndex]}</span>
                      </p>
                    )}
                    {!isCorrect && hideCorrectAnswer && (
                      <p className="text-sm text-gray-600">
                        You have more attempts remaining. Keep trying!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Timer display */}
          {timerEnabled && timeRemaining !== null && !showFeedback && (
            <div className={`mb-4 p-3 rounded-xl border-2 ${
              timeRemaining <= 10 ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300' :
              timeRemaining <= 30 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300' :
              'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className={`w-5 h-5 ${
                    timeRemaining <= 10 ? 'text-red-600' :
                    timeRemaining <= 30 ? 'text-amber-600' : 'text-blue-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Time Remaining</span>
                </div>
                <div className={`text-2xl font-bold ${
                  timeRemaining <= 10 ? 'text-red-600 animate-pulse' :
                  timeRemaining <= 30 ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeRemaining <= 10 ? 'bg-red-500' :
                    timeRemaining <= 30 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${(timeRemaining / timeLimitSeconds) * 100}%` }}
                />
              </div>
              {timeRemaining <= 10 && (
                <div className="mt-2 flex items-start gap-2 text-xs text-red-700">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Quiz will auto-submit when time expires! Unanswered questions will be marked wrong.</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="px-6 sm:px-8 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark active:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {showFeedback
                ? currentQuestionIndex === questions.length - 1
                  ? 'Finish Quiz'
                  : 'Next Question'
                : 'Check Answer'}
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
