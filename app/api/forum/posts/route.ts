import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { createPost } from '@/lib/forum'
import { validateTitle, validateContentLength, shouldAutoFlag } from '@/lib/autoModeration'
import { awardXP } from '@/lib/gamification/xp'
import type { PostsListResponse } from '@/lib/types/forum'

/**
 * GET /api/forum/posts
 * List forum posts with filtering and sorting
 * Public endpoint (no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const sort = searchParams.get('sort') || 'recent' // recent, popular, most_replies
    const tagSlug = searchParams.get('tag')

    const supabase = createServiceClient()

    // Build query
    let query = supabase
      .from('forum_posts')
      .select(
        `
        *,
        author:profiles!forum_posts_author_id_fkey(id, name, email, role, avatar, avatar_url),
        tags:forum_post_tags(tag:forum_tags(*))
      `,
        { count: 'exact' }
      )
      .eq('is_deleted', false)

    // Filter by tag if provided
    if (tagSlug) {
      // First get the tag ID
      const { data: tag } = await supabase
        .from('forum_tags')
        .select('id')
        .eq('slug', tagSlug)
        .single()

      if (tag) {
        const { data: postIds } = await supabase
          .from('forum_post_tags')
          .select('post_id')
          .eq('tag_id', tag.id)

        if (postIds && postIds.length > 0) {
          query = query.in('id', postIds.map((p) => p.post_id))
        } else {
          // No posts with this tag
          return NextResponse.json({
            posts: [],
            total: 0,
            page,
            limit,
            hasMore: false,
          } as PostsListResponse)
        }
      }
    }

    // Apply sorting
    if (sort === 'popular') {
      query = query.order('vote_score', { ascending: false })
    } else if (sort === 'most_replies') {
      query = query.order('reply_count', { ascending: false })
    } else {
      // Default: recent (with pinned posts first)
      query = query
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false })
    }

    // Apply pagination
    const start = (page - 1) * limit
    const end = start + limit - 1
    query = query.range(start, end)

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    // Transform tags from nested structure
    const transformedPosts = posts?.map((post: any) => ({
      ...post,
      tags: post.tags?.map((pt: any) => pt.tag) || [],
    })) || []

    return NextResponse.json({
      posts: transformedPosts,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > end + 1,
    } as PostsListResponse)
  } catch (error) {
    console.error('Error in GET /api/forum/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/forum/posts
 * Create a new forum post
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, tag_ids } = body

    // Validate input
    const titleValidation = validateTitle(title)
    if (!titleValidation.valid) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 })
    }

    const contentValidation = validateContentLength(content, 'post')
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 })
    }

    if (!tag_ids || tag_ids.length === 0) {
      return NextResponse.json({ error: 'At least one tag is required' }, { status: 400 })
    }

    // Check for auto-moderation flags
    const shouldFlag = shouldAutoFlag(title + ' ' + content)

    // Create the post
    const post = await createPost(user.id, { title, content, tag_ids })

    // If flagged, create an auto-report
    if (shouldFlag) {
      const supabase = createServiceClient()
      await supabase.from('forum_reports').insert({
        reporter_id: user.id, // System reporter (will be shown as auto-flagged)
        post_id: post.id,
        reason: 'spam',
        description: 'Auto-flagged by system for review',
        status: 'pending',
      })
    }

    // Award XP for creating post
    const supabase = createServiceClient()
    const { data: reputation } = await supabase
      .from('user_forum_reputation')
      .select('posts_created')
      .eq('user_id', user.id)
      .single()

    // Award bonus XP for first post
    if (reputation && reputation.posts_created === 1) {
      await awardXP(user.id, 25, 'forum_first_post')
    } else {
      await awardXP(user.id, 15, 'forum_post_created')
    }

    // Fetch the complete post with author and tags
    const { data: fullPost } = await supabase
      .from('forum_posts')
      .select(
        `
        *,
        author:profiles!forum_posts_author_id_fkey(id, name, email, role, avatar, avatar_url),
        tags:forum_post_tags(tag:forum_tags(*))
      `
      )
      .eq('id', post.id)
      .single()

    // Transform tags
    const transformedPost = {
      ...fullPost,
      tags: fullPost?.tags?.map((pt: any) => pt.tag) || [],
    }

    return NextResponse.json(transformedPost, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/forum/posts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    )
  }
}
