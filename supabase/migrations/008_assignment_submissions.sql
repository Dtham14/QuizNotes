-- Track when students submit assignments early (before using all attempts)
-- This prevents further retries after explicit submission

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  final_score INTEGER,
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_assignment_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student ON public.assignment_submissions(student_id);

-- Enable RLS
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
  ON public.assignment_submissions FOR SELECT
  USING (auth.uid() = student_id);

-- Students can insert their own submissions
CREATE POLICY "Students can submit assignments"
  ON public.assignment_submissions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Teachers can view submissions for their assignments
CREATE POLICY "Teachers can view submissions for their assignments"
  ON public.assignment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_submissions.assignment_id AND a.teacher_id = auth.uid()
    )
  );
