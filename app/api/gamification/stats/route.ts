import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getGamificationStats, ensureUserGamification } from '@/lib/gamification'

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure the user has a gamification record (creates one if missing)
    await ensureUserGamification(user.id)

    const stats = await getGamificationStats(user.id)

    if (!stats) {
      return NextResponse.json({ error: 'Gamification data not found' }, { status: 404 })
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching gamification stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
