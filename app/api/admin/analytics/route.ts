import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Use service role for accessing anonymous attempts (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get anonymous quiz attempts with aggregated stats
    const { data: anonymousAttempts, error: anonError } = await supabaseAdmin
      .from('anonymous_quiz_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (anonError) {
      console.error('Error fetching anonymous attempts:', anonError);
    }

    // Get registered user quiz attempts
    const { data: registeredAttempts, error: regError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (regError) {
      console.error('Error fetching registered attempts:', regError);
    }

    // Calculate anonymous stats
    const anonStats = {
      totalAttempts: anonymousAttempts?.length || 0,
      uniqueSessions: new Set(anonymousAttempts?.map(a => a.session_id) || []).size,
      byQuizType: {} as Record<string, { count: number; totalScore: number; totalQuestions: number }>,
      recentAttempts: (anonymousAttempts || []).slice(0, 20).map(a => ({
        id: a.id,
        sessionId: a.session_id,
        quizType: a.quiz_type,
        score: a.score,
        totalQuestions: a.total_questions,
        createdAt: a.created_at,
      })),
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
    };

    // Calculate time-based stats
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    (anonymousAttempts || []).forEach(attempt => {
      const attemptDate = new Date(attempt.created_at);

      // Time-based counts
      if (attemptDate >= oneDayAgo) anonStats.last24Hours++;
      if (attemptDate >= sevenDaysAgo) anonStats.last7Days++;
      if (attemptDate >= thirtyDaysAgo) anonStats.last30Days++;

      // By quiz type
      if (!anonStats.byQuizType[attempt.quiz_type]) {
        anonStats.byQuizType[attempt.quiz_type] = { count: 0, totalScore: 0, totalQuestions: 0 };
      }
      anonStats.byQuizType[attempt.quiz_type].count++;
      anonStats.byQuizType[attempt.quiz_type].totalScore += attempt.score;
      anonStats.byQuizType[attempt.quiz_type].totalQuestions += attempt.total_questions;
    });

    // Calculate registered user stats
    const regStats = {
      totalAttempts: registeredAttempts?.length || 0,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
    };

    (registeredAttempts || []).forEach(attempt => {
      const attemptDate = new Date(attempt.created_at);
      if (attemptDate >= oneDayAgo) regStats.last24Hours++;
      if (attemptDate >= sevenDaysAgo) regStats.last7Days++;
      if (attemptDate >= thirtyDaysAgo) regStats.last30Days++;
    });

    return NextResponse.json({
      anonymous: anonStats,
      registered: regStats,
      comparison: {
        anonymousPercentage: anonStats.totalAttempts + regStats.totalAttempts > 0
          ? Math.round((anonStats.totalAttempts / (anonStats.totalAttempts + regStats.totalAttempts)) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
