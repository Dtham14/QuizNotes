'use client'

import dynamic from 'next/dynamic'

const PREMIUM_BLUE = '#439FDD'

const RhythmGame = dynamic(
  () => import('@/components/premium-features/RhythmGame'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: PREMIUM_BLUE, borderTopColor: 'transparent' }}
          ></div>
          <p>Loading rhythm game...</p>
        </div>
      </div>
    )
  }
)

export default function RhythmPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, #e8f4fc 0%, #d0e8f7 100%)' }}
        >
          <span className="text-4xl">🎮</span>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">Rhythm Game</h1>
            <p className="text-sm text-gray-600">Test your timing skills with falling notes</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">How to Play</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold"
              style={{ backgroundColor: PREMIUM_BLUE }}
            >
              1
            </div>
            <div>
              <p className="font-semibold text-gray-900">Watch the Notes</p>
              <p className="text-sm text-gray-600">Notes will fall from the top of the screen</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold"
              style={{ backgroundColor: PREMIUM_BLUE }}
            >
              2
            </div>
            <div>
              <p className="font-semibold text-gray-900">Tap in Time</p>
              <p className="text-sm text-gray-600">Press Space or tap when notes reach the target line</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold"
              style={{ backgroundColor: PREMIUM_BLUE }}
            >
              3
            </div>
            <div>
              <p className="font-semibold text-gray-900">Build Combos</p>
              <p className="text-sm text-gray-600">Hit consecutive notes perfectly to increase your score multiplier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Guide */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Scoring</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-bold text-green-700">Perfect</p>
              <p className="text-xs text-green-600">&lt;50ms timing</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-lg">
            <span className="text-2xl">👍</span>
            <div>
              <p className="font-bold text-yellow-700">Good</p>
              <p className="text-xs text-yellow-600">&lt;120ms timing</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-bold text-red-700">Miss</p>
              <p className="text-xs text-red-600">Too early/late</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Component */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <RhythmGame />
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>💡</span> Tips for Better Scores
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Start with Easy difficulty to get used to the timing
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Listen to the beat - the notes sync with the tempo
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Focus on the target line, not the falling notes
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Build up combos for higher scores - consistency is key!
          </li>
        </ul>
      </div>
    </div>
  )
}
