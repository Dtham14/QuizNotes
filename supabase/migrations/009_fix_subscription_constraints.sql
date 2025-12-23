-- Fix subscription plan and status constraints to match application types
-- This allows student_premium plans and all status values used in the app

-- Drop old constraint and add new one with student_premium support
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_plan_check
  CHECK (subscription_plan IN ('monthly', 'yearly', 'student_premium'));

-- Drop old constraint and add new one with all status values
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('none', 'active', 'canceled', 'expired', 'past_due', 'inactive'));
