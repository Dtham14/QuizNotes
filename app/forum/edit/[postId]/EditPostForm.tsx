'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ForumTag } from '@/lib/types/forum'

interface EditPostFormProps {
  postId: string
  initialTitle: string
  initialContent: string
  initialTagIds: string[]
  allTags: ForumTag[]
}

export default function EditPostForm({
  postId,
  initialTitle,
  initialContent,
  initialTagIds,
  allTags,
}: EditPostFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagIds)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters')
      return
    }

    if (!content.trim()) {
      setError('Please enter some content')
      return
    }

    if (content.trim().length < 10) {
      setError('Content must be at least 10 characters')
      return
    }

    if (selectedTags.length === 0) {
      setError('Please select at least one tag')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          tag_ids: selectedTags,
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
        throw new Error(data.error || 'Failed to update post')
      }

      // Redirect to the post
      router.push(`/forum/${postId}`)
      router.refresh()
    } catch (err) {
      console.error('Error updating post:', err)
      setError(err instanceof Error ? err.message : 'Failed to update post')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's your question or topic?"
          maxLength={200}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-gray-500">{title.length}/200 characters</p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Tags (select at least one)
        </label>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagToggle(tag.id)}
              disabled={isSubmitting}
              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{tag.icon}</span>
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="content" className="block text-sm font-semibold text-gray-900">
            Content
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
          <div className="min-h-[300px] p-4 bg-white border border-gray-300 rounded-lg prose prose-sm max-w-none">
            {content.trim() ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
            ) : (
              <p className="text-gray-400 italic">Preview will appear here...</p>
            )}
          </div>
        ) : (
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, ask questions, or provide helpful information...

You can use markdown formatting:
**bold**, *italic*, [links](url),
- bullet points
1. numbered lists
> quotes
`code`"
            rows={12}
            maxLength={10000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900 font-mono text-sm"
            disabled={isSubmitting}
          />
        )}
        <p className="mt-1 text-xs text-gray-500">
          {content.length}/10,000 characters • Markdown supported
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating Post...' : 'Update Post'}
        </button>
        <Link
          href={`/forum/${postId}`}
          className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
