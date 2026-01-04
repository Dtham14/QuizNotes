-- Phase 3: Daily Quiz Leaderboards, Achievements, and Streaks

-- Table: daily_quiz_leaderboard
-- Tracks weekly and all-time stats for daily quiz performance
CREATE TABLE IF NOT EXISTS public.daily_quiz_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'all_time')),
  period_start DATE,
  period_end DATE,
  total_score INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  perfect_days INTEGER DEFAULT 0, -- Days with score of 10/10
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- Index for leaderboard queries
CREATE INDEX idx_daily_leaderboard_period ON public.daily_quiz_leaderboard(period_type, period_start, total_score DESC);
CREATE INDEX idx_daily_leaderboard_user ON public.daily_quiz_leaderboard(user_id, period_type);

-- Table: daily_quiz_templates
-- Pre-made templates for Connections and Wordle quizzes
CREATE TABLE IF NOT EXISTS public.daily_quiz_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL CHECK (template_type IN ('connections', 'wordle')),
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  template_data JSONB NOT NULL,
  used_count INTEGER DEFAULT 0,
  last_used_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for template selection
CREATE INDEX idx_templates_type ON public.daily_quiz_templates(template_type, used_count);

-- Add daily quiz streak columns to user_gamification
ALTER TABLE public.user_gamification
  ADD COLUMN IF NOT EXISTS daily_quiz_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_quiz_longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_daily_quiz_date DATE;

-- RLS Policies for daily_quiz_leaderboard
ALTER TABLE public.daily_quiz_leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can read leaderboard
CREATE POLICY "Anyone can read leaderboard"
  ON public.daily_quiz_leaderboard FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can update their own stats (via service role in API)
-- No INSERT policy for users - only service role can insert

-- RLS Policies for daily_quiz_templates
ALTER TABLE public.daily_quiz_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can read templates (they're used by edge function)
CREATE POLICY "Admins can read templates"
  ON public.daily_quiz_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert new daily quiz achievements
INSERT INTO public.achievement_definitions (id, name, description, icon, category, xp_reward, requirement_type, requirement_value, sort_order, is_hidden)
VALUES
  -- Daily Quiz Achievements
  ('daily_quiz_3', 'Daily Starter', 'Complete 3 daily quizzes', 'star', 'special', 25, 'count', 3, 100, false),
  ('daily_quiz_7_streak', 'Weekly Warrior', 'Complete 7 daily quizzes in a row', 'flame', 'streak', 50, 'streak', 7, 101, false),
  ('daily_quiz_perfect_7', 'Perfect Week', 'Get perfect scores on 7 consecutive daily quizzes', 'trophy', 'special', 100, 'special', 7, 102, false),
  ('connections_master', 'Connections Master', 'Solve a Connections quiz with no mistakes', 'check-circle', 'special', 50, 'special', 1, 103, false),
  ('wordle_wizard', 'Wordle Wizard', 'Guess a Wordle answer in 3 tries or less', 'zap', 'special', 50, 'special', 1, 104, false)
ON CONFLICT (id) DO NOTHING;

-- Function to update daily quiz leaderboard
CREATE OR REPLACE FUNCTION update_daily_quiz_leaderboard(
  p_user_id UUID,
  p_score INTEGER,
  p_is_perfect BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
BEGIN
  -- Calculate current week (Monday to Sunday)
  v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  v_week_end := (v_week_start + INTERVAL '6 days')::DATE;

  -- Update weekly leaderboard
  INSERT INTO public.daily_quiz_leaderboard (
    user_id, period_type, period_start, period_end, total_score, quizzes_completed, perfect_days
  )
  VALUES (
    p_user_id, 'weekly', v_week_start, v_week_end, p_score, 1, CASE WHEN p_is_perfect THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, period_type, period_start)
  DO UPDATE SET
    total_score = daily_quiz_leaderboard.total_score + p_score,
    quizzes_completed = daily_quiz_leaderboard.quizzes_completed + 1,
    perfect_days = daily_quiz_leaderboard.perfect_days + CASE WHEN p_is_perfect THEN 1 ELSE 0 END,
    updated_at = NOW();

  -- Update all-time leaderboard
  INSERT INTO public.daily_quiz_leaderboard (
    user_id, period_type, period_start, period_end, total_score, quizzes_completed, perfect_days
  )
  VALUES (
    p_user_id, 'all_time', NULL, NULL, p_score, 1, CASE WHEN p_is_perfect THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, period_type, period_start)
  DO UPDATE SET
    total_score = daily_quiz_leaderboard.total_score + p_score,
    quizzes_completed = daily_quiz_leaderboard.quizzes_completed + 1,
    perfect_days = daily_quiz_leaderboard.perfect_days + CASE WHEN p_is_perfect THEN 1 ELSE 0 END,
    updated_at = NOW();
END;
$$;

-- Function to update daily quiz streak
CREATE OR REPLACE FUNCTION update_daily_quiz_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  -- Get current streak data
  SELECT last_daily_quiz_date, daily_quiz_streak, daily_quiz_longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.user_gamification
  WHERE user_id = p_user_id;

  -- Calculate new streak
  IF v_last_date IS NULL THEN
    -- First daily quiz ever
    v_new_streak := 1;
  ELSIF v_last_date = CURRENT_DATE THEN
    -- Already completed today (shouldn't happen due to unique constraint, but just in case)
    v_new_streak := v_current_streak;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken
    v_new_streak := 1;
  END IF;

  -- Update user_gamification
  UPDATE public.user_gamification
  SET
    daily_quiz_streak = v_new_streak,
    daily_quiz_longest_streak = GREATEST(v_longest_streak, v_new_streak),
    last_daily_quiz_date = CURRENT_DATE
  WHERE user_id = p_user_id;
END;
$$;

-- Comments
COMMENT ON TABLE public.daily_quiz_leaderboard IS 'Leaderboard stats for daily quizzes (weekly and all-time)';
COMMENT ON TABLE public.daily_quiz_templates IS 'Pre-made templates for Connections and Wordle quizzes to rotate through';
COMMENT ON FUNCTION update_daily_quiz_leaderboard IS 'Updates user position on weekly and all-time leaderboards';
COMMENT ON FUNCTION update_daily_quiz_streak IS 'Updates user daily quiz streak and longest streak';
