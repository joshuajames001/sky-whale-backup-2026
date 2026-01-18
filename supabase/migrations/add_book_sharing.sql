-- Add is_public column to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for faster public book queries
CREATE INDEX IF NOT EXISTS idx_books_public 
ON books(is_public, created_at DESC) 
WHERE is_public = true;

-- Update existing books to be private by default
UPDATE books 
SET is_public = false 
WHERE is_public IS NULL;
