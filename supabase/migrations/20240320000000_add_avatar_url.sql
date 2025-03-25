-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing users to have a null avatar_url
UPDATE users SET avatar_url = NULL WHERE avatar_url IS NULL; 