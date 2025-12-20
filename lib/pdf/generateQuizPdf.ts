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

// Render VexFlow notation to a hidden container and return as base64 PNG
async function renderNotationToImage(
  notes: string[],
  clef: 'treble' | 'bass' = 'treble',
  keySignature?: string,
  questionType?: string
): Promise<string | null> {
  try {
    const VF = await import('vexflow');

    // Create a hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);

    const width = 300;
    const height = 150;

    // Create renderer
    const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

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

    // Get the SVG element
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      document.body.removeChild(container);
      return null;
    }

    // Add white background and ensure black strokes
    svgElement.style.backgroundColor = 'white';

    // Convert SVG to base64 PNG using canvas
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create image and canvas
    const img = new Image();
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // 2x for better quality
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');

    // Wait for image to load and convert to PNG
    const base64Image = await new Promise<string | null>((resolve) => {
      img.onload = () => {
        if (ctx) {
          // White background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Draw SVG
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(svgUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        resolve(null);
      };
      img.src = svgUrl;
    });

    // Clean up
    document.body.removeChild(container);

    return base64Image;
  } catch (error) {
    console.error('Error rendering notation:', error);
    return null;
  }
}

export async function generateQuizResultsPdf(data: QuizPdfData): Promise<Blob> {
  const { quizType, score, totalQuestions, questions, answers, completedAt } = data;

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
