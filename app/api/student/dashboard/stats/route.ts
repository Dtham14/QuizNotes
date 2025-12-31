import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // First get student's enrolled class IDs
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('student_id', user.id);

    const classIds = enrollments?.map(e => e.class_id) || [];

    // Fetch student stats in parallel
    const [enrollmentsResult, assignmentsResult, gamificationResult] = await Promise.all([
      // Total classes enrolled
      supabase
        .from('class_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.id),

      // Total assignments and completion
      classIds.length > 0
        ? supabase
            .from('assignments')
            .select(`
              id,
              quiz_attempts!inner(id, score, assignment_id)
            `)
            .in('class_id', classIds)
        : { data: [] },

      // Gamification stats
      supabase
        .from('user_gamification')
        .select('total_xp, current_level, current_streak, quizzes_today')
        .eq('user_id', user.id)
        .single(),
    ]);

    // Calculate assignment stats
    const assignments = assignmentsResult.data || [];
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter((a: any) =>
      a.quiz_attempts && a.quiz_attempts.length > 0
    ).length;

    return NextResponse.json({
      stats: {
        classCount: enrollmentsResult.count || 0,
        totalAssignments,
        completedAssignments,
        xp: gamificationResult.data?.total_xp || 0,
        level: gamificationResult.data?.current_level || 1,
        streak: gamificationResult.data?.current_streak || 0,
        quizzesToday: gamificationResult.data?.quizzes_today || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching student dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
