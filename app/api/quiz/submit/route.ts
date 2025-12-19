import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

// Create admin client lazily to ensure env vars are available
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quizType, score, totalQuestions, answers, assignmentId } = await request.json()

    if (!quizType || score === undefined || !totalQuestions || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Check attempt limit if this is an assignment submission
    if (assignmentId) {
      const { data: assignment } = await supabaseAdmin
        .from('assignments')
        .select('max_attempts')
        .eq('id', assignmentId)
        .single()

      if (assignment && assignment.max_attempts) {
        // Count existing attempts for this user on this assignment
        const { count } = await supabaseAdmin
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('assignment_id', assignmentId)

        if (count !== null && count >= assignment.max_attempts) {
          return NextResponse.json(
            {
              error: 'Attempt limit reached',
              message: `You have already used all ${assignment.max_attempts} attempt${assignment.max_attempts > 1 ? 's' : ''} for this assignment.`
            },
            { status: 403 }
          )
        }
      }
    }

    const { data: attempt, error } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_type: quizType,
        score,
        total_questions: totalQuestions,
        answers,
        assignment_id: assignmentId || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting quiz:', error)
      return NextResponse.json({ error: 'Failed to submit quiz', details: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Quiz submitted successfully',
        attempt: {
          id: attempt.id,
          userId: attempt.user_id,
          quizType: attempt.quiz_type,
          score: attempt.score,
          totalQuestions: attempt.total_questions,
          answers: attempt.answers,
          assignmentId: attempt.assignment_id,
          createdAt: attempt.created_at,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Quiz submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
