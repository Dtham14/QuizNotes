'use client';

import { useEffect, useRef, useState } from 'react';

export type Note = {
  keys: string[];
  duration: string;
  accidental?: string;
};

type MusicNotationProps = {
  notes: Note[];
  clef?: 'treble' | 'bass';
  timeSignature?: string;
  width?: number;
  height?: number;
};

export default function MusicNotation({
  notes,
  clef = 'treble',
  timeSignature,
  width = 400,
  height = 150,
}: MusicNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !mounted) return;

    const renderNotation = async () => {
      // Clear previous content
      containerRef.current!.innerHTML = '';

      try {
        // Dynamic import of VexFlow
        const VF = await import('vexflow');

        // Create SVG renderer
        const div = containerRef.current!;
        const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure renderer size
        renderer.resize(width, height);
        const context = renderer.getContext();

        // Create a stave
        const stave = new VF.Stave(10, 20, width - 20);
        stave.addClef(clef);

        // Only add time signature if explicitly provided
        if (timeSignature) {
          stave.addTimeSignature(timeSignature);
        }

        stave.setContext(context).draw();

        // Create VexFlow notes
        const vfNotes = notes.map((note) => {
          const vfNote = new VF.StaveNote({
            keys: note.keys,
            duration: note.duration,
            clef: clef,
          });

          // Add accidentals if specified
          if (note.accidental) {
            note.keys.forEach((_, index) => {
              vfNote.addModifier(new VF.Accidental(note.accidental!), index);
            });
          }

          return vfNote;
        });

        // Create a TickContext and add all notes to it
        const tickContext = new VF.TickContext();
        vfNotes.forEach((note) => {
          tickContext.addTickable(note);
        });

        // Preformat to calculate metrics
        tickContext.preFormat();

        // Set X positions and draw notes
        const startX = stave.getNoteStartX();
        const spacing = (width - startX - 60) / notes.length;

        vfNotes.forEach((note, index) => {
          note.setStave(stave);
          note.setContext(context);

          // Set the x position for this note
          const xPos = startX + (index * spacing) + 20;
          tickContext.setX(xPos);

          // Draw the note
          note.draw();
        });

      } catch (err) {
        console.error('VexFlow rendering error:', err);

        // Show fallback
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666; font-family: sans-serif;">
              <p style="font-weight: bold; margin-bottom: 8px;">Unable to render notation</p>
              <p style="font-size: 14px;">Notes: ${notes.map(n => n.keys.join(', ')).join(' → ')}</p>
              <p style="font-size: 12px; color: #999; margin-top: 8px;">Error: ${err instanceof Error ? err.message : 'Unknown'}</p>
            </div>
          `;
        }
      }
    };

    renderNotation();
  }, [notes, clef, timeSignature, width, height, mounted]);

  if (!mounted) {
    return (
      <div
        className="bg-white rounded-lg border-2 border-gray-200 inline-block flex items-center justify-center"
        style={{ minHeight: height, width }}
      >
        <p className="text-gray-500 text-sm">Loading notation...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg border-2 border-gray-200 inline-block"
      style={{ minHeight: height, minWidth: width }}
    />
  );
}
