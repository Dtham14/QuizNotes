import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import ForumNav from '@/components/ForumNav'
import type { ForumPost, ForumTag } from '@/lib/types/forum'

export const metadata = {
  title: 'Forum | QuizNotes',
  description: 'Discuss music theory, share tips, and get help from the community',
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const user = await requireAuth() // Require authentication
  const supabase = createServiceClient()

  // Get tags for filtering
  const { data: tags } = await supabase
    .from('forum_tags')
    .select('*')
    .order('name', { ascending: true })

  // Get posts
  const { data: posts } = await supabase
    .from('forum_posts')
    .select(
      `
      *,
      author:profiles!forum_posts_author_id_fkey(id, name, email, role, avatar, avatar_url),
      tags:forum_post_tags(tag:forum_tags(*))
    `
    )
    .eq('is_deleted', false)
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })
    .limit(20)

  // Transform posts
  const transformedPosts = posts?.map((post: any) => ({
    ...post,
    tags: post.tags?.map((pt: any) => pt.tag) || [],
  })) as ForumPost[] || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Navigation */}
      <ForumNav user={user} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Forum</h1>
              <p className="mt-2 text-gray-600">Discuss music theory and share knowledge</p>
            </div>
            <Link
              href="/forum/create"
              className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
            >
              New Post
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Tags */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Topics</h2>
              <div className="space-y-2">
                <Link
                  href="/forum"
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors text-gray-700"
                >
                  All Topics
                </Link>
                {tags?.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/forum?tag=${tag.slug}`}
                    className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    <span className="mr-2">{tag.icon}</span>
                    {tag.name}
                    <span className="ml-2 text-xs text-gray-500">({tag.post_count})</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Posts List */}
          <main className="flex-1">
            <div className="space-y-4">
              {transformedPosts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <p className="text-gray-500">No posts yet. Be the first to start a discussion!</p>
                </div>
              ) : (
                transformedPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/forum/${post.id}`}
                    className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-2 border-gray-200 hover:border-brand"
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                          {post.author?.name?.[0] || '?'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="flex items-start gap-2 mb-2">
                          {post.is_pinned && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                              📌 Pinned
                            </span>
                          )}
                          <h2 className="text-lg font-bold text-gray-900 hover:text-brand transition-colors">
                            {post.title}
                          </h2>
                          {post.is_locked && (
                            <span className="text-gray-400">🔒</span>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                          <span>{post.author?.name || 'Anonymous'}</span>
                          <span>•</span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          {post.author?.role === 'admin' && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 font-semibold">Admin</span>
                            </>
                          )}
                          {post.author?.role === 'teacher' && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 font-semibold">Teacher</span>
                            </>
                          )}
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                <span className="mr-1">{tag.icon}</span>
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>👍 {post.vote_score}</span>
                          <span>💬 {post.reply_count} replies</span>
                          <span>👁️ {post.view_count} views</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
