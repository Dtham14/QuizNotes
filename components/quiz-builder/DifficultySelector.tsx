'use client';

import type { Difficulty } from '@/lib/quizBuilder/types';

interface DifficultySelectorProps {
  selected: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; description: string; color: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Start with the basics',
    color: 'from-green-500 to-emerald-500',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Ready for more challenge',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Test your mastery',
    color: 'from-red-500 to-rose-500',
  },
];

export default function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  return (
    <div className="flex gap-2">
      {DIFFICULTIES.map((diff) => (
        <button
          key={diff.value}
          onClick={() => onChange(diff.value)}
          className={`flex-1 p-3 rounded-xl transition-all duration-200 ${
            selected === diff.value
              ? `bg-gradient-to-r ${diff.color} text-white shadow-lg scale-[1.02]`
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <div className="font-semibold text-sm">{diff.label}</div>
          {selected === diff.value && (
            <div className="text-xs opacity-90 mt-0.5">{diff.description}</div>
          )}
        </button>
      ))}
    </div>
  );
}
