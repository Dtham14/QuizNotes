import { createServiceClient } from '@/lib/supabase/service'
import { renderMarkdown } from '@/lib/markdown'
import type {
  ForumPost,
  ForumComment,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
} from '@/lib/types/forum'

/**
 * Create a new forum post
 */
export async function createPost(
  userId: string,
  data: CreatePostRequest
): Promise<ForumPost> {
  const supabase = createServiceClient()

  // Render markdown to HTML
  const content_html = await renderMarkdown(data.content)

  // Create the post
  const { data: post, error: postError } = await supabase
    .from('forum_posts')
    .insert({
      author_id: userId,
      title: data.title,
      content: data.content,
      content_html,
    })
    .select()
    .single()

  if (postError) throw postError

  // Associate tags with the post
  if (data.tag_ids && data.tag_ids.length > 0) {
    const tagInserts = data.tag_ids.map((tag_id) => ({
      post_id: post.id,
      tag_id,
    }))

    const { error: tagError } = await supabase
      .from('forum_post_tags')
      .insert(tagInserts)

    if (tagError) throw tagError

    // Tag post counts are automatically updated by database trigger
  }

  // Update user reputation
  await incrementUserReputation(userId, 'post')

  return post
}

/**
 * Update an existing forum post
 */
export async function updatePost(
  postId: string,
  userId: string,
  data: UpdatePostRequest
): Promise<ForumPost> {
  const supabase = createServiceClient()

  // Verify post ownership or moderator status
  const { data: post } = await supabase
    .from('forum_posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!post) throw new Error('Post not found')

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isModerator = profile?.role === 'admin' || profile?.role === 'teacher'
  const isAuthor = post.author_id === userId

  if (!isAuthor && !isModerator) {
    throw new Error('Unauthorized to update this post')
  }

  // Prepare update data
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (data.title) updateData.title = data.title
  if (data.content) {
    updateData.content = data.content
    updateData.content_html = await renderMarkdown(data.content)
  }

  // Update the post
  const { data: updatedPost, error } = await supabase
    .from('forum_posts')
    .update(updateData)
    .eq('id', postId)
    .select()
    .single()

  if (error) throw error

  // Update tags if provided
  if (data.tag_ids) {
    // Remove existing tags and add new ones
    // Tag post counts are automatically updated by database trigger
    await supabase.from('forum_post_tags').delete().eq('post_id', postId)

    if (data.tag_ids.length > 0) {
      const tagInserts = data.tag_ids.map((tag_id) => ({
        post_id: postId,
        tag_id,
      }))

      await supabase.from('forum_post_tags').insert(tagInserts)
    }
  }

  return updatedPost
}

/**
 * Delete a forum post (soft delete)
 */
export async function deletePost(postId: string, userId: string): Promise<void> {
  const supabase = createServiceClient()

  // Verify post ownership or moderator status
  const { data: post } = await supabase
    .from('forum_posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!post) throw new Error('Post not found')

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isModerator = profile?.role === 'admin' || profile?.role === 'teacher'
  const isAuthor = post.author_id === userId

  if (!isAuthor && !isModerator) {
    throw new Error('Unauthorized to delete this post')
  }

  // Soft delete - tag post counts are automatically updated by database trigger
  const { error } = await supabase
    .from('forum_posts')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('id', postId)

  if (error) throw error

  // Decrement user reputation if deleting own post
  if (isAuthor) {
    await decrementUserReputation(post.author_id, 'post')
  }
}

/**
 * Create a new comment
 */
export async function createComment(
  userId: string,
  data: CreateCommentRequest
): Promise<ForumComment> {
  const supabase = createServiceClient()

  // Calculate depth if replying to a comment
  let depth = 0
  if (data.parent_id) {
    const { data: parentComment } = await supabase
      .from('forum_comments')
      .select('depth')
      .eq('id', data.parent_id)
      .single()

    if (parentComment) {
      depth = Math.min(parentComment.depth + 1, 5) // Max depth 5
    }
  }

  // Render markdown to HTML
  const content_html = await renderMarkdown(data.content)

  // Create the comment
  const { data: comment, error } = await supabase
    .from('forum_comments')
    .insert({
      post_id: data.post_id,
      parent_id: data.parent_id || null,
      author_id: userId,
      content: data.content,
      content_html,
      depth,
    })
    .select()
    .single()

  if (error) throw error

  // Update user reputation
  await incrementUserReputation(userId, 'comment')

  return comment
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  userId: string,
  content: string
): Promise<ForumComment> {
  const supabase = createServiceClient()

  // Verify comment ownership
  const { data: comment } = await supabase
    .from('forum_comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (!comment) throw new Error('Comment not found')
  if (comment.author_id !== userId) {
    throw new Error('Unauthorized to update this comment')
  }

  // Render markdown
  const content_html = await renderMarkdown(content)

  // Update the comment
  const { data: updatedComment, error } = await supabase
    .from('forum_comments')
    .update({
      content,
      content_html,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw error

  return updatedComment
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const supabase = createServiceClient()

  // Verify comment ownership or moderator status
  const { data: comment } = await supabase
    .from('forum_comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (!comment) throw new Error('Comment not found')

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isModerator = profile?.role === 'admin' || profile?.role === 'teacher'
  const isAuthor = comment.author_id === userId

  if (!isAuthor && !isModerator) {
    throw new Error('Unauthorized to delete this comment')
  }

  // Soft delete
  const { error } = await supabase
    .from('forum_comments')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('id', commentId)

  if (error) throw error

  // Decrement user reputation if deleting own comment
  if (isAuthor) {
    await decrementUserReputation(comment.author_id, 'comment')
  }
}

/**
 * Increment user forum reputation
 */
async function incrementUserReputation(userId: string, type: 'post' | 'comment'): Promise<void> {
  const supabase = createServiceClient()

  const field = type === 'post' ? 'posts_created' : 'comments_created'

  const { error } = await supabase.rpc('increment_forum_reputation', {
    p_user_id: userId,
    p_field: field,
  })

  // If RPC doesn't exist yet, use manual update
  if (error) {
    const { data: reputation } = await supabase
      .from('user_forum_reputation')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (reputation) {
      // Update existing record
      const newCount = type === 'post'
        ? reputation.posts_created + 1
        : reputation.comments_created + 1

      const newScore = (
        (type === 'post' ? newCount : reputation.posts_created) * 5 +
        (type === 'comment' ? newCount : reputation.comments_created) * 2 +
        reputation.helpful_votes_received
      )

      await supabase
        .from('user_forum_reputation')
        .update({
          [field]: newCount,
          reputation_score: newScore,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      // Create new record for first-time poster
      await supabase
        .from('user_forum_reputation')
        .insert({
          user_id: userId,
          posts_created: type === 'post' ? 1 : 0,
          comments_created: type === 'comment' ? 1 : 0,
          reputation_score: type === 'post' ? 5 : 2,
        })
    }
  }
}

/**
 * Decrement user forum reputation
 */
async function decrementUserReputation(userId: string, type: 'post' | 'comment'): Promise<void> {
  const supabase = createServiceClient()

  const field = type === 'post' ? 'posts_created' : 'comments_created'

  const { data: reputation } = await supabase
    .from('user_forum_reputation')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (reputation) {
    const newCount = Math.max(
      0,
      type === 'post'
        ? reputation.posts_created - 1
        : reputation.comments_created - 1
    )

    const newScore = Math.max(
      0,
      (type === 'post' ? newCount : reputation.posts_created) * 5 +
      (type === 'comment' ? newCount : reputation.comments_created) * 2 +
      reputation.helpful_votes_received
    )

    await supabase
      .from('user_forum_reputation')
      .update({
        [field]: newCount,
        reputation_score: newScore,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }
}

/**
 * Pin or unpin a post (moderators only)
 */
export async function togglePinPost(
  postId: string,
  userId: string,
  pinned: boolean
): Promise<void> {
  const supabase = createServiceClient()

  // Verify moderator status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isModerator = profile?.role === 'admin' || profile?.role === 'teacher'
  if (!isModerator) {
    throw new Error('Only moderators can pin posts')
  }

  const { error } = await supabase
    .from('forum_posts')
    .update({ is_pinned: pinned })
    .eq('id', postId)

  if (error) throw error

  // Create notification if pinning
  if (pinned) {
    const { data: post } = await supabase
      .from('forum_posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (post && post.author_id !== userId) {
      await supabase.from('forum_notifications').insert({
        user_id: post.author_id,
        type: 'post_pinned',
        post_id: postId,
        actor_id: userId,
      })
    }
  }
}

/**
 * Lock or unlock a post (moderators only)
 */
export async function toggleLockPost(
  postId: string,
  userId: string,
  locked: boolean
): Promise<void> {
  const supabase = createServiceClient()

  // Verify moderator status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isModerator = profile?.role === 'admin' || profile?.role === 'teacher'
  if (!isModerator) {
    throw new Error('Only moderators can lock posts')
  }

  const { error } = await supabase
    .from('forum_posts')
    .update({ is_locked: locked })
    .eq('id', postId)

  if (error) throw error

  // Create notification if locking
  if (locked) {
    const { data: post } = await supabase
      .from('forum_posts')
      .select('author_id')
      .eq('id', postId)
      .single()

    if (post && post.author_id !== userId) {
      await supabase.from('forum_notifications').insert({
        user_id: post.author_id,
        type: 'post_locked',
        post_id: postId,
        actor_id: userId,
      })
    }
  }
}
