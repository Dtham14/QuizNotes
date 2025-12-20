'use client'

import { useEffect, useState } from 'react'

interface XPBreakdownItem {
  reason: string
  amount: number
}

interface XPGainAnimationProps {
  xpAwarded: number
  breakdown: XPBreakdownItem[]
  onComplete?: () => void
}

const reasonLabels: Record<string, string> = {
  quiz_complete: 'Quiz Complete',
  score_bonus: 'Score Bonus',
  perfect_score: 'Perfect Score!',
  streak_bonus: 'Streak Bonus',
  daily_goal: 'Daily Goal Met!',
  first_quiz_of_day: 'First Quiz Today',
  achievement: 'Achievement',
}

export default function XPGainAnimation({
  xpAwarded,
  breakdown,
  onComplete,
}: XPGainAnimationProps) {
  const [visible, setVisible] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    // Show breakdown after a short delay
    const breakdownTimer = setTimeout(() => {
      setShowBreakdown(true)
    }, 300)

    // Auto-hide after animation
    const hideTimer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 4000)

    return () => {
      clearTimeout(breakdownTimer)
      clearTimeout(hideTimer)
    }
  }, [onComplete])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-bounce-in">
        {/* Main XP display */}
        <div className="bg-brand text-white px-8 py-4 rounded-2xl shadow-2xl text-center mb-4 animate-pulse-glow">
          <div className="text-4xl font-bold mb-1">+{xpAwarded} XP</div>
        </div>

        {/* Breakdown */}
        {showBreakdown && breakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-4 max-w-xs mx-auto animate-slide-up">
            <div className="space-y-2">
              {breakdown.map((item, index) => (
                <div
                  key={item.reason}
                  className="flex justify-between items-center text-sm animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="text-gray-600">
                    {reasonLabels[item.reason] || item.reason}
                  </span>
                  <span className="font-semibold text-brand">+{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }

        .animate-pulse-glow {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
