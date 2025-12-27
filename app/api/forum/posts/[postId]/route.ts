import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { updatePost, deletePost } from '@/lib/forum'
import { validateTitle, validateContentLength } from '@/lib/autoModeration'
import type { SinglePostResponse } from '@/lib/types/forum'

interface RouteParams {
  params: Promise<{
    postId: string
  }>
}

/**
 * GET /api/forum/posts/[postId]
 * Get a single post with comments
 * Public endpoint
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = await params
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
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get comments for this post (with nested structure)
    const { data: comments, error: commentsError } = await supabase
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

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
    }

    // Build threaded comment structure
    const threadedComments = buildCommentTree(comments || [])

    // Get user's vote if authenticated
    let userVote = null
    const user = await getSession()
    if (user) {
      const { data: vote } = await supabase
        .from('forum_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()

      userVote = vote?.vote_type || null
    }

    // Increment view count (fire and forget)
    supabase
      .from('forum_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', postId)
      .then(() => {})

    // Transform tags
    const transformedPost = {
      ...post,
      tags: post.tags?.map((pt: any) => pt.tag) || [],
    }

    return NextResponse.json({
      post: transformedPost,
      comments: threadedComments,
      user_vote: userVote,
    } as SinglePostResponse)
  } catch (error) {
    console.error('Error in GET /api/forum/posts/[postId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/forum/posts/[postId]
 * Update a post
 * Requires authentication (author or moderator)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params
    const body = await request.json()
    const { title, content, tag_ids } = body

    // Validate input if provided
    if (title) {
      const titleValidation = validateTitle(title)
      if (!titleValidation.valid) {
        return NextResponse.json({ error: titleValidation.error }, { status: 400 })
      }
    }

    if (content) {
      const contentValidation = validateContentLength(content, 'post')
      if (!contentValidation.valid) {
        return NextResponse.json({ error: contentValidation.error }, { status: 400 })
      }
    }

    // Update the post
    const updatedPost = await updatePost(postId, user.id, { title, content, tag_ids })

    // Fetch the complete post with author and tags
    const supabase = createServiceClient()
    const { data: fullPost } = await supabase
      .from('forum_posts')
      .select(
        `
        *,
        author:profiles!forum_posts_author_id_fkey(id, name, email, role, avatar, avatar_url),
        tags:forum_post_tags(tag:forum_tags(*))
      `
      )
      .eq('id', updatedPost.id)
      .single()

    // Transform tags
    const transformedPost = {
      ...fullPost,
      tags: fullPost?.tags?.map((pt: any) => pt.tag) || [],
    }

    return NextResponse.json(transformedPost)
  } catch (error) {
    console.error('Error in PUT /api/forum/posts/[postId]:', error)

    if (error instanceof Error) {
      if (error.message === 'Post not found') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

/**
 * DELETE /api/forum/posts/[postId]
 * Delete a post (soft delete)
 * Requires authentication (author or moderator)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params

    // Delete the post
    await deletePost(postId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/forum/posts/[postId]:', error)

    if (error instanceof Error) {
      if (error.message === 'Post not found') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

/**
 * Helper function to build threaded comment tree
 */
function buildCommentTree(comments: any[]): any[] {
  const commentMap = new Map<string, any>()
  const rootComments: any[] = []

  // First pass: create map of all comments
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: build tree structure
  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id)!

    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies.push(commentWithReplies)
      } else {
        // Parent not found or deleted, add as root
        rootComments.push(commentWithReplies)
      }
    } else {
      rootComments.push(commentWithReplies)
    }
  })

  return rootComments
}
