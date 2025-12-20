'use client'

interface StreakCounterProps {
  currentStreak: number
  longestStreak?: number
  isActiveToday?: boolean
  willExpireToday?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLongest?: boolean
}

const sizeClasses = {
  sm: { container: 'gap-1', icon: 'w-4 h-4', text: 'text-sm', subtext: 'text-xs' },
  md: { container: 'gap-2', icon: 'w-6 h-6', text: 'text-lg', subtext: 'text-sm' },
  lg: { container: 'gap-3', icon: 'w-8 h-8', text: 'text-2xl', subtext: 'text-base' },
}

export default function StreakCounter({
  currentStreak,
  longestStreak,
  isActiveToday = false,
  willExpireToday = false,
  size = 'md',
  showLongest = false,
}: StreakCounterProps) {
  const sizes = sizeClasses[size]
  const hasStreak = currentStreak > 0

  return (
    <div className={`flex items-center ${sizes.container}`}>
      <div className="relative">
        {/* Flame icon */}
        <svg
          className={`${sizes.icon} ${
            hasStreak
              ? isActiveToday
                ? 'text-orange-500'
                : willExpireToday
                ? 'text-orange-400 animate-pulse'
                : 'text-orange-500'
              : 'text-gray-300'
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 23c-4.97 0-9-3.582-9-8 0-2.418 1.042-4.615 2.712-6.334C7.42 6.892 8.5 4.582 8.5 2a.5.5 0 01.793-.407C10.75 2.71 12 4.5 12 6c0-2.5 2-5 4-6a.5.5 0 01.783.454c-.152 1.77-.163 3.61.505 5.046C18.833 8.5 21 11.5 21 15c0 4.418-4.03 8-9 8zm0-2c3.866 0 7-2.686 7-6 0-2.648-1.5-5-3-6.5.5 2-1 4-3 4-.5-2-2-4-3-5-.257 1.723-1.203 3.227-2.088 4.335C6.695 13.321 5 15.093 5 17c0 3.314 3.134 6 7 6z" />
        </svg>
        {/* Glow effect for active streak */}
        {hasStreak && isActiveToday && (
          <div className="absolute inset-0 bg-orange-400 blur-md opacity-30 rounded-full" />
        )}
      </div>

      <div className="flex flex-col">
        <span className={`font-bold ${sizes.text} ${hasStreak ? 'text-gray-900' : 'text-gray-400'}`}>
          {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
        </span>
        {showLongest && longestStreak !== undefined && longestStreak > 0 && (
          <span className={`${sizes.subtext} text-gray-500`}>
            Best: {longestStreak} days
          </span>
        )}
        {willExpireToday && !isActiveToday && (
          <span className={`${sizes.subtext} text-orange-600 font-medium`}>
            Complete a quiz to keep your streak!
          </span>
        )}
      </div>
    </div>
  )
}
