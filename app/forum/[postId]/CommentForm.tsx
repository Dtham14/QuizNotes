'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CommentFormProps {
  postId: string
  parentId?: string
  onCancel?: () => void
  placeholder?: string
}

export default function CommentForm({
  postId,
  parentId,
  onCancel,
  placeholder = 'Add your comment...',
}: CommentFormProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!content.trim()) {
      setError('Please enter a comment')
      return
    }

    if (content.trim().length < 3) {
      setError('Comment must be at least 3 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/forum/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          parent_id: parentId || null,
          content: content.trim(),
        }),
      })

      const text = await response.text()
      let data

      try {
        data = text ? JSON.parse(text) : {}
      } catch (e) {
        console.error('Invalid JSON response:', text)
        throw new Error('Server returned an invalid response')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post comment')
      }

      // Reset form
      setContent('')
      setShowPreview(false)

      // Refresh the page to show new comment
      router.refresh()

      // Call onCancel if it's a reply form
      if (onCancel) {
        onCancel()
      }
    } catch (err) {
      console.error('Error posting comment:', err)
      setError(err instanceof Error ? err.message : 'Failed to post comment')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="comment" className="block text-sm font-semibold text-gray-900">
            {parentId ? 'Your Reply' : 'Your Comment'}
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-brand hover:text-brand-dark font-medium"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {showPreview ? (
          <div className="min-h-[120px] p-4 bg-gray-50 border border-gray-300 rounded-lg">
            {content.trim() ? (
              <div style={{ whiteSpace: 'pre-wrap' }} className="text-gray-900">
                {content}
              </div>
            ) : (
              <p className="text-gray-400 italic">Preview will appear here...</p>
            )}
          </div>
        ) : (
          <textarea
            id="comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={4}
            maxLength={5000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900 font-mono text-sm resize-none"
            disabled={isSubmitting}
          />
        )}
        <p className="mt-1 text-xs text-gray-500">
          {content.length}/5,000 characters • Markdown supported
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting ? 'Posting...' : parentId ? 'Post Reply' : 'Post Comment'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
