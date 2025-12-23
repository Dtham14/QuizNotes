'use client'

import dynamic from 'next/dynamic'

const PREMIUM_BLUE = '#439FDD'

const InteractivePiano = dynamic(
  () => import('@/components/premium-features/InteractivePiano'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: PREMIUM_BLUE, borderTopColor: 'transparent' }}
          ></div>
          <p>Loading piano...</p>
        </div>
      </div>
    )
  }
)

export default function PianoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, #e8f4fc 0%, #d0e8f7 100%)' }}
        >
          <span className="text-4xl">🎹</span>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">Interactive Piano</h1>
            <p className="text-sm text-gray-600">Play, practice, and record your melodies</p>
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
              <p className="font-semibold text-gray-900">Click or Tap</p>
              <p className="text-sm text-gray-600">Click on the piano keys to play notes</p>
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
              <p className="font-semibold text-gray-900">Keyboard Shortcuts</p>
              <p className="text-sm text-gray-600">Use ASDFGHJKL for white keys, WETYUO for black keys</p>
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
              <p className="font-semibold text-gray-900">Record & Playback</p>
              <p className="text-sm text-gray-600">Record your performance and play it back</p>
            </div>
          </div>
        </div>
      </div>

      {/* Piano Component */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <InteractivePiano />
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>💡</span> Tips for Practice
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Start with simple scales like C Major (all white keys from C to C)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Practice playing intervals - try playing two notes that are 3 or 5 keys apart
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Use the recording feature to hear yourself and improve your timing
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Try playing simple melodies like &quot;Mary Had a Little Lamb&quot; or &quot;Twinkle Twinkle&quot;
          </li>
        </ul>
      </div>
    </div>
  )
}
