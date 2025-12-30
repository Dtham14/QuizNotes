'use client'

import { useState } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useRouter } from 'next/navigation'
import CommentForm from './CommentForm'

interface CommentDisplayProps {
  comment: any
  depth?: number
  postId?: string
  isAuthenticated?: boolean
}

export default function CommentDisplay({ comment, depth = 0, postId, isAuthenticated = true }: CommentDisplayProps) {
  const router = useRouter()
  const maxDepth = 5
  const shouldIndent = depth < maxDepth
  const [showReplyForm, setShowReplyForm] = useState(false)

  const handleReplyClick = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    setShowReplyForm(!showReplyForm)
  }

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 ${shouldIndent ? `ml-${Math.min(depth, 5) * 8}` : ''}`}
    >
      {/* Comment header */}
      <div className="flex items-center gap-3 mb-3">
        {comment.author?.avatar_url ? (
          <Image
            src={comment.author.avatar_url}
            alt={comment.author.name || 'User'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
            {comment.author?.name?.[0] || '?'}
          </div>
        )}
        <div>
          <div className="font-semibold text-gray-900 text-sm">
            {comment.author?.name || 'Anonymous'}
            {comment.author?.role === 'admin' && (
              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                Admin
              </span>
            )}
            {comment.author?.role === 'teacher' && (
              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                Teacher
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Comment content */}
      <div className="prose prose-sm max-w-none mb-2 whitespace-pre-wrap [&_p]:!text-gray-900 [&_li]:!text-gray-900 [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900 [&_strong]:!text-gray-900 [&_em]:!text-gray-900 [&_code]:!text-gray-900 [&_blockquote]:!text-gray-900 [&_a]:!text-brand">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
      </div>

      {/* Comment stats and actions */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>👍 {comment.vote_score} votes</span>
        {depth < maxDepth && postId && (
          <button
            onClick={handleReplyClick}
            className="text-brand hover:text-brand-dark font-medium"
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && postId && (
        <div className="mt-4">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Write your reply..."
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply: any) => (
            <CommentDisplay key={reply.id} comment={reply} depth={depth + 1} postId={postId} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      )}
    </div>
  )
}
