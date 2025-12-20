-- Add stripe_subscription_id column for tracking subscriptions
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update subscription_plan to include student_premium option
-- Note: If you have a constraint on subscription_plan, you may need to drop and recreate it
-- This assumes the column is a text type or enum that accepts these values
