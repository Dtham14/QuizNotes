'use client'

import dynamic from 'next/dynamic'

const PREMIUM_BLUE = '#439FDD'

const SandboxComposition = dynamic(
  () => import('@/components/premium-features/SandboxComposition'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: PREMIUM_BLUE, borderTopColor: 'transparent' }}
          ></div>
          <p>Loading composition tool...</p>
        </div>
      </div>
    )
  }
)

export default function CompositionPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, #e8f4fc 0%, #d0e8f7 100%)' }}
        >
          <span className="text-4xl">🎼</span>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">Sandbox Composition</h1>
            <p className="text-sm text-gray-600">Create and play your own music</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">How to Compose</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold"
              style={{ backgroundColor: PREMIUM_BLUE }}
            >
              1
            </div>
            <div>
              <p className="font-semibold text-gray-900">Select Duration</p>
              <p className="text-sm text-gray-600">Choose note length (whole, half, quarter, etc.)</p>
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
              <p className="font-semibold text-gray-900">Click to Place</p>
              <p className="text-sm text-gray-600">Click on the staff to add notes</p>
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
              <p className="font-semibold text-gray-900">Set Key & Time</p>
              <p className="text-sm text-gray-600">Choose your key signature and time signature</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold"
              style={{ backgroundColor: PREMIUM_BLUE }}
            >
              4
            </div>
            <div>
              <p className="font-semibold text-gray-900">Play Back</p>
              <p className="text-sm text-gray-600">Press play to hear your composition</p>
            </div>
          </div>
        </div>
      </div>

      {/* Note Duration Legend */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Note Durations</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-2xl">𝅝</span>
            <div>
              <p className="font-bold text-gray-900">Whole</p>
              <p className="text-xs text-gray-500">4 beats</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-2xl">𝅗𝅥</span>
            <div>
              <p className="font-bold text-gray-900">Half</p>
              <p className="text-xs text-gray-500">2 beats</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-2xl">♩</span>
            <div>
              <p className="font-bold text-gray-900">Quarter</p>
              <p className="text-xs text-gray-500">1 beat</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-2xl">♪</span>
            <div>
              <p className="font-bold text-gray-900">Eighth</p>
              <p className="text-xs text-gray-500">1/2 beat</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <span className="text-2xl">𝅘𝅥𝅯</span>
            <div>
              <p className="font-bold text-gray-900">Sixteenth</p>
              <p className="text-xs text-gray-500">1/4 beat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Composition Component */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <SandboxComposition />
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>💡</span> Composition Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Start simple - try writing a 4-bar melody using quarter notes first
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Use notes from the same key signature for a harmonious sound
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Experiment with different tempos to change the feel of your piece
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Right-click on a note to delete it if you make a mistake
          </li>
        </ul>
      </div>
    </div>
  )
}
