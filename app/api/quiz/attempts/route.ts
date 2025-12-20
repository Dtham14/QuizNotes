import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: attempts, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching attempts:', error)
      return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 })
    }

    // Transform to camelCase
    const transformedAttempts = attempts.map((a) => ({
      id: a.id,
      userId: a.user_id,
      quizType: a.quiz_type,
      score: a.score,
      totalQuestions: a.total_questions,
      answers: a.answers,
      assignmentId: a.assignment_id,
      pdfUrl: a.pdf_url,
      createdAt: a.created_at,
    }))

    return NextResponse.json({ attempts: transformedAttempts })
  } catch (error) {
    console.error('Fetch attempts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
