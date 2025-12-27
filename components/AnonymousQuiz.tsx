'use client';

import { useState, useEffect } from 'react';
import MusicNotation, { Note } from './MusicNotation';
import AudioPlayer from './AudioPlayer';
import {
  generateQuestions,
  generateMixedQuiz,
  getDefaultSettings,
  type MixedQuizCategory
} from '@/lib/quizBuilder';
import type { GeneratedQuestion, QuizType as BuilderQuizType } from '@/lib/quizBuilder/types';

// Extended quiz type to include mixed categories
type QuizCategory = BuilderQuizType | 'mixedStaff' | 'mixedEarTraining' | 'mixedAll';

function generateSessionId(): string {
  return 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();

  let sessionId = sessionStorage.getItem('quizSessionId');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('quizSessionId', sessionId);
  }
  return sessionId;
}

type AnonymousQuizProps = {
  onClose: () => void;
  initialType?: string;
};

export default function AnonymousQuiz({ onClose, initialType }: AnonymousQuizProps) {
  const [quizCategory, setQuizCategory] = useState<QuizCategory | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Map old quiz types to new ones
  const mapInitialType = (type: string): QuizCategory | null => {
    const typeMap: Record<string, QuizCategory> = {
      'intervals': 'intervalIdentification',
      'chords': 'chordIdentification',
      'scales': 'scaleIdentification',
      'noteIdentification': 'noteIdentification',
      'keySignature': 'keySignature',
      'ear-training': 'mixedEarTraining',
      'earTrainingNote': 'earTrainingNote',
      'earTrainingInterval': 'earTrainingInterval',
      'earTrainingChord': 'earTrainingChord',
      'mixed': 'mixedAll',
    };
    return typeMap[type] || null;
  };

  useEffect(() => {
    if (initialType) {
      const mappedType = mapInitialType(initialType);
      if (mappedType) {
        startQuiz(mappedType);
      }
    }
  }, [initialType]);

  const generateQuestionsForCategory = (category: QuizCategory): GeneratedQuestion[] => {
    try {
      // Handle mixed quiz categories
      if (category === 'mixedStaff') {
        return generateMixedQuiz('visual', 10, 'intermediate');
      }
      if (category === 'mixedEarTraining') {
        return generateMixedQuiz('earTraining', 10, 'intermediate');
      }
      if (category === 'mixedAll') {
        return generateMixedQuiz('all', 10, 'intermediate');
      }

      // Handle individual quiz types
      const settings = getDefaultSettings(category as BuilderQuizType, 'intermediate');
      return generateQuestions({ ...settings, questionCount: 10 });
    } catch (error) {
      console.error('Failed to generate questions:', error);
      return [];
    }
  };

  const startQuiz = (category: QuizCategory) => {
    const generatedQuestions = generateQuestionsForCategory(category);
    setQuizCategory(category);
    setQuestions(generatedQuestions);
    setAnswers(new Array(generatedQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowResult(false);
    setScore(0);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showFeedback) return; // Prevent changing answer after feedback is shown
    setSelectedAnswer(answerIndex);
  };

  const getCorrectAnswerIndex = (question: GeneratedQuestion): number => {
    return question.options.findIndex(opt => opt === question.correctAnswer);
  };

  const handleNext = () => {
    // If feedback not shown yet, show it first
    if (!showFeedback) {
      setShowFeedback(true);
      return;
    }

    // Feedback was shown, now move to next question
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      submitQuiz(newAnswers);
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
      await fetch('/api/quiz/anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizType: quizCategory,
          score: calculatedScore,
          totalQuestions: questions.length,
          answers: finalAnswers,
          sessionId,
        }),
      });
    } catch (error) {
      console.error('Failed to save anonymous quiz:', error);
    } finally {
      setLoading(false);
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setQuizCategory(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswers([]);
    setShowResult(false);
    setScore(0);
  };

  // Helper to extract accidental from a VexFlow note string
  const extractAccidental = (noteStr: string): string | null => {
    const match = noteStr.match(/^[a-g](#|b)?\/\d+$/i);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  };

  // Convert string[] notes to Note[] for MusicNotation
  const convertToNotes = (notes: string[], questionType?: string): Note[] => {
    if (notes.length === 0) return [];

    // For scales, render each note individually (horizontally)
    if (questionType === 'scaleIdentification') {
      return notes.map(noteStr => {
        const accidental = extractAccidental(noteStr);
        const note: Note = { keys: [noteStr], duration: 'q' };
        if (accidental) {
          note.accidentals = [accidental];
        }
        return note;
      });
    }

    // For intervals, render notes separately but horizontally as whole notes
    if (questionType === 'intervalIdentification' && notes.length === 2) {
      return notes.map(noteStr => {
        const accidental = extractAccidental(noteStr);
        const note: Note = { keys: [noteStr], duration: 'w' };
        if (accidental) {
          note.accidentals = [accidental];
        }
        return note;
      });
    }

    // For chords and other types, stack notes vertically
    const accidentals = notes.map(extractAccidental);
    const hasAnyAccidentals = accidentals.some(acc => acc !== null);

    const result: Note = {
      keys: notes,
      duration: 'w',
    };

    if (hasAnyAccidentals) {
      result.accidentals = accidentals.map(acc => acc || 'n');
    }

    return [result];
  };

  const getQuizTypeLabel = (category: QuizCategory): string => {
    const labels: Record<QuizCategory, string> = {
      'noteIdentification': 'Note Identification',
      'keySignature': 'Key Signature',
      'intervalIdentification': 'Interval Identification',
      'chordIdentification': 'Chord Identification',
      'scaleIdentification': 'Scale Identification',
      'earTrainingNote': 'Note Recognition',
      'earTrainingInterval': 'Interval Recognition',
      'earTrainingChord': 'Chord Recognition',
      'mixedStaff': 'Mixed Staff Identification',
      'mixedEarTraining': 'Mixed Ear Training',
      'mixedAll': 'Mixed Quiz',
    };
    return labels[category] || category;
  };

  // Topic selection screen - matching landing page format
  if (!quizCategory) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Choose a Quiz Topic</h2>
              <p className="text-sm sm:text-base text-gray-600">No account required - just pick a topic and start!</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Quick Start */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Start</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => startQuiz('mixedStaff')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">🎼</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Mixed Staff Identification Quiz</h3>
                  <p className="text-sm text-gray-500 flex-grow">Random staff notation questions (10 questions)</p>
                </button>

                <button
                  onClick={() => startQuiz('mixedEarTraining')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">👂</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Mixed Ear Training Quiz</h3>
                  <p className="text-sm text-gray-500 flex-grow">Random ear training questions (10 questions)</p>
                </button>

                <button
                  onClick={() => startQuiz('mixedAll')}
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

            {/* Staff Identification */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Staff Identification</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => startQuiz('noteIdentification')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Note Identification</h3>
                  <p className="text-sm text-gray-500 flex-grow">Identify notes on the musical staff</p>
                </button>

                <button
                  onClick={() => startQuiz('keySignature')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">🎼</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Key Signature</h3>
                  <p className="text-sm text-gray-500 flex-grow">Identify key signatures and their names</p>
                </button>

                <button
                  onClick={() => startQuiz('intervalIdentification')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">📏</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Interval Identification</h3>
                  <p className="text-sm text-gray-500 flex-grow">Identify intervals between notes</p>
                </button>

                <button
                  onClick={() => startQuiz('chordIdentification')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">🎹</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Chord Identification</h3>
                  <p className="text-sm text-gray-500 flex-grow">Identify chord types from notation</p>
                </button>

                <button
                  onClick={() => startQuiz('scaleIdentification')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">🎚️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Scale Identification</h3>
                  <p className="text-sm text-gray-500 flex-grow">Identify scale types and modes</p>
                </button>
              </div>
            </div>

            {/* Ear Training */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ear Training</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => startQuiz('earTrainingNote')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">👂</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Note Recognition</h3>
                  <p className="text-sm text-gray-500 flex-grow">Identify notes by ear</p>
                </button>

                <button
                  onClick={() => startQuiz('earTrainingInterval')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">🔊</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Interval Recognition</h3>
                  <p className="text-sm text-gray-500 flex-grow">Identify intervals by ear</p>
                </button>

                <button
                  onClick={() => startQuiz('earTrainingChord')}
                  className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand hover:shadow-md transition-all text-left flex flex-col"
                >
                  <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                    <span className="text-2xl">🎧</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Chord Recognition</h3>
                  <p className="text-sm text-gray-500 flex-grow">Identify chord types by ear</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while questions are being populated
  if (quizCategory && questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">{percentage >= 70 ? '🎉' : '📚'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
              <p className="text-lg sm:text-xl text-gray-600">
                You scored <span className="font-bold text-brand">{score}</span> out of{' '}
                <span className="font-bold">{questions.length}</span>
              </p>
              <p className="text-3xl font-bold text-brand mt-2">{percentage}%</p>
            </div>

            <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto">
              {questions.map((question, index) => {
                const userAnswer = answers[index];
                const correctIdx = getCorrectAnswerIndex(question);
                const isCorrect = userAnswer === correctIdx;
                return (
                  <div
                    key={question.id}
                    className={`p-3 rounded-lg border-2 ${
                      isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{isCorrect ? '✓' : '✗'}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Q{index + 1}: {question.question}</p>
                        {!isCorrect && (
                          <p className="text-xs mt-1">
                            <span className="text-red-600">Your answer: {userAnswer !== null ? question.options[userAnswer] : 'None'}</span>
                            <br />
                            <span className="text-green-600">
                              Correct: {question.correctAnswer}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={resetQuiz}
                className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
              >
                Try Another Quiz
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors border-2 border-gray-200"
              >
                Close
              </button>
            </div>

            <div className="mt-6 p-4 bg-brand/10 rounded-lg text-center">
              <p className="text-sm text-brand font-medium mb-2">
                Want to track your progress and unlock more features?
              </p>
              <a
                href="/login?tab=register"
                className="text-brand font-semibold hover:underline"
              >
                Create a free account →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  const currentQuestion = questions[currentQuestionIndex];
  const isEarTraining = currentQuestion.audioData !== undefined;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <span className="px-3 py-1 bg-brand/20 text-brand rounded-full text-sm font-semibold">
            {getQuizTypeLabel(quizCategory)}
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-brand h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">{currentQuestion.question}</h3>

          <div className="flex justify-center mb-6 overflow-x-auto">
            <div className="min-w-0 w-full max-w-full flex justify-center">
              {isEarTraining && currentQuestion.audioData ? (
                <AudioPlayer
                  subtype={currentQuestion.audioData.subtype}
                  audioData={{ notes: currentQuestion.audioData.notes, duration: currentQuestion.audioData.duration }}
                />
              ) : currentQuestion.notes && currentQuestion.notes.length > 0 ? (
                <MusicNotation
                  notes={convertToNotes(currentQuestion.notes, currentQuestion.type)}
                  clef={currentQuestion.clef || 'treble'}
                  keySignature={currentQuestion.keySignature}
                  width={Math.min(450, typeof window !== 'undefined' ? window.innerWidth - 80 : 450)}
                  height={160}
                />
              ) : currentQuestion.keySignature ? (
                <MusicNotation
                  notes={[]}
                  clef={currentQuestion.clef || 'treble'}
                  keySignature={currentQuestion.keySignature}
                  width={Math.min(450, typeof window !== 'undefined' ? window.innerWidth - 80 : 450)}
                  height={160}
                />
              ) : null}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const correctIdx = getCorrectAnswerIndex(currentQuestion);
              const isCorrect = index === correctIdx;
              const isSelected = selectedAnswer === index;

              let buttonClass = 'w-full p-4 text-left rounded-lg border-2 transition-all ';

              if (showFeedback) {
                if (isCorrect) {
                  buttonClass += 'bg-green-100 border-green-500 text-green-800';
                } else if (isSelected && !isCorrect) {
                  buttonClass += 'bg-red-100 border-red-500 text-red-800';
                } else {
                  buttonClass += 'bg-gray-50 border-gray-200 text-gray-400';
                }
              } else if (isSelected) {
                buttonClass += 'bg-brand/10 border-brand text-brand';
              } else {
                buttonClass += 'bg-white border-gray-200 hover:border-brand/50 text-gray-700';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={showFeedback}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {option}
                    </span>
                    {showFeedback && isCorrect && (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {showFeedback && isSelected && !isCorrect && (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <button
              onClick={handleNext}
              disabled={selectedAnswer === null || loading}
              className="px-5 py-2.5 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : !showFeedback ? 'Check Answer' : currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
