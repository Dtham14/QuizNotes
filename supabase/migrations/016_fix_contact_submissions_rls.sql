-- Fix infinite recursion in contact_submissions RLS policy
-- The previous policy caused recursion when checking admin status through profiles table

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Admin can view contact submissions" ON contact_submissions;

-- Create a security definer function to check if user is admin
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;

  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policy using the security definer function
CREATE POLICY "Admin can view contact submissions"
  ON contact_submissions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Also create a policy for admins to update submissions (mark as read, etc.)
CREATE POLICY "Admin can update contact submissions"
  ON contact_submissions
  FOR UPDATE
  USING (is_admin(auth.uid()));
