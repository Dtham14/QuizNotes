'use client'

import type { AchievementDefinition } from '@/lib/types/database'

interface AchievementCardProps {
  achievement: AchievementDefinition
  earned?: boolean
  earnedAt?: string
  progress?: { current: number; required: number }
  compact?: boolean
}

const iconMap: Record<string, React.ReactNode> = {
  rocket: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  ),
  target: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  ),
  zap: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  award: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  ),
  trophy: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  ),
  crown: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l3.5 4L12 6l3.5 5L19 7v14" />
  ),
  flame: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
  ),
  star: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  ),
  'trending-up': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  ),
  coins: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  'check-circle': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  sunrise: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  ),
  moon: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  ),
}

const categoryColors: Record<string, { bg: string; iconBg: string; text: string }> = {
  quiz: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
  streak: { bg: 'bg-orange-50', iconBg: 'bg-orange-100', text: 'text-orange-600' },
  score: { bg: 'bg-yellow-50', iconBg: 'bg-yellow-100', text: 'text-yellow-600' },
  milestone: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600' },
  special: { bg: 'bg-green-50', iconBg: 'bg-green-100', text: 'text-green-600' },
}

export default function AchievementCard({
  achievement,
  earned = false,
  earnedAt,
  progress,
  compact = false,
}: AchievementCardProps) {
  const colors = categoryColors[achievement.category] || categoryColors.quiz
  const icon = iconMap[achievement.icon] || iconMap.star
  const progressPercent = progress
    ? Math.min(100, Math.floor((progress.current / progress.required) * 100))
    : 0

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-2 rounded-lg ${
          earned ? colors.bg : 'bg-gray-100'
        }`}
      >
        <div
          className={`p-1.5 rounded-lg ${
            earned ? colors.iconBg : 'bg-gray-200'
          }`}
        >
          <svg
            className={`w-4 h-4 ${earned ? colors.text : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {icon}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${earned ? 'text-gray-900' : 'text-gray-500'}`}>
            {achievement.name}
          </p>
        </div>
        {earned && achievement.xp_reward > 0 && (
          <span className="text-xs font-semibold text-brand">+{achievement.xp_reward} XP</span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        earned
          ? `${colors.bg} border-transparent`
          : 'bg-gray-50 border-gray-200 opacity-75'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-3 rounded-xl ${
            earned ? colors.iconBg : 'bg-gray-200'
          }`}
        >
          <svg
            className={`w-6 h-6 ${earned ? colors.text : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {icon}
          </svg>
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${earned ? 'text-gray-900' : 'text-gray-500'}`}>
            {achievement.name}
          </h3>
          <p className={`text-sm ${earned ? 'text-gray-600' : 'text-gray-400'}`}>
            {achievement.description}
          </p>
          {earned && earnedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Earned {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
          {!earned && progress && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progress.current} / {progress.required}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gray-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {earned && achievement.xp_reward > 0 && (
          <span className="text-sm font-bold text-brand">+{achievement.xp_reward} XP</span>
        )}
      </div>
    </div>
  )
}
