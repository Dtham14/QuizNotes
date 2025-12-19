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
  { params }: { params: Promise<{ classId: string }> }
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

    const { classId } = await params
    const supabase = getSupabaseAdmin()

    // Verify the class belongs to this teacher
    const { data: classData } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .eq('teacher_id', user.id)
      .single()

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get all enrolled students with their profile info
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        student_id,
        enrolled_at,
        profiles(id, name, email)
      `)
      .eq('class_id', classId)

    // Get all assignments for this class
    const { data: classAssignments } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    // Get student IDs for fetching quiz attempts
    const studentIds = enrollments?.map((e) => e.student_id) || []

    // Get all quiz attempts from enrolled students
    let studentAttempts: any[] = []
    if (studentIds.length > 0) {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('id, user_id, quiz_type, score, total_questions, assignment_id, created_at')
        .in('user_id', studentIds)

      studentAttempts = data || []
    }

    // Organize attempts by student
    const studentsWithScores = (enrollments || []).map((enrollment) => {
      const student = enrollment.profiles as any
      const attempts = studentAttempts.filter((a) => a.user_id === enrollment.student_id)
      const totalAttempts = attempts.length
      const averageScore = totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / totalAttempts
        : null

      return {
        id: enrollment.student_id,
        name: student?.name,
        email: student?.email,
        enrolledAt: enrollment.enrolled_at,
        totalAttempts,
        averageScore: averageScore !== null ? Math.round(averageScore * 10) / 10 : null,
        recentAttempts: attempts
          .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
            return dateB - dateA
          })
          .slice(0, 5)
          .map((a) => ({
            id: a.id,
            quizType: a.quiz_type,
            score: a.score,
            totalQuestions: a.total_questions,
            percentage: Math.round((a.score / a.total_questions) * 100),
            assignmentId: a.assignment_id,
            createdAt: a.created_at,
          })),
      }
    })

    // Transform class data
    const transformedClass = {
      id: classData.id,
      teacherId: classData.teacher_id,
      name: classData.name,
      description: classData.description,
      code: classData.code,
      createdAt: classData.created_at,
    }

    // Transform assignments
    const transformedAssignments = (classAssignments || []).map((a) => ({
      id: a.id,
      classId: a.class_id,
      teacherId: a.teacher_id,
      quizId: a.quiz_id,
      quizType: a.quiz_type,
      title: a.title,
      description: a.description,
      dueDate: a.due_date,
      maxAttempts: a.max_attempts,
      createdAt: a.created_at,
    }))

    return NextResponse.json({
      class: transformedClass,
      students: studentsWithScores,
      assignments: transformedAssignments,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch class data' },
      { status: 500 }
    )
  }
}
