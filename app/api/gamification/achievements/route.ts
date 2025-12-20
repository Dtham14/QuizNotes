import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserAchievements, ensureUserGamification } from '@/lib/gamification'

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user has gamification record
    await ensureUserGamification(user.id)

    const { earned, available, progress } = await getUserAchievements(user.id)

    // Convert Map to object for JSON serialization
    const progressObj: Record<string, { current: number; required: number }> = {}
    progress.forEach((value, key) => {
      progressObj[key] = value
    })

    return NextResponse.json({
      earned,
      available,
      progress: progressObj,
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
  }
}
