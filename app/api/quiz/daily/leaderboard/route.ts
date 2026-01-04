import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly' // weekly or all_time

    if (!['weekly', 'all_time'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
    }

    // Calculate current week start for weekly leaderboard
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    const weekStartDate = weekStart.toISOString().split('T')[0]

    // Build query
    let query = supabase
      .from('daily_quiz_leaderboard')
      .select(
        `
        *,
        profile:profiles(id, name, email, avatar_url, theme_color)
      `
      )
      .eq('period_type', period)
      .order('total_score', { ascending: false })
      .limit(100)

    // Filter by current week for weekly leaderboard
    if (period === 'weekly') {
      query = query.eq('period_start', weekStartDate)
    } else {
      query = query.is('period_start', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Add rank to each entry
    const leaderboard = (data || []).map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      userName: entry.profile?.name || entry.profile?.email || 'Anonymous',
      avatarUrl: entry.profile?.avatar_url,
      themeColor: entry.profile?.theme_color,
      totalScore: entry.total_score,
      quizzesCompleted: entry.quizzes_completed,
      perfectDays: entry.perfect_days,
      currentStreak: entry.current_streak,
      bestStreak: entry.best_streak,
    }))

    return NextResponse.json({
      period,
      periodStart: period === 'weekly' ? weekStartDate : null,
      leaderboard,
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
