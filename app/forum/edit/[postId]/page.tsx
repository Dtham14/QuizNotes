import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import EditPostForm from './EditPostForm'

interface PageProps {
  params: Promise<{ postId: string }>
}

export const metadata = {
  title: 'Edit Post | QuizNotes Forum',
  description: 'Edit your forum post',
}

export default async function EditPostPage({ params }: PageProps) {
  const { postId } = await params
  const user = await requireAuth()
  const supabase = createServiceClient()

  // Get the post
  const { data: post, error } = await supabase
    .from('forum_posts')
    .select(
      `
      *,
      tags:forum_post_tags(tag:forum_tags(*))
    `
    )
    .eq('id', postId)
    .eq('is_deleted', false)
    .single()

  if (error || !post) {
    notFound()
  }

  // Check if user is the author
  if (post.author_id !== user.id) {
    // Only the author can edit their post
    redirect(`/forum/${postId}`)
  }

  // Get all available tags
  const { data: allTags } = await supabase
    .from('forum_tags')
    .select('*')
    .order('name', { ascending: true })

  // Transform tags
  const postTags = post.tags?.map((pt: any) => pt.tag.id) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
          <p className="text-gray-600 mt-2">Make changes to your post</p>
        </div>

        <EditPostForm
          postId={postId}
          initialTitle={post.title}
          initialContent={post.content}
          initialTagIds={postTags}
          allTags={allTags || []}
        />
      </div>
    </div>
  )
}
