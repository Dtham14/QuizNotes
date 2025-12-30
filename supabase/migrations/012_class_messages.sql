-- Class Messages/Discussion Feature
-- Allows teachers and students to communicate within a class

-- ============================================
-- CLASS MESSAGES TABLE
-- ============================================
CREATE TABLE public.class_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_class_messages_class ON public.class_messages(class_id);
CREATE INDEX idx_class_messages_user ON public.class_messages(user_id);
CREATE INDEX idx_class_messages_created ON public.class_messages(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages from classes they're enrolled in or teaching
CREATE POLICY "Users can read messages from their classes"
  ON public.class_messages
  FOR SELECT
  USING (
    -- Teachers can read messages from their classes
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_messages.class_id
      AND classes.teacher_id = auth.uid()
    )
    OR
    -- Students can read messages from classes they're enrolled in
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_enrollments.class_id = class_messages.class_id
      AND class_enrollments.student_id = auth.uid()
    )
  );

-- Policy: Users can post messages to classes they're enrolled in or teaching
CREATE POLICY "Users can post messages to their classes"
  ON public.class_messages
  FOR INSERT
  WITH CHECK (
    -- Teachers can post to their classes
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_messages.class_id
      AND classes.teacher_id = auth.uid()
    )
    OR
    -- Students can post to classes they're enrolled in
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_enrollments.class_id = class_messages.class_id
      AND class_enrollments.student_id = auth.uid()
    )
  );

-- Policy: Users can update only their own messages
CREATE POLICY "Users can update their own messages"
  ON public.class_messages
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete only their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.class_messages
  FOR DELETE
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_class_messages_updated_at
  BEFORE UPDATE ON public.class_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
