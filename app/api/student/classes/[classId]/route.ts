import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params
    const supabase = await createClient()
    const supabaseAdmin = getSupabaseAdmin()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error in student classes:', {
        authError: authError?.message,
        hasUser: !!user
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify student is enrolled in this class (use admin client to bypass RLS)
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('class_enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('class_id', classId)
      .single()

    if (enrollmentError || !enrollment) {
      console.error('Enrollment check failed:', {
        userId: user.id,
        classId,
        error: enrollmentError,
        hasEnrollment: !!enrollment
      })
      return NextResponse.json(
        { error: 'Not enrolled in this class' },
        { status: 403 }
      )
    }

    // Get class details (use admin client to bypass RLS)
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select(`
        id,
        name,
        description,
        teacher:profiles!classes_teacher_id_fkey (
          name,
          email
        )
      `)
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get assignments for this class (use admin client to bypass RLS)
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
    }

    // For each assignment, get the student's attempts
    const assignmentsWithProgress = await Promise.all(
      (assignments || []).map(async (assignment) => {
        // Get student's attempts for this assignment (use admin client to bypass RLS)
        const { data: attempts, error: attemptsError } = await supabaseAdmin
          .from('quiz_attempts')
          .select('score, total_questions')
          .eq('user_id', user.id)
          .eq('assignment_id', assignment.id)

        if (attemptsError) {
          console.error('Error fetching attempts:', attemptsError)
        }

        const attemptsUsed = attempts?.length || 0
        const bestScore = attempts && attempts.length > 0
          ? Math.max(
              ...attempts.map((a) =>
                Math.round((a.score / a.total_questions) * 100)
              )
            )
          : null

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          quizType: assignment.quiz_type,
          dueDate: assignment.due_date,
          maxAttempts: assignment.max_attempts,
          attemptsUsed,
          bestScore,
        }
      })
    )

    // Handle teacher data (could be array or object)
    const teacherData: any = classData.teacher
    const teacher = Array.isArray(teacherData) ? teacherData[0] : teacherData

    return NextResponse.json({
      class: {
        id: classData.id,
        name: classData.name,
        description: classData.description,
        teacherName: teacher?.name || teacher?.email || 'Unknown',
      },
      assignments: assignmentsWithProgress,
    })
  } catch (error) {
    console.error('Error in GET /api/student/classes/[classId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
