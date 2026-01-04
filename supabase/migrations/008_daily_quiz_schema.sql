-- Daily Quiz Tables
-- Create tables for daily music theory quiz feature with rotating formats

-- Table: daily_quizzes
-- Stores one quiz per day (same for all users)
CREATE TABLE IF NOT EXISTS public.daily_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_date DATE NOT NULL UNIQUE,
  quiz_format TEXT NOT NULL CHECK (quiz_format IN ('standard', 'connections', 'wordle')),
  quiz_type TEXT, -- For standard format: 'noteIdentification', 'intervals', etc. NULL for other formats
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Pre-generated questions stored as JSON array
  metadata JSONB, -- Additional format-specific data (connections groups, wordle config, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date lookups
CREATE INDEX idx_daily_quizzes_date ON public.daily_quizzes(quiz_date DESC);

-- Table: daily_quiz_attempts
-- Tracks user completion (one attempt per user/session per day)
CREATE TABLE IF NOT EXISTS public.daily_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_quiz_id UUID NOT NULL REFERENCES public.daily_quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for anonymous users
  session_id TEXT, -- For anonymous users (from sessionStorage/cookie)
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB, -- User's answers stored as array
  time_taken_seconds INTEGER, -- Optional: track completion time
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure one attempt per user per quiz
CREATE UNIQUE INDEX idx_daily_attempts_user_quiz ON public.daily_quiz_attempts(daily_quiz_id, user_id)
WHERE user_id IS NOT NULL;

-- Ensure one attempt per anonymous session per quiz
CREATE UNIQUE INDEX idx_daily_attempts_session_quiz ON public.daily_quiz_attempts(daily_quiz_id, session_id)
WHERE session_id IS NOT NULL;

-- Index for user's attempt history
CREATE INDEX idx_daily_attempts_user ON public.daily_quiz_attempts(user_id, completed_at DESC);

-- Index for quiz attempts lookup
CREATE INDEX idx_daily_attempts_quiz ON public.daily_quiz_attempts(daily_quiz_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on daily_quizzes table
ALTER TABLE public.daily_quizzes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read daily quizzes
CREATE POLICY "Anyone can read daily quizzes"
  ON public.daily_quizzes FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Only service role can insert/update daily quizzes (via edge function)
-- No policy needed here since service role bypasses RLS

-- Enable RLS on daily_quiz_attempts table
ALTER TABLE public.daily_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own attempts
CREATE POLICY "Users can read their own attempts"
  ON public.daily_quiz_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Anonymous users cannot read attempts (enforced by session_id check in API)
-- No SELECT policy for anon role on this table

-- Policy: Authenticated users can insert their own attempts
CREATE POLICY "Users can insert their own attempts"
  ON public.daily_quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Service role can insert anonymous attempts (bypasses RLS)
-- No policy needed since service role bypasses RLS

-- Comments for documentation
COMMENT ON TABLE public.daily_quizzes IS 'Stores daily music theory quizzes with rotating formats (standard, connections, wordle). One quiz per day, same for all users.';
COMMENT ON TABLE public.daily_quiz_attempts IS 'Tracks user attempts on daily quizzes. One attempt per user/session per quiz.';

COMMENT ON COLUMN public.daily_quizzes.quiz_format IS 'Format type: standard (multiple choice), connections (group items), wordle (guess concept)';
COMMENT ON COLUMN public.daily_quizzes.quiz_type IS 'For standard format only: the specific quiz type (noteIdentification, intervals, etc.)';
COMMENT ON COLUMN public.daily_quizzes.questions IS 'Pre-generated questions in GeneratedQuestion[] format for standard quizzes, empty for other formats';
COMMENT ON COLUMN public.daily_quizzes.metadata IS 'Format-specific data: connections groups, wordle answer/hints, etc.';

COMMENT ON COLUMN public.daily_quiz_attempts.session_id IS 'Anonymous user session ID from sessionStorage/cookie';
COMMENT ON COLUMN public.daily_quiz_attempts.time_taken_seconds IS 'Optional: time taken to complete quiz in seconds';
