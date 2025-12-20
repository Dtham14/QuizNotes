-- Create storage bucket for quiz result PDFs
-- Note: Bucket creation is done via Supabase dashboard or CLI, not SQL
-- This migration sets up the necessary policies

-- Add pdf_url column to quiz_attempts table
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Create index for faster lookups on pdf_url
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_pdf_url ON public.quiz_attempts(pdf_url) WHERE pdf_url IS NOT NULL;

-- Storage policies for quiz-results bucket
-- These assume the bucket 'quiz-results' has been created in Supabase dashboard

-- Policy: Users can read their own quiz PDFs
-- Path format: {user_id}/{attempt_id}.pdf
CREATE POLICY "Users can read own quiz PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quiz-results'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can upload their own quiz PDFs
CREATE POLICY "Users can upload own quiz PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quiz-results'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own quiz PDFs
CREATE POLICY "Users can delete own quiz PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'quiz-results'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
