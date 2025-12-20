import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { UserGamification, LevelThreshold } from '@/lib/types/database'

// XP reward constants
export const XP_REWARDS = {
  QUIZ_COMPLETE: 10,
  SCORE_70_89: 5,
  SCORE_90_99: 10,
  PERFECT_SCORE: 25,
  STREAK_BONUS_PER_DAY: 2, // +2 XP per streak day, max +20
  STREAK_BONUS_MAX: 20,
  DAILY_GOAL_MET: 15,
  FIRST_QUIZ_OF_DAY: 5,
  ACHIEVEMENT_BONUS: 0, // Achievements have their own XP rewards
} as const

export type XPReason =
  | 'quiz_complete'
  | 'score_bonus'
  | 'perfect_score'
  | 'streak_bonus'
  | 'daily_goal'
  | 'first_quiz_of_day'
  | 'achievement'

export interface XPAwardResult {
  totalXpAwarded: number
  newTotalXp: number
  previousLevel: number
  newLevel: number
  leveledUp: boolean
  breakdown: { reason: XPReason; amount: number }[]
}

export async function calculateQuizXP(
  score: number,
  totalQuestions: number,
  currentStreak: number,
  isFirstQuizOfDay: boolean,
  dailyGoalJustMet: boolean
): Promise<{ total: number; breakdown: { reason: XPReason; amount: number }[] }> {
  const percentage = (score / totalQuestions) * 100
  const breakdown: { reason: XPReason; amount: number }[] = []

  // Base XP for completion
  breakdown.push({ reason: 'quiz_complete', amount: XP_REWARDS.QUIZ_COMPLETE })

  // Score bonuses
  if (percentage === 100) {
    breakdown.push({ reason: 'perfect_score', amount: XP_REWARDS.PERFECT_SCORE })
  } else if (percentage >= 90) {
    breakdown.push({ reason: 'score_bonus', amount: XP_REWARDS.SCORE_90_99 })
  } else if (percentage >= 70) {
    breakdown.push({ reason: 'score_bonus', amount: XP_REWARDS.SCORE_70_89 })
  }

  // Streak bonus
  if (currentStreak > 0) {
    const streakBonus = Math.min(
      currentStreak * XP_REWARDS.STREAK_BONUS_PER_DAY,
      XP_REWARDS.STREAK_BONUS_MAX
    )
    if (streakBonus > 0) {
      breakdown.push({ reason: 'streak_bonus', amount: streakBonus })
    }
  }

  // First quiz of the day bonus
  if (isFirstQuizOfDay) {
    breakdown.push({ reason: 'first_quiz_of_day', amount: XP_REWARDS.FIRST_QUIZ_OF_DAY })
  }

  // Daily goal bonus
  if (dailyGoalJustMet) {
    breakdown.push({ reason: 'daily_goal', amount: XP_REWARDS.DAILY_GOAL_MET })
  }

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0)
  return { total, breakdown }
}

export async function awardXP(
  userId: string,
  amount: number,
  reason: XPReason,
  quizAttemptId?: string
): Promise<void> {
  const serviceClient = createServiceClient()

  // Record the XP transaction
  await serviceClient.from('xp_transactions').insert({
    user_id: userId,
    amount,
    reason,
    quiz_attempt_id: quizAttemptId || null,
  })

  // Update user's total XP
  const { data: gamification } = await serviceClient
    .from('user_gamification')
    .select('total_xp, current_level')
    .eq('user_id', userId)
    .single()

  if (gamification) {
    const newTotalXp = gamification.total_xp + amount
    const newLevel = await calculateLevel(newTotalXp)

    await serviceClient
      .from('user_gamification')
      .update({
        total_xp: newTotalXp,
        current_level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }
}

export async function awardQuizXP(
  userId: string,
  score: number,
  totalQuestions: number,
  quizAttemptId: string
): Promise<XPAwardResult> {
  const serviceClient = createServiceClient()

  // Get current gamification state
  const { data: gamification } = await serviceClient
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!gamification) {
    throw new Error('User gamification record not found')
  }

  const today = new Date().toISOString().split('T')[0]
  const lastActivityDate = gamification.last_activity_date
  const isFirstQuizOfDay = lastActivityDate !== today
  const quizzesToday = isFirstQuizOfDay ? 1 : gamification.quizzes_today + 1
  const dailyGoalJustMet = !gamification.daily_goal_met && quizzesToday >= gamification.daily_goal
  const isPerfectScore = score === totalQuestions

  // Calculate XP
  const { total, breakdown } = await calculateQuizXP(
    score,
    totalQuestions,
    gamification.current_streak,
    isFirstQuizOfDay,
    dailyGoalJustMet
  )

  // Record XP transactions
  for (const item of breakdown) {
    await serviceClient.from('xp_transactions').insert({
      user_id: userId,
      amount: item.amount,
      reason: item.reason,
      quiz_attempt_id: quizAttemptId,
    })
  }

  // Calculate new totals
  const newTotalXp = gamification.total_xp + total
  const newLevel = await calculateLevel(newTotalXp)
  const leveledUp = newLevel > gamification.current_level

  // Update gamification record
  await serviceClient
    .from('user_gamification')
    .update({
      total_xp: newTotalXp,
      current_level: newLevel,
      quizzes_today: quizzesToday,
      daily_goal_met: gamification.daily_goal_met || dailyGoalJustMet,
      last_activity_date: today,
      total_quizzes_completed: gamification.total_quizzes_completed + 1,
      total_perfect_scores: isPerfectScore
        ? gamification.total_perfect_scores + 1
        : gamification.total_perfect_scores,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Update leaderboard entries
  await updateLeaderboardEntry(userId, total, isPerfectScore)

  return {
    totalXpAwarded: total,
    newTotalXp,
    previousLevel: gamification.current_level,
    newLevel,
    leveledUp,
    breakdown,
  }
}

async function calculateLevel(xp: number): Promise<number> {
  const supabase = await createClient()

  const { data: threshold } = await supabase
    .from('level_thresholds')
    .select('level')
    .lte('xp_required', xp)
    .order('level', { ascending: false })
    .limit(1)
    .single()

  return threshold?.level || 1
}

async function updateLeaderboardEntry(
  userId: string,
  xpEarned: number,
  isPerfectScore: boolean
): Promise<void> {
  const serviceClient = createServiceClient()

  // Get current weekly and monthly periods
  const { data: weeklyPeriod } = await serviceClient
    .rpc('get_current_leaderboard_period', { p_period_type: 'weekly' })

  const { data: monthlyPeriod } = await serviceClient
    .rpc('get_current_leaderboard_period', { p_period_type: 'monthly' })

  const periods = [weeklyPeriod, monthlyPeriod].filter(Boolean)

  for (const periodId of periods) {
    // Try to update existing entry
    const { data: existing } = await serviceClient
      .from('leaderboard_entries')
      .select('id, xp_earned, quizzes_completed, perfect_scores')
      .eq('period_id', periodId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      await serviceClient
        .from('leaderboard_entries')
        .update({
          xp_earned: existing.xp_earned + xpEarned,
          quizzes_completed: existing.quizzes_completed + 1,
          perfect_scores: isPerfectScore
            ? existing.perfect_scores + 1
            : existing.perfect_scores,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await serviceClient.from('leaderboard_entries').insert({
        period_id: periodId,
        user_id: userId,
        xp_earned: xpEarned,
        quizzes_completed: 1,
        perfect_scores: isPerfectScore ? 1 : 0,
      })
    }
  }
}

export async function getLevelInfo(level: number): Promise<LevelThreshold | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('level_thresholds')
    .select('*')
    .eq('level', level)
    .single()

  return data
}

export async function getNextLevelXP(currentLevel: number): Promise<number | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('level_thresholds')
    .select('xp_required')
    .eq('level', currentLevel + 1)
    .single()

  return data?.xp_required || null
}

export async function getXPProgress(
  totalXp: number,
  currentLevel: number
): Promise<{ currentLevelXp: number; nextLevelXp: number | null; progress: number }> {
  const supabase = await createClient()

  const { data: currentThreshold } = await supabase
    .from('level_thresholds')
    .select('xp_required')
    .eq('level', currentLevel)
    .single()

  const { data: nextThreshold } = await supabase
    .from('level_thresholds')
    .select('xp_required')
    .eq('level', currentLevel + 1)
    .single()

  const currentLevelXp = currentThreshold?.xp_required || 0
  const nextLevelXp = nextThreshold?.xp_required || null

  let progress = 100 // Max level
  if (nextLevelXp) {
    const xpIntoLevel = totalXp - currentLevelXp
    const xpNeeded = nextLevelXp - currentLevelXp
    progress = Math.min(100, Math.floor((xpIntoLevel / xpNeeded) * 100))
  }

  return { currentLevelXp, nextLevelXp, progress }
}
