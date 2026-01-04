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
  { params }: { params: { assignmentId: string } }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = params

    const supabase = getSupabaseAdmin()

    // Fetch the most recent quiz attempt for this assignment
    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('user_id', user.id) // Ensure user can only access their own attempts
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !attempt) {
      return NextResponse.json({ error: 'No quiz attempt found for this assignment' }, { status: 404 })
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
