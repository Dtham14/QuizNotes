import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createComment } from '@/lib/forum'
import { validateContentLength } from '@/lib/autoModeration'
import { awardXP } from '@/lib/gamification/xp'

/**
 * POST /api/forum/comments
 * Create a new comment
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, parent_id, content } = body

    if (!post_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate content
    const contentValidation = validateContentLength(content, 'comment')
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 })
    }

    // Create the comment
    const comment = await createComment(user.id, {
      post_id,
      parent_id: parent_id || null,
      content,
    })

    // Award XP for creating comment
    await awardXP(user.id, 5, 'forum_comment_created')

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/forum/comments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    )
  }
}
