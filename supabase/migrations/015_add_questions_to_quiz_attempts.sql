-- Add questions column to quiz_attempts table to enable quiz review functionality
ALTER TABLE public.quiz_attempts
ADD COLUMN IF NOT EXISTS questions JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN public.quiz_attempts.questions IS 'Stores the full quiz questions for review mode';
