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
  avatarUrl?: string | null;
  themeColor?: string | null;
};

type TeacherStats = {
  classCount: number;
  studentCount: number;
  quizCount: number;
  assignmentCount: number;
};

// Chromatic notes - each note separate (no combined enharmonics)
type NoteOption = {
  display: string;      // What to show (e.g., "C#")
  value: string;        // Value for VexFlow notation (e.g., "C#")
  audioValue: string;   // Value for audio playback (e.g., "C#")
  isFlat?: boolean;     // Whether this is a flat (for styling)
  baseNote: string;     // The base pitch class (0-11) for conflict detection
};

// Map of note names to pitch class (0-11)
const NOTE_TO_PITCH: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
};

// Get pitch class from a note string (e.g., "C#/4" -> 1, "C#4" -> 1)
const getPitchClass = (noteStr: string): { pitch: number; octave: number } => {
  // Handle VexFlow format (C#/4) or audio format (C#4)
  const match = noteStr.match(/^([A-Ga-g][#b]?)[\/_]?(\d)$/);
  if (match) {
    const noteName = match[1].toUpperCase();
    const octave = parseInt(match[2]);
    return { pitch: NOTE_TO_PITCH[noteName] ?? 0, octave };
  }
  return { pitch: 0, octave: 4 };
};

// Enharmonic equivalents map (notes that sound the same)
const ENHARMONIC_PAIRS: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
};

// Get the note name (letter + accidental) from a note string
const getNoteName = (noteStr: string): { name: string; octave: string; letter: string } | null => {
  // Handle both formats: "C#/4" and "C#4"
  const match = noteStr.match(/^([A-Ga-g])([#b])?[\/]?(\d)$/);
  if (!match) return null;
  const letter = match[1].toUpperCase();
  const accidental = match[2] || '';
  // Normalize: letter uppercase, accidental as-is (# or b)
  return {
    name: letter + accidental,
    octave: match[3],
    letter: letter
  };
};

// Check if adding a note would conflict with existing notes
// Conflicts:
// 1. Same letter with different accidental: C/C#, C/Cb, A/A#, A/Ab - BLOCKED
// 2. Enharmonic equivalents: C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb - BLOCKED
// Allowed:
// - Different letters that aren't enharmonic: C/Db, F/Gb - ALLOWED
const hasConflict = (existingNotes: string[], newNote: NoteOption): boolean => {
  const newParsed = getNoteName(newNote.display);
  if (!newParsed) return false;

  const newName = newParsed.name;
  const newOctave = newParsed.octave;
  const newLetter = newParsed.letter;

  for (const existing of existingNotes) {
    const existingParsed = getNoteName(existing);
    if (!existingParsed) continue;

    const existingName = existingParsed.name;
    const existingOctave = existingParsed.octave;
    const existingLetter = existingParsed.letter;

    // Must be same octave to conflict
    if (existingOctave !== newOctave) continue;

    // Conflict 1: Same letter with any accidental difference (C/C#, C/Cb, A/A#)
    if (existingLetter === newLetter && existingName !== newName) {
      return true;
    }

    // Conflict 2: Enharmonic equivalents (C#/Db, D#/Eb, etc.)
    const enharmonicOfNew = ENHARMONIC_PAIRS[newName];
    if (enharmonicOfNew && enharmonicOfNew === existingName) {
      return true;
    }
  }
  return false;
};

// Generate chromatic notes for a given octave range - each note separate
const generateChromaticNotes = (startOctave: number, endOctave: number): NoteOption[][] => {
  // Each chromatic pitch as separate entries (sharps and flats separate)
  const chromaticPattern: { display: string; audioValue: string; isFlat?: boolean }[] = [
    { display: 'C', audioValue: 'C' },
    { display: 'C#', audioValue: 'C#' },
    { display: 'Db', audioValue: 'Db', isFlat: true },
    { display: 'D', audioValue: 'D' },
    { display: 'D#', audioValue: 'D#' },
    { display: 'Eb', audioValue: 'Eb', isFlat: true },
    { display: 'E', audioValue: 'E' },
    { display: 'F', audioValue: 'F' },
    { display: 'F#', audioValue: 'F#' },
    { display: 'Gb', audioValue: 'Gb', isFlat: true },
    { display: 'G', audioValue: 'G' },
    { display: 'G#', audioValue: 'G#' },
    { display: 'Ab', audioValue: 'Ab', isFlat: true },
    { display: 'A', audioValue: 'A' },
    { display: 'A#', audioValue: 'A#' },
    { display: 'Bb', audioValue: 'Bb', isFlat: true },
    { display: 'B', audioValue: 'B' },
  ];

  const notesByOctave: NoteOption[][] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    const octaveNotes: NoteOption[] = chromaticPattern.map(note => ({
      display: `${note.display}${octave}`,
      value: `${note.display}/${octave}`,
      audioValue: `${note.audioValue}${octave}`,
      isFlat: note.isFlat,
      baseNote: note.display.replace(/[#b]/, ''),
    }));
    notesByOctave.push(octaveNotes);
  }

  return notesByOctave;
};

// Treble clef: C4 to C6
const TREBLE_NOTES = generateChromaticNotes(4, 6);
// Bass clef: C2 to C4
const BASS_NOTES = generateChromaticNotes(2, 4);

// Key signatures organized by circle of fifths
type KeySignatureOption = {
  value: string;
  label: string;
  accidentals: string;
  type: 'major' | 'minor';
};

const MAJOR_KEYS: KeySignatureOption[] = [
  // Flat keys (left side of circle)
  { value: 'Gb', label: 'Gb', accidentals: '6♭', type: 'major' },
  { value: 'Db', label: 'Db', accidentals: '5♭', type: 'major' },
  { value: 'Ab', label: 'Ab', accidentals: '4♭', type: 'major' },
  { value: 'Eb', label: 'Eb', accidentals: '3♭', type: 'major' },
  { value: 'Bb', label: 'Bb', accidentals: '2♭', type: 'major' },
  { value: 'F', label: 'F', accidentals: '1♭', type: 'major' },
  // No accidentals (center)
  { value: 'C', label: 'C', accidentals: '—', type: 'major' },
  // Sharp keys (right side of circle)
  { value: 'G', label: 'G', accidentals: '1♯', type: 'major' },
  { value: 'D', label: 'D', accidentals: '2♯', type: 'major' },
  { value: 'A', label: 'A', accidentals: '3♯', type: 'major' },
  { value: 'E', label: 'E', accidentals: '4♯', type: 'major' },
  { value: 'B', label: 'B', accidentals: '5♯', type: 'major' },
  { value: 'F#', label: 'F#', accidentals: '6♯', type: 'major' },
];

const MINOR_KEYS: KeySignatureOption[] = [
  // Flat keys (left side of circle)
  { value: 'Ebm', label: 'Eb', accidentals: '6♭', type: 'minor' },
  { value: 'Bbm', label: 'Bb', accidentals: '5♭', type: 'minor' },
  { value: 'Fm', label: 'F', accidentals: '4♭', type: 'minor' },
  { value: 'Cm', label: 'C', accidentals: '3♭', type: 'minor' },
  { value: 'Gm', label: 'G', accidentals: '2♭', type: 'minor' },
  { value: 'Dm', label: 'D', accidentals: '1♭', type: 'minor' },
  // No accidentals (center)
  { value: 'Am', label: 'A', accidentals: '—', type: 'minor' },
  // Sharp keys (right side of circle)
  { value: 'Em', label: 'E', accidentals: '1♯', type: 'minor' },
  { value: 'Bm', label: 'B', accidentals: '2♯', type: 'minor' },
  { value: 'F#m', label: 'F#', accidentals: '3♯', type: 'minor' },
  { value: 'C#m', label: 'C#', accidentals: '4♯', type: 'minor' },
  { value: 'G#m', label: 'G#', accidentals: '5♯', type: 'minor' },
  { value: 'D#m', label: 'D#', accidentals: '6♯', type: 'minor' },
];

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
    subtype: 'note' | 'chord' | 'interval' | 'sequence';
    audioData: { notes: string[]; noteGroups?: string[][]; duration?: string };
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
  const [questionType, setQuestionType] = useState<'custom' | 'noteIdentification' | 'keySignature' | 'intervalIdentification' | 'chordIdentification' | 'customStaff' | 'earTrainingNote' | 'earTrainingInterval' | 'earTrainingChord' | 'customEarTraining'>('custom');
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

  // Custom staff/ear training - note groups (each group is either a single note or a chord)
  type NoteGroup = { type: 'note'; note: string } | { type: 'chord'; notes: string[] };
  const [staffNoteGroups, setStaffNoteGroups] = useState<NoteGroup[]>([]);
  const [staffInputMode, setStaffInputMode] = useState<'note' | 'chord'>('note');
  const [currentChordNotes, setCurrentChordNotes] = useState<string[]>([]);

  const [audioNoteGroups, setAudioNoteGroups] = useState<NoteGroup[]>([]);
  const [audioInputMode, setAudioInputMode] = useState<'note' | 'chord'>('note');
  const [currentAudioChordNotes, setCurrentAudioChordNotes] = useState<string[]>([]);

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
      // For chord questions, stack all notes together
      if (gq.type === 'chordIdentification' && gq.notes.length > 1) {
        const keys: string[] = [];
        const accidentals: string[] = [];
        gq.notes.forEach(noteStr => {
          const parts = noteStr.split('/');
          const notePart = parts[0];
          const octave = parts[1] || '4';
          let baseNote = notePart;
          let acc = 'n';
          if (notePart.includes('#')) {
            acc = '#';
            baseNote = notePart.replace('#', '');
          } else if (notePart.includes('b') && notePart.length > 1) {
            acc = 'b';
            baseNote = notePart.replace('b', '');
          }
          keys.push(`${baseNote.toLowerCase()}/${octave}`);
          accidentals.push(acc);
        });
        notes = [{
          keys,
          duration: 'w',
          accidentals: accidentals.some(a => a !== 'n') ? accidentals : undefined,
        }];
      } else {
        // For other types, render notes separately
        notes = gq.notes.map(noteStr => {
          // Parse note string like "C/4" or "C#/4" or "Bb/4"
          const parts = noteStr.split('/');
          const notePart = parts[0];
          const octave = parts[1] || '4';

          // Extract accidental if present
          let accidental: string | undefined;
          let baseNote = notePart;
          if (notePart.includes('#')) {
            accidental = '#';
            baseNote = notePart.replace('#', '');
          } else if (notePart.length > 1 && notePart.includes('b')) {
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

    const isVisualType = ['noteIdentification', 'keySignature', 'intervalIdentification', 'chordIdentification', 'customStaff'].includes(questionType);
    const isEarTrainingType = ['earTrainingNote', 'earTrainingInterval', 'earTrainingChord', 'customEarTraining'].includes(questionType);

    // Helper to parse note string to VexFlow format
    const parseNoteStr = (noteStr: string) => {
      const parts = noteStr.split('/');
      const notePart = parts[0];
      const octave = parts[1] || '4';
      let baseNote = notePart;
      let accidental: string | undefined;
      if (notePart.includes('#')) {
        accidental = '#';
        baseNote = notePart.replace('#', '');
      } else if (notePart.includes('b') && notePart.length > 1) {
        accidental = 'b';
        baseNote = notePart.replace('b', '');
      }
      return { baseNote: baseNote.toLowerCase(), octave, accidental };
    };

    // Build notes for visual types
    let notes: Note[] | undefined;

    // For customStaff, use staffNoteGroups
    if (questionType === 'customStaff' && staffNoteGroups.length > 0) {
      notes = staffNoteGroups.map(group => {
        if (group.type === 'note') {
          const parsed = parseNoteStr(group.note);
          return {
            keys: [`${parsed.baseNote}/${parsed.octave}`],
            duration: 'w',
            accidental: parsed.accidental,
          };
        } else {
          // Chord
          const keys: string[] = [];
          const accidentals: string[] = [];
          group.notes.forEach(n => {
            const parsed = parseNoteStr(n);
            keys.push(`${parsed.baseNote}/${parsed.octave}`);
            accidentals.push(parsed.accidental || 'n');
          });
          return {
            keys,
            duration: 'w',
            accidentals: accidentals.some(a => a !== 'n') ? accidentals : undefined,
          };
        }
      });
    } else if (isVisualType && notationNotes.length > 0 && questionType !== 'customStaff') {
      // For chords, stack all notes together in one Note object
      if (questionType === 'chordIdentification' && notationNotes.length > 1) {
        const keys: string[] = [];
        const accidentals: string[] = [];
        notationNotes.forEach(noteStr => {
          const parsed = parseNoteStr(noteStr);
          keys.push(`${parsed.baseNote}/${parsed.octave}`);
          accidentals.push(parsed.accidental || 'n');
        });
        notes = [{
          keys,
          duration: 'w',
          accidentals: accidentals.some(a => a !== 'n') ? accidentals : undefined,
        }];
      } else {
        // For other types, render notes separately
        notes = notationNotes.map(noteStr => {
          const parsed = parseNoteStr(noteStr);
          return {
            keys: [`${parsed.baseNote}/${parsed.octave}`],
            duration: 'w',
            accidental: parsed.accidental,
          } as Note;
        });
      }
    }

    // Build ear training data
    let earTraining: QuizQuestion['earTraining'] | undefined;

    // For customEarTraining, use audioNoteGroups with sequence playback
    if (questionType === 'customEarTraining' && audioNoteGroups.length > 0) {
      // Build note groups for sequence playback
      const noteGroups: string[][] = audioNoteGroups.map(group =>
        group.type === 'note' ? [group.note] : group.notes
      );
      const allNotes: string[] = noteGroups.flat();
      earTraining = {
        subtype: 'sequence', // Plays each group in sequence
        audioData: {
          notes: allNotes,
          noteGroups,
          duration: '2n',
        },
      };
    } else if (isEarTrainingType && audioNotes.length > 0 && questionType !== 'customEarTraining') {
      const subtype = questionType === 'earTrainingNote' ? 'note'
        : questionType === 'earTrainingInterval' ? 'interval'
        : 'chord';
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
      keySignature: (questionType === 'keySignature' || questionType === 'customStaff') && notationKeySignature ? notationKeySignature : undefined,
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
    // Reset custom staff/ear training states
    setStaffNoteGroups([]);
    setStaffInputMode('note');
    setCurrentChordNotes([]);
    setAudioNoteGroups([]);
    setAudioInputMode('note');
    setCurrentAudioChordNotes([]);
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
        router.push('/dashboard');
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Create Custom Quiz</h2>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>

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
                  <p className="text-gray-500">No questions added yet. Use the buttons above to get started.</p>
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

            <div className="pt-6">
              <button
                onClick={handleSaveQuiz}
                disabled={questions.length === 0}
                className="w-full px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Create Custom Question</h3>
              <button
                onClick={() => setShowCreateQuestion(false)}
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Go Back
              </button>
            </div>

            <div className="space-y-5">
              {/* Question Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>

                {/* Staff Identification */}
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Staff Identification</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { id: 'noteIdentification', label: 'Note ID', icon: '🎵' },
                    { id: 'keySignature', label: 'Key Sig', icon: '🎼' },
                    { id: 'intervalIdentification', label: 'Interval', icon: '↔️' },
                    { id: 'chordIdentification', label: 'Chord', icon: '🎹' },
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

                {/* Ear Training */}
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ear Training</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
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

                {/* Custom */}
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Custom</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'custom', label: 'Text Only', icon: '📝' },
                    { id: 'customStaff', label: 'Comprehensive Notation Builder', icon: '🎻' },
                    { id: 'customEarTraining', label: 'Comprehensive Ear Training Builder', icon: '🎶' },
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
              {['noteIdentification', 'keySignature', 'intervalIdentification', 'chordIdentification', 'customStaff'].includes(questionType) && (
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

                  {/* Key Signature (for key sig questions and custom staff) */}
                  {(questionType === 'keySignature' || questionType === 'customStaff') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          {questionType === 'customStaff' ? 'Key Signature (optional):' : 'Select Key:'}
                        </label>
                        {notationKeySignature ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-brand">
                              Selected: {notationKeySignature.includes('m') ? `${notationKeySignature.replace('m', '')} Minor` : `${notationKeySignature} Major`}
                            </span>
                            {questionType === 'customStaff' && (
                              <button
                                onClick={() => setNotationKeySignature('')}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        ) : questionType === 'customStaff' ? (
                          <span className="text-xs text-gray-500">No key signature</span>
                        ) : null}
                      </div>

                      {/* Major Keys */}
                      <div className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">Major Keys</div>
                        <div className="overflow-x-auto pb-2">
                          <div className="flex gap-1 min-w-max">
                            {MAJOR_KEYS.map((key) => {
                              const isSelected = notationKeySignature === key.value;
                              const isFlat = key.accidentals.includes('♭');
                              const isNatural = key.accidentals === '—';
                              return (
                                <button
                                  key={key.value}
                                  onClick={() => setNotationKeySignature(key.value)}
                                  className={`px-2 py-2 rounded text-xs font-medium transition-all whitespace-nowrap flex flex-col items-center min-w-[44px] ${
                                    isSelected
                                      ? 'bg-brand text-white shadow-md scale-105'
                                      : isNatural
                                        ? 'bg-green-50 text-green-700 hover:bg-brand/20 hover:text-brand border border-green-200'
                                        : isFlat
                                          ? 'bg-amber-50 text-amber-700 hover:bg-brand/20 hover:text-brand border border-amber-200'
                                          : 'bg-blue-50 text-blue-700 hover:bg-brand/20 hover:text-brand border border-blue-200'
                                  }`}
                                >
                                  <span className="font-bold">{key.label}</span>
                                  <span className="text-[10px] opacity-75">{key.accidentals}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Minor Keys */}
                      <div className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">Minor Keys</div>
                        <div className="overflow-x-auto pb-2">
                          <div className="flex gap-1 min-w-max">
                            {MINOR_KEYS.map((key) => {
                              const isSelected = notationKeySignature === key.value;
                              const isFlat = key.accidentals.includes('♭');
                              const isNatural = key.accidentals === '—';
                              return (
                                <button
                                  key={key.value}
                                  onClick={() => setNotationKeySignature(key.value)}
                                  className={`px-2 py-2 rounded text-xs font-medium transition-all whitespace-nowrap flex flex-col items-center min-w-[44px] ${
                                    isSelected
                                      ? 'bg-brand text-white shadow-md scale-105'
                                      : isNatural
                                        ? 'bg-green-50 text-green-700 hover:bg-brand/20 hover:text-brand border border-green-200'
                                        : isFlat
                                          ? 'bg-amber-50 text-amber-700 hover:bg-brand/20 hover:text-brand border border-amber-200'
                                          : 'bg-blue-50 text-blue-700 hover:bg-brand/20 hover:text-brand border border-blue-200'
                                  }`}
                                >
                                  <span className="font-bold">{key.label}m</span>
                                  <span className="text-[10px] opacity-75">{key.accidentals}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-50 rounded border border-green-200"></span> No accidentals</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-50 rounded border border-blue-200"></span> Sharps</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-50 rounded border border-amber-200"></span> Flats</span>
                      </div>
                    </div>
                  )}

                  {/* Notes Input for standard types (not customStaff) */}
                  {questionType !== 'keySignature' && questionType !== 'customStaff' && (
                    <div>
                      <div className="space-y-3">
                        {(() => {
                          // Determine max notes based on question type
                          const maxNotes = questionType === 'noteIdentification' ? 1
                            : questionType === 'intervalIdentification' ? 2
                            : undefined; // No limit for chords
                          const atLimit = maxNotes !== undefined && notationNotes.length >= maxNotes;

                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">
                                  {questionType === 'noteIdentification' ? 'Select Note:'
                                    : questionType === 'intervalIdentification' ? 'Select 2 Notes:'
                                    : 'Add Notes:'}
                                </label>
                                <p className="text-xs text-gray-500">
                                  {questionType === 'noteIdentification'
                                    ? `${notationNotes.length}/1 note selected`
                                    : questionType === 'intervalIdentification'
                                      ? `${notationNotes.length}/2 notes selected`
                                      : questionType === 'chordIdentification'
                                        ? `${notationNotes.length} notes in chord`
                                        : `${notationNotes.length} notes selected`}
                                </p>
                              </div>

                              {/* Selected Notes Display */}
                              {notationNotes.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <span className="text-xs text-gray-500 self-center mr-1">Selected:</span>
                                  {notationNotes.map((note, index) => (
                                    <div key={index} className="flex items-center gap-1 bg-brand/10 border border-brand/30 rounded-lg px-2 py-1">
                                      <span className="text-sm font-medium text-brand">{note}</span>
                                      <button
                                        onClick={() => setNotationNotes(notationNotes.filter((_, i) => i !== index))}
                                        className="text-brand hover:text-red-500 transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => setNotationNotes([])}
                                    className="text-xs text-red-500 hover:text-red-700 ml-2"
                                  >
                                    Clear all
                                  </button>
                                </div>
                              )}

                              {/* Horizontal Note Scroll Bar */}
                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-500">
                                    {notationClef === 'treble' ? '𝄞 Treble Clef (C4 - C6)' : '𝄢 Bass Clef (C2 - C4)'}
                                  </span>
                                  {atLimit && (
                                    <span className="text-xs font-medium text-amber-600">
                                      Maximum notes reached
                                    </span>
                                  )}
                                </div>
                                <div className="overflow-x-auto pb-2">
                                  <div className="flex gap-0.5 min-w-max">
                                    {(notationClef === 'treble' ? TREBLE_NOTES : BASS_NOTES).map((octaveNotes, octaveIndex) => (
                                      <div key={octaveIndex} className="flex gap-0.5">
                                        {octaveNotes.map((note, noteIndex) => {
                                          const isSelected = notationNotes.includes(note.value);
                                          const isConflict = !isSelected && hasConflict(notationNotes, note);
                                          const isDisabled = !isSelected && (isConflict || atLimit);
                                          const isAccidental = note.display.includes('#') || note.display.includes('b');
                                          return (
                                            <button
                                              key={noteIndex}
                                              onClick={() => {
                                                if (isSelected) {
                                                  setNotationNotes(notationNotes.filter(n => n !== note.value));
                                                } else if (!isDisabled) {
                                                  setNotationNotes([...notationNotes, note.value]);
                                                }
                                              }}
                                              disabled={isDisabled}
                                              className={`px-1.5 py-2 rounded text-xs font-medium transition-all whitespace-nowrap ${
                                                isSelected
                                                  ? 'bg-brand text-white shadow-md scale-105'
                                                  : isDisabled
                                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                                    : isAccidental
                                                      ? note.isFlat
                                                        ? 'bg-amber-50 text-amber-700 hover:bg-brand/20 hover:text-brand border border-amber-200'
                                                        : 'bg-blue-50 text-blue-700 hover:bg-brand/20 hover:text-brand border border-blue-200'
                                                      : 'bg-gray-50 text-gray-800 hover:bg-brand/20 hover:text-brand'
                                              }`}
                                              title={isConflict ? 'Cannot select - conflicts with existing note' : atLimit && !isSelected ? 'Maximum notes reached' : note.display}
                                            >
                                              {note.display}
                                            </button>
                                          );
                                        })}
                                        {/* Octave separator */}
                                        {octaveIndex < (notationClef === 'treble' ? TREBLE_NOTES : BASS_NOTES).length - 1 && (
                                          <div className="w-px bg-gray-300 mx-2" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-50 rounded border"></span> Natural</span>
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-50 rounded border border-blue-200"></span> Sharp</span>
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-50 rounded border border-amber-200"></span> Flat</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Custom Staff Notes/Chords Input */}
                  {questionType === 'customStaff' && (
                    <div className="space-y-4">
                      {/* Mode Toggle with descriptions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setStaffInputMode('note')}
                          className={`p-3 rounded-lg text-left transition-all border-2 ${
                            staffInputMode === 'note'
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">🎵</span>
                            <span className={`font-semibold ${staffInputMode === 'note' ? 'text-blue-700' : 'text-gray-700'}`}>Single Notes</span>
                          </div>
                          <p className="text-xs text-gray-500">Click a note to add it instantly</p>
                        </button>
                        <button
                          onClick={() => setStaffInputMode('chord')}
                          className={`p-3 rounded-lg text-left transition-all border-2 ${
                            staffInputMode === 'chord'
                              ? 'ring-2'
                              : 'bg-white border-gray-200'
                          }`}
                          style={staffInputMode === 'chord'
                            ? { backgroundColor: 'rgba(67, 159, 221, 0.1)', borderColor: '#439FDD', '--tw-ring-color': 'rgba(67, 159, 221, 0.3)' } as React.CSSProperties
                            : { }}
                          onMouseEnter={(e) => { if (staffInputMode !== 'chord') e.currentTarget.style.borderColor = 'rgba(67, 159, 221, 0.5)'; }}
                          onMouseLeave={(e) => { if (staffInputMode !== 'chord') e.currentTarget.style.borderColor = ''; }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">🎹</span>
                            <span className="font-semibold" style={{ color: staffInputMode === 'chord' ? '#439FDD' : '#374151' }}>Build Chord</span>
                          </div>
                          <p className="text-xs text-gray-500">Select notes, then click "Add Chord"</p>
                        </button>
                      </div>

                      {/* Status banner for note mode */}
                      {staffInputMode === 'note' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                          <span className="text-blue-500 text-lg">👆</span>
                          <span className="text-sm text-blue-700">Click any note below to add it to the staff instantly</span>
                        </div>
                      )}

                      {/* Current Chord Builder (when in chord mode) */}
                      {staffInputMode === 'chord' && (
                        <div className="rounded-lg p-4 border-2" style={{ backgroundColor: 'rgba(67, 159, 221, 0.1)', borderColor: '#439FDD' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎹</span>
                              <span className="text-sm font-semibold" style={{ color: '#2d7ab8' }}>Building Chord</span>
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(67, 159, 221, 0.2)', color: '#439FDD' }}>
                                {currentChordNotes.length} note{currentChordNotes.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (currentChordNotes.length >= 2) {
                                    setStaffNoteGroups([...staffNoteGroups, { type: 'chord', notes: [...currentChordNotes] }]);
                                    setCurrentChordNotes([]);
                                  }
                                }}
                                disabled={currentChordNotes.length < 2}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                  currentChordNotes.length >= 2
                                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md animate-pulse'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                ✓ Add Chord
                              </button>
                              {currentChordNotes.length > 0 && (
                                <button
                                  onClick={() => setCurrentChordNotes([])}
                                  className="px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                            {currentChordNotes.length === 0 ? (
                              <span className="text-sm italic" style={{ color: '#439FDD' }}>← Select at least 2 notes below to build a chord</span>
                            ) : (
                              <>
                                {currentChordNotes.map((note, index) => (
                                  <div key={index} className="flex items-center gap-1 bg-white rounded-lg px-3 py-1.5 shadow-sm border-2" style={{ borderColor: '#439FDD' }}>
                                    <span className="text-sm font-bold" style={{ color: '#2d7ab8' }}>{note}</span>
                                    <button
                                      onClick={() => setCurrentChordNotes(currentChordNotes.filter((_, i) => i !== index))}
                                      className="hover:text-red-500 ml-1"
                                      style={{ color: 'rgba(67, 159, 221, 0.6)' }}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                                {currentChordNotes.length === 1 && (
                                  <span className="text-xs italic ml-2" style={{ color: '#439FDD' }}>+ add 1 more note</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Added Note Groups Display */}
                      {staffNoteGroups.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">✓</span>
                              <span className="text-sm font-semibold text-green-800">Added to Staff ({staffNoteGroups.length} item{staffNoteGroups.length !== 1 ? 's' : ''}):</span>
                            </div>
                            <button
                              onClick={() => setStaffNoteGroups([])}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {staffNoteGroups.map((group, index) => (
                              <div
                                key={index}
                                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 ${
                                  group.type === 'note' ? 'bg-blue-100 border border-blue-300' : 'border'
                                }`}
                                style={group.type === 'chord' ? { backgroundColor: 'rgba(67, 159, 221, 0.15)', borderColor: '#439FDD' } : {}}
                              >
                                <span className="text-xs font-bold text-gray-500 mr-1">#{index + 1}</span>
                                <span className="text-xs">{group.type === 'note' ? '🎵' : '🎹'}</span>
                                <span
                                  className={`text-sm font-medium ${group.type === 'note' ? 'text-blue-700' : ''}`}
                                  style={group.type === 'chord' ? { color: '#439FDD' } : {}}
                                >
                                  {group.type === 'note' ? group.note : group.notes.join(' + ')}
                                </span>
                                <button
                                  onClick={() => setStaffNoteGroups(staffNoteGroups.filter((_, i) => i !== index))}
                                  className={`${group.type === 'note' ? 'text-blue-400' : ''} hover:text-red-500 ml-1`}
                                  style={group.type === 'chord' ? { color: 'rgba(67, 159, 221, 0.6)' } : {}}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Note Selector */}
                      <div
                        className={`rounded-lg border-2 p-3 ${
                          staffInputMode === 'note' ? 'bg-blue-50/50 border-blue-200' : ''
                        }`}
                        style={staffInputMode === 'chord' ? { backgroundColor: 'rgba(67, 159, 221, 0.05)', borderColor: 'rgba(67, 159, 221, 0.3)' } : {}}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-600">
                            {notationClef === 'treble' ? '𝄞 Treble Clef (C4 - C6)' : '𝄢 Bass Clef (C2 - C4)'}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              staffInputMode === 'note' ? 'bg-blue-100 text-blue-700' : ''
                            }`}
                            style={staffInputMode === 'chord' ? { backgroundColor: 'rgba(67, 159, 221, 0.15)', color: '#439FDD' } : {}}
                          >
                            {staffInputMode === 'note' ? '🎵 Click = Add Note' : '🎹 Click = Add to Chord'}
                          </span>
                        </div>
                        <div className="overflow-x-auto pb-2">
                          <div className="flex gap-0.5 min-w-max">
                            {(notationClef === 'treble' ? TREBLE_NOTES : BASS_NOTES).map((octaveNotes, octaveIndex) => (
                              <div key={octaveIndex} className="flex gap-0.5">
                                {octaveNotes.map((note, noteIndex) => {
                                  const notesInUse = staffInputMode === 'chord' ? currentChordNotes : [];
                                  const isSelected = notesInUse.includes(note.value);
                                  const isConflict = !isSelected && hasConflict(notesInUse, note);
                                  const isAccidental = note.display.includes('#') || note.display.includes('b');
                                  return (
                                    <button
                                      key={noteIndex}
                                      onClick={() => {
                                        if (staffInputMode === 'note') {
                                          // Add as individual note
                                          setStaffNoteGroups([...staffNoteGroups, { type: 'note', note: note.value }]);
                                        } else {
                                          // Add to current chord
                                          if (isSelected) {
                                            setCurrentChordNotes(currentChordNotes.filter(n => n !== note.value));
                                          } else if (!isConflict) {
                                            setCurrentChordNotes([...currentChordNotes, note.value]);
                                          }
                                        }
                                      }}
                                      disabled={staffInputMode === 'chord' && isConflict}
                                      className={`px-1.5 py-2 rounded text-xs font-medium transition-all whitespace-nowrap ${
                                        isSelected
                                          ? 'bg-brand text-white shadow-md scale-105'
                                          : isConflict
                                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                            : isAccidental
                                              ? note.isFlat
                                                ? 'bg-amber-50 text-amber-700 hover:bg-brand/20 hover:text-brand border border-amber-200'
                                                : 'bg-blue-50 text-blue-700 hover:bg-brand/20 hover:text-brand border border-blue-200'
                                              : 'bg-gray-50 text-gray-800 hover:bg-brand/20 hover:text-brand'
                                      }`}
                                    >
                                      {note.display}
                                    </button>
                                  );
                                })}
                                {octaveIndex < (notationClef === 'treble' ? TREBLE_NOTES : BASS_NOTES).length - 1 && (
                                  <div className="w-px bg-gray-300 mx-2" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-50 rounded border"></span> Natural</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-50 rounded border border-blue-200"></span> Sharp</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-50 rounded border border-amber-200"></span> Flat</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Preview:</label>
                    <div className="bg-white rounded-lg p-2 inline-block">
                      <MusicNotation
                        notes={questionType !== 'keySignature' && (questionType === 'customStaff' ? staffNoteGroups.length > 0 : notationNotes.length > 0) ? (() => {
                          // For customStaff, convert note groups to notes
                          if (questionType === 'customStaff') {
                            return staffNoteGroups.map(group => {
                              if (group.type === 'note') {
                                const parts = group.note.split('/');
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
                                return { keys: [`${baseNote.toLowerCase()}/${octave}`], duration: 'w', accidental };
                              } else {
                                // Chord
                                const keys: string[] = [];
                                const accidentals: string[] = [];
                                group.notes.forEach(n => {
                                  const parts = n.split('/');
                                  const notePart = parts[0];
                                  const octave = parts[1] || '4';
                                  let baseNote = notePart;
                                  let acc = 'n';
                                  if (notePart.includes('#')) {
                                    acc = '#';
                                    baseNote = notePart.replace('#', '');
                                  } else if (notePart.includes('b') && notePart.length > 1) {
                                    acc = 'b';
                                    baseNote = notePart.replace('b', '');
                                  }
                                  keys.push(`${baseNote.toLowerCase()}/${octave}`);
                                  accidentals.push(acc);
                                });
                                return { keys, duration: 'w', accidentals: accidentals.some(a => a !== 'n') ? accidentals : undefined };
                              }
                            });
                          }
                          // For chords with multiple notes, stack all notes together
                          if (questionType === 'chordIdentification' && notationNotes.length > 1) {
                            const keys: string[] = [];
                            const accidentals: string[] = [];
                            notationNotes.forEach(n => {
                              const parts = n.split('/');
                              const notePart = parts[0];
                              const octave = parts[1] || '4';
                              let baseNote = notePart;
                              let acc = 'n';
                              if (notePart.includes('#')) {
                                acc = '#';
                                baseNote = notePart.replace('#', '');
                              } else if (notePart.includes('b') && notePart.length > 1) {
                                acc = 'b';
                                baseNote = notePart.replace('b', '');
                              }
                              keys.push(`${baseNote.toLowerCase()}/${octave}`);
                              accidentals.push(acc);
                            });
                            return [{ keys, duration: 'w', accidentals: accidentals.some(a => a !== 'n') ? accidentals : undefined }];
                          }
                          // For other types, render notes separately
                          return notationNotes.map(n => {
                            const parts = n.split('/');
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
                            return { keys: [`${baseNote.toLowerCase()}/${octave}`], duration: 'w', accidental };
                          });
                        })() : undefined}
                        clef={notationClef}
                        keySignature={(questionType === 'keySignature' || questionType === 'customStaff') ? notationKeySignature : undefined}
                        width={300}
                        height={120}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Ear Training Settings - Standard types */}
              {['earTrainingNote', 'earTrainingInterval', 'earTrainingChord'].includes(questionType) && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">Audio Settings</h4>

                  <div className="space-y-3">
                    {(() => {
                      // Determine max notes based on question type
                      const maxAudioNotes = questionType === 'earTrainingNote' ? 1
                        : questionType === 'earTrainingInterval' ? 2
                        : undefined; // No limit for chords
                      const atAudioLimit = maxAudioNotes !== undefined && audioNotes.length >= maxAudioNotes;

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              {questionType === 'earTrainingNote' ? 'Select Note:'
                                : questionType === 'earTrainingInterval' ? 'Select 2 Notes:'
                                : 'Add Notes:'}
                            </label>
                            <p className="text-xs text-gray-500">
                              {questionType === 'earTrainingNote'
                                ? `${audioNotes.length}/1 note selected`
                                : questionType === 'earTrainingInterval'
                                  ? `${audioNotes.length}/2 notes selected`
                                  : `${audioNotes.length} notes in chord`}
                            </p>
                          </div>

                          {/* Selected Audio Notes Display */}
                          {audioNotes.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-2 bg-white rounded-lg border border-gray-200">
                              <span className="text-xs text-gray-500 self-center mr-1">Selected:</span>
                              {audioNotes.map((note, index) => (
                                <div key={index} className="flex items-center gap-1 bg-brand/10 border border-brand/30 rounded-lg px-2 py-1">
                                  <span className="text-sm font-medium text-brand">{note}</span>
                                  <button
                                    onClick={() => setAudioNotes(audioNotes.filter((_, i) => i !== index))}
                                    className="text-brand hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => setAudioNotes([])}
                                className="text-xs text-red-500 hover:text-red-700 ml-2"
                              >
                                Clear all
                              </button>
                            </div>
                          )}

                          {/* Horizontal Audio Note Scroll Bar (C3 - C5 for ear training) */}
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">
                                🎧 Audio Notes (C3 - C5)
                              </span>
                              {atAudioLimit && (
                                <span className="text-xs font-medium text-amber-600">
                                  Maximum notes reached
                                </span>
                              )}
                            </div>
                            <div className="overflow-x-auto pb-2">
                              <div className="flex gap-0.5 min-w-max">
                                {generateChromaticNotes(3, 5).map((octaveNotes, octaveIndex) => (
                                  <div key={octaveIndex} className="flex gap-0.5">
                                    {octaveNotes.map((note, noteIndex) => {
                                      const isSelected = audioNotes.includes(note.audioValue);
                                      const isConflict = !isSelected && hasConflict(audioNotes.map(n => n.replace(/(\d)$/, '/$1')), note);
                                      const isDisabled = !isSelected && (isConflict || atAudioLimit);
                                      const isAccidental = note.display.includes('#') || note.display.includes('b');
                                      return (
                                        <button
                                          key={noteIndex}
                                          onClick={() => {
                                            if (isSelected) {
                                              setAudioNotes(audioNotes.filter(n => n !== note.audioValue));
                                            } else if (!isDisabled) {
                                              setAudioNotes([...audioNotes, note.audioValue]);
                                            }
                                          }}
                                          disabled={isDisabled}
                                          className={`px-1.5 py-2 rounded text-xs font-medium transition-all whitespace-nowrap ${
                                            isSelected
                                              ? 'bg-brand text-white shadow-md scale-105'
                                              : isDisabled
                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                                : isAccidental
                                                  ? note.isFlat
                                                    ? 'bg-amber-50 text-amber-700 hover:bg-brand/20 hover:text-brand border border-amber-200'
                                                    : 'bg-blue-50 text-blue-700 hover:bg-brand/20 hover:text-brand border border-blue-200'
                                                  : 'bg-gray-50 text-gray-800 hover:bg-brand/20 hover:text-brand'
                                          }`}
                                          title={isConflict ? 'Cannot select - conflicts with existing note' : atAudioLimit && !isSelected ? 'Maximum notes reached' : note.display}
                                        >
                                          {note.display}
                                        </button>
                                      );
                                    })}
                                    {/* Octave separator */}
                                    {octaveIndex < 2 && (
                                      <div className="w-px bg-gray-300 mx-2" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-50 rounded border"></span> Natural</span>
                              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-50 rounded border border-blue-200"></span> Sharp</span>
                              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-50 rounded border border-amber-200"></span> Flat</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Audio Preview */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Preview:</label>
                    <AudioPlayer
                      subtype={
                        questionType === 'earTrainingNote' ? 'note'
                        : questionType === 'earTrainingInterval' ? 'interval'
                        : 'chord'
                      }
                      audioData={{ notes: audioNotes, duration: '2n' }}
                    />
                  </div>
                </div>
              )}

              {/* Custom Ear Training Settings - with note/chord mode */}
              {questionType === 'customEarTraining' && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">Custom Audio Settings</h4>

                  {/* Mode Toggle with descriptions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAudioInputMode('note')}
                      className={`p-3 rounded-lg text-left transition-all border-2 ${
                        audioInputMode === 'note'
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🎵</span>
                        <span className={`font-semibold ${audioInputMode === 'note' ? 'text-blue-700' : 'text-gray-700'}`}>Single Notes</span>
                      </div>
                      <p className="text-xs text-gray-500">Click a note to add it instantly</p>
                    </button>
                    <button
                      onClick={() => setAudioInputMode('chord')}
                      className={`p-3 rounded-lg text-left transition-all border-2 ${
                        audioInputMode === 'chord'
                          ? 'ring-2'
                          : 'bg-white border-gray-200'
                      }`}
                      style={audioInputMode === 'chord'
                        ? { backgroundColor: 'rgba(67, 159, 221, 0.1)', borderColor: '#439FDD', '--tw-ring-color': 'rgba(67, 159, 221, 0.3)' } as React.CSSProperties
                        : {}}
                      onMouseEnter={(e) => { if (audioInputMode !== 'chord') e.currentTarget.style.borderColor = 'rgba(67, 159, 221, 0.5)'; }}
                      onMouseLeave={(e) => { if (audioInputMode !== 'chord') e.currentTarget.style.borderColor = ''; }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🎹</span>
                        <span className="font-semibold" style={{ color: audioInputMode === 'chord' ? '#439FDD' : '#374151' }}>Build Chord</span>
                      </div>
                      <p className="text-xs text-gray-500">Select notes, then click "Add Chord"</p>
                    </button>
                  </div>

                  {/* Status banner for note mode */}
                  {audioInputMode === 'note' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 text-lg">👆</span>
                        <span className="text-sm text-blue-700">Click any note below to add it instantly</span>
                      </div>
                      {audioNoteGroups.length >= 8 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Max 8 reached</span>
                      )}
                    </div>
                  )}

                  {/* Current Chord Builder (when in chord mode) */}
                  {audioInputMode === 'chord' && (
                    <div className="rounded-lg p-4 border-2" style={{ backgroundColor: 'rgba(67, 159, 221, 0.1)', borderColor: '#439FDD' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎹</span>
                          <span className="text-sm font-semibold" style={{ color: '#2d7ab8' }}>Building Chord</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(67, 159, 221, 0.2)', color: '#439FDD' }}>
                            {currentAudioChordNotes.length} note{currentAudioChordNotes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (currentAudioChordNotes.length >= 2) {
                                setAudioNoteGroups([...audioNoteGroups, { type: 'chord', notes: [...currentAudioChordNotes] }]);
                                setCurrentAudioChordNotes([]);
                              }
                            }}
                            disabled={currentAudioChordNotes.length < 2}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                              currentAudioChordNotes.length >= 2
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-md animate-pulse'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            ✓ Add Chord
                          </button>
                          {currentAudioChordNotes.length > 0 && (
                            <button
                              onClick={() => setCurrentAudioChordNotes([])}
                              className="px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                        {currentAudioChordNotes.length === 0 ? (
                          <span className="text-sm italic" style={{ color: '#439FDD' }}>← Select at least 2 notes below to build a chord</span>
                        ) : (
                          <>
                            {currentAudioChordNotes.map((note, index) => (
                              <div key={index} className="flex items-center gap-1 bg-white rounded-lg px-3 py-1.5 shadow-sm border-2" style={{ borderColor: '#439FDD' }}>
                                <span className="text-sm font-bold" style={{ color: '#2d7ab8' }}>{note}</span>
                                <button
                                  onClick={() => setCurrentAudioChordNotes(currentAudioChordNotes.filter((_, i) => i !== index))}
                                  className="hover:text-red-500 ml-1"
                                  style={{ color: 'rgba(67, 159, 221, 0.6)' }}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            {currentAudioChordNotes.length === 1 && (
                              <span className="text-xs italic ml-2" style={{ color: '#439FDD' }}>+ add 1 more note</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Added Audio Groups Display */}
                  {audioNoteGroups.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span className="text-sm font-semibold text-green-800">
                            Added to Sequence ({audioNoteGroups.length}/8 item{audioNoteGroups.length !== 1 ? 's' : ''}):
                          </span>
                        </div>
                        <button
                          onClick={() => setAudioNoteGroups([])}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {audioNoteGroups.map((group, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 ${
                              group.type === 'note' ? 'bg-blue-100 border border-blue-300' : 'border'
                            }`}
                            style={group.type === 'chord' ? { backgroundColor: 'rgba(67, 159, 221, 0.15)', borderColor: '#439FDD' } : {}}
                          >
                            <span className="text-xs font-bold text-gray-500 mr-1">#{index + 1}</span>
                            <span className="text-xs">{group.type === 'note' ? '🎵' : '🎹'}</span>
                            <span
                              className={`text-sm font-medium ${group.type === 'note' ? 'text-blue-700' : ''}`}
                              style={group.type === 'chord' ? { color: '#439FDD' } : {}}
                            >
                              {group.type === 'note' ? group.note : group.notes.join(' + ')}
                            </span>
                            <button
                              onClick={() => setAudioNoteGroups(audioNoteGroups.filter((_, i) => i !== index))}
                              className={`${group.type === 'note' ? 'text-blue-400' : ''} hover:text-red-500 ml-1`}
                              style={group.type === 'chord' ? { color: 'rgba(67, 159, 221, 0.6)' } : {}}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-green-600 mt-2 italic">Items will play in order: #1 → #2 → #3...</p>
                    </div>
                  )}

                  {/* Note Selector */}
                  <div
                    className={`rounded-lg border-2 p-3 ${
                      audioInputMode === 'note' ? 'bg-blue-50/50 border-blue-200' : ''
                    }`}
                    style={audioInputMode === 'chord' ? { backgroundColor: 'rgba(67, 159, 221, 0.05)', borderColor: 'rgba(67, 159, 221, 0.3)' } : {}}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        🎧 Audio Notes (C3 - C5)
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          audioInputMode === 'note' ? 'bg-blue-100 text-blue-700' : ''
                        }`}
                        style={audioInputMode === 'chord' ? { backgroundColor: 'rgba(67, 159, 221, 0.15)', color: '#439FDD' } : {}}
                      >
                        {audioInputMode === 'note' ? '🎵 Click = Add Note' : '🎹 Click = Add to Chord'}
                      </span>
                    </div>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex gap-0.5 min-w-max">
                        {generateChromaticNotes(3, 5).map((octaveNotes, octaveIndex) => (
                          <div key={octaveIndex} className="flex gap-0.5">
                            {octaveNotes.map((note, noteIndex) => {
                              const notesInUse = audioInputMode === 'chord' ? currentAudioChordNotes : [];
                              const isSelected = notesInUse.includes(note.audioValue);
                              const isConflict = !isSelected && hasConflict(notesInUse.map(n => n.replace(/(\d)$/, '/$1')), note);
                              const isAtLimit = audioInputMode === 'note' && audioNoteGroups.length >= 8;
                              const isAccidental = note.display.includes('#') || note.display.includes('b');
                              return (
                                <button
                                  key={noteIndex}
                                  onClick={() => {
                                    if (audioInputMode === 'note') {
                                      if (!isAtLimit) {
                                        setAudioNoteGroups([...audioNoteGroups, { type: 'note', note: note.audioValue }]);
                                      }
                                    } else {
                                      if (isSelected) {
                                        setCurrentAudioChordNotes(currentAudioChordNotes.filter(n => n !== note.audioValue));
                                      } else if (!isConflict) {
                                        setCurrentAudioChordNotes([...currentAudioChordNotes, note.audioValue]);
                                      }
                                    }
                                  }}
                                  disabled={(audioInputMode === 'chord' && isConflict) || (audioInputMode === 'note' && isAtLimit)}
                                  className={`px-1.5 py-2 rounded text-xs font-medium transition-all whitespace-nowrap ${
                                    isSelected
                                      ? 'bg-brand text-white shadow-md scale-105'
                                      : (isConflict || (audioInputMode === 'note' && isAtLimit))
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                        : isAccidental
                                          ? note.isFlat
                                            ? 'bg-amber-50 text-amber-700 hover:bg-brand/20 hover:text-brand border border-amber-200'
                                            : 'bg-blue-50 text-blue-700 hover:bg-brand/20 hover:text-brand border border-blue-200'
                                          : 'bg-gray-50 text-gray-800 hover:bg-brand/20 hover:text-brand'
                                  }`}
                                >
                                  {note.display}
                                </button>
                              );
                            })}
                            {octaveIndex < 2 && (
                              <div className="w-px bg-gray-300 mx-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-50 rounded border"></span> Natural</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-50 rounded border border-blue-200"></span> Sharp</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-50 rounded border border-amber-200"></span> Flat</span>
                    </div>
                  </div>

                  {/* Audio Preview */}
                  {audioNoteGroups.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Preview (plays items in sequence):</label>
                      <AudioPlayer
                        subtype="sequence"
                        audioData={{
                          notes: audioNoteGroups.flatMap(group =>
                            group.type === 'note' ? [group.note] : group.notes
                          ),
                          noteGroups: audioNoteGroups.map(group =>
                            group.type === 'note' ? [group.note] : group.notes
                          ),
                          duration: '2n'
                        }}
                      />
                    </div>
                  )}
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
