'use client'

import { useEffect, useState } from 'react'
import LevelBadge from './LevelBadge'

interface LevelUpCelebrationProps {
  previousLevel: number
  newLevel: number
  levelName: string
  levelColor: string
  onComplete?: () => void
}

export default function LevelUpCelebration({
  previousLevel,
  newLevel,
  levelName,
  levelColor,
  onComplete,
}: LevelUpCelebrationProps) {
  const [visible, setVisible] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Show details after initial animation
    const detailsTimer = setTimeout(() => {
      setShowDetails(true)
    }, 500)

    // Auto-hide after celebration
    const hideTimer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 5000)

    return () => {
      clearTimeout(detailsTimer)
      clearTimeout(hideTimer)
    }
  }, [onComplete])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Confetti effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][
                Math.floor(Math.random() * 6)
              ],
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center animate-scale-in">
        {/* Stars burst */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 animate-star-burst"
              style={{
                transform: `rotate(${i * 45}deg)`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <svg
                className="w-full h-full text-yellow-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          ))}
        </div>

        {/* Level up text */}
        <div className="mb-6 animate-bounce-slow">
          <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-glow">
            LEVEL UP!
          </span>
        </div>

        {/* Level transition */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="opacity-50 scale-90">
            <LevelBadge level={previousLevel} name="" color="gray" size="lg" />
          </div>
          <svg className="w-8 h-8 text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div className="animate-glow-pulse">
            <LevelBadge level={newLevel} name={levelName} color={levelColor} size="lg" />
          </div>
        </div>

        {/* Subtitle */}
        {showDetails && (
          <div className="animate-slide-up">
            <p className="text-xl text-white font-semibold mb-2">
              Congratulations! You've reached
            </p>
            <p className="text-3xl font-bold text-white">
              Level {newLevel}: {levelName}
            </p>
          </div>
        )}

        {/* Dismiss hint */}
        <p className="text-white/60 text-sm mt-8 animate-pulse">
          Click anywhere to continue
        </p>
      </div>

      {/* Click to dismiss */}
      <button
        onClick={() => {
          setVisible(false)
          onComplete?.()
        }}
        className="absolute inset-0 z-20"
        aria-label="Dismiss"
      />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes slide-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes star-burst {
          0% { transform: rotate(var(--rotation)) translateX(0) scale(0); opacity: 0; }
          50% { transform: rotate(var(--rotation)) translateX(80px) scale(1); opacity: 1; }
          100% { transform: rotate(var(--rotation)) translateX(120px) scale(0.5); opacity: 0; }
        }

        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8)); }
          50% { filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1)); }
        }

        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-star-burst {
          animation: star-burst 1.5s ease-out forwards;
        }

        .animate-glow-pulse {
          animation: glow-pulse 1.5s ease-in-out infinite;
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear infinite;
        }

        .drop-shadow-glow {
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
        }
      `}</style>
    </div>
  )
}
