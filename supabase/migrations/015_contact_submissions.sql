-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Add index for faster queries
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_read ON contact_submissions(read);

-- Enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (authenticated or anonymous)
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can view submissions (you can adjust this later)
CREATE POLICY "Admin can view contact submissions"
  ON contact_submissions
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));
