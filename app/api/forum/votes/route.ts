import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { awardXP } from '@/lib/gamification/xp'

/**
 * POST /api/forum/votes
 * Toggle vote on post or comment
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { target_type, target_id, vote_type } = body

    if (!target_type || !target_id || !vote_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (target_type !== 'post' && target_type !== 'comment') {
      return NextResponse.json({ error: 'Invalid target_type' }, { status: 400 })
    }

    if (vote_type !== 'upvote' && vote_type !== 'downvote') {
      return NextResponse.json({ error: 'Invalid vote_type' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if user is voting on their own content
    if (target_type === 'post') {
      const { data: post } = await supabase
        .from('forum_posts')
        .select('author_id')
        .eq('id', target_id)
        .single()

      if (post && post.author_id === user.id) {
        return NextResponse.json({ error: 'Cannot vote on your own post' }, { status: 400 })
      }
    } else {
      const { data: comment } = await supabase
        .from('forum_comments')
        .select('author_id')
        .eq('id', target_id)
        .single()

      if (comment && comment.author_id === user.id) {
        return NextResponse.json({ error: 'Cannot vote on your own comment' }, { status: 400 })
      }
    }

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from('forum_votes')
      .select('*')
      .eq('user_id', user.id)
      .eq(target_type === 'post' ? 'post_id' : 'comment_id', target_id)
      .single()

    let previousVoteType: string | null = null
    let newVote = null

    if (existingVote) {
      previousVoteType = existingVote.vote_type

      if (existingVote.vote_type === vote_type) {
        // Same vote type - remove vote
        const { error } = await supabase
          .from('forum_votes')
          .delete()
          .eq('id', existingVote.id)

        if (error) throw error
      } else {
        // Different vote type - update vote
        const { data, error } = await supabase
          .from('forum_votes')
          .update({ vote_type, updated_at: new Date().toISOString() })
          .eq('id', existingVote.id)
          .select()
          .single()

        if (error) throw error
        newVote = data
      }
    } else {
      // No existing vote - create new vote
      const { data, error } = await supabase
        .from('forum_votes')
        .insert({
          user_id: user.id,
          [target_type === 'post' ? 'post_id' : 'comment_id']: target_id,
          vote_type,
        })
        .select()
        .single()

      if (error) throw error
      newVote = data
    }

    // Award XP to content author if upvoting (and not removing vote)
    if (vote_type === 'upvote' && (newVote || previousVoteType !== 'upvote')) {
      // Get content author
      let authorId: string | null = null

      if (target_type === 'post') {
        const { data: post } = await supabase
          .from('forum_posts')
          .select('author_id')
          .eq('id', target_id)
          .single()
        authorId = post?.author_id || null
      } else {
        const { data: comment } = await supabase
          .from('forum_comments')
          .select('author_id')
          .eq('id', target_id)
          .single()
        authorId = comment?.author_id || null
      }

      if (authorId && authorId !== user.id) {
        // Award XP
        const xpAmount = target_type === 'post' ? 10 : 3
        await awardXP(
          authorId,
          xpAmount,
          target_type === 'post' ? 'forum_post_upvoted' : 'forum_comment_upvoted'
        )

        // Update user reputation
        const { data: reputation } = await supabase
          .from('user_forum_reputation')
          .select('*')
          .eq('user_id', authorId)
          .single()

        if (reputation) {
          const newHelpfulVotes = reputation.helpful_votes_received + 1
          const newScore =
            reputation.posts_created * 5 +
            reputation.comments_created * 2 +
            newHelpfulVotes

          await supabase
            .from('user_forum_reputation')
            .update({
              helpful_votes_received: newHelpfulVotes,
              reputation_score: newScore,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', authorId)
        }
      }
    }

    return NextResponse.json({ success: true, vote: newVote })
  } catch (error) {
    console.error('Error in POST /api/forum/votes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process vote' },
      { status: 500 }
    )
  }
}
