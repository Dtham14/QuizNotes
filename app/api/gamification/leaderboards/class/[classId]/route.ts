import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getClassLeaderboard, getLeaderboardPeriodInfo, type LeaderboardType } from '@/lib/gamification'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const user = await getSession()
    const { classId } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify user has access to this class (either teacher or enrolled student)
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const isTeacher = classData.teacher_id === user.id

    if (!isTeacher) {
      // Check if user is enrolled
      const { data: enrollment } = await supabase
        .from('class_enrollments')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', user.id)
        .single()

      if (!enrollment) {
        return NextResponse.json({ error: 'Not authorized to view this class' }, { status: 403 })
      }
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

    const leaderboard = await getClassLeaderboard(classId, type, limit)
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
    console.error('Error fetching class leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
