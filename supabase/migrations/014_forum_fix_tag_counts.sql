-- ============================================
-- Fix Forum Tag Counts and Add Bug Reports Tag
-- ============================================

-- Add Bug Reports tag if it doesn't exist
INSERT INTO public.forum_tags (name, slug, description, color, icon)
VALUES ('Bug Reports', 'bug-reports', 'Report bugs and technical issues', 'rose', '🐛')
ON CONFLICT (slug) DO NOTHING;

-- Drop the old duplicate trigger if it still exists
DROP TRIGGER IF EXISTS trigger_update_tag_post_count ON public.forum_post_tags;
DROP FUNCTION IF EXISTS update_tag_post_count();

-- Recalculate all tag counts to fix any existing discrepancies
-- This ensures counts reflect only non-deleted posts
UPDATE public.forum_tags
SET post_count = (
  SELECT COUNT(DISTINCT fpt.post_id)
  FROM public.forum_post_tags fpt
  JOIN public.forum_posts fp ON fp.id = fpt.post_id
  WHERE fpt.tag_id = forum_tags.id
    AND fp.is_deleted = FALSE
);
