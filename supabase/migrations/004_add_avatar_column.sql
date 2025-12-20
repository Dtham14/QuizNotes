-- Add avatar column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN profiles.avatar IS 'User selected avatar identifier (e.g., treble-clef, piano, guitar)';
