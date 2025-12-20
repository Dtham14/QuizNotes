'use client'

interface XPProgressBarProps {
  currentXP: number
  currentLevelXP: number
  nextLevelXP: number | null
  progress: number
  level: number
  levelName: string
  color?: string
  showDetails?: boolean
}

export default function XPProgressBar({
  currentXP,
  currentLevelXP,
  nextLevelXP,
  progress,
  level,
  levelName,
  color = 'brand',
  showDetails = true,
}: XPProgressBarProps) {
  const xpIntoLevel = currentXP - currentLevelXP
  const xpNeeded = nextLevelXP ? nextLevelXP - currentLevelXP : 0
  const isMaxLevel = !nextLevelXP

  return (
    <div className="w-full">
      {showDetails && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">
            Level {level} - {levelName}
          </span>
          <span className="text-sm text-gray-500">
            {isMaxLevel ? (
              'Max Level!'
            ) : (
              <>
                {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
              </>
            )}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            color === 'brand' ? 'bg-brand' : `bg-${color}-500`
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showDetails && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            Total: {currentXP.toLocaleString()} XP
          </span>
          {!isMaxLevel && (
            <span className="text-xs text-gray-500">
              {(xpNeeded - xpIntoLevel).toLocaleString()} XP to Level {level + 1}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
