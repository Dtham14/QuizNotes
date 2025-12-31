import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await getSession();

    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // First get teacher's class IDs
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', user.id);

    const classIds = teacherClasses?.map(c => c.id) || [];

    // Fetch all stats in parallel
    const [classesResult, studentsResult, quizzesResult, assignmentsResult, recentEnrollments, upcomingAssignments] = await Promise.all([
      // Total classes
      supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id),

      // Total students across all classes
      classIds.length > 0
        ? supabase
            .from('class_enrollments')
            .select('student_id, enrolled_at, profiles!inner(name, email)', { count: 'exact' })
            .in('class_id', classIds)
            .order('enrolled_at', { ascending: false })
            .limit(5)
        : { count: 0, data: [] },

      // Total custom quizzes
      supabase
        .from('custom_quizzes')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id),

      // Total assignments
      supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id),

      // Recent enrollments (last 5)
      classIds.length > 0
        ? supabase
            .from('class_enrollments')
            .select('enrolled_at, student_id, class_id, classes!inner(name), profiles!inner(name, email)')
            .in('class_id', classIds)
            .order('enrolled_at', { ascending: false })
            .limit(5)
        : { data: [] },

      // Upcoming assignments (next 5 with due dates)
      supabase
        .from('assignments')
        .select('id, title, due_date, classes!inner(name)')
        .eq('teacher_id', user.id)
        .not('due_date', 'is', null)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

    return NextResponse.json({
      stats: {
        classCount: classesResult.count || 0,
        studentCount: studentsResult.count || 0,
        quizCount: quizzesResult.count || 0,
        assignmentCount: assignmentsResult.count || 0,
      },
      recentActivity: {
        enrollments: recentEnrollments.data || [],
        upcomingAssignments: upcomingAssignments.data || [],
      },
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
