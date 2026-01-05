import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import type { DailyQuiz, DailyQuizAttempt } from '@/lib/types/database'
import { generateDailyQuizData, getQuizFormatForDate } from '@/lib/dailyQuizGenerator'

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
    let { data: quiz, error: quizError } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('quiz_date', today)
      .single()

    // If no quiz exists for today, auto-generate one
    if (quizError || !quiz) {
      console.log(`No quiz found for ${today}, auto-generating...`)

      // Determine format based on date
      const format = getQuizFormatForDate(today)
      const quizData = generateDailyQuizData(today, format)

      // Insert the new quiz
      const { data: newQuiz, error: insertError } = await supabase
        .from('daily_quizzes')
        .insert(quizData)
        .select()
        .single()

      if (insertError || !newQuiz) {
        console.error('Error auto-generating daily quiz:', insertError)
        return NextResponse.json(
          { error: 'Failed to generate daily quiz' },
          { status: 500 }
        )
      }

      console.log(`Auto-generated ${format} quiz for ${today}`)
      quiz = newQuiz
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
