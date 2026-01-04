'use client'

import { useState, useEffect } from 'react'

interface ConnectionsGroup {
  name: string
  items: string[]
  difficulty: number // 1-4 (yellow, green, blue, purple)
}

interface ConnectionsGameProps {
  groups: ConnectionsGroup[]
  onComplete: (score: number, mistakes: number) => void
}

const DIFFICULTY_COLORS = {
  1: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-900', name: 'Easy' },
  2: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900', name: 'Medium' },
  3: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900', name: 'Hard' },
  4: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900', name: 'Very Hard' },
}

export default function ConnectionsGame({ groups, onComplete }: ConnectionsGameProps) {
  const [allItems, setAllItems] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [solvedGroups, setSolvedGroups] = useState<ConnectionsGroup[]>([])
  const [remainingItems, setRemainingItems] = useState<string[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [shakeWrong, setShakeWrong] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)

  const MAX_MISTAKES = 4

  useEffect(() => {
    // Shuffle all items from all groups
    const items = groups.flatMap((g) => g.items)
    const shuffled = items.sort(() => Math.random() - 0.5)
    setAllItems(shuffled)
    setRemainingItems(shuffled)
  }, [groups])

  const toggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item))
    } else {
      if (selectedItems.length < 4) {
        setSelectedItems([...selectedItems, item])
      }
    }
  }

  const handleSubmit = () => {
    if (selectedItems.length !== 4) return

    // Check if selected items form a correct group
    const matchingGroup = groups.find((group) => {
      return (
        group.items.every((item) => selectedItems.includes(item)) &&
        selectedItems.every((item) => group.items.includes(item))
      )
    })

    if (matchingGroup) {
      // Correct group!
      const newSolvedGroups = [...solvedGroups, matchingGroup]
      setSolvedGroups(newSolvedGroups)
      setRemainingItems(remainingItems.filter((item) => !selectedItems.includes(item)))
      setSelectedItems([])

      // Check if all groups solved
      if (newSolvedGroups.length === groups.length) {
        setWon(true)
        setGameOver(true)
        const score = 10 - mistakes // 10 points minus mistakes
        onComplete(Math.max(0, score), mistakes)
      }
    } else {
      // Wrong group
      const newMistakes = mistakes + 1
      setMistakes(newMistakes)

      // Shake animation
      setShakeWrong(true)
      setTimeout(() => setShakeWrong(false), 500)

      // Check if out of mistakes
      if (newMistakes >= MAX_MISTAKES) {
        setGameOver(true)
        onComplete(0, newMistakes)
      }
    }
  }

  const handleShuffle = () => {
    const shuffled = [...remainingItems].sort(() => Math.random() - 0.5)
    setRemainingItems(shuffled)
  }

  const handleDeselectAll = () => {
    setSelectedItems([])
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Music Theory Connections</h1>
          <p className="text-gray-600">Group these 16 items into 4 categories of 4</p>
        </div>

        {/* Mistakes Counter */}
        <div className="flex justify-center gap-2 mb-6">
          <span className="text-sm font-semibold text-gray-700">Mistakes:</span>
          {[...Array(MAX_MISTAKES)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                i < mistakes ? 'bg-red-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Solved Groups */}
        {solvedGroups.length > 0 && (
          <div className="space-y-3 mb-6">
            {solvedGroups.map((group, idx) => {
              const colors = DIFFICULTY_COLORS[group.difficulty as keyof typeof DIFFICULTY_COLORS]
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border}`}
                >
                  <h3 className={`font-bold text-sm mb-2 ${colors.text}`}>
                    {group.name} ({colors.name})
                  </h3>
                  <p className="text-sm text-gray-700">{group.items.join(' • ')}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Game Over */}
        {gameOver ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">{won ? '🎉' : '😔'}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {won ? 'Perfect!' : 'Game Over'}
            </h2>
            <p className="text-gray-600 mb-4">
              {won
                ? `You solved all groups with ${mistakes} mistake${mistakes !== 1 ? 's' : ''}!`
                : 'You ran out of attempts. Better luck next time!'}
            </p>
            <div className="text-3xl font-bold text-violet-600 mb-2">
              Score: {Math.max(0, 10 - mistakes)}/10
            </div>
          </div>
        ) : (
          <>
            {/* Items Grid */}
            <div
              className={`grid grid-cols-4 gap-2 mb-6 ${
                shakeWrong ? 'animate-shake' : ''
              }`}
            >
              {remainingItems.map((item, idx) => {
                const isSelected = selectedItems.includes(item)
                return (
                  <button
                    key={idx}
                    onClick={() => toggleItem(item)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-violet-100 border-violet-500 text-violet-900'
                        : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-violet-300 hover:bg-violet-50'
                    }`}
                  >
                    {item}
                  </button>
                )
              })}
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="bg-violet-50 border-2 border-violet-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-violet-900 mb-2">
                  Selected ({selectedItems.length}/4):
                </p>
                <p className="text-sm text-gray-700">{selectedItems.join(' • ')}</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={handleShuffle}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Shuffle
              </button>
              <button
                onClick={handleDeselectAll}
                disabled={selectedItems.length === 0}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deselect All
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedItems.length !== 4}
                className="flex-1 px-6 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Group
              </button>
            </div>
          </>
        )}
      </div>

      {/* Shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  )
}
