import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attemptId } = params

    const supabase = getSupabaseAdmin()

    // Fetch the quiz attempt
    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id) // Ensure user can only access their own attempts
      .single()

    if (error || !attempt) {
      return NextResponse.json({ error: 'Quiz attempt not found' }, { status: 404 })
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        quizType: attempt.quiz_type,
        score: attempt.score,
        totalQuestions: attempt.total_questions,
        answers: attempt.answers,
        questions: attempt.questions,
        assignmentId: attempt.assignment_id,
        createdAt: attempt.created_at,
      },
    })
  } catch (error) {
    console.error('Error fetching quiz attempt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
