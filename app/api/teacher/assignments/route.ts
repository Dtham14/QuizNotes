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

    // Get all assignments for this teacher with class name
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        classes(name)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Get stats for each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        // Get total students in the class
        const { count: totalStudents } = await supabase
          .from('class_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', assignment.class_id)

        // Get quiz attempts for this assignment
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('user_id, score, total_questions')
          .eq('assignment_id', assignment.id)

        // Calculate stats
        const studentsCompleted = new Set(attempts?.map((a) => a.user_id) || []).size

        // Get best score per student for average calculation
        const bestScoresByStudent = new Map<string, number>()
        attempts?.forEach((attempt) => {
          const percentage = (attempt.score / attempt.total_questions) * 100
          const current = bestScoresByStudent.get(attempt.user_id)
          if (current === undefined || percentage > current) {
            bestScoresByStudent.set(attempt.user_id, percentage)
          }
        })

        const averageScore = bestScoresByStudent.size > 0
          ? Math.round(
              Array.from(bestScoresByStudent.values()).reduce((sum, score) => sum + score, 0) /
                bestScoresByStudent.size
            )
          : null

        // Handle classes as array or object
        const classes = assignment.classes as { name: string }[] | { name: string } | null;
        const className = Array.isArray(classes) ? classes[0]?.name : classes?.name;
        return {
          id: assignment.id,
          class_id: assignment.class_id,
          classes: { name: className || 'Unknown Class' },
          quiz_id: assignment.quiz_id,
          quiz_type: assignment.quiz_type,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          max_attempts: assignment.max_attempts,
          created_at: assignment.created_at,
          stats: {
            total_students: totalStudents || 0,
            completed_count: studentsCompleted,
            completion_rate: totalStudents && totalStudents > 0
              ? Math.round((studentsCompleted / totalStudents) * 100)
              : 0,
            average_score: averageScore,
          },
        }
      })
    )

    return NextResponse.json({ assignments: assignmentsWithStats })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assignments' },
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

    const { classId, quizId, quizType, title, description, dueDate, maxAttempts } = await request.json()

    if (!classId || !title || (!quizId && !quizType)) {
      return NextResponse.json(
        { error: 'Class, title, and either quizId or quizType are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify the class belongs to this teacher
    const { data: teacherClass } = await supabase
      .from('classes')
      .select()
      .eq('id', classId)
      .eq('teacher_id', user.id)
      .single()

    if (!teacherClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const { data: newAssignment, error } = await supabase
      .from('assignments')
      .insert({
        class_id: classId,
        teacher_id: user.id,
        quiz_id: quizId || null,
        quiz_type: quizType || null,
        title,
        description: description || null,
        due_date: dueDate || null,
        max_attempts: maxAttempts ? parseInt(maxAttempts, 10) : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
    }

    return NextResponse.json({
      assignment: {
        id: newAssignment.id,
        classId: newAssignment.class_id,
        teacherId: newAssignment.teacher_id,
        quizId: newAssignment.quiz_id,
        quizType: newAssignment.quiz_type,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.due_date,
        maxAttempts: newAssignment.max_attempts,
        createdAt: newAssignment.created_at,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create assignment' },
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

    const { assignmentId } = await request.json()

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verify the assignment belongs to this teacher
    const { data: assignment } = await supabase
      .from('assignments')
      .select()
      .eq('id', assignmentId)
      .eq('teacher_id', user.id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      console.error('Error deleting assignment:', error)
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
