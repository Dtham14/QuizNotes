-- Migration: Add anonymous quiz attempts tracking
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- ============================================
-- ANONYMOUS QUIZ ATTEMPTS TABLE
-- ============================================
-- This table tracks quiz attempts from users who haven't created an account
-- Uses session_id to group attempts from the same anonymous session

CREATE TABLE public.anonymous_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  quiz_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB,
  ip_hash TEXT, -- Optional: hashed IP for basic analytics (privacy-friendly)
  user_agent TEXT, -- Browser/device info for analytics
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_anonymous_attempts_session ON public.anonymous_quiz_attempts(session_id);
CREATE INDEX idx_anonymous_attempts_created ON public.anonymous_quiz_attempts(created_at);
CREATE INDEX idx_anonymous_attempts_quiz_type ON public.anonymous_quiz_attempts(quiz_type);

-- ============================================
-- RLS POLICIES FOR ANONYMOUS ATTEMPTS
-- ============================================

ALTER TABLE public.anonymous_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (no auth required for anonymous attempts)
CREATE POLICY "Anyone can insert anonymous attempts"
  ON public.anonymous_quiz_attempts FOR INSERT
  WITH CHECK (true);

-- Only admins can view anonymous attempts (via service role key)
-- Regular users cannot query this table directly
CREATE POLICY "Service role can view all anonymous attempts"
  ON public.anonymous_quiz_attempts FOR SELECT
  USING (false); -- Block all regular user access, use service role for admin queries
