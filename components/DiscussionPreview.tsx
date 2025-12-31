'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Message {
  id: string;
  content: string;
  created_at: string;
  class_id: string;
  class_name: string;
  user_name: string;
  user_role: string;
}

export default function DiscussionPreview() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentDiscussions() {
      try {
        const response = await fetch('/api/student/discussions/recent?limit=5');
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Error fetching recent discussions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentDiscussions();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Discussions</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      </div>
    );
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          💬 Recent Discussions
        </h2>
        <Link href="/student/classes" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
          View All
        </Link>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No recent discussions</p>
          <p className="text-xs mt-1">Join a class to start participating in discussions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Link
              key={message.id}
              href={`/class/${message.class_id}`}
              className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                  message.user_role === 'teacher'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-violet-500 to-purple-600'
                }`}>
                  {message.user_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm truncate">
                      {message.user_name}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{message.class_name}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{getTimeAgo(message.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
