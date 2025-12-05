-- Add password_hash column if it doesn't exist
-- This migration fixes the issue where password_hash column is missing

DO $$ 
BEGIN
  -- Check if column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
    RAISE NOTICE 'Added password_hash column to users table';
  ELSE
    RAISE NOTICE 'password_hash column already exists';
  END IF;
END $$;





