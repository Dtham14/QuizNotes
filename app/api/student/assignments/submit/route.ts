import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

// Service role client to bypass RLS policies
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  return createSupabaseClient(url, key)
}

export async function POST(request: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = await request.json()

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verify the student is enrolled in the class for this assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .select('id, class_id')
      .eq('id', assignmentId)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const { data: enrollment } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', assignment.class_id)
      .eq('student_id', user.id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 })
    }

    // Get the student's best score for this assignment
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('assignment_id', assignmentId)
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(1)

    const bestScore = attempts && attempts.length > 0 ? attempts[0].score : null

    // Check if already submitted
    const { data: existingSubmission } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single()

    if (existingSubmission) {
      return NextResponse.json({ error: 'Assignment already submitted' }, { status: 400 })
    }

    // Create submission record
    const { error: insertError } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: user.id,
        final_score: bestScore,
      })

    if (insertError) {
      console.error('Error submitting assignment:', insertError)
      return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Assignment submitted successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit assignment' },
      { status: 500 }
    )
  }
}
