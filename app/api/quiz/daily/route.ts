import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import type { DailyQuiz, DailyQuizAttempt } from '@/lib/types/database'

// Create admin client for bypassing RLS
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const user = await getSession() // May be null for anonymous users

    // Get today's date in UTC (YYYY-MM-DD format)
    const today = new Date().toISOString().split('T')[0]

    // Fetch today's daily quiz
    const { data: quiz, error: quizError } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('quiz_date', today)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: 'No daily quiz available for today' },
        { status: 404 }
      )
    }

    // Check if user/session already completed this quiz
    let userAttempt: DailyQuizAttempt | null = null

    if (user) {
      // Logged-in user: check by user_id
      const { data } = await supabase
        .from('daily_quiz_attempts')
        .select('*')
        .eq('daily_quiz_id', quiz.id)
        .eq('user_id', user.id)
        .single()

      userAttempt = data
    } else {
      // Anonymous user: check by session_id from cookie
      const sessionId = request.cookies.get('quiz_session_id')?.value

      if (sessionId) {
        const { data } = await supabase
          .from('daily_quiz_attempts')
          .select('*')
          .eq('daily_quiz_id', quiz.id)
          .eq('session_id', sessionId)
          .single()

        userAttempt = data
      }
    }

    // Return quiz with attempt status
    return NextResponse.json({
      quiz: quiz as DailyQuiz,
      userAttempt: userAttempt
        ? {
            completed: true,
            score: userAttempt.score,
            completedAt: userAttempt.completed_at,
          }
        : { completed: false },
    })
  } catch (error) {
    console.error('Error fetching daily quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
