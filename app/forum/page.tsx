import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'
import { getSession } from '@/lib/auth'
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
  const user = await getSession() // Allow viewing without authentication
  const supabase = createServiceClient()

  // Get selected tag from query params
  const selectedTagSlug = params.tag as string | undefined

  // Get tags for filtering
  const { data: tags } = await supabase
    .from('forum_tags')
    .select('*')
    .order('name', { ascending: true })

  // Get posts - filter by tag if selected
  let postsQuery = supabase
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

  const { data: posts } = await postsQuery

  // Transform posts
  let transformedPosts = posts?.map((post: any) => ({
    ...post,
    tags: post.tags?.map((pt: any) => pt.tag) || [],
  })) as ForumPost[] || []

  // Filter by tag if selected (client-side filtering since Supabase query is complex)
  if (selectedTagSlug && transformedPosts) {
    transformedPosts = transformedPosts.filter((post) =>
      post.tags?.some((tag) => tag.slug === selectedTagSlug)
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Forum</h1>
              <p className="mt-2 text-gray-600">Discuss music theory and share knowledge</p>
            </div>
            {user ? (
              <Link
                href="/forum/create"
                className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
              >
                New Post
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
              >
                Login to Post
              </Link>
            )}
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
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !selectedTagSlug
                      ? 'bg-brand text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Topics
                </Link>
                {tags?.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/forum?tag=${tag.slug}`}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTagSlug === tag.slug
                        ? 'bg-brand text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{tag.icon}</span>
                    {tag.name}
                    <span className={`ml-2 text-xs ${selectedTagSlug === tag.slug ? 'text-white/80' : 'text-gray-500'}`}>
                      ({tag.post_count})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Posts List */}
          <main className="flex-1">
            {/* Filter indicator */}
            {selectedTagSlug && (
              <div className="mb-4 flex items-center gap-3 text-sm">
                <span className="text-gray-600">Filtered by:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand text-white font-medium">
                  <span className="mr-1">
                    {tags?.find((t) => t.slug === selectedTagSlug)?.icon}
                  </span>
                  {tags?.find((t) => t.slug === selectedTagSlug)?.name}
                </span>
                <Link
                  href="/forum"
                  className="text-brand hover:text-brand-dark font-medium"
                >
                  Clear filter
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {transformedPosts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <p className="text-gray-500">
                    {selectedTagSlug
                      ? 'No posts found with this topic. Try a different filter or create a new post!'
                      : 'No posts yet. Be the first to start a discussion!'}
                  </p>
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
                        {post.author?.avatar_url ? (
                          <Image
                            src={post.author.avatar_url}
                            alt={post.author.name || 'User'}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                            {post.author?.name?.[0] || '?'}
                          </div>
                        )}
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

                        {/* Content Preview */}
                        {post.content && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2 whitespace-pre-wrap">
                            {post.content.length > 150
                              ? post.content.substring(0, 150) + '...'
                              : post.content
                            }
                          </p>
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
