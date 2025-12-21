'use client';

import { useEffect, useRef, useState } from 'react';

export type Note = {
  keys: string[];
  duration: string;
  accidental?: string;
  accidentals?: (string | null)[]; // Per-key accidentals for chords
};

type MusicNotationProps = {
  notes?: Note[];
  clef?: 'treble' | 'bass';
  timeSignature?: string;
  keySignature?: string;
  width?: number;
  height?: number;
};

export default function MusicNotation({
  notes,
  clef = 'treble',
  timeSignature,
  keySignature,
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

        // Add key signature if provided
        if (keySignature) {
          stave.addKeySignature(keySignature);
        }

        // Only add time signature if explicitly provided
        if (timeSignature) {
          stave.addTimeSignature(timeSignature);
        }

        stave.setContext(context).draw();

        // Only render notes if they exist and are valid
        // Filter out notes with invalid keys (empty strings, missing octaves, etc.)
        const validNotes = notes?.filter(note =>
          note.keys &&
          note.keys.length > 0 &&
          note.keys.every(key => key && key.includes('/') && key.split('/')[0] && key.split('/')[1])
        ) || [];

        if (validNotes.length > 0) {
          // Use VexFlow's built-in stem direction constants
          const { Stem } = VF;

          // Helper function to determine stem direction based on note position
          const getStemDirection = (noteKey: string, noteClef: 'treble' | 'bass'): number => {
            // Extract pitch and octave (e.g. "c#/4")
            const [pitch, octaveStr] = noteKey.split('/');
            const octave = parseInt(octaveStr);

            // Convert pitch to scale index
            const pitchOrder = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
            const pitchIndex = pitchOrder.indexOf(pitch[0].toLowerCase());

            // Map middle line reference
            const middleLine = noteClef === 'treble'
              ? { pitch: 'b', octave: 4 } // B4
              : { pitch: 'd', octave: 3 }; // D3

            const middlePitchIndex = pitchOrder.indexOf(middleLine.pitch);

            // Compare position: stem up if below middle line
            if (
              octave < middleLine.octave ||
              (octave === middleLine.octave && pitchIndex < middlePitchIndex)
            ) {
              return Stem.UP;
            }

            return Stem.DOWN;
          };

          // For chords, determine stem direction based on note farthest from middle
          const getChordStemDirection = (keys: string[], noteClef: 'treble' | 'bass'): number => {
            if (keys.length === 1) {
              return getStemDirection(keys[0], noteClef);
            }

            // For chords, check the outermost notes
            const pitchOrder = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
            const middleLine = noteClef === 'treble'
              ? { pitch: 'b', octave: 4 }
              : { pitch: 'd', octave: 3 };
            const middlePitchIndex = pitchOrder.indexOf(middleLine.pitch);
            const middleValue = middleLine.octave * 7 + middlePitchIndex;

            // Calculate positions for all notes
            const positions = keys.map(key => {
              const [pitch, octaveStr] = key.split('/');
              const octave = parseInt(octaveStr);
              const pitchIndex = pitchOrder.indexOf(pitch[0].toLowerCase());
              return octave * 7 + pitchIndex;
            });

            const minPos = Math.min(...positions);
            const maxPos = Math.max(...positions);
            const distFromMiddleDown = Math.abs(minPos - middleValue);
            const distFromMiddleUp = Math.abs(maxPos - middleValue);

            // If top note is farther from middle, stem down; otherwise stem up
            return distFromMiddleUp >= distFromMiddleDown ? Stem.DOWN : Stem.UP;
          };

          // Create VexFlow notes with accidentals
          const vfNotes = validNotes.map((note) => {
            const vfNote = new VF.StaveNote({
              keys: note.keys,
              duration: note.duration,
              clef: clef,
            });

            // Add per-key accidentals if specified (for chords)
            if (note.accidentals && note.accidentals.length > 0) {
              note.accidentals.forEach((acc, index) => {
                if (acc && acc !== 'n') {
                  vfNote.addModifier(new VF.Accidental(acc), index);
                }
              });
            }
            // Fall back to single accidental for all keys (backwards compatibility)
            else if (note.accidental) {
              note.keys.forEach((_, index) => {
                vfNote.addModifier(new VF.Accidental(note.accidental!), index);
              });
            }

            return vfNote;
          });

          // Set stave and stem direction for each note
          vfNotes.forEach((note, index) => {
            note.setStave(stave);

            // Set stem direction for notes with stems (not whole notes)
            const originalNote = validNotes[index];
            if (originalNote.duration !== 'w') {
              const stemDirection = getChordStemDirection(originalNote.keys, clef);
              note.setStemDirection(stemDirection);
            }
          });

          // Create a voice and add notes
          const voice = new VF.Voice({ numBeats: validNotes.length, beatValue: 1 }).setStrict(false);
          voice.addTickables(vfNotes);

          // Use Formatter to handle accidental positioning automatically
          const formatter = new VF.Formatter();
          formatter.joinVoices([voice]);
          formatter.format([voice], width - stave.getNoteStartX() - 40);

          // Draw the voice
          voice.draw(context, stave);
        }

      } catch (err) {
        console.error('VexFlow rendering error:', err);

        // Show fallback
        if (containerRef.current) {
          const notesDisplay = notes && notes.length > 0
            ? `Notes: ${notes.map(n => n.keys.join(', ')).join(' → ')}`
            : keySignature
              ? `Key Signature: ${keySignature}`
              : 'No content';
          containerRef.current.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666; font-family: sans-serif;">
              <p style="font-weight: bold; margin-bottom: 8px;">Unable to render notation</p>
              <p style="font-size: 14px;">${notesDisplay}</p>
              <p style="font-size: 12px; color: #999; margin-top: 8px;">Error: ${err instanceof Error ? err.message : 'Unknown'}</p>
            </div>
          `;
        }
      }
    };

    renderNotation();
  }, [notes, clef, timeSignature, keySignature, width, height, mounted]);

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
