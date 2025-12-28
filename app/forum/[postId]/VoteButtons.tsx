'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface VoteButtonsProps {
  postId: string
  initialScore: number
  initialUserVote: 'upvote' | 'downvote' | null
  authorId: string
  currentUserId: string
}

export default function VoteButtons({
  postId,
  initialScore,
  initialUserVote,
  authorId,
  currentUserId,
}: VoteButtonsProps) {
  const router = useRouter()
  const [voteScore, setVoteScore] = useState(initialScore)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(initialUserVote)
  const [isVoting, setIsVoting] = useState(false)

  // Can't vote on your own post
  const isOwnPost = authorId === currentUserId

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return

    setIsVoting(true)

    try {
      const response = await fetch('/api/forum/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_type: 'post',
          target_id: postId,
          vote_type: voteType,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to vote')
      }

      // Optimistic update
      let newScore = voteScore

      // If clicking the same vote type, remove the vote
      if (userVote === voteType) {
        if (voteType === 'upvote') {
          newScore -= 1
        } else {
          newScore += 1
        }
        setUserVote(null)
      } else {
        // If switching from one vote to another
        if (userVote === 'upvote') {
          newScore -= 2 // Remove upvote (+1 -> -1)
        } else if (userVote === 'downvote') {
          newScore += 2 // Remove downvote (-1 -> +1)
        } else {
          // No previous vote
          newScore += voteType === 'upvote' ? 1 : -1
        }
        setUserVote(voteType)
      }

      setVoteScore(newScore)

      // Refresh to get updated data
      router.refresh()
    } catch (error) {
      console.error('Error voting:', error)
      // Revert on error
      setVoteScore(initialScore)
      setUserVote(initialUserVote)
    } finally {
      setIsVoting(false)
    }
  }

  // If it's user's own post, just show the score without voting buttons
  if (isOwnPost) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Your post</span>
        <span className={`text-lg font-bold ${
          voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-600' : 'text-gray-600'
        }`}>
          {voteScore > 0 ? '+' : ''}{voteScore} votes
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Upvote button */}
      <button
        onClick={() => handleVote('upvote')}
        disabled={isVoting}
        className={`p-2 rounded-lg transition-colors ${
          userVote === 'upvote'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Upvote"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Score */}
      <span className={`text-lg font-bold min-w-[3rem] text-center ${
        voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-600' : 'text-gray-600'
      }`}>
        {voteScore > 0 ? '+' : ''}{voteScore}
      </span>

      {/* Downvote button */}
      <button
        onClick={() => handleVote('downvote')}
        disabled={isVoting}
        className={`p-2 rounded-lg transition-colors ${
          userVote === 'downvote'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Downvote"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}
