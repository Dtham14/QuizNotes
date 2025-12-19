import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSession, hasActiveSubscription } from '@/lib/auth'

// Service role client to bypass RLS policies
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  return createSupabaseClient(url, key)
}

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role === 'teacher' && !hasActiveSubscription(user)) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
    }

    const supabase = getSupabaseAdmin()

    const { data: quizzes, error } = await supabase
      .from('custom_quizzes')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quizzes:', error)
      return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
    }

    // Transform to camelCase for frontend
    const transformedQuizzes = quizzes.map((quiz) => ({
      id: quiz.id,
      teacherId: quiz.teacher_id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
      createdAt: quiz.created_at,
    }))

    return NextResponse.json({ quizzes: transformedQuizzes })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch quizzes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role === 'teacher' && !hasActiveSubscription(user)) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
    }

    const { title, description, questions } = await request.json()

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Title and questions are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: newQuiz, error } = await supabase
      .from('custom_quizzes')
      .insert({
        teacher_id: user.id,
        title,
        description: description || null,
        questions,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating quiz:', error)
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
    }

    return NextResponse.json({
      quiz: {
        id: newQuiz.id,
        teacherId: newQuiz.teacher_id,
        title: newQuiz.title,
        description: newQuiz.description,
        questions: newQuiz.questions,
        createdAt: newQuiz.created_at,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create quiz' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role === 'teacher' && !hasActiveSubscription(user)) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
    }

    const { quizId } = await request.json()

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verify the quiz belongs to this teacher
    const { data: quiz } = await supabase
      .from('custom_quizzes')
      .select()
      .eq('id', quizId)
      .eq('teacher_id', user.id)
      .single()

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('custom_quizzes')
      .delete()
      .eq('id', quizId)

    if (error) {
      console.error('Error deleting quiz:', error)
      return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete quiz' },
      { status: 500 }
    )
  }
}
