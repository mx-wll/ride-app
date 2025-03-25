-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update database types
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add updated_at column with default value
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(); 