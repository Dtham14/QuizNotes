import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
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

    const { assignmentId } = await params
    const supabase = getSupabaseAdmin()

    // Get the assignment and verify it belongs to this teacher
    const { data: assignment } = await supabase
      .from('assignments')
      .select(`
        id,
        class_id,
        quiz_id,
        quiz_type,
        title,
        description,
        due_date,
        max_attempts,
        created_at,
        classes(name)
      `)
      .eq('id', assignmentId)
      .eq('teacher_id', user.id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get all enrolled students in the class
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select(`
        student_id,
        profiles(id, name, email)
      `)
      .eq('class_id', assignment.class_id)

    const studentIds = enrollments?.map((e) => e.student_id) || []

    // Get quiz attempts for this assignment
    let attempts: any[] = []
    if (studentIds.length > 0) {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('id, user_id, score, total_questions, created_at')
        .eq('assignment_id', assignmentId)
        .in('user_id', studentIds)

      attempts = data || []
    }

    // Build student results with completion status
    const studentResults = (enrollments || []).map((enrollment) => {
      const student = enrollment.profiles as any
      const studentAttempts = attempts.filter((a) => a.user_id === enrollment.student_id)
      const bestAttempt = studentAttempts.length > 0
        ? studentAttempts.reduce((best, current) =>
            (current.score / current.total_questions) > (best.score / best.total_questions) ? current : best
          )
        : null

      return {
        studentId: enrollment.student_id,
        studentName: student?.name,
        studentEmail: student?.email,
        completed: studentAttempts.length > 0,
        attemptCount: studentAttempts.length,
        bestScore: bestAttempt ? bestAttempt.score : null,
        totalQuestions: bestAttempt ? bestAttempt.total_questions : null,
        bestPercentage: bestAttempt
          ? Math.round((bestAttempt.score / bestAttempt.total_questions) * 100)
          : null,
        lastAttemptAt: studentAttempts.length > 0
          ? studentAttempts.sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
              return dateB - dateA
            })[0].created_at
          : null,
      }
    })

    // Calculate class statistics
    const completedStudents = studentResults.filter((s) => s.completed)
    const totalEnrolled = enrollments?.length || 0
    const completionRate = totalEnrolled > 0
      ? Math.round((completedStudents.length / totalEnrolled) * 100)
      : 0
    const averageScore = completedStudents.length > 0
      ? Math.round(
          completedStudents.reduce((sum, s) => sum + (s.bestPercentage || 0), 0) / completedStudents.length
        )
      : null

    // Transform assignment - handle classes as array or object
    const classes = assignment.classes as { name: string }[] | { name: string } | null;
    const className = Array.isArray(classes) ? classes[0]?.name : classes?.name;
    const transformedAssignment = {
      id: assignment.id,
      classId: assignment.class_id,
      className,
      quizId: assignment.quiz_id,
      quizType: assignment.quiz_type,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date,
      maxAttempts: assignment.max_attempts,
      createdAt: assignment.created_at,
    }

    return NextResponse.json({
      assignment: transformedAssignment,
      results: studentResults,
      stats: {
        totalStudents: totalEnrolled,
        completedCount: completedStudents.length,
        completionRate,
        averageScore,
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assignment results' },
      { status: 500 }
    )
  }
}
