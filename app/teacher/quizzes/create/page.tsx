'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TeacherNav from '@/components/TeacherNav';
import MusicNotation, { Note } from '@/components/MusicNotation';
import {
  intervalOptions,
  chordOptions,
  noteOptions,
  generateIntervalDistractors,
  generateChordDistractors,
  generateNoteDistractors,
} from '@/lib/musicTheoryOptions';

type QuizQuestion = {
  type: 'interval' | 'note' | 'chord';
  question: string;
  correctAnswer: number;
  options: string[];
  notes?: Note[];
  clef?: 'treble' | 'bass';
};

export default function CreateQuizPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    type: 'interval',
    question: '',
    correctAnswer: 0,
    options: ['', '', '', ''],
  });
  const [selectedMusicOption, setSelectedMusicOption] = useState<string>('');

  useEffect(() => {
    fetchCurrentUser();
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

  const getMusicOptions = () => {
    switch (currentQuestion.type) {
      case 'interval':
        return intervalOptions;
      case 'chord':
        return chordOptions;
      case 'note':
        return noteOptions;
      default:
        return [];
    }
  };

  const handleMusicOptionChange = (optionName: string) => {
    setSelectedMusicOption(optionName);

    if (!optionName) {
      setCurrentQuestion({
        ...currentQuestion,
        notes: undefined,
        clef: undefined,
        options: ['', '', '', ''],
        correctAnswer: 0,
      });
      return;
    }

    const musicData = getMusicOptions().find(opt => opt.name === optionName);
    if (!musicData) return;

    let distractors: string[] = [];
    if (currentQuestion.type === 'interval') {
      distractors = generateIntervalDistractors(optionName);
    } else if (currentQuestion.type === 'chord') {
      distractors = generateChordDistractors(optionName);
    } else if (currentQuestion.type === 'note') {
      const noteName = optionName.split(' ')[0].charAt(0);
      distractors = generateNoteDistractors(noteName, musicData.clef);
    }

    const allOptions = [optionName, ...distractors];
    const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);
    const correctIndex = shuffledOptions.indexOf(optionName);

    let defaultQuestion = currentQuestion.question;
    if (!defaultQuestion) {
      switch (currentQuestion.type) {
        case 'interval':
          defaultQuestion = 'What interval is shown?';
          break;
        case 'chord':
          defaultQuestion = 'What type of chord is this?';
          break;
        case 'note':
          defaultQuestion = 'What note is shown on the ' + musicData.clef + ' clef?';
          break;
      }
    }

    setCurrentQuestion({
      ...currentQuestion,
      question: defaultQuestion,
      notes: musicData.notes,
      clef: musicData.clef,
      options: shuffledOptions,
      correctAnswer: correctIndex,
    });
  };

  const handleTypeChange = (newType: 'interval' | 'note' | 'chord') => {
    setSelectedMusicOption('');
    setCurrentQuestion({
      type: newType,
      question: '',
      correctAnswer: 0,
      options: ['', '', '', ''],
      notes: undefined,
      clef: undefined,
    });
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }

    const validOptions = currentQuestion.options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please add at least 2 answer options');
      return;
    }

    const correctOption = currentQuestion.options[currentQuestion.correctAnswer];
    const newCorrectIndex = validOptions.indexOf(correctOption);

    setQuestions([...questions, {
      ...currentQuestion,
      options: validOptions,
      correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
    }]);
    setCurrentQuestion({
      type: 'interval',
      question: '',
      correctAnswer: 0,
      options: ['', '', '', ''],
    });
    setSelectedMusicOption('');
    setShowQuestionModal(false);
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleAddOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, ''],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (currentQuestion.options.length <= 2) {
      alert('Must have at least 2 options');
      return;
    }
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
      correctAnswer: currentQuestion.correctAnswer >= newOptions.length ? 0 : currentQuestion.correctAnswer,
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
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
        router.push('/teacher/quizzes');
      } else {
        alert('Failed to create quiz');
      }
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert('Failed to create quiz');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <TeacherNav />

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                placeholder="Brief description of what this quiz covers"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Questions ({questions.length})</h3>
                <button
                  onClick={() => setShowQuestionModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500">No questions added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded mb-2">
                            {q.type.toUpperCase()}
                          </span>
                          <p className="text-gray-900 font-medium mb-2">{q.question}</p>
                          {q.notes && (
                            <div className="mb-3">
                              <MusicNotation
                                notes={q.notes}
                                clef={q.clef || 'treble'}
                                width={300}
                                height={120}
                              />
                            </div>
                          )}
                          <div className="text-sm space-y-1">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className={optIdx === q.correctAnswer ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                                {optIdx === q.correctAnswer && '\u2713 '}
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
                href="/teacher/quizzes"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                onClick={handleSaveQuiz}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Quiz
              </button>
            </div>
          </div>
        </div>
      </main>

      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full my-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Add Question</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={currentQuestion.type}
                  onChange={(e) => handleTypeChange(e.target.value as 'interval' | 'note' | 'chord')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                >
                  <option value="interval">Interval</option>
                  <option value="note">Note</option>
                  <option value="chord">Chord</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select {currentQuestion.type === 'interval' ? 'Interval' : currentQuestion.type === 'chord' ? 'Chord' : 'Note'}
                </label>
                <select
                  value={selectedMusicOption}
                  onChange={(e) => handleMusicOptionChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                >
                  <option value="">-- Select an option --</option>
                  {getMusicOptions().map((opt) => (
                    <option key={opt.name} value={opt.name}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecting an option will auto-generate the music notation and answer choices
                </p>
              </div>

              {currentQuestion.notes && currentQuestion.notes.length > 0 && (
                <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                  <MusicNotation
                    notes={currentQuestion.notes}
                    clef={currentQuestion.clef || 'treble'}
                    width={350}
                    height={130}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text
                </label>
                <input
                  type="text"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                  placeholder="e.g., What interval is shown?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Options
                </label>
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={currentQuestion.correctAnswer === index}
                        onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                        className="mt-3"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleUpdateOption(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-gray-900"
                        placeholder={'Option ' + (index + 1)}
                      />
                      {currentQuestion.options.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddOption}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    + Add Option
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Select the radio button next to the correct answer</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowQuestionModal(false);
                    setCurrentQuestion({
                      type: 'interval',
                      question: '',
                      correctAnswer: 0,
                      options: ['', '', '', ''],
                    });
                    setSelectedMusicOption('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
