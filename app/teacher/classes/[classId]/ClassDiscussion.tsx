'use client'

import { useState, useEffect } from 'react'

interface Message {
  id: string
  author: string
  role: 'teacher' | 'student'
  content: string
  timestamp: Date
  avatar?: string
}

interface ClassDiscussionProps {
  classId: string
  currentUserRole: 'teacher' | 'student'
  currentUserName: string
}

export default function ClassDiscussion({
  classId,
  currentUserRole,
  currentUserName
}: ClassDiscussionProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages()
  }, [classId])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch(`/api/classes/${classId}/messages`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      // Convert timestamp strings to Date objects
      const formattedMessages = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))

      setMessages(formattedMessages)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostMessage = async () => {
    if (!newMessage.trim()) return

    setIsPosting(true)

    try {
      const res = await fetch(`/api/classes/${classId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post message')
      }

      // Add the new message to the list
      const formattedMessage = {
        ...data.message,
        timestamp: new Date(data.message.timestamp)
      }

      setMessages([...messages, formattedMessage])
      setNewMessage('')
    } catch (err) {
      console.error('Error posting message:', err)
      alert(err instanceof Error ? err.message : 'Failed to post message')
    } finally {
      setIsPosting(false)
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarGradient = (role: string) => {
    if (role === 'teacher') {
      return 'from-blue-500 to-cyan-600'
    }
    const gradients = [
      'from-violet-500 to-purple-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-blue-600'
    ]
    return gradients[Math.floor(Math.random() * gradients.length)]
  }

  return (
    <div className="space-y-6">
      {/* Musical Staff Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
        <div className="absolute top-0 left-0 right-0 h-full">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-gray-900"
              style={{ top: `${i * 5}%` }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">💬</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Class Discussion</h2>
            <p className="text-sm text-gray-600">
              {currentUserRole === 'teacher'
                ? 'Post announcements and respond to student questions'
                : 'Ask questions and stay updated with class announcements'}
            </p>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
        {/* Decorative Corner Elements */}
        <div className="absolute top-0 right-0 text-6xl text-gray-100 leading-none p-4 select-none">
          ♪
        </div>

        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {currentUserRole === 'teacher' ? 'Post an Announcement' : 'Send a Message'}
          </label>

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              currentUserRole === 'teacher'
                ? 'Share updates, reminders, or important information with your class...'
                : 'Ask a question or share a comment...'
            }
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none text-gray-900 placeholder-gray-400"
            rows={4}
          />

          <div className="flex justify-between items-center mt-4">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Posting as {currentUserRole === 'teacher' ? 'Teacher' : 'Student'}
            </div>

            <button
              onClick={handlePostMessage}
              disabled={!newMessage.trim() || isPosting}
              className={`
                px-6 py-2.5 rounded-xl font-semibold text-white
                transition-all duration-200 flex items-center gap-2
                ${!newMessage.trim() || isPosting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:shadow-lg hover:scale-105 active:scale-95'
                }
              `}
            >
              {isPosting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Posting...
                </>
              ) : (
                <>
                  <span>✉️</span>
                  {currentUserRole === 'teacher' ? 'Post' : 'Send'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="space-y-4">
        {isLoading ? (
          /* Loading State */
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-white rounded-2xl shadow-md border border-red-100 p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error loading messages
            </h3>
            <p className="text-red-600 max-w-md mx-auto mb-4">{error}</p>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl opacity-50">𝄞</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {currentUserRole === 'teacher'
                ? 'Start the conversation by posting your first announcement to the class.'
                : 'This discussion board is empty. Check back later for announcements from your teacher.'}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-200 relative overflow-hidden group"
              style={{
                animation: `slideUp 0.4s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Teacher Message Special Styling */}
              {message.role === 'teacher' && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
              )}

              {/* Hover Effect - Musical Note */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-6xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 select-none">
                ♩
              </div>

              <div className="flex gap-4">
                {/* Avatar */}
                <div
                  className={`
                    flex-shrink-0 w-12 h-12 rounded-xl
                    bg-gradient-to-br ${getAvatarGradient(message.role)}
                    flex items-center justify-center text-white font-bold text-sm
                    shadow-md
                  `}
                >
                  {getInitials(message.author)}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {message.author}
                    </span>

                    {/* Role Badge */}
                    {message.role === 'teacher' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs font-semibold rounded-lg shadow-sm">
                        <span>𝄞</span>
                        Teacher
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                        <span>♪</span>
                        Student
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>

                  {/* Message Text */}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
