import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import CreatePostForm from './CreatePostForm'
import Link from 'next/link'

export const metadata = {
  title: 'Create Post | QuizNotes Forum',
  description: 'Create a new forum post',
}

export default async function CreatePostPage() {
  const user = await requireAuth()
  const supabase = createServiceClient()

  // Get all tags
  const { data: tags } = await supabase
    .from('forum_tags')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/forum"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Back to Forum
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
          <p className="mt-2 text-gray-600">Share your music theory questions or insights with the community</p>
        </div>

        {/* Form */}
        <CreatePostForm tags={tags || []} />
      </div>
    </div>
  )
}
