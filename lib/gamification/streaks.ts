import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { UserGamification } from '@/lib/types/database'

export interface StreakUpdateResult {
  previousStreak: number
  newStreak: number
  longestStreak: number
  streakBroken: boolean
  streakMaintained: boolean
  streakStarted: boolean
}

export async function updateStreak(userId: string): Promise<StreakUpdateResult> {
  const serviceClient = createServiceClient()

  const { data: gamification } = await serviceClient
    .from('user_gamification')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single()

  if (!gamification) {
    throw new Error('User gamification record not found')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayStr = today.toISOString().split('T')[0]
  const lastActivityDate = gamification.last_activity_date

  let newStreak = gamification.current_streak
  let streakBroken = false
  let streakMaintained = false
  let streakStarted = false

  if (!lastActivityDate) {
    // First ever activity
    newStreak = 1
    streakStarted = true
  } else if (lastActivityDate === todayStr) {
    // Already active today, streak unchanged
    streakMaintained = true
  } else {
    // Check if last activity was yesterday
    const lastDate = new Date(lastActivityDate)
    lastDate.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 1) {
      // Consecutive day - extend streak
      newStreak = gamification.current_streak + 1
      streakMaintained = true
    } else if (daysDiff > 1) {
      // Streak broken
      streakBroken = gamification.current_streak > 0
      newStreak = 1
      streakStarted = true
    }
  }

  const longestStreak = Math.max(newStreak, gamification.longest_streak)

  // Update the gamification record
  await serviceClient
    .from('user_gamification')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: todayStr,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return {
    previousStreak: gamification.current_streak,
    newStreak,
    longestStreak,
    streakBroken,
    streakMaintained,
    streakStarted,
  }
}

export async function getStreakStatus(userId: string): Promise<{
  currentStreak: number
  longestStreak: number
  isActiveToday: boolean
  willExpireToday: boolean
}> {
  const supabase = await createClient()

  const { data: gamification } = await supabase
    .from('user_gamification')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single()

  if (!gamification) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActiveToday: false,
      willExpireToday: false,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const isActiveToday = gamification.last_activity_date === todayStr

  // Check if streak will expire if user doesn't play today
  let willExpireToday = false
  if (gamification.last_activity_date && !isActiveToday) {
    const lastDate = new Date(gamification.last_activity_date)
    lastDate.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // If last activity was yesterday, streak will expire if they don't play today
    willExpireToday = lastDate.getTime() === yesterday.getTime() && gamification.current_streak > 0
  }

  return {
    currentStreak: gamification.current_streak,
    longestStreak: gamification.longest_streak,
    isActiveToday,
    willExpireToday,
  }
}

export async function resetDailyStats(): Promise<void> {
  // This function should be called by a scheduled job at midnight
  // It resets quizzes_today and daily_goal_met for all users
  const serviceClient = createServiceClient()

  await serviceClient
    .from('user_gamification')
    .update({
      quizzes_today: 0,
      daily_goal_met: false,
      updated_at: new Date().toISOString(),
    })
    .neq('user_id', '') // Update all records
}

export async function getDailyProgress(userId: string): Promise<{
  quizzesToday: number
  dailyGoal: number
  goalMet: boolean
  progress: number
}> {
  const supabase = await createClient()

  const { data: gamification } = await supabase
    .from('user_gamification')
    .select('quizzes_today, daily_goal, daily_goal_met, last_activity_date')
    .eq('user_id', userId)
    .single()

  if (!gamification) {
    return {
      quizzesToday: 0,
      dailyGoal: 3,
      goalMet: false,
      progress: 0,
    }
  }

  // Check if we need to reset (different day)
  const today = new Date().toISOString().split('T')[0]
  if (gamification.last_activity_date !== today) {
    return {
      quizzesToday: 0,
      dailyGoal: gamification.daily_goal,
      goalMet: false,
      progress: 0,
    }
  }

  const progress = Math.min(100, Math.floor((gamification.quizzes_today / gamification.daily_goal) * 100))

  return {
    quizzesToday: gamification.quizzes_today,
    dailyGoal: gamification.daily_goal,
    goalMet: gamification.daily_goal_met,
    progress,
  }
}

export async function updateDailyGoal(userId: string, newGoal: number): Promise<void> {
  if (newGoal < 1 || newGoal > 20) {
    throw new Error('Daily goal must be between 1 and 20')
  }

  const serviceClient = createServiceClient()

  await serviceClient
    .from('user_gamification')
    .update({
      daily_goal: newGoal,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}
