-- Check current RLS policies on contact_submissions table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'contact_submissions';

-- Also check if is_admin function exists
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'is_admin';
