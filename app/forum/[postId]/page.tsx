import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import ForumNav from '@/components/ForumNav'
import PostActions from './PostActions'
import CommentForm from './CommentForm'
import CommentDisplay from './CommentDisplay'
import VoteButtons from './VoteButtons'
import type { ForumPost, ForumComment } from '@/lib/types/forum'

interface PageProps {
  params: Promise<{ postId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { postId } = await params
  const supabase = createServiceClient()

  const { data: post } = await supabase
    .from('forum_posts')
    .select('title, content')
    .eq('id', postId)
    .eq('is_deleted', false)
    .single()

  if (!post) {
    return {
      title: 'Post Not Found | QuizNotes Forum',
    }
  }

  return {
    title: `${post.title} | QuizNotes Forum`,
    description: post.content.substring(0, 160),
  }
}

export default async function ForumPostPage({ params }: PageProps) {
  const { postId } = await params
  const user = await requireAuth() // Require authentication
  const supabase = createServiceClient()

  // Get the post
  const { data: post, error: postError } = await supabase
    .from('forum_posts')
    .select(
      `
      *,
      author:profiles!forum_posts_author_id_fkey(id, name, email, role, avatar, avatar_url),
      tags:forum_post_tags(tag:forum_tags(*))
    `
    )
    .eq('id', postId)
    .eq('is_deleted', false)
    .single()

  if (postError || !post) {
    notFound()
  }

  // Transform tags
  const transformedPost = {
    ...post,
    tags: post.tags?.map((pt: any) => pt.tag) || [],
  } as ForumPost

  // Get comments
  const { data: comments } = await supabase
    .from('forum_comments')
    .select(
      `
      *,
      author:profiles!forum_comments_author_id_fkey(id, name, email, role, avatar, avatar_url)
    `
    )
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  // Get user's vote if authenticated
  let userVote = null
  if (user) {
    const { data: vote } = await supabase
      .from('forum_votes')
      .select('vote_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    userVote = vote?.vote_type || null
  }

  // Build threaded comment structure
  const threadedComments = buildCommentTree(comments || [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Navigation */}
      <ForumNav user={user} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/forum"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Back to Forum
        </Link>

        {/* Post */}
        <article className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {/* Header */}
          <div className="mb-6">
            {transformedPost.is_pinned && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 mb-3">
                📌 Pinned Post
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{transformedPost.title}</h1>

            {/* Author and metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {transformedPost.author?.avatar_url ? (
                  <Image
                    src={transformedPost.author.avatar_url}
                    alt={transformedPost.author.name || 'User'}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {transformedPost.author?.name?.[0] || '?'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">
                    {transformedPost.author?.name || 'Anonymous'}
                    {transformedPost.author?.role === 'admin' && (
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                        Admin
                      </span>
                    )}
                    {transformedPost.author?.role === 'teacher' && (
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        Teacher
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(transformedPost.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Edit/Delete buttons */}
              <PostActions
                postId={transformedPost.id}
                authorId={transformedPost.author_id}
                currentUserId={user.id}
                currentUserRole={user.role}
              />
            </div>

            {/* Tags */}
            {transformedPost.tags && transformedPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {transformedPost.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/forum?tag=${tag.slug}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <span className="mr-1">{tag.icon}</span>
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-6 whitespace-pre-wrap [&_p]:!text-gray-900 [&_li]:!text-gray-900 [&_h1]:!text-gray-900 [&_h2]:!text-gray-900 [&_h3]:!text-gray-900 [&_h4]:!text-gray-900 [&_h5]:!text-gray-900 [&_h6]:!text-gray-900 [&_strong]:!text-gray-900 [&_em]:!text-gray-900 [&_code]:!text-gray-900 [&_blockquote]:!text-gray-900 [&_a]:!text-brand">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {transformedPost.content}
            </ReactMarkdown>
          </div>

          {/* Voting and Stats */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <VoteButtons
              postId={transformedPost.id}
              initialScore={transformedPost.vote_score}
              initialUserVote={userVote as 'upvote' | 'downvote' | null}
              authorId={transformedPost.author_id}
              currentUserId={user.id}
            />
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>💬 {transformedPost.reply_count} replies</span>
              <span>👁️ {transformedPost.view_count} views</span>
            </div>
          </div>

          {transformedPost.is_locked && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                🔒 This thread is locked. No new comments can be added.
              </p>
            </div>
          )}
        </article>

        {/* Comments */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {transformedPost.reply_count} {transformedPost.reply_count === 1 ? 'Reply' : 'Replies'}
          </h2>

          {/* Add Comment Form */}
          {!transformedPost.is_locked && (
            <div className="mb-6">
              <CommentForm postId={transformedPost.id} />
            </div>
          )}

          {threadedComments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
              No comments yet. Be the first to reply!
            </div>
          ) : (
            <div className="space-y-4">
              {threadedComments.map((comment) => (
                <CommentDisplay key={comment.id} comment={comment} postId={transformedPost.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// Helper function to build comment tree
function buildCommentTree(comments: any[]): any[] {
  const commentMap = new Map<string, any>()
  const rootComments: any[] = []

  // First pass: create map
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: build tree
  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id)!

    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies.push(commentWithReplies)
      } else {
        rootComments.push(commentWithReplies)
      }
    } else {
      rootComments.push(commentWithReplies)
    }
  })

  return rootComments
}
