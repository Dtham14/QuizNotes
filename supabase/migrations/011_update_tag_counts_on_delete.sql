-- ============================================
-- Update tag post counts when posts are deleted
-- ============================================

-- Function to update tag post counts when a post is deleted/undeleted
CREATE OR REPLACE FUNCTION update_tag_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- If post is being marked as deleted
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    -- Decrement post_count for all tags associated with this post
    UPDATE public.forum_tags
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id IN (
      SELECT tag_id FROM public.forum_post_tags WHERE post_id = NEW.id
    );
  END IF;

  -- If post is being undeleted
  IF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
    -- Increment post_count for all tags associated with this post
    UPDATE public.forum_tags
    SET post_count = post_count + 1
    WHERE id IN (
      SELECT tag_id FROM public.forum_post_tags WHERE post_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post deletion/undeletion
CREATE TRIGGER trigger_update_tag_counts_on_post_delete
AFTER UPDATE OF is_deleted ON public.forum_posts
FOR EACH ROW
WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
EXECUTE FUNCTION update_tag_post_counts();

-- Function to update tag post counts when tags are added/removed from posts
CREATE OR REPLACE FUNCTION update_tag_count_on_post_tag_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Check if the post is not deleted before incrementing
    IF EXISTS (
      SELECT 1 FROM public.forum_posts
      WHERE id = NEW.post_id AND is_deleted = FALSE
    ) THEN
      UPDATE public.forum_tags
      SET post_count = post_count + 1
      WHERE id = NEW.tag_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Check if the post is not deleted before decrementing
    IF EXISTS (
      SELECT 1 FROM public.forum_posts
      WHERE id = OLD.post_id AND is_deleted = FALSE
    ) THEN
      UPDATE public.forum_tags
      SET post_count = GREATEST(0, post_count - 1)
      WHERE id = OLD.tag_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tag assignment changes
-- Drop both old trigger names in case they exist
DROP TRIGGER IF EXISTS trigger_update_tag_count ON public.forum_post_tags;
DROP TRIGGER IF EXISTS trigger_update_tag_post_count ON public.forum_post_tags;
CREATE TRIGGER trigger_update_tag_count
AFTER INSERT OR DELETE ON public.forum_post_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_count_on_post_tag_change();

-- Recalculate all tag counts to fix any existing discrepancies
UPDATE public.forum_tags
SET post_count = (
  SELECT COUNT(DISTINCT fpt.post_id)
  FROM public.forum_post_tags fpt
  JOIN public.forum_posts fp ON fp.id = fpt.post_id
  WHERE fpt.tag_id = forum_tags.id
    AND fp.is_deleted = FALSE
);
