-- ========================================
-- COMPLETE FIX FOR CONTACT SUBMISSIONS RLS
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- Step 1: Drop ALL existing policies on contact_submissions
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contact_submissions;
DROP POLICY IF EXISTS "Admin can view contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admin can update contact submissions" ON contact_submissions;

-- Step 2: Drop and recreate is_admin function to ensure it's correct
DROP FUNCTION IF EXISTS is_admin(UUID);

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Use SECURITY DEFINER to bypass RLS when checking role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;

  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate policies with correct syntax

-- Policy: Anyone can insert (authenticated or anonymous)
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can view submissions
CREATE POLICY "Admin can view contact submissions"
  ON contact_submissions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Policy: Only admins can update submissions (for marking as read, etc.)
CREATE POLICY "Admin can update contact submissions"
  ON contact_submissions
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Step 4: Verify the function works
-- This should return TRUE for admin users, FALSE for others
SELECT is_admin('71274812-f919-40c7-acae-c1f9e4d406ed'::UUID) as admin_check;
-- Expected result: admin_check = true
