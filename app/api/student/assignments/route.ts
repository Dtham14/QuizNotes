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

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Get all class IDs the student is enrolled in
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('student_id', user.id)

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ assignments: [] })
    }

    const classIds = enrollments.map((e) => e.class_id)

    // Get all assignments for those classes
    const { data: assignments, error } = await supabase
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
      .in('class_id', classIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Get quiz attempts for this student to check completion status
    const assignmentIds = (assignments || []).map((a) => a.id)
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('assignment_id, score, total_questions')
      .eq('user_id', user.id)
      .in('assignment_id', assignmentIds)

    // Create a map of assignment completions
    const completionMap = new Map<string, { completed: boolean; score: number; totalQuestions: number }>()
    ;(attempts || []).forEach((attempt) => {
      if (attempt.assignment_id) {
        completionMap.set(attempt.assignment_id, {
          completed: true,
          score: attempt.score,
          totalQuestions: attempt.total_questions,
        })
      }
    })

    // Transform to camelCase - use type assertion to avoid complex Supabase join type issues
    const transformedAssignments = (assignments || []).map((a) => {
      const assignment = a as {
        id: string;
        class_id: string;
        quiz_id: string | null;
        quiz_type: string | null;
        title: string;
        description: string | null;
        due_date: string | null;
        max_attempts: number | null;
        created_at: string;
        classes: { name: string }[] | { name: string } | null;
      };
      const className = Array.isArray(assignment.classes)
        ? assignment.classes[0]?.name
        : assignment.classes?.name;
      const completion = completionMap.get(assignment.id)
      return {
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
        completed: completion?.completed || false,
        score: completion?.score || null,
        totalQuestions: completion?.totalQuestions || null,
      };
    })

    return NextResponse.json({ assignments: transformedAssignments })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
