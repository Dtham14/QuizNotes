-- Add quiz_defaults column to profiles table
-- This stores user's saved default settings for each quiz type as JSONB

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS quiz_defaults JSONB DEFAULT '{}';

-- Create index for faster queries on quiz_defaults
CREATE INDEX IF NOT EXISTS idx_profiles_quiz_defaults ON public.profiles USING GIN (quiz_defaults);

-- Comment for documentation
COMMENT ON COLUMN public.profiles.quiz_defaults IS 'Stores user default settings for each quiz type as JSONB. Key is quiz type, value is settings object.';
