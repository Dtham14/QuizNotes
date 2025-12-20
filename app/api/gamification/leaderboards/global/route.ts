import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLeaderboard, getLeaderboardPeriodInfo, ensureUserGamification, type LeaderboardType } from '@/lib/gamification'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    // Ensure user has gamification record if logged in
    if (user) {
      await ensureUserGamification(user.id)
    }

    const searchParams = request.nextUrl.searchParams
    const type = (searchParams.get('type') || 'weekly') as LeaderboardType
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (type !== 'weekly' && type !== 'monthly') {
      return NextResponse.json(
        { error: 'Invalid leaderboard type. Must be "weekly" or "monthly"' },
        { status: 400 }
      )
    }

    const leaderboard = await getLeaderboard(type, user?.id, limit)
    const periodInfo = await getLeaderboardPeriodInfo(type)

    if (!leaderboard) {
      return NextResponse.json({
        leaderboard: {
          period: null,
          entries: [],
          userRank: null,
          userEntry: null,
        },
        periodInfo: null,
      })
    }

    return NextResponse.json({
      leaderboard,
      periodInfo,
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
