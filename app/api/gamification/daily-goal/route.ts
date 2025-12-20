import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDailyProgress, updateDailyGoal } from '@/lib/gamification'

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dailyProgress = await getDailyProgress(user.id)

    return NextResponse.json({ dailyProgress })
  } catch (error) {
    console.error('Error fetching daily goal:', error)
    return NextResponse.json({ error: 'Failed to fetch daily goal' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dailyGoal } = await request.json()

    if (typeof dailyGoal !== 'number' || dailyGoal < 1 || dailyGoal > 20) {
      return NextResponse.json(
        { error: 'Daily goal must be a number between 1 and 20' },
        { status: 400 }
      )
    }

    await updateDailyGoal(user.id, dailyGoal)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating daily goal:', error)
    return NextResponse.json({ error: 'Failed to update daily goal' }, { status: 500 })
  }
}
