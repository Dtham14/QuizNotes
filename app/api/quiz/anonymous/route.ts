import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Use service role for anonymous attempts (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.SUPABASE_SERVICE_ROLE_KEY).digest('hex').substring(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const { quizType, score, totalQuestions, answers, sessionId } = await request.json()

    if (!quizType || score === undefined || !totalQuestions || !answers || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get IP for analytics (hashed for privacy)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    const ipHash = hashIP(ip)

    // Get user agent for device analytics
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const { data: attempt, error } = await supabaseAdmin
      .from('anonymous_quiz_attempts')
      .insert({
        session_id: sessionId,
        quiz_type: quizType,
        score,
        total_questions: totalQuestions,
        answers,
        ip_hash: ipHash,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting anonymous quiz:', error)
      return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Quiz submitted successfully',
        attempt: {
          id: attempt.id,
          sessionId: attempt.session_id,
          quizType: attempt.quiz_type,
          score: attempt.score,
          totalQuestions: attempt.total_questions,
          createdAt: attempt.created_at,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Anonymous quiz submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
