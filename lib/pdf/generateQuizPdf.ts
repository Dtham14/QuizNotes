'use client';

import { jsPDF } from 'jspdf';

// Types for quiz data
export interface QuizQuestion {
  id: string;
  type?: string;
  question: string;
  notes?: string[];
  options: string[];
  correctAnswer: string | number;
  explanation?: string;
  clef?: 'treble' | 'bass';
  keySignature?: string;
  audioData?: {
    subtype: 'note' | 'chord' | 'interval';
    notes: string[];
    duration?: string;
  };
}

export interface QuizPdfData {
  quizType: string;
  score: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  answers: (number | null)[];
  completedAt: Date;
}

// Helper to get correct answer index
const getCorrectAnswerIndex = (q: QuizQuestion): number => {
  if (typeof q.correctAnswer === 'number') {
    return q.correctAnswer;
  }
  return q.options.findIndex(opt => opt === q.correctAnswer);
};

// Format quiz type for display
const formatQuizType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'noteIdentification': 'Note Identification',
    'keySignature': 'Key Signatures',
    'intervalIdentification': 'Interval Identification',
    'chordIdentification': 'Chord Identification',
    'scaleIdentification': 'Scale Identification',
    'earTrainingNote': 'Ear Training - Notes',
    'earTrainingInterval': 'Ear Training - Intervals',
    'earTrainingChord': 'Ear Training - Chords',
    'ear-training': 'Ear Training',
    'intervals': 'Intervals',
    'chords': 'Chords',
    'scales': 'Scales',
    'mixed': 'Mixed Quiz',
  };
  return typeMap[type] || type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Track if VexFlow fonts have been loaded for canvas rendering
let vexflowFontsLoaded = false;
let fontLoadPromise: Promise<void> | null = null;

/**
 * Ensures VexFlow music fonts are loaded before canvas rendering.
 * VexFlow 5.x loads fonts asynchronously, and canvas rendering requires
 * fonts to be fully loaded BEFORE drawing (unlike SVG which can re-render).
 * Without this, music notation appears as black boxes/tofu characters.
 */
async function ensureVexFlowFontsLoaded(): Promise<void> {
  if (vexflowFontsLoaded) {
    console.log('[VexFlow Fonts] Already loaded, skipping');
    return;
  }

  if (fontLoadPromise) {
    console.log('[VexFlow Fonts] Load already in progress, waiting...');
    return fontLoadPromise;
  }

  fontLoadPromise = (async () => {
    try {
      console.log('[VexFlow Fonts] Starting font loading process...');

      // Import VexFlow - this triggers the font loading in vexflow.js
      const VF = await import('vexflow');
      console.log('[VexFlow Fonts] VexFlow imported, checking for loadFonts method...');

      // VexFlow 5.x has a loadFonts method that we can use to explicitly load fonts
      // Check if VexFlow.default has the loadFonts method (it should for VexFlow 5.x)
      // Using type assertion because the loadFonts method exists at runtime but TypeScript types don't expose it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const VexFlowClass = (VF.default || VF) as any;

      if (typeof VexFlowClass?.loadFonts === 'function') {
        console.log('[VexFlow Fonts] Using VexFlow.loadFonts() to load Bravura font...');
        try {
          // Load the essential music notation font
          await VexFlowClass.loadFonts('Bravura', 'Academico');
          console.log('[VexFlow Fonts] VexFlow.loadFonts() completed');
        } catch (loadError) {
          console.warn('[VexFlow Fonts] VexFlow.loadFonts() failed:', loadError);
        }
      }

      // Check if document.fonts API is available (browser environment)
      if (typeof document !== 'undefined' && document.fonts) {
        console.log('[VexFlow Fonts] Using document.fonts API to verify font loading...');

        // List all fonts currently registered
        const fontFamilies = new Set<string>();
        document.fonts.forEach((font) => {
          fontFamilies.add(font.family);
        });
        console.log('[VexFlow Fonts] Registered font families:', Array.from(fontFamilies).join(', '));

        // Wait for the critical music fonts to be loaded
        // Bravura is the music notation font (notes, clefs, accidentals, etc.)
        const fontChecks: Promise<FontFace[]>[] = [];

        // Check for Bravura (the main music font)
        fontChecks.push(
          document.fonts.load('40px Bravura').catch((err) => {
            console.warn('[VexFlow Fonts] Bravura font load check failed:', err);
            return [];
          })
        );

        // Also ensure Academico is ready for any text rendering
        fontChecks.push(
          document.fonts.load('12px Academico').catch(() => [])
        );

        const results = await Promise.all(fontChecks);
        console.log('[VexFlow Fonts] Font load checks completed, Bravura result:', results[0]?.length || 0, 'faces');

        // Give a small delay to ensure fonts are fully registered
        // This helps with edge cases where fonts report "loaded" but aren't quite ready
        await new Promise(resolve => setTimeout(resolve, 150));

        // Double-check by waiting for document.fonts.ready
        await document.fonts.ready;

        // Log which fonts are now available
        const loadedFonts = new Set<string>();
        document.fonts.forEach((font) => {
          if (font.status === 'loaded') {
            loadedFonts.add(font.family);
          }
        });
        console.log('[VexFlow Fonts] Loaded font families:', Array.from(loadedFonts).join(', '));

        // Check specifically if Bravura is loaded
        const hasBravura = Array.from(loadedFonts).some(f => f.toLowerCase().includes('bravura'));
        if (!hasBravura) {
          console.error('[VexFlow Fonts] WARNING: Bravura font may not be loaded! Music notation may show as boxes.');
        } else {
          console.log('[VexFlow Fonts] Bravura font confirmed loaded');
        }
      } else {
        // Fallback: just wait a bit for fonts to load
        console.warn('[VexFlow Fonts] document.fonts API not available, using timeout fallback');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      vexflowFontsLoaded = true;
      console.log('[VexFlow Fonts] Font loading complete');
    } catch (error) {
      console.error('[VexFlow Fonts] Error during font loading:', error);
      // Mark as loaded anyway to prevent infinite retries
      vexflowFontsLoaded = true;
    }
  })();

  return fontLoadPromise;
}

// Render VexFlow notation directly to Canvas for reliable PDF embedding
// Using Canvas renderer eliminates SVG-to-canvas conversion issues that cause black boxes
async function renderNotationToImage(
  notes: string[],
  clef: 'treble' | 'bass' = 'treble',
  keySignature?: string,
  questionType?: string
): Promise<string | null> {
  try {
    // CRITICAL: Wait for VexFlow fonts to load before rendering
    // Without this, canvas rendering produces black boxes instead of music notation
    await ensureVexFlowFontsLoaded();

    const VF = await import('vexflow');

    const width = 300;
    const height = 150;
    const scale = 2; // Higher resolution for better PDF quality

    // Create a canvas element directly - this avoids SVG-to-canvas conversion issues
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    // Get 2D context and scale it for high DPI rendering
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    // Fill white background first
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale for high DPI
    ctx.scale(scale, scale);

    // Use VexFlow's native Canvas renderer - this draws directly to canvas
    // without any SVG intermediate step, avoiding black box issues
    const renderer = new VF.Renderer(canvas, VF.Renderer.Backends.CANVAS);
    renderer.resize(width, height);
    const context = renderer.getContext();

    // Set background color on VexFlow context as well
    context.setBackgroundFillStyle('white');

    // Create stave
    const stave = new VF.Stave(10, 10, width - 20);
    stave.addClef(clef);
    if (keySignature) {
      stave.addKeySignature(keySignature);
    }
    stave.setContext(context).draw();

    // Render notes if provided
    if (notes && notes.length > 0) {
      const { Stem } = VF;

      // Helper to extract accidental from note string
      const extractAccidental = (noteStr: string): string | null => {
        const match = noteStr.match(/^[a-g](#|b)?\/\d+$/i);
        if (match && match[1]) return match[1];
        return null;
      };

      // Determine if we should render notes individually (scales/intervals) or stacked (chords)
      const isScale = questionType === 'scaleIdentification';
      const isInterval = questionType === 'intervalIdentification';

      let vfNotes: InstanceType<typeof VF.StaveNote>[];

      if (isScale) {
        // Render each note individually with quarter note duration
        vfNotes = notes.map(noteStr => {
          const vfNote = new VF.StaveNote({
            keys: [noteStr],
            duration: 'q',
            clef: clef,
          });
          const acc = extractAccidental(noteStr);
          if (acc) {
            vfNote.addModifier(new VF.Accidental(acc), 0);
          }
          return vfNote;
        });
      } else if (isInterval && notes.length === 2) {
        // Render interval notes as whole notes
        vfNotes = notes.map(noteStr => {
          const vfNote = new VF.StaveNote({
            keys: [noteStr],
            duration: 'w',
            clef: clef,
          });
          const acc = extractAccidental(noteStr);
          if (acc) {
            vfNote.addModifier(new VF.Accidental(acc), 0);
          }
          return vfNote;
        });
      } else {
        // Chord - stack all notes together
        const accidentals = notes.map(extractAccidental);
        const vfNote = new VF.StaveNote({
          keys: notes,
          duration: 'w',
          clef: clef,
        });
        accidentals.forEach((acc, index) => {
          if (acc) {
            vfNote.addModifier(new VF.Accidental(acc), index);
          }
        });
        vfNotes = [vfNote];
      }

      // Create tick context
      const tickContext = new VF.TickContext();
      vfNotes.forEach(note => tickContext.addTickable(note));
      tickContext.preFormat();

      // Position and draw notes
      const startX = stave.getNoteStartX();
      const spacing = (width - startX - 40) / vfNotes.length;

      // Stem direction helper (for scales)
      const getStemDirection = (noteKey: string, noteClef: 'treble' | 'bass'): number => {
        const [pitch, octaveStr] = noteKey.split('/');
        const octave = parseInt(octaveStr);
        const pitchOrder = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
        const pitchIndex = pitchOrder.indexOf(pitch[0].toLowerCase());
        const middleLine = noteClef === 'treble'
          ? { pitch: 'b', octave: 4 }
          : { pitch: 'd', octave: 3 };
        const middlePitchIndex = pitchOrder.indexOf(middleLine.pitch);

        if (octave < middleLine.octave || (octave === middleLine.octave && pitchIndex < middlePitchIndex)) {
          return Stem.UP;
        }
        return Stem.DOWN;
      };

      vfNotes.forEach((note, index) => {
        note.setStave(stave);
        note.setContext(context);
        const xPos = startX + (index * spacing) + 15;
        tickContext.setX(xPos);

        // Set stem direction for scales
        if (isScale) {
          const originalKey = notes[index];
          const stemDir = getStemDirection(originalKey, clef);
          note.setStemDirection(stemDir);
        }

        note.draw();
      });
    }

    // Canvas is already rendered - just export to PNG data URL
    // This is much more reliable than SVG->Image->Canvas conversion
    const dataUrl = canvas.toDataURL('image/png', 1.0);

    // Debug: Log the data URL length to verify content was rendered
    console.log('[PDF Notation] Canvas exported, data URL length:', dataUrl.length);

    // A very small data URL likely means the canvas is mostly empty/blank
    // A proper notation render should produce a data URL of at least 10KB
    if (dataUrl.length < 5000) {
      console.warn('[PDF Notation] Warning: Canvas data URL is suspiciously small, notation may not have rendered correctly');
    }

    return dataUrl;
  } catch (error) {
    console.error('[PDF Notation] Error rendering notation:', error);
    return null;
  }
}

export async function generateQuizResultsPdf(data: QuizPdfData): Promise<Blob> {
  const { quizType, score, totalQuestions, questions, answers, completedAt } = data;

  console.log('[PDF Generation] Starting PDF generation for quiz type:', quizType);
  console.log('[PDF Generation] Total questions:', totalQuestions);

  // Pre-load VexFlow fonts before starting PDF generation
  // This ensures fonts are ready when we render notation images
  console.log('[PDF Generation] Pre-loading VexFlow fonts...');
  await ensureVexFlowFontsLoaded();
  console.log('[PDF Generation] VexFlow fonts ready');

  // Create PDF document (A4 size)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Colors
  const brandColor = '#6366f1'; // Indigo
  const correctColor = '#22c55e'; // Green
  const incorrectColor = '#ef4444'; // Red
  const textColor = '#1f2937'; // Dark gray

  // Header
  pdf.setFillColor(99, 102, 241); // Brand indigo
  pdf.rect(0, 0, pageWidth, 35, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('QuizNotes - Quiz Results', margin, 18);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  const dateStr = completedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  pdf.text(`Completed: ${dateStr}`, margin, 28);

  yPosition = 45;

  // Quiz type and score section
  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Quiz Type: ${formatQuizType(quizType)}`, margin, yPosition);

  yPosition += 10;

  // Score box
  const percentage = Math.round((score / totalQuestions) * 100);
  const scoreColor = percentage >= 70 ? correctColor : percentage >= 50 ? '#f59e0b' : incorrectColor;

  pdf.setFillColor(...hexToRgb(scoreColor));
  pdf.roundedRect(margin, yPosition - 5, 60, 20, 3, 3, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${score}/${totalQuestions} (${percentage}%)`, margin + 5, yPosition + 8);

  yPosition += 25;

  // Divider line
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 10;

  // Questions section
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const userAnswerIndex = answers[i];
    const correctAnswerIndex = getCorrectAnswerIndex(question);
    const isCorrect = userAnswerIndex === correctAnswerIndex;

    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    // Question number with indicator
    pdf.setFillColor(...hexToRgb(isCorrect ? correctColor : incorrectColor));
    pdf.circle(margin + 5, yPosition + 3, 5, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${i + 1}`, margin + 3, yPosition + 5);

    // Question text
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const questionText = pdf.splitTextToSize(question.question, pageWidth - margin * 2 - 20);
    pdf.text(questionText, margin + 15, yPosition + 5);

    yPosition += 7 + (questionText.length - 1) * 5;

    // Render notation if available (not for ear training)
    const isEarTraining = question.type?.startsWith('earTraining') || question.audioData;

    if (!isEarTraining) {
      if (question.notes && question.notes.length > 0) {
        yPosition += 5;
        const imageData = await renderNotationToImage(
          question.notes,
          question.clef || 'treble',
          undefined,
          question.type
        );

        if (imageData) {
          try {
            // Add the canvas image to PDF
            pdf.addImage(imageData, 'PNG', margin, yPosition, 90, 45);
            yPosition += 48;
          } catch (e) {
            console.error('Error embedding image:', e);
            yPosition += 5;
          }
        }
      } else if (question.keySignature) {
        yPosition += 5;
        const imageData = await renderNotationToImage(
          [],
          question.clef || 'treble',
          question.keySignature,
          question.type
        );

        if (imageData) {
          try {
            // Add the canvas image to PDF
            pdf.addImage(imageData, 'PNG', margin, yPosition, 90, 45);
            yPosition += 48;
          } catch (e) {
            console.error('Error embedding image:', e);
            yPosition += 5;
          }
        }
      }
    } else {
      // Ear training - show audio indicator
      yPosition += 5;
      pdf.setFillColor(243, 244, 246);
      pdf.roundedRect(margin, yPosition - 3, 100, 15, 2, 2, 'F');
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('🎵 Audio-based question', margin + 5, yPosition + 6);
      yPosition += 15;
    }

    // User answer
    const userAnswerText = userAnswerIndex !== null
      ? question.options[userAnswerIndex]
      : 'No answer';

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    if (isCorrect) {
      pdf.setTextColor(...hexToRgb(correctColor));
      pdf.text(`✓ Your Answer: ${userAnswerText}`, margin, yPosition);
    } else {
      pdf.setTextColor(...hexToRgb(incorrectColor));
      pdf.text(`✗ Your Answer: ${userAnswerText}`, margin, yPosition);
      yPosition += 5;
      pdf.setTextColor(...hexToRgb(correctColor));
      pdf.text(`✓ Correct Answer: ${question.options[correctAnswerIndex]}`, margin, yPosition);
    }

    yPosition += 7;

    // Explanation if available
    if (question.explanation) {
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      const explanationLines = pdf.splitTextToSize(question.explanation, pageWidth - margin * 2);
      pdf.text(explanationLines, margin, yPosition);
      yPosition += explanationLines.length * 4 + 3;
    }

    // Spacing between questions
    yPosition += 8;

    // Light separator
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.2);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);

    yPosition += 8;
  }

  // Footer on last page
  pdf.setTextColor(156, 163, 175);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Generated by QuizNotes - Music Theory Quiz App', margin, pageHeight - 10);

  // Return as blob
  return pdf.output('blob');
}

// Helper to convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  }
  return [0, 0, 0];
}
