// Main exports for gamification system

// XP System
export {
  XP_REWARDS,
  calculateQuizXP,
  awardXP,
  awardQuizXP,
  getLevelInfo,
  getNextLevelXP,
  getXPProgress,
  type XPReason,
  type XPAwardResult,
} from './xp'

// Streak System
export {
  updateStreak,
  getStreakStatus,
  getDailyProgress,
  updateDailyGoal,
  resetDailyStats,
  type StreakUpdateResult,
} from './streaks'

// Achievements System
export {
  checkAndAwardAchievements,
  checkTimeBasedAchievements,
  getUserAchievements,
  getRecentAchievements,
  getConsecutiveDailyGoalStreak,
  type NewAchievement,
} from './achievements'

// Leaderboard System
export {
  getLeaderboard,
  getClassLeaderboard,
  getUserLeaderboardStats,
  getLeaderboardPeriodInfo,
  type LeaderboardType,
  type LeaderboardData,
} from './leaderboard'

// Types re-exports
export type {
  UserGamification,
  LevelThreshold,
  XPTransaction,
  AchievementDefinition,
  UserAchievement,
  UserAchievementWithDetails,
  LeaderboardPeriod,
  LeaderboardEntry,
  LeaderboardEntryWithUser,
  GamificationStats,
} from '@/lib/types/database'

// Utility functions
import { createServiceClient } from '@/lib/supabase/service'
import { getXPProgress, getLevelInfo, getNextLevelXP } from './xp'
import { getRecentAchievements, getConsecutiveDailyGoalStreak } from './achievements'
import type { GamificationStats } from '@/lib/types/database'

export async function getGamificationStats(userId: string): Promise<GamificationStats | null> {
  const serviceClient = createServiceClient()

  const { data: gamification, error } = await serviceClient
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !gamification) {
    console.error('Error fetching gamification stats:', error)
    return null
  }

  const levelInfo = await getLevelInfo(gamification.current_level)
  const nextLevelXp = await getNextLevelXP(gamification.current_level)
  const { progress } = await getXPProgress(gamification.total_xp, gamification.current_level)
  const recentAchievements = await getRecentAchievements(userId, 3)
  const dailyGoalStreak = await getConsecutiveDailyGoalStreak(userId)

  return {
    ...gamification,
    level_info: levelInfo!,
    next_level_xp: nextLevelXp,
    xp_progress: progress,
    recent_achievements: recentAchievements,
    daily_goal_streak: dailyGoalStreak,
  }
}

// Ensure user has a gamification record (creates one if missing)
export async function ensureUserGamification(userId: string): Promise<void> {
  const serviceClient = createServiceClient()

  // Check if record exists
  const { data: existing } = await serviceClient
    .from('user_gamification')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    // Create the gamification record with defaults
    await serviceClient.from('user_gamification').insert({
      user_id: userId,
      total_xp: 0,
      current_level: 1,
      current_streak: 0,
      longest_streak: 0,
      quizzes_today: 0,
      daily_goal: 3,
      daily_goal_met: false,
      total_quizzes_completed: 0,
      total_perfect_scores: 0,
    })
  }
}

// Function to process quiz completion gamification
export async function processQuizCompletion(
  userId: string,
  score: number,
  totalQuestions: number,
  quizAttemptId: string
): Promise<{
  xp: import('./xp').XPAwardResult
  streak: import('./streaks').StreakUpdateResult
  achievements: import('./achievements').NewAchievement[]
}> {
  // Ensure user has gamification record before processing
  await ensureUserGamification(userId)

  const { awardQuizXP } = await import('./xp')
  const { updateStreak } = await import('./streaks')
  const { checkAndAwardAchievements, checkTimeBasedAchievements } = await import('./achievements')

  // Award XP (this also updates leaderboard)
  const xpResult = await awardQuizXP(userId, score, totalQuestions, quizAttemptId)

  // Update streak
  const streakResult = await updateStreak(userId)

  // Check for new achievements
  const achievementResults = await checkAndAwardAchievements(userId)
  const timeAchievements = await checkTimeBasedAchievements(userId)
  const allAchievements = [...achievementResults, ...timeAchievements]

  return {
    xp: xpResult,
    streak: streakResult,
    achievements: allAchievements,
  }
}
