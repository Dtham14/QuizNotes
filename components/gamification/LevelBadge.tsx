'use client'

interface LevelBadgeProps {
  level: number
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  gray: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export default function LevelBadge({
  level,
  name,
  color = 'gray',
  size = 'md',
}: LevelBadgeProps) {
  const colors = colorClasses[color] || colorClasses.gray

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} font-semibold`}
    >
      <span className="font-bold">Lv.{level}</span>
      <span className="opacity-75">{name}</span>
    </div>
  )
}
