'use client'

interface DailyGoalProgressProps {
  quizzesToday: number
  dailyGoal: number
  goalMet: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { ring: 48, stroke: 4, text: 'text-sm', icon: 'w-4 h-4' },
  md: { ring: 64, stroke: 5, text: 'text-base', icon: 'w-5 h-5' },
  lg: { ring: 80, stroke: 6, text: 'text-lg', icon: 'w-6 h-6' },
}

export default function DailyGoalProgress({
  quizzesToday,
  dailyGoal,
  goalMet,
  size = 'md',
}: DailyGoalProgressProps) {
  const sizes = sizeClasses[size]
  const progress = Math.min(100, (quizzesToday / dailyGoal) * 100)
  const radius = (sizes.ring - sizes.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: sizes.ring, height: sizes.ring }}>
        {/* Background ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={sizes.ring / 2}
            cy={sizes.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={sizes.stroke}
            className="text-gray-200"
          />
          {/* Progress ring */}
          <circle
            cx={sizes.ring / 2}
            cy={sizes.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={sizes.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-500 ${
              goalMet ? 'text-green-500' : 'text-brand'
            }`}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {goalMet ? (
            <svg
              className={`${sizes.icon} text-green-500`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <span className={`${sizes.text} font-bold text-gray-700`}>
              {quizzesToday}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <span className={`${sizes.text} font-semibold text-gray-900`}>
          {goalMet ? 'Goal Complete!' : 'Daily Goal'}
        </span>
        <span className="text-sm text-gray-500">
          {quizzesToday} / {dailyGoal} quizzes
        </span>
      </div>
    </div>
  )
}
