-- QuizNotes Gamification Schema
-- Run this in Supabase SQL Editor after 002_anonymous_quiz_attempts.sql

-- ============================================
-- 1. LEVEL THRESHOLDS TABLE
-- ============================================
CREATE TABLE public.level_thresholds (
  level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  xp_required INTEGER NOT NULL,
  color TEXT NOT NULL -- Tailwind color class for UI
);

-- Pre-seed level thresholds (15 levels)
INSERT INTO public.level_thresholds (level, name, xp_required, color) VALUES
  (1, 'Beginner', 0, 'gray'),
  (2, 'Novice', 100, 'gray'),
  (3, 'Apprentice', 250, 'green'),
  (4, 'Student', 500, 'green'),
  (5, 'Intermediate', 850, 'blue'),
  (6, 'Skilled', 1300, 'blue'),
  (7, 'Advanced', 1900, 'purple'),
  (8, 'Expert', 2700, 'purple'),
  (9, 'Master', 3800, 'orange'),
  (10, 'Grandmaster', 5200, 'orange'),
  (11, 'Virtuoso', 7000, 'red'),
  (12, 'Maestro', 9500, 'red'),
  (13, 'Prodigy', 13000, 'pink'),
  (14, 'Genius', 18000, 'pink'),
  (15, 'Legend', 25000, 'yellow');

-- ============================================
-- 2. USER GAMIFICATION TABLE
-- ============================================
CREATE TABLE public.user_gamification (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  quizzes_today INTEGER DEFAULT 0,
  daily_goal INTEGER DEFAULT 3, -- Configurable daily goal
  daily_goal_met BOOLEAN DEFAULT FALSE,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_perfect_scores INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_gamification_xp ON public.user_gamification(total_xp DESC);
CREATE INDEX idx_user_gamification_streak ON public.user_gamification(current_streak DESC);

-- ============================================
-- 3. XP TRANSACTIONS TABLE (History)
-- ============================================
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'quiz_complete', 'perfect_score', 'streak_bonus', 'daily_goal', 'first_quiz_of_day', 'achievement'
  quiz_attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_xp_transactions_user ON public.xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_date ON public.xp_transactions(created_at);

-- ============================================
-- 4. ACHIEVEMENT DEFINITIONS TABLE
-- ============================================
CREATE TABLE public.achievement_definitions (
  id TEXT PRIMARY KEY, -- e.g., 'first_quiz', 'streak_7', 'perfect_10'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Icon identifier for UI
  category TEXT NOT NULL CHECK (category IN ('quiz', 'streak', 'score', 'milestone', 'special')),
  xp_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL, -- 'count', 'streak', 'score', 'special'
  requirement_value INTEGER, -- The threshold to earn this achievement
  is_hidden BOOLEAN DEFAULT FALSE, -- Hidden until earned
  sort_order INTEGER DEFAULT 0
);

-- Pre-seed achievements (20+ badges)
INSERT INTO public.achievement_definitions (id, name, description, icon, category, xp_reward, requirement_type, requirement_value, sort_order) VALUES
  -- Quiz completion achievements
  ('first_quiz', 'First Steps', 'Complete your first quiz', 'rocket', 'quiz', 25, 'count', 1, 1),
  ('quiz_10', 'Getting Started', 'Complete 10 quizzes', 'target', 'quiz', 50, 'count', 10, 2),
  ('quiz_25', 'Quiz Enthusiast', 'Complete 25 quizzes', 'zap', 'quiz', 75, 'count', 25, 3),
  ('quiz_50', 'Quiz Master', 'Complete 50 quizzes', 'award', 'quiz', 100, 'count', 50, 4),
  ('quiz_100', 'Quiz Champion', 'Complete 100 quizzes', 'trophy', 'quiz', 200, 'count', 100, 5),
  ('quiz_250', 'Quiz Legend', 'Complete 250 quizzes', 'crown', 'quiz', 500, 'count', 250, 6),

  -- Streak achievements
  ('streak_3', 'On a Roll', 'Maintain a 3-day streak', 'flame', 'streak', 30, 'streak', 3, 10),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'flame', 'streak', 75, 'streak', 7, 11),
  ('streak_14', 'Fortnight Fighter', 'Maintain a 14-day streak', 'flame', 'streak', 150, 'streak', 14, 12),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'flame', 'streak', 300, 'streak', 30, 13),
  ('streak_60', 'Dedicated Learner', 'Maintain a 60-day streak', 'flame', 'streak', 500, 'streak', 60, 14),
  ('streak_100', 'Centurion', 'Maintain a 100-day streak', 'flame', 'streak', 1000, 'streak', 100, 15),

  -- Perfect score achievements
  ('perfect_1', 'Perfectionist', 'Get your first perfect score', 'star', 'score', 25, 'score', 1, 20),
  ('perfect_5', 'Accuracy Expert', 'Get 5 perfect scores', 'star', 'score', 50, 'score', 5, 21),
  ('perfect_10', 'Flawless Player', 'Get 10 perfect scores', 'star', 'score', 100, 'score', 10, 22),
  ('perfect_25', 'Precision Master', 'Get 25 perfect scores', 'star', 'score', 200, 'score', 25, 23),
  ('perfect_50', 'Perfect Legend', 'Get 50 perfect scores', 'star', 'score', 400, 'score', 50, 24),

  -- Level milestones
  ('level_5', 'Rising Star', 'Reach level 5', 'trending-up', 'milestone', 50, 'special', 5, 30),
  ('level_10', 'High Achiever', 'Reach level 10', 'trending-up', 'milestone', 150, 'special', 10, 31),
  ('level_15', 'Legendary Status', 'Reach level 15', 'trending-up', 'milestone', 500, 'special', 15, 32),

  -- XP milestones
  ('xp_1000', 'XP Collector', 'Earn 1,000 total XP', 'coins', 'milestone', 50, 'special', 1000, 40),
  ('xp_5000', 'XP Hoarder', 'Earn 5,000 total XP', 'coins', 'milestone', 100, 'special', 5000, 41),
  ('xp_10000', 'XP Tycoon', 'Earn 10,000 total XP', 'coins', 'milestone', 200, 'special', 10000, 42),

  -- Special achievements
  ('daily_goal_7', 'Consistent', 'Meet your daily goal 7 days in a row', 'check-circle', 'special', 100, 'special', 7, 50),
  ('early_bird', 'Early Bird', 'Complete a quiz before 8 AM', 'sunrise', 'special', 25, 'special', 1, 51),
  ('night_owl', 'Night Owl', 'Complete a quiz after 10 PM', 'moon', 'special', 25, 'special', 1, 52);

-- ============================================
-- 5. USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_date ON public.user_achievements(earned_at DESC);

-- ============================================
-- 6. LEADERBOARD PERIODS TABLE
-- ============================================
CREATE TABLE public.leaderboard_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_type, start_date)
);

CREATE INDEX idx_leaderboard_periods_active ON public.leaderboard_periods(is_active, period_type);

-- ============================================
-- 7. LEADERBOARD ENTRIES TABLE
-- ============================================
CREATE TABLE public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES public.leaderboard_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_earned INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  perfect_scores INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_id, user_id)
);

CREATE INDEX idx_leaderboard_entries_period ON public.leaderboard_entries(period_id);
CREATE INDEX idx_leaderboard_entries_xp ON public.leaderboard_entries(period_id, xp_earned DESC);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION get_level_from_xp(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  result_level INTEGER;
BEGIN
  SELECT level INTO result_level
  FROM public.level_thresholds
  WHERE xp_required <= xp
  ORDER BY level DESC
  LIMIT 1;

  RETURN COALESCE(result_level, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get XP required for next level
CREATE OR REPLACE FUNCTION get_xp_for_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
  next_xp INTEGER;
BEGIN
  SELECT xp_required INTO next_xp
  FROM public.level_thresholds
  WHERE level = current_level + 1;

  RETURN next_xp; -- Returns NULL if at max level
END;
$$ LANGUAGE plpgsql;

-- Function to initialize gamification for a user
CREATE OR REPLACE FUNCTION initialize_user_gamification(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_gamification (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create current leaderboard period
CREATE OR REPLACE FUNCTION get_current_leaderboard_period(p_period_type TEXT)
RETURNS UUID AS $$
DECLARE
  v_period_id UUID;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Calculate period dates
  IF p_period_type = 'weekly' THEN
    v_start_date := date_trunc('week', CURRENT_DATE)::DATE;
    v_end_date := v_start_date + INTERVAL '6 days';
  ELSE -- monthly
    v_start_date := date_trunc('month', CURRENT_DATE)::DATE;
    v_end_date := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  END IF;

  -- Try to get existing period
  SELECT id INTO v_period_id
  FROM public.leaderboard_periods
  WHERE period_type = p_period_type AND start_date = v_start_date;

  -- Create if doesn't exist
  IF v_period_id IS NULL THEN
    -- Mark old periods as inactive
    UPDATE public.leaderboard_periods
    SET is_active = FALSE
    WHERE period_type = p_period_type AND is_active = TRUE;

    -- Create new period
    INSERT INTO public.leaderboard_periods (period_type, start_date, end_date, is_active)
    VALUES (p_period_type, v_start_date, v_end_date, TRUE)
    RETURNING id INTO v_period_id;
  END IF;

  RETURN v_period_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. UPDATE HANDLE_NEW_USER TO INIT GAMIFICATION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );

  -- Initialize gamification
  INSERT INTO public.user_gamification (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.level_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Level thresholds are public read
CREATE POLICY "Anyone can view level thresholds"
  ON public.level_thresholds FOR SELECT
  USING (true);

-- Achievement definitions are public read
CREATE POLICY "Anyone can view achievements"
  ON public.achievement_definitions FOR SELECT
  USING (true);

-- Leaderboard periods are public read
CREATE POLICY "Anyone can view leaderboard periods"
  ON public.leaderboard_periods FOR SELECT
  USING (true);

-- User gamification - users can view/update own
CREATE POLICY "Users can view own gamification"
  ON public.user_gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification"
  ON public.user_gamification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert gamification"
  ON public.user_gamification FOR INSERT
  WITH CHECK (true);

-- XP transactions - users can view own
CREATE POLICY "Users can view own XP transactions"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert XP transactions"
  ON public.xp_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User achievements - users can view own, anyone can see others (for leaderboard)
CREATE POLICY "Anyone can view user achievements"
  ON public.user_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can insert achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Leaderboard entries - public read for rankings
CREATE POLICY "Anyone can view leaderboard entries"
  ON public.leaderboard_entries FOR SELECT
  USING (true);

CREATE POLICY "System can manage leaderboard entries"
  ON public.leaderboard_entries FOR ALL
  USING (auth.uid() = user_id);

-- Teachers can view gamification for students in their classes
CREATE POLICY "Teachers can view students gamification"
  ON public.user_gamification FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE ce.student_id = user_gamification.user_id
      AND c.teacher_id = auth.uid()
    )
  );

-- ============================================
-- 11. INITIALIZE GAMIFICATION FOR EXISTING USERS
-- ============================================
INSERT INTO public.user_gamification (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_gamification)
ON CONFLICT (user_id) DO NOTHING;
