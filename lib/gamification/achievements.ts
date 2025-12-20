import { createServiceClient } from '@/lib/supabase/service'
import type { AchievementDefinition, UserAchievementWithDetails, UserGamification } from '@/lib/types/database'
import { awardXP } from './xp'

export interface NewAchievement {
  achievement: AchievementDefinition
  xpAwarded: number
}

export async function checkAndAwardAchievements(userId: string): Promise<NewAchievement[]> {
  // Use service client for writes (bypasses RLS)
  const serviceClient = createServiceClient()

  // Get user's current stats
  const { data: gamification } = await serviceClient
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!gamification) {
    return []
  }

  // Get all achievement definitions
  const { data: allAchievements } = await serviceClient
    .from('achievement_definitions')
    .select('*')
    .order('sort_order')

  if (!allAchievements) {
    return []
  }

  // Get user's already earned achievements
  const { data: earnedAchievements } = await serviceClient
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)

  const earnedIds = new Set((earnedAchievements || []).map(a => a.achievement_id))

  // Check each unearned achievement
  const newAchievements: NewAchievement[] = []

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) {
      continue // Already earned
    }

    let earned = false

    // Special handling for daily_goal_7 (async check)
    if (achievement.id === 'daily_goal_7') {
      earned = await checkConsecutiveDailyGoals(userId, 7)
    } else {
      earned = await checkAchievementCriteria(achievement, gamification)
    }

    if (earned) {
      // Award the achievement using service client (bypasses RLS)
      const { error } = await serviceClient.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
      })

      if (error) {
        console.error('Failed to insert achievement:', error)
        continue
      }

      // Award XP for the achievement
      if (achievement.xp_reward > 0) {
        await awardXP(userId, achievement.xp_reward, 'achievement')
      }

      newAchievements.push({
        achievement,
        xpAwarded: achievement.xp_reward,
      })
    }
  }

  return newAchievements
}

async function checkAchievementCriteria(
  achievement: AchievementDefinition,
  gamification: UserGamification
): Promise<boolean> {
  const value = achievement.requirement_value

  switch (achievement.requirement_type) {
    case 'count':
      // Quiz count achievements
      return gamification.total_quizzes_completed >= (value || 0)

    case 'streak':
      // Streak achievements - check both current and longest
      return gamification.longest_streak >= (value || 0)

    case 'score':
      // Perfect score count achievements
      return gamification.total_perfect_scores >= (value || 0)

    case 'special':
      // Special achievements need specific checks
      return checkSpecialAchievement(achievement.id, gamification)

    default:
      return false
  }
}

function checkSpecialAchievement(
  achievementId: string,
  gamification: UserGamification
): boolean {
  switch (achievementId) {
    case 'level_5':
      return gamification.current_level >= 5
    case 'level_10':
      return gamification.current_level >= 10
    case 'level_15':
      return gamification.current_level >= 15
    case 'xp_1000':
      return gamification.total_xp >= 1000
    case 'xp_5000':
      return gamification.total_xp >= 5000
    case 'xp_10000':
      return gamification.total_xp >= 10000
    // daily_goal_7 is checked separately via checkConsecutiveDailyGoals
    // Time-based achievements like early_bird and night_owl
    // are checked via checkTimeBasedAchievements
    default:
      return false
  }
}

// Check if user has met daily goal for N consecutive days (ending today or yesterday)
async function checkConsecutiveDailyGoals(userId: string, requiredDays: number): Promise<boolean> {
  const supabase = createServiceClient()

  // Get daily_goal XP transactions from the last N+1 days (to have some buffer)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - requiredDays - 1)

  const { data: transactions } = await supabase
    .from('xp_transactions')
    .select('created_at')
    .eq('user_id', userId)
    .eq('reason', 'daily_goal')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  if (!transactions || transactions.length < requiredDays) {
    return false
  }

  // Extract unique dates when daily goal was met
  const datesWithGoalMet = new Set<string>()
  for (const tx of transactions) {
    const date = new Date(tx.created_at).toISOString().split('T')[0]
    datesWithGoalMet.add(date)
  }

  // Check for N consecutive days ending with today or yesterday
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Try starting from today, then yesterday
  for (let startOffset = 0; startOffset <= 1; startOffset++) {
    let consecutiveDays = 0
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - startOffset)

    for (let i = 0; i < requiredDays; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (datesWithGoalMet.has(dateStr)) {
        consecutiveDays++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    if (consecutiveDays >= requiredDays) {
      return true
    }
  }

  return false
}

export async function checkTimeBasedAchievements(userId: string): Promise<NewAchievement[]> {
  const supabase = createServiceClient()
  const now = new Date()
  const hour = now.getHours()

  const newAchievements: NewAchievement[] = []

  // Check for early_bird (before 8 AM)
  if (hour < 8) {
    const achievement = await tryAwardAchievement(userId, 'early_bird')
    if (achievement) {
      newAchievements.push(achievement)
    }
  }

  // Check for night_owl (after 10 PM)
  if (hour >= 22) {
    const achievement = await tryAwardAchievement(userId, 'night_owl')
    if (achievement) {
      newAchievements.push(achievement)
    }
  }

  return newAchievements
}

async function tryAwardAchievement(
  userId: string,
  achievementId: string
): Promise<NewAchievement | null> {
  const serviceClient = createServiceClient()

  // Check if already earned
  const { data: existing } = await serviceClient
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single()

  if (existing) {
    return null // Already earned
  }

  // Get achievement definition
  const { data: achievement } = await serviceClient
    .from('achievement_definitions')
    .select('*')
    .eq('id', achievementId)
    .single()

  if (!achievement) {
    return null
  }

  // Award the achievement
  const { error } = await serviceClient.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievementId,
  })

  if (error) {
    console.error('Failed to insert achievement:', error)
    return null
  }

  // Award XP
  if (achievement.xp_reward > 0) {
    await awardXP(userId, achievement.xp_reward, 'achievement')
  }

  return {
    achievement,
    xpAwarded: achievement.xp_reward,
  }
}

export async function getUserAchievements(userId: string): Promise<{
  earned: UserAchievementWithDetails[]
  available: AchievementDefinition[]
  progress: Map<string, { current: number; required: number }>
}> {
  const serviceClient = createServiceClient()

  // Get all achievements
  const { data: allAchievements } = await serviceClient
    .from('achievement_definitions')
    .select('*')
    .eq('is_hidden', false)
    .order('sort_order')

  // Get user's earned achievements
  const { data: userAchievements } = await serviceClient
    .from('user_achievements')
    .select('*, achievement:achievement_definitions(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  // Get user's gamification stats for progress
  const { data: gamification } = await serviceClient
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single()

  const earnedIds = new Set((userAchievements || []).map(ua => ua.achievement_id))

  const earned = (userAchievements || []).map(ua => ({
    ...ua,
    achievement: ua.achievement as AchievementDefinition,
  }))

  const available = (allAchievements || []).filter(a => !earnedIds.has(a.id))

  // Calculate progress for each available achievement
  const progress = new Map<string, { current: number; required: number }>()

  if (gamification) {
    // Get consecutive daily goal streak for progress display
    const dailyGoalStreak = await getConsecutiveDailyGoalStreak(userId)

    for (const achievement of available) {
      const required = achievement.requirement_value || 0
      let current = 0

      switch (achievement.requirement_type) {
        case 'count':
          current = gamification.total_quizzes_completed
          break
        case 'streak':
          current = gamification.longest_streak
          break
        case 'score':
          current = gamification.total_perfect_scores
          break
        case 'special':
          if (achievement.id.startsWith('level_')) {
            current = gamification.current_level
          } else if (achievement.id.startsWith('xp_')) {
            current = gamification.total_xp
          } else if (achievement.id === 'daily_goal_7') {
            current = dailyGoalStreak
          }
          break
      }

      progress.set(achievement.id, { current, required })
    }
  }

  return { earned, available, progress }
}

// Get the current consecutive daily goal streak (for progress display)
export async function getConsecutiveDailyGoalStreak(userId: string): Promise<number> {
  const supabase = createServiceClient()

  // Get daily_goal XP transactions from the last 30 days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const { data: transactions } = await supabase
    .from('xp_transactions')
    .select('created_at')
    .eq('user_id', userId)
    .eq('reason', 'daily_goal')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  if (!transactions || transactions.length === 0) {
    return 0
  }

  // Extract unique dates when daily goal was met
  const datesWithGoalMet = new Set<string>()
  for (const tx of transactions) {
    const date = new Date(tx.created_at).toISOString().split('T')[0]
    datesWithGoalMet.add(date)
  }

  // Count consecutive days starting from today or yesterday
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let maxStreak = 0

  for (let startOffset = 0; startOffset <= 1; startOffset++) {
    let streak = 0
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - startOffset)

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (datesWithGoalMet.has(dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    maxStreak = Math.max(maxStreak, streak)
  }

  return maxStreak
}

export async function getRecentAchievements(
  userId: string,
  limit: number = 3
): Promise<UserAchievementWithDetails[]> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('user_achievements')
    .select('*, achievement:achievement_definitions(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
    .limit(limit)

  return (data || []).map(ua => ({
    ...ua,
    achievement: ua.achievement as AchievementDefinition,
  }))
}
