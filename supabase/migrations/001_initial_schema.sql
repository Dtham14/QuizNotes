-- QuizNotes Database Schema for Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'canceled', 'expired')),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

-- ============================================
-- 2. CLASSES TABLE
-- ============================================
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for class code lookups (students joining)
CREATE INDEX idx_classes_code ON public.classes(code);
CREATE INDEX idx_classes_teacher ON public.classes(teacher_id);

-- ============================================
-- 3. CLASS ENROLLMENTS TABLE
-- ============================================
CREATE TABLE public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_enrollments_student ON public.class_enrollments(student_id);
CREATE INDEX idx_enrollments_class ON public.class_enrollments(class_id);

-- ============================================
-- 4. CUSTOM QUIZZES TABLE
-- ============================================
CREATE TABLE public.custom_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_quizzes_teacher ON public.custom_quizzes(teacher_id);

-- ============================================
-- 5. ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.custom_quizzes(id) ON DELETE SET NULL,
  quiz_type TEXT, -- For built-in quizzes like 'interval-quiz', 'note-identification'
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  max_attempts INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assignments_class ON public.assignments(class_id);
CREATE INDEX idx_assignments_teacher ON public.assignments(teacher_id);

-- ============================================
-- 6. QUIZ ATTEMPTS TABLE
-- ============================================
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_assignment ON public.quiz_attempts(assignment_id);

-- ============================================
-- 7. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Teachers can view profiles of students in their classes
CREATE POLICY "Teachers can view students in their classes"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE ce.student_id = profiles.id
      AND c.teacher_id = auth.uid()
    )
  );

-- CLASSES POLICIES
CREATE POLICY "Teachers can manage own classes"
  ON public.classes FOR ALL
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view enrolled classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_id = classes.id AND student_id = auth.uid()
    )
  );

-- Anyone can look up a class by code (for joining)
CREATE POLICY "Anyone can lookup class by code"
  ON public.classes FOR SELECT
  USING (true);

-- CLASS ENROLLMENTS POLICIES
CREATE POLICY "Students can view own enrollments"
  ON public.class_enrollments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll themselves"
  ON public.class_enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can unenroll themselves"
  ON public.class_enrollments FOR DELETE
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view enrollments in their classes"
  ON public.class_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_enrollments.class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can remove students from their classes"
  ON public.class_enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_enrollments.class_id AND teacher_id = auth.uid()
    )
  );

-- CUSTOM QUIZZES POLICIES
CREATE POLICY "Teachers can manage own quizzes"
  ON public.custom_quizzes FOR ALL
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view quizzes assigned to them"
  ON public.custom_quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.class_enrollments ce ON a.class_id = ce.class_id
      WHERE a.quiz_id = custom_quizzes.id AND ce.student_id = auth.uid()
    )
  );

-- ASSIGNMENTS POLICIES
CREATE POLICY "Teachers can manage own assignments"
  ON public.assignments FOR ALL
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view assignments in enrolled classes"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_id = assignments.class_id AND student_id = auth.uid()
    )
  );

-- QUIZ ATTEMPTS POLICIES
CREATE POLICY "Users can view own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can view attempts for their assignments"
  ON public.quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = quiz_attempts.assignment_id AND a.teacher_id = auth.uid()
    )
  );

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to generate unique class codes
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
