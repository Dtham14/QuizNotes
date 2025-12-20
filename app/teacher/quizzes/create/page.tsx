'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeacherNav from '@/components/TeacherNav';
import MusicNotation, { Note } from '@/components/MusicNotation';
import AudioPlayer from '@/components/AudioPlayer';
import {
  generateQuestions,
  getDefaultSettings,
  QUIZ_TYPE_INFO,
} from '@/lib/quizBuilder';
import type { QuizType as BuilderQuizType, GeneratedQuestion, Difficulty } from '@/lib/quizBuilder/types';

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  avatar?: string | null;
};

type TeacherStats = {
  classCount: number;
  studentCount: number;
  quizCount: number;
  assignmentCount: number;
};

// Convert GeneratedQuestion to the format expected by the API
type QuizQuestion = {
  type: string;
  question: string;
  correctAnswer: number;
  options: string[];
  notes?: Note[];
  clef?: 'treble' | 'bass';
  keySignature?: string;
  earTraining?: {
    subtype: 'note' | 'chord' | 'interval';
    audioData: { notes: string[]; duration?: string };
  };
};

// Quiz types grouped by category
const VISUAL_QUIZ_TYPES: BuilderQuizType[] = [
  'noteIdentification',
  'keySignature',
  'intervalIdentification',
  'chordIdentification',
  'scaleIdentification',
];

const EAR_TRAINING_QUIZ_TYPES: BuilderQuizType[] = [
  'earTrainingNote',
  'earTrainingInterval',
  'earTrainingChord',
];

export default function CreateQuizPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Quick add state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedQuizType, setSelectedQuizType] = useState<BuilderQuizType>('noteIdentification');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('intermediate');
  const [questionCount, setQuestionCount] = useState(5);

  // Manual question creation state
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [questionType, setQuestionType] = useState<'custom' | 'noteIdentification' | 'keySignature' | 'intervalIdentification' | 'chordIdentification' | 'earTrainingNote' | 'earTrainingInterval' | 'earTrainingChord'>('custom');
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
  });
  // Notation settings
  const [notationClef, setNotationClef] = useState<'treble' | 'bass'>('treble');
  const [notationNotes, setNotationNotes] = useState<string[]>(['C/4']);
  const [notationKeySignature, setNotationKeySignature] = useState<string>('');
  // Audio settings for ear training
  const [audioNotes, setAudioNotes] = useState<string[]>(['C4']);

  useEffect(() => {
    fetchCurrentUser();
    fetchTeacherStats();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user && data.user.role === 'teacher') {
        setCurrentUser(data.user);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  };

  const fetchTeacherStats = async () => {
    try {
      const [classesRes, quizzesRes, assignmentsRes] = await Promise.all([
        fetch('/api/teacher/classes'),
        fetch('/api/teacher/quizzes'),
        fetch('/api/teacher/assignments'),
      ]);

      const classesData = await classesRes.json();
      const quizzesData = await quizzesRes.json();
      const assignmentsData = await assignmentsRes.json();

      const classList = classesData.classes || [];
      const totalStudents = classList.reduce((acc: number, c: { studentCount?: number }) => acc + (c.studentCount || 0), 0);

      setTeacherStats({
        classCount: classList.length,
        studentCount: totalStudents,
        quizCount: quizzesData.quizzes?.length || 0,
        assignmentCount: assignmentsData.assignments?.length || 0,
      });
    } catch {
      // Stats are optional
    }
  };

  // Convert GeneratedQuestion to QuizQuestion format
  const convertToQuizQuestion = (gq: GeneratedQuestion): QuizQuestion => {
    const correctIndex = gq.options.findIndex(opt => opt === gq.correctAnswer);

    // Convert notes to the expected format
    let notes: Note[] | undefined;
    if (gq.notes && gq.notes.length > 0) {
      notes = gq.notes.map(noteStr => {
        // Parse note string like "C/4" or "C#/4"
        const parts = noteStr.split('/');
        const notePart = parts[0];
        const octave = parts[1] || '4';

        // Extract accidental if present
        let accidental: string | undefined;
        let baseNote = notePart;
        if (notePart.includes('#')) {
          accidental = '#';
          baseNote = notePart.replace('#', '');
        } else if (notePart.includes('b')) {
          accidental = 'b';
          baseNote = notePart.replace('b', '');
        }

        return {
          keys: [`${baseNote.toLowerCase()}/${octave}`],
          duration: 'w',
          accidentals: accidental ? [{ index: 0, type: accidental }] : undefined,
        } as Note;
      });
    }

    return {
      type: gq.type,
      question: gq.question,
      correctAnswer: correctIndex >= 0 ? correctIndex : 0,
      options: gq.options,
      notes,
      clef: gq.clef,
      keySignature: gq.keySignature,
      earTraining: gq.audioData ? {
        subtype: gq.audioData.subtype,
        audioData: {
          notes: gq.audioData.notes,
          duration: gq.audioData.duration,
        },
      } : undefined,
    };
  };

  const handleQuickAdd = () => {
    try {
      const settings = getDefaultSettings(selectedQuizType, selectedDifficulty);
      settings.questionCount = questionCount;

      const generatedQuestions = generateQuestions(settings);
      const convertedQuestions = generatedQuestions.map(convertToQuizQuestion);

      setQuestions([...questions, ...convertedQuestions]);
      setShowQuickAdd(false);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate questions. Please try again.');
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateQuestion = () => {
    if (!newQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }
    if (newQuestion.options.some(opt => !opt.trim())) {
      alert('Please fill in all answer options');
      return;
    }

    const isVisualType = ['noteIdentification', 'keySignature', 'intervalIdentification', 'chordIdentification'].includes(questionType);
    const isEarTrainingType = ['earTrainingNote', 'earTrainingInterval', 'earTrainingChord'].includes(questionType);

    // Build notes for visual types
    let notes: Note[] | undefined;
    if (isVisualType && notationNotes.length > 0) {
      notes = notationNotes.map(noteStr => {
        const parts = noteStr.split('/');
        const notePart = parts[0];
        const octave = parts[1] || '4';

        let accidental: string | undefined;
        let baseNote = notePart;
        if (notePart.includes('#')) {
          accidental = '#';
          baseNote = notePart.replace('#', '');
        } else if (notePart.includes('b') && notePart.length > 1) {
          accidental = 'b';
          baseNote = notePart.replace('b', '');
        }

        return {
          keys: [`${baseNote.toLowerCase()}/${octave}`],
          duration: 'w',
          accidental,
        } as Note;
      });
    }

    // Build ear training data
    let earTraining: QuizQuestion['earTraining'] | undefined;
    if (isEarTrainingType && audioNotes.length > 0) {
      const subtype = questionType === 'earTrainingNote' ? 'note' : questionType === 'earTrainingInterval' ? 'interval' : 'chord';
      earTraining = {
        subtype,
        audioData: {
          notes: audioNotes,
          duration: '2n',
        },
      };
    }

    const customQuestion: QuizQuestion = {
      type: questionType,
      question: newQuestion.question,
      correctAnswer: newQuestion.correctAnswer,
      options: newQuestion.options,
      notes,
      clef: isVisualType ? notationClef : undefined,
      keySignature: questionType === 'keySignature' ? notationKeySignature : undefined,
      earTraining,
    };

    setQuestions([...questions, customQuestion]);
    resetQuestionForm();
    setShowCreateQuestion(false);
  };

  const resetQuestionForm = () => {
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    });
    setQuestionType('custom');
    setNotationClef('treble');
    setNotationNotes(['C/4']);
    setNotationKeySignature('');
    setAudioNotes(['C4']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    try {
      const res = await fetch('/api/teacher/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questions,
        }),
      });

      if (res.ok) {
        router.push('/profile');
      } else {
        alert('Failed to create quiz');
      }
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert('Failed to create quiz');
    }
  };

  const getQuizTypeLabel = (type: string): string => {
    const info = QUIZ_TYPE_INFO[type as BuilderQuizType];
    return info?.name || type;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
      <TeacherNav user={currentUser} stats={teacherStats} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Create Custom Quiz</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                placeholder="e.g., Week 3 Intervals Quiz"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                placeholder="Brief description of what this quiz covers"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Questions ({questions.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateQuestion(true)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Create Question
                  </button>
                  <button
                    onClick={() => setShowQuickAdd(true)}
                    className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Auto-Generate
                  </button>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="text-5xl mb-4">📝</div>
                  <p className="text-gray-500 mb-6">No questions added yet</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setShowCreateQuestion(true)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Create Your Own
                    </button>
                    <button
                      onClick={() => setShowQuickAdd(true)}
                      className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
                    >
                      Auto-Generate Questions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <span className="inline-block px-2 py-1 bg-brand/20 text-brand text-xs font-semibold rounded">
                              {getQuizTypeLabel(q.type)}
                            </span>
                          </div>
                          <p className="text-gray-900 font-medium mb-2">{q.question}</p>
                          {q.notes && q.notes.length > 0 && (
                            <div className="mb-3">
                              <MusicNotation
                                notes={q.notes}
                                clef={q.clef || 'treble'}
                                keySignature={q.keySignature}
                                width={300}
                                height={120}
                              />
                            </div>
                          )}
                          {q.earTraining && (
                            <div className="mb-3">
                              <AudioPlayer
                                subtype={q.earTraining.subtype}
                                audioData={q.earTraining.audioData}
                              />
                            </div>
                          )}
                          <div className="text-sm space-y-1">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className={optIdx === q.correctAnswer ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                                {optIdx === q.correctAnswer && '✓ '}
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          className="text-red-600 hover:text-red-700 text-sm ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <Link
                href="/profile"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                onClick={handleSaveQuiz}
                disabled={questions.length === 0}
                className="flex-1 px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Quiz
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Add Questions</h3>

            <div className="space-y-6">
              {/* Quiz Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Question Type
                </label>

                {/* Visual Quiz Types */}
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Staff Identification</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {VISUAL_QUIZ_TYPES.map((type) => {
                    const info = QUIZ_TYPE_INFO[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedQuizType(type)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedQuizType === type
                            ? 'border-brand bg-brand/10'
                            : 'border-gray-200 hover:border-brand/50'
                        }`}
                      >
                        <div className="text-lg mb-1">{info?.icon}</div>
                        <div className="text-sm font-medium text-gray-900">{info?.name}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Ear Training Types */}
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ear Training</p>
                <div className="grid grid-cols-3 gap-2">
                  {EAR_TRAINING_QUIZ_TYPES.map((type) => {
                    const info = QUIZ_TYPE_INFO[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedQuizType(type)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedQuizType === type
                            ? 'border-brand bg-brand/10'
                            : 'border-gray-200 hover:border-brand/50'
                        }`}
                      >
                        <div className="text-lg mb-1">{info?.icon}</div>
                        <div className="text-sm font-medium text-gray-900">{info?.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedDifficulty === diff
                          ? 'border-brand bg-brand text-white'
                          : 'border-gray-200 text-gray-700 hover:border-brand/50'
                      }`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold text-brand w-8 text-center">{questionCount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAdd}
                  className="flex-1 px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors font-medium"
                >
                  Add {questionCount} Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Question Modal */}
      {showCreateQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Custom Question</h3>

            <div className="space-y-5">
              {/* Question Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'custom', label: 'Text Only', icon: '📝' },
                    { id: 'noteIdentification', label: 'Note ID', icon: '🎵' },
                    { id: 'keySignature', label: 'Key Sig', icon: '🎼' },
                    { id: 'intervalIdentification', label: 'Interval', icon: '↔️' },
                    { id: 'chordIdentification', label: 'Chord', icon: '🎹' },
                    { id: 'earTrainingNote', label: 'Ear: Note', icon: '👂' },
                    { id: 'earTrainingInterval', label: 'Ear: Interval', icon: '🎧' },
                    { id: 'earTrainingChord', label: 'Ear: Chord', icon: '🔊' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setQuestionType(type.id as typeof questionType)}
                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                        questionType === type.id
                          ? 'border-brand bg-brand/10'
                          : 'border-gray-200 hover:border-brand/50'
                      }`}
                    >
                      <div className="text-lg">{type.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Notation Settings */}
              {['noteIdentification', 'keySignature', 'intervalIdentification', 'chordIdentification'].includes(questionType) && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">Notation Settings</h4>

                  {/* Clef Selection */}
                  <div className="flex gap-4">
                    <label className="text-sm font-medium text-gray-700 w-20">Clef:</label>
                    <div className="flex gap-2">
                      {(['treble', 'bass'] as const).map((clef) => (
                        <button
                          key={clef}
                          onClick={() => setNotationClef(clef)}
                          className={`px-4 py-1 rounded-lg text-sm font-medium transition-all ${
                            notationClef === clef
                              ? 'bg-brand text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:border-brand'
                          }`}
                        >
                          {clef === 'treble' ? '𝄞 Treble' : '𝄢 Bass'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Key Signature (for key sig questions) */}
                  {questionType === 'keySignature' && (
                    <div className="flex gap-4 items-center">
                      <label className="text-sm font-medium text-gray-700 w-20">Key:</label>
                      <select
                        value={notationKeySignature}
                        onChange={(e) => setNotationKeySignature(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                      >
                        <option value="">Select a key</option>
                        <optgroup label="Major Keys">
                          <option value="C">C Major (no sharps/flats)</option>
                          <option value="G">G Major (1 sharp)</option>
                          <option value="D">D Major (2 sharps)</option>
                          <option value="A">A Major (3 sharps)</option>
                          <option value="E">E Major (4 sharps)</option>
                          <option value="B">B Major (5 sharps)</option>
                          <option value="F#">F# Major (6 sharps)</option>
                          <option value="F">F Major (1 flat)</option>
                          <option value="Bb">Bb Major (2 flats)</option>
                          <option value="Eb">Eb Major (3 flats)</option>
                          <option value="Ab">Ab Major (4 flats)</option>
                          <option value="Db">Db Major (5 flats)</option>
                          <option value="Gb">Gb Major (6 flats)</option>
                        </optgroup>
                        <optgroup label="Minor Keys">
                          <option value="Am">A Minor (no sharps/flats)</option>
                          <option value="Em">E Minor (1 sharp)</option>
                          <option value="Bm">B Minor (2 sharps)</option>
                          <option value="F#m">F# Minor (3 sharps)</option>
                          <option value="C#m">C# Minor (4 sharps)</option>
                          <option value="Dm">D Minor (1 flat)</option>
                          <option value="Gm">G Minor (2 flats)</option>
                          <option value="Cm">C Minor (3 flats)</option>
                          <option value="Fm">F Minor (4 flats)</option>
                        </optgroup>
                      </select>
                    </div>
                  )}

                  {/* Notes Input */}
                  {questionType !== 'keySignature' && (
                    <div>
                      <div className="flex gap-4 items-start">
                        <label className="text-sm font-medium text-gray-700 w-20 pt-2">Notes:</label>
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {notationNotes.map((note, index) => (
                              <div key={index} className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-1">
                                <span className="text-sm font-medium text-gray-900">{note}</span>
                                <button
                                  onClick={() => setNotationNotes(notationNotes.filter((_, i) => i !== index))}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <select
                              id="noteSelect"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                              defaultValue=""
                            >
                              <option value="" disabled>Add note...</option>
                              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) =>
                                [2, 3, 4, 5, 6].map((oct) => (
                                  <option key={`${n}/${oct}`} value={`${n}/${oct}`}>{n}/{oct}</option>
                                ))
                              ).flat()}
                            </select>
                            <button
                              onClick={() => {
                                const select = document.getElementById('noteSelect') as HTMLSelectElement;
                                if (select.value) {
                                  setNotationNotes([...notationNotes, select.value]);
                                  select.value = '';
                                }
                              }}
                              className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm"
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {questionType === 'chordIdentification' ? 'Add multiple notes for chord' : questionType === 'intervalIdentification' ? 'Add 2 notes for interval' : 'Add notes to display'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Preview:</label>
                    <div className="bg-white rounded-lg p-2 inline-block">
                      <MusicNotation
                        notes={questionType !== 'keySignature' ? notationNotes.map(n => {
                          const parts = n.split('/');
                          const notePart = parts[0];
                          const octave = parts[1] || '4';
                          let accidental: string | undefined;
                          let baseNote = notePart;
                          if (notePart.includes('#')) {
                            accidental = '#';
                            baseNote = notePart.replace('#', '');
                          }
                          return { keys: [`${baseNote.toLowerCase()}/${octave}`], duration: 'w', accidental };
                        }) : undefined}
                        clef={notationClef}
                        keySignature={questionType === 'keySignature' ? notationKeySignature : undefined}
                        width={300}
                        height={120}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Ear Training Settings */}
              {['earTrainingNote', 'earTrainingInterval', 'earTrainingChord'].includes(questionType) && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">Audio Settings</h4>

                  <div>
                    <div className="flex gap-4 items-start">
                      <label className="text-sm font-medium text-gray-700 w-20 pt-2">Notes:</label>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {audioNotes.map((note, index) => (
                            <div key={index} className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-1">
                              <span className="text-sm font-medium text-gray-900">{note}</span>
                              <button
                                onClick={() => setAudioNotes(audioNotes.filter((_, i) => i !== index))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <select
                            id="audioNoteSelect"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                            defaultValue=""
                          >
                            <option value="" disabled>Add note...</option>
                            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) =>
                              [3, 4, 5].map((oct) => (
                                <option key={`${n}${oct}`} value={`${n}${oct}`}>{n}{oct}</option>
                              ))
                            ).flat()}
                          </select>
                          <button
                            onClick={() => {
                              const select = document.getElementById('audioNoteSelect') as HTMLSelectElement;
                              if (select.value) {
                                setAudioNotes([...audioNotes, select.value]);
                                select.value = '';
                              }
                            }}
                            className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm"
                          >
                            Add
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {questionType === 'earTrainingChord' ? 'Add notes for chord (played together)' : questionType === 'earTrainingInterval' ? 'Add 2 notes for interval' : 'Add note to play'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audio Preview */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Preview:</label>
                    <AudioPlayer
                      subtype={questionType === 'earTrainingNote' ? 'note' : questionType === 'earTrainingInterval' ? 'interval' : 'chord'}
                      audioData={{ notes: audioNotes, duration: '2n' }}
                    />
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text
                </label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                  placeholder={
                    questionType === 'noteIdentification' ? 'What note is shown on the staff?' :
                    questionType === 'keySignature' ? 'What key signature is shown?' :
                    questionType === 'intervalIdentification' ? 'What interval is shown?' :
                    questionType === 'chordIdentification' ? 'What chord is shown?' :
                    questionType === 'earTrainingNote' ? 'What note do you hear?' :
                    questionType === 'earTrainingInterval' ? 'What interval do you hear?' :
                    questionType === 'earTrainingChord' ? 'What chord do you hear?' :
                    'Enter your question here...'
                  }
                />
              </div>

              {/* Answer Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Options
                </label>
                <div className="space-y-2">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: index })}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          newQuestion.correctAnswer === index
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300 hover:border-green-300'
                        }`}
                        title={newQuestion.correctAnswer === index ? 'Correct answer' : 'Mark as correct'}
                      >
                        {newQuestion.correctAnswer === index && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click the circle to mark the correct answer
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateQuestion(false);
                    resetQuestionForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateQuestion}
                  className="flex-1 px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors font-medium"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
