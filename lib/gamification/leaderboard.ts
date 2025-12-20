import { createServiceClient } from '@/lib/supabase/service'
import type { LeaderboardEntryWithUser, LeaderboardPeriod } from '@/lib/types/database'

export type LeaderboardType = 'weekly' | 'monthly'

export interface LeaderboardData {
  period: LeaderboardPeriod
  entries: LeaderboardEntryWithUser[]
  userRank: number | null
  userEntry: LeaderboardEntryWithUser | null
}

export async function getLeaderboard(
  type: LeaderboardType,
  userId?: string,
  limit: number = 50
): Promise<LeaderboardData | null> {
  const supabase = createServiceClient()

  // Get current period
  const { data: period } = await supabase
    .from('leaderboard_periods')
    .select('*')
    .eq('period_type', type)
    .eq('is_active', true)
    .single()

  if (!period) {
    return null
  }

  // Get top entries with user profiles
  const { data: entries } = await supabase
    .from('leaderboard_entries')
    .select(`
      *,
      profile:profiles(id, name, email)
    `)
    .eq('period_id', period.id)
    .order('xp_earned', { ascending: false })
    .limit(limit)

  if (!entries) {
    return {
      period,
      entries: [],
      userRank: null,
      userEntry: null,
    }
  }

  // Add ranks
  const rankedEntries: LeaderboardEntryWithUser[] = entries.map((entry, index) => ({
    ...entry,
    profile: entry.profile as { id: string; name: string | null; email: string },
    rank: index + 1,
  }))

  // Find user's rank if userId provided
  let userRank: number | null = null
  let userEntry: LeaderboardEntryWithUser | null = null

  if (userId) {
    const userInTop = rankedEntries.find(e => e.user_id === userId)

    if (userInTop) {
      userRank = userInTop.rank!
      userEntry = userInTop
    } else {
      // User not in top, need to calculate their rank
      const { count } = await supabase
        .from('leaderboard_entries')
        .select('*', { count: 'exact', head: true })
        .eq('period_id', period.id)

      // Get user's entry
      const { data: userEntryData } = await supabase
        .from('leaderboard_entries')
        .select(`
          *,
          profile:profiles(id, name, email)
        `)
        .eq('period_id', period.id)
        .eq('user_id', userId)
        .single()

      if (userEntryData) {
        // Count how many are above this user
        const { count: aboveCount } = await supabase
          .from('leaderboard_entries')
          .select('*', { count: 'exact', head: true })
          .eq('period_id', period.id)
          .gt('xp_earned', userEntryData.xp_earned)

        userRank = (aboveCount || 0) + 1
        userEntry = {
          ...userEntryData,
          profile: userEntryData.profile as { id: string; name: string | null; email: string },
          rank: userRank,
        }
      }
    }
  }

  return {
    period,
    entries: rankedEntries,
    userRank,
    userEntry,
  }
}

export async function getClassLeaderboard(
  classId: string,
  type: LeaderboardType = 'weekly',
  limit: number = 50
): Promise<LeaderboardData | null> {
  const supabase = createServiceClient()

  // Get current period
  const { data: period } = await supabase
    .from('leaderboard_periods')
    .select('*')
    .eq('period_type', type)
    .eq('is_active', true)
    .single()

  if (!period) {
    return null
  }

  // Get students in the class
  const { data: enrollments } = await supabase
    .from('class_enrollments')
    .select('student_id')
    .eq('class_id', classId)

  if (!enrollments || enrollments.length === 0) {
    return {
      period,
      entries: [],
      userRank: null,
      userEntry: null,
    }
  }

  const studentIds = enrollments.map(e => e.student_id)

  // Get leaderboard entries for these students
  const { data: entries } = await supabase
    .from('leaderboard_entries')
    .select(`
      *,
      profile:profiles(id, name, email)
    `)
    .eq('period_id', period.id)
    .in('user_id', studentIds)
    .order('xp_earned', { ascending: false })
    .limit(limit)

  if (!entries) {
    return {
      period,
      entries: [],
      userRank: null,
      userEntry: null,
    }
  }

  // Add ranks
  const rankedEntries: LeaderboardEntryWithUser[] = entries.map((entry, index) => ({
    ...entry,
    profile: entry.profile as { id: string; name: string | null; email: string },
    rank: index + 1,
  }))

  return {
    period,
    entries: rankedEntries,
    userRank: null,
    userEntry: null,
  }
}

export async function getUserLeaderboardStats(userId: string): Promise<{
  weeklyRank: number | null
  weeklyXp: number
  monthlyRank: number | null
  monthlyXp: number
}> {
  const weekly = await getLeaderboard('weekly', userId, 1)
  const monthly = await getLeaderboard('monthly', userId, 1)

  return {
    weeklyRank: weekly?.userRank || null,
    weeklyXp: weekly?.userEntry?.xp_earned || 0,
    monthlyRank: monthly?.userRank || null,
    monthlyXp: monthly?.userEntry?.xp_earned || 0,
  }
}

export async function getLeaderboardPeriodInfo(type: LeaderboardType): Promise<{
  startDate: Date
  endDate: Date
  daysRemaining: number
} | null> {
  const supabase = createServiceClient()

  const { data: period } = await supabase
    .from('leaderboard_periods')
    .select('*')
    .eq('period_type', type)
    .eq('is_active', true)
    .single()

  if (!period) {
    return null
  }

  const startDate = new Date(period.start_date)
  const endDate = new Date(period.end_date)
  const now = new Date()

  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return {
    startDate,
    endDate,
    daysRemaining,
  }
}
