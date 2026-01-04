-- ============================================
-- FORUM SYSTEM SCHEMA
-- ============================================

-- ============================================
-- 1. FORUM TAGS TABLE
-- ============================================
CREATE TABLE public.forum_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT 'blue', -- Tailwind color for UI
  icon TEXT DEFAULT '🏷️',
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_tags_slug ON public.forum_tags(slug);
CREATE INDEX idx_forum_tags_post_count ON public.forum_tags(post_count DESC);

-- Pre-seed common tags
INSERT INTO public.forum_tags (name, slug, description, color, icon) VALUES
  ('Theory Questions', 'theory-questions', 'General music theory questions', 'blue', '🎵'),
  ('Scales & Modes', 'scales-modes', 'Questions about scales and modes', 'green', '🎚️'),
  ('Intervals', 'intervals', 'Interval identification and theory', 'purple', '📏'),
  ('Chords', 'chords', 'Chord construction and progressions', 'orange', '🎹'),
  ('Ear Training', 'ear-training', 'Tips and questions about ear training', 'pink', '👂'),
  ('Study Tips', 'study-tips', 'Learning strategies and motivation', 'yellow', '📚'),
  ('Quiz Help', 'quiz-help', 'Help with specific quiz questions', 'red', '❓'),
  ('Resources', 'resources', 'Recommended books, videos, tools', 'cyan', '🔗'),
  ('Practice Techniques', 'practice-techniques', 'Effective practice methods', 'indigo', '🎯'),
  ('Bug Reports', 'bug-reports', 'Report bugs and technical issues', 'rose', '🐛'),
  ('General Discussion', 'general', 'General music theory discussions', 'gray', '💬');

-- ============================================
-- 2. FORUM POSTS TABLE
-- ============================================
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered markdown for display
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id),
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  vote_score INTEGER DEFAULT 0, -- Net votes (upvotes - downvotes)
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX idx_forum_posts_created ON public.forum_posts(created_at DESC);
CREATE INDEX idx_forum_posts_activity ON public.forum_posts(last_activity_at DESC);
CREATE INDEX idx_forum_posts_vote_score ON public.forum_posts(vote_score DESC);
CREATE INDEX idx_forum_posts_pinned ON public.forum_posts(is_pinned, last_activity_at DESC);
CREATE INDEX idx_forum_posts_deleted ON public.forum_posts(is_deleted) WHERE is_deleted = FALSE;

-- Full text search index
CREATE INDEX idx_forum_posts_search ON public.forum_posts
  USING gin(to_tsvector('english', title || ' ' || content));

-- ============================================
-- 3. FORUM POST TAGS (Many-to-Many)
-- ============================================
CREATE TABLE public.forum_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.forum_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

CREATE INDEX idx_forum_post_tags_post ON public.forum_post_tags(post_id);
CREATE INDEX idx_forum_post_tags_tag ON public.forum_post_tags(tag_id);

-- ============================================
-- 4. FORUM COMMENTS TABLE (Threaded Replies)
-- ============================================
CREATE TABLE public.forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered markdown
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id),
  vote_score INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0, -- For threading depth
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_comments_post ON public.forum_comments(post_id, created_at);
CREATE INDEX idx_forum_comments_parent ON public.forum_comments(parent_id);
CREATE INDEX idx_forum_comments_author ON public.forum_comments(author_id);
CREATE INDEX idx_forum_comments_deleted ON public.forum_comments(is_deleted) WHERE is_deleted = FALSE;

-- ============================================
-- 5. FORUM VOTES TABLE
-- ============================================
CREATE TABLE public.forum_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- User can only vote once per post or comment
  CONSTRAINT unique_post_vote UNIQUE NULLS NOT DISTINCT (user_id, post_id),
  CONSTRAINT unique_comment_vote UNIQUE NULLS NOT DISTINCT (user_id, comment_id),
  -- Must vote on either post or comment, not both
  CONSTRAINT vote_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_forum_votes_user ON public.forum_votes(user_id);
CREATE INDEX idx_forum_votes_post ON public.forum_votes(post_id);
CREATE INDEX idx_forum_votes_comment ON public.forum_votes(comment_id);

-- ============================================
-- 6. FORUM REPORTS TABLE (User Reporting)
-- ============================================
CREATE TABLE public.forum_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 'inappropriate', 'harassment', 'misinformation', 'other'
  )),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Must report either post or comment
  CONSTRAINT report_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_forum_reports_status ON public.forum_reports(status, created_at DESC);
CREATE INDEX idx_forum_reports_reporter ON public.forum_reports(reporter_id);
CREATE INDEX idx_forum_reports_post ON public.forum_reports(post_id);
CREATE INDEX idx_forum_reports_comment ON public.forum_reports(comment_id);

-- ============================================
-- 7. FORUM NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.forum_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'reply_to_post', 'reply_to_comment', 'mention', 'post_locked', 'post_pinned'
  )),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who triggered the notification
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forum_notifications_user ON public.forum_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_forum_notifications_post ON public.forum_notifications(post_id);
CREATE INDEX idx_forum_notifications_comment ON public.forum_notifications(comment_id);

-- ============================================
-- 8. USER FORUM REPUTATION TABLE
-- ============================================
CREATE TABLE public.user_forum_reputation (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  reputation_score INTEGER DEFAULT 0,
  posts_created INTEGER DEFAULT 0,
  comments_created INTEGER DEFAULT 0,
  helpful_votes_received INTEGER DEFAULT 0, -- Upvotes on their content
  total_votes_given INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_forum_reputation_score ON public.user_forum_reputation(reputation_score DESC);

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to update post vote score
CREATE OR REPLACE FUNCTION update_post_vote_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.forum_posts
    SET vote_score = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE -1 END), 0)
      FROM public.forum_votes
      WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts
    SET vote_score = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE -1 END), 0)
      FROM public.forum_votes
      WHERE post_id = OLD.post_id
    )
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_vote_score
AFTER INSERT OR UPDATE OR DELETE ON public.forum_votes
FOR EACH ROW
EXECUTE FUNCTION update_post_vote_score();

-- Function to update comment vote score
CREATE OR REPLACE FUNCTION update_comment_vote_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.forum_comments
    SET vote_score = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE -1 END), 0)
      FROM public.forum_votes
      WHERE comment_id = NEW.comment_id
    )
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_comments
    SET vote_score = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE -1 END), 0)
      FROM public.forum_votes
      WHERE comment_id = OLD.comment_id
    )
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_vote_score
AFTER INSERT OR UPDATE OR DELETE ON public.forum_votes
FOR EACH ROW
EXECUTE FUNCTION update_comment_vote_score();

-- Function to update post reply count
CREATE OR REPLACE FUNCTION update_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts
    SET reply_count = reply_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_deleted = FALSE THEN
    UPDATE public.forum_posts
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_reply_count
AFTER INSERT OR DELETE ON public.forum_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_reply_count();

-- Tag post count update is handled by trigger in 011_update_tag_counts_on_delete.sql
-- This ensures proper handling of deleted posts

-- Function to initialize user forum reputation
CREATE OR REPLACE FUNCTION initialize_user_forum_reputation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_forum_reputation (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_forum_reputation
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_user_forum_reputation();

-- Function to create notification on reply
CREATE OR REPLACE FUNCTION create_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
  v_parent_comment_author_id UUID;
BEGIN
  -- If replying to a comment
  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO v_parent_comment_author_id
    FROM public.forum_comments
    WHERE id = NEW.parent_id;

    -- Don't notify yourself
    IF v_parent_comment_author_id IS NOT NULL AND v_parent_comment_author_id != NEW.author_id THEN
      INSERT INTO public.forum_notifications (user_id, type, post_id, comment_id, actor_id)
      VALUES (v_parent_comment_author_id, 'reply_to_comment', NEW.post_id, NEW.id, NEW.author_id);
    END IF;
  ELSE
    -- If replying to post
    SELECT author_id INTO v_post_author_id
    FROM public.forum_posts
    WHERE id = NEW.post_id;

    -- Don't notify yourself
    IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.author_id THEN
      INSERT INTO public.forum_notifications (user_id, type, post_id, comment_id, actor_id)
      VALUES (v_post_author_id, 'reply_to_post', NEW.post_id, NEW.id, NEW.author_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_reply_notification
AFTER INSERT ON public.forum_comments
FOR EACH ROW
EXECUTE FUNCTION create_reply_notification();

-- Function to search posts
CREATE OR REPLACE FUNCTION search_forum_posts(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.content,
    p.author_id,
    p.created_at,
    ts_rank(to_tsvector('english', p.title || ' ' || p.content), plainto_tsquery('english', search_query)) as rank
  FROM public.forum_posts p
  WHERE p.is_deleted = FALSE
    AND to_tsvector('english', p.title || ' ' || p.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.forum_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_forum_reputation ENABLE ROW LEVEL SECURITY;

-- FORUM TAGS - Public read
CREATE POLICY "Anyone can view tags"
  ON public.forum_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON public.forum_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- FORUM POSTS - Public read, authenticated write
CREATE POLICY "Anyone can view non-deleted posts"
  ON public.forum_posts FOR SELECT
  USING (is_deleted = FALSE OR author_id = auth.uid());

CREATE POLICY "Authenticated users can create posts"
  ON public.forum_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update own posts"
  ON public.forum_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Moderators can update any post"
  ON public.forum_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Authors can delete own posts"
  ON public.forum_posts FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Moderators can delete any post"
  ON public.forum_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- FORUM POST TAGS
CREATE POLICY "Anyone can view post tags"
  ON public.forum_post_tags FOR SELECT
  USING (true);

CREATE POLICY "Post authors can manage post tags"
  ON public.forum_post_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts
      WHERE id = forum_post_tags.post_id AND author_id = auth.uid()
    )
  );

-- FORUM COMMENTS - Public read, authenticated write
CREATE POLICY "Anyone can view non-deleted comments"
  ON public.forum_comments FOR SELECT
  USING (is_deleted = FALSE OR author_id = auth.uid());

CREATE POLICY "Authenticated users can create comments"
  ON public.forum_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update own comments"
  ON public.forum_comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Moderators can update any comment"
  ON public.forum_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Authors can delete own comments"
  ON public.forum_comments FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Moderators can delete any comment"
  ON public.forum_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- FORUM VOTES - Users can manage own votes
CREATE POLICY "Anyone can view votes"
  ON public.forum_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create votes"
  ON public.forum_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON public.forum_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.forum_votes FOR DELETE
  USING (auth.uid() = user_id);

-- FORUM REPORTS
CREATE POLICY "Users can view own reports"
  ON public.forum_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view all reports"
  ON public.forum_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Authenticated users can create reports"
  ON public.forum_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can manage reports"
  ON public.forum_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- FORUM NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON public.forum_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.forum_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.forum_notifications FOR INSERT
  WITH CHECK (true);

-- USER FORUM REPUTATION - Public read
CREATE POLICY "Anyone can view forum reputation"
  ON public.user_forum_reputation FOR SELECT
  USING (true);

CREATE POLICY "System can manage forum reputation"
  ON public.user_forum_reputation FOR ALL
  USING (true);

-- ============================================
-- 11. INITIALIZE FORUM REPUTATION FOR EXISTING USERS
-- ============================================
INSERT INTO public.user_forum_reputation (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_forum_reputation)
ON CONFLICT (user_id) DO NOTHING;
