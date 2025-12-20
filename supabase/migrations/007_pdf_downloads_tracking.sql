-- Track PDF downloads for rate limiting
-- Free users: 5 downloads/day, Premium: 20 downloads/day

CREATE TABLE IF NOT EXISTS public.pdf_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for efficient daily count queries
CREATE INDEX IF NOT EXISTS idx_pdf_downloads_user_date
  ON public.pdf_downloads(user_id, downloaded_at DESC);

-- Index for looking up downloads by attempt
CREATE INDEX IF NOT EXISTS idx_pdf_downloads_attempt
  ON public.pdf_downloads(attempt_id);

-- RLS policies
ALTER TABLE public.pdf_downloads ENABLE ROW LEVEL SECURITY;

-- Users can view their own download history
CREATE POLICY "Users can view own pdf downloads"
  ON public.pdf_downloads FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own downloads
CREATE POLICY "Users can insert own pdf downloads"
  ON public.pdf_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get today's download count for a user
CREATE OR REPLACE FUNCTION get_user_daily_download_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.pdf_downloads
    WHERE user_id = p_user_id
    AND downloaded_at >= CURRENT_DATE
    AND downloaded_at < CURRENT_DATE + INTERVAL '1 day'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
