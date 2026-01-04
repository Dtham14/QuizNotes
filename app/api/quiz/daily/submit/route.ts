import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import { processQuizCompletion, calculateQuizXP, awardXP, XP_REWARDS } from '@/lib/gamification'
import type { DailyQuiz, DailyQuizAttempt } from '@/lib/types/database'

// Create admin client for bypassing RLS
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

// Generate or retrieve session ID for anonymous users
function getOrCreateSessionId(request: NextRequest): string {
  const existingSessionId = request.cookies.get('quiz_session_id')?.value
  if (existingSessionId) {
    return existingSessionId
  }
  return 'anon_' + crypto.randomUUID()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const user = await getSession() // May be null for anonymous users

    const { dailyQuizId, score, totalQuestions, answers, timeTaken } = await request.json()

    // Validate required fields
    if (!dailyQuizId || score === undefined || !totalQuestions || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('id', dailyQuizId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    let sessionId: string | null = null

    // Check if user/session already completed this quiz
    if (user) {
      // Logged-in user: check for existing attempt
      const { data: existing } = await supabase
        .from('daily_quiz_attempts')
        .select('id')
        .eq('daily_quiz_id', dailyQuizId)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'You have already completed today\'s quiz' },
          { status: 400 }
        )
      }
    } else {
      // Anonymous user: get/create session ID
      sessionId = getOrCreateSessionId(request)

      const { data: existing } = await supabase
        .from('daily_quiz_attempts')
        .select('id')
        .eq('daily_quiz_id', dailyQuizId)
        .eq('session_id', sessionId)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'You have already completed today\'s quiz' },
          { status: 400 }
        )
      }
    }

    // Save the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('daily_quiz_attempts')
      .insert({
        daily_quiz_id: dailyQuizId,
        user_id: user?.id || null,
        session_id: !user ? sessionId : null,
        score,
        total_questions: totalQuestions,
        answers,
        time_taken_seconds: timeTaken || null,
      })
      .select()
      .single()

    if (attemptError || !attempt) {
      console.error('Error saving attempt:', attemptError)
      return NextResponse.json(
        { error: 'Failed to save quiz attempt' },
        { status: 500 }
      )
    }

    // Award XP for logged-in users (2x multiplier)
    let gamificationResult = null
    let totalXpAwarded = 0

    if (user) {
      try {
        // First, process regular quiz completion (XP, streaks, achievements)
        gamificationResult = await processQuizCompletion(
          user.id,
          score,
          totalQuestions,
          attempt.id
        )

        // Now award bonus XP (equal to the base XP to make it 2x total)
        // The base XP was already awarded by processQuizCompletion
        const baseXP = gamificationResult.xp.totalXpAwarded
        const bonusXP = baseXP // Award equal bonus to double the total

        // Award the bonus XP
        await awardXP(user.id, bonusXP, 'daily_quiz_bonus', attempt.id)

        // Calculate total XP (base + bonus = 2x)
        totalXpAwarded = baseXP + bonusXP

        // Update the XP result to reflect the bonus
        gamificationResult.xp.totalXpAwarded = totalXpAwarded
        gamificationResult.xp.newTotalXp += bonusXP
        gamificationResult.xp.breakdown.push({
          reason: 'daily_quiz_bonus',
          amount: bonusXP,
        })
      } catch (gamificationError) {
        console.error('Gamification processing error:', gamificationError)
      }
    }

    // Prepare response
    const response = NextResponse.json({
      success: true,
      score,
      totalQuestions,
      xpAwarded: totalXpAwarded,
      gamification: gamificationResult
        ? {
            xpAwarded: gamificationResult.xp.totalXpAwarded,
            newTotalXp: gamificationResult.xp.newTotalXp,
            leveledUp: gamificationResult.xp.leveledUp,
            newLevel: gamificationResult.xp.newLevel,
            xpBreakdown: gamificationResult.xp.breakdown,
            streak: {
              current: gamificationResult.streak.newStreak,
              longest: gamificationResult.streak.longestStreak,
              maintained: gamificationResult.streak.streakMaintained,
            },
            newAchievements: gamificationResult.achievements.map((a) => ({
              id: a.achievement.id,
              name: a.achievement.name,
              description: a.achievement.description,
              icon: a.achievement.icon,
              xpReward: a.xpAwarded,
            })),
          }
        : null,
    })

    // Set session cookie for anonymous users
    if (!user && sessionId) {
      response.cookies.set('quiz_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Daily quiz submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
