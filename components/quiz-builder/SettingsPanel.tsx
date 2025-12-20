'use client';

import type {
  QuizSettings,
  NoteIdentificationSettings,
  KeySignatureSettings,
  IntervalSettings,
  ChordSettings,
  ScaleSettings,
  EarTrainingNoteSettings,
  Clef,
  Direction,
  AccidentalType,
  KeyType,
} from '@/lib/quizBuilder/types';
import {
  ALL_INTERVALS,
  ALL_CHORD_TYPES,
  ALL_SCALE_TYPES,
} from '@/lib/quizBuilder/types';
import {
  CLEF_OPTIONS,
  DIRECTION_OPTIONS,
  ACCIDENTAL_OPTIONS,
  KEY_TYPE_OPTIONS,
  KEY_DIRECTION_OPTIONS,
  PITCH_RANGE_OPTIONS,
  getPitchRangeForClef,
  getDefaultPitchRangeForClef,
} from '@/lib/quizBuilder/presets';

interface SettingsPanelProps {
  settings: QuizSettings;
  onChange: (settings: Partial<QuizSettings>) => void;
}

// Radio button group component
function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              value === option.value
                ? 'bg-[#439FDD] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Select dropdown component
function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#439FDD] focus:border-[#439FDD] text-black"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// Pitch range component
function PitchRangeField({
  min,
  max,
  onChange,
  pitchOptions = PITCH_RANGE_OPTIONS,
}: {
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
  pitchOptions?: string[];
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">Pitch Range</label>
      <div className="flex items-center gap-3">
        <select
          value={min}
          onChange={(e) => onChange(e.target.value, max)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#439FDD] text-black"
        >
          {pitchOptions.map((opt) => (
            <option key={opt} value={opt} className="text-black">
              {opt}
            </option>
          ))}
        </select>
        <span className="text-black font-medium">to</span>
        <select
          value={max}
          onChange={(e) => onChange(min, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#439FDD] text-black"
        >
          {pitchOptions.map((opt) => (
            <option key={opt} value={opt} className="text-black">
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Checkbox toggle
function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-gray-300 text-[#439FDD] focus:ring-[#439FDD]"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const { quizType } = settings;

  // Render settings based on quiz type
  switch (quizType) {
    case 'noteIdentification': {
      const s = settings as NoteIdentificationSettings;
      const clef = s.clef ?? 'treble';
      const pitchRange = s.pitchRange ?? { min: 'C4', max: 'C5' };
      const accidentals = s.accidentals ?? 'natural';
      const pitchOptions = getPitchRangeForClef(clef);

      // Handle clef change - reset pitch range to valid values for the new clef
      const handleClefChange = (newClef: Clef) => {
        const newPitchRange = getDefaultPitchRangeForClef(newClef);
        onChange({ clef: newClef, pitchRange: newPitchRange });
      };

      return (
        <div className="space-y-4">
          <RadioGroup<Clef>
            label="Clef"
            options={CLEF_OPTIONS}
            value={clef}
            onChange={handleClefChange}
          />
          <PitchRangeField
            min={pitchRange.min}
            max={pitchRange.max}
            onChange={(min, max) => onChange({ pitchRange: { min, max } })}
            pitchOptions={pitchOptions}
          />
          <RadioGroup<AccidentalType>
            label="Accidentals"
            options={ACCIDENTAL_OPTIONS}
            value={accidentals}
            onChange={(acc) => onChange({ accidentals: acc })}
          />
        </div>
      );
    }

    case 'keySignature': {
      const s = settings as KeySignatureSettings;
      // Provide defaults for all fields if undefined (for saved settings without these fields)
      const clef = s.clef ?? 'treble';
      const direction = s.direction ?? 'staffToName';
      const keyTypes = s.keyTypes ?? 'major';
      const maxSharps = s.maxSharps ?? 7;
      const maxFlats = s.maxFlats ?? 7;
      return (
        <div className="space-y-4">
          <RadioGroup<Clef>
            label="Clef"
            options={CLEF_OPTIONS}
            value={clef}
            onChange={(c) => onChange({ clef: c })}
          />
          <RadioGroup<'staffToName' | 'nameToStaff' | 'both'>
            label="Question Direction"
            options={KEY_DIRECTION_OPTIONS}
            value={direction}
            onChange={(dir) => onChange({ direction: dir })}
          />
          <RadioGroup<KeyType>
            label="Key Types"
            options={KEY_TYPE_OPTIONS}
            value={keyTypes}
            onChange={(kt) => onChange({ keyTypes: kt })}
          />
          {/* Sharps/Flats Range Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Max Sharps</label>
                <span className="text-sm font-bold text-[#439FDD]">{maxSharps}</span>
              </div>
              <input
                type="range"
                min={0}
                max={7}
                value={maxSharps}
                onChange={(e) => onChange({ maxSharps: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#439FDD]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>7</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Max Flats</label>
                <span className="text-sm font-bold text-[#439FDD]">{maxFlats}</span>
              </div>
              <input
                type="range"
                min={0}
                max={7}
                value={maxFlats}
                onChange={(e) => onChange({ maxFlats: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#439FDD]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>7</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'intervalIdentification': {
      const s = settings as IntervalSettings;
      const clef = s.clef ?? 'treble';
      const direction = s.direction ?? 'ascending';
      const intervals = s.intervals ?? ['M2', 'm3', 'M3', 'P5', 'P8'];
      return (
        <div className="space-y-4">
          <RadioGroup<Clef>
            label="Clef"
            options={CLEF_OPTIONS}
            value={clef}
            onChange={(c) => onChange({ clef: c })}
          />
          <RadioGroup<Direction>
            label="Direction"
            options={DIRECTION_OPTIONS}
            value={direction}
            onChange={(dir) => onChange({ direction: dir })}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Intervals ({intervals.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_INTERVALS.map((interval) => (
                <button
                  key={interval.id}
                  onClick={() => {
                    const newIntervals = intervals.includes(interval.id)
                      ? intervals.filter((i) => i !== interval.id)
                      : [...intervals, interval.id];
                    if (newIntervals.length > 0) {
                      onChange({ intervals: newIntervals });
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    intervals.includes(interval.id)
                      ? 'bg-[#439FDD] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {interval.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'chordIdentification': {
      const s = settings as ChordSettings;
      const clef = s.clef ?? 'treble';
      const inversions = s.inversions ?? 'root';
      const chordTypes = s.chordTypes ?? ['major', 'minor'];
      return (
        <div className="space-y-4">
          <RadioGroup<Clef>
            label="Clef"
            options={CLEF_OPTIONS}
            value={clef}
            onChange={(c) => onChange({ clef: c })}
          />
          <RadioGroup<'root' | 'all'>
            label="Inversions"
            options={[
              { value: 'root', label: 'Root position only' },
              { value: 'all', label: 'All inversions' },
            ]}
            value={inversions}
            onChange={(inv) => onChange({ inversions: inv })}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Chord Types ({chordTypes.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CHORD_TYPES.map((chord) => (
                <button
                  key={chord.id}
                  onClick={() => {
                    const newTypes = chordTypes.includes(chord.id)
                      ? chordTypes.filter((c) => c !== chord.id)
                      : [...chordTypes, chord.id];
                    if (newTypes.length > 0) {
                      onChange({ chordTypes: newTypes });
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    chordTypes.includes(chord.id)
                      ? 'bg-[#439FDD] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {chord.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'scaleIdentification': {
      const s = settings as ScaleSettings;
      const clef = s.clef ?? 'treble';
      const scaleTypes = s.scaleTypes ?? ['major'];
      return (
        <div className="space-y-4">
          <RadioGroup<Clef>
            label="Clef"
            options={CLEF_OPTIONS}
            value={clef}
            onChange={(c) => onChange({ clef: c })}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Scale Types ({scaleTypes.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SCALE_TYPES.map((scale) => (
                <button
                  key={scale.id}
                  onClick={() => {
                    const newTypes = scaleTypes.includes(scale.id)
                      ? scaleTypes.filter((t) => t !== scale.id)
                      : [...scaleTypes, scale.id];
                    if (newTypes.length > 0) {
                      onChange({ scaleTypes: newTypes });
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    scaleTypes.includes(scale.id)
                      ? 'bg-[#439FDD] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {scale.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'earTrainingNote': {
      const s = settings as EarTrainingNoteSettings;
      const pitchRange = s.pitchRange ?? { min: 'C4', max: 'B4' };
      const showReference = s.showReference ?? true;
      return (
        <div className="space-y-4">
          <PitchRangeField
            min={pitchRange.min}
            max={pitchRange.max}
            onChange={(min, max) => onChange({ pitchRange: { min, max } })}
          />
          <ToggleField
            label="Show reference note (C4)"
            checked={showReference}
            onChange={(sr) => onChange({ showReference: sr })}
          />
        </div>
      );
    }

    case 'earTrainingInterval': {
      const s = settings as IntervalSettings;
      const direction = s.direction ?? 'ascending';
      const intervals = s.intervals ?? ['M2', 'm3', 'M3', 'P5', 'P8'];
      return (
        <div className="space-y-4">
          <RadioGroup<Direction>
            label="Direction"
            options={DIRECTION_OPTIONS}
            value={direction}
            onChange={(dir) => onChange({ direction: dir })}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Intervals ({intervals.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_INTERVALS.map((interval) => (
                <button
                  key={interval.id}
                  onClick={() => {
                    const newIntervals = intervals.includes(interval.id)
                      ? intervals.filter((i) => i !== interval.id)
                      : [...intervals, interval.id];
                    if (newIntervals.length > 0) {
                      onChange({ intervals: newIntervals });
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    intervals.includes(interval.id)
                      ? 'bg-[#439FDD] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {interval.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'earTrainingChord': {
      const s = settings as ChordSettings;
      const inversions = s.inversions ?? 'root';
      const chordTypes = s.chordTypes ?? ['major', 'minor'];
      return (
        <div className="space-y-4">
          <RadioGroup<'root' | 'all'>
            label="Inversions"
            options={[
              { value: 'root', label: 'Root position only' },
              { value: 'all', label: 'All inversions' },
            ]}
            value={inversions}
            onChange={(inv) => onChange({ inversions: inv })}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Chord Types ({chordTypes.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CHORD_TYPES.map((chord) => (
                <button
                  key={chord.id}
                  onClick={() => {
                    const newTypes = chordTypes.includes(chord.id)
                      ? chordTypes.filter((c) => c !== chord.id)
                      : [...chordTypes, chord.id];
                    if (newTypes.length > 0) {
                      onChange({ chordTypes: newTypes });
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    chordTypes.includes(chord.id)
                      ? 'bg-[#439FDD] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {chord.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    default:
      return <div className="text-gray-500">No settings available for this quiz type.</div>;
  }
}
