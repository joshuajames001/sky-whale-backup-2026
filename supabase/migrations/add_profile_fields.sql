-- Add nickname and avatar fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '👤';

-- Update existing users to have default avatar
UPDATE profiles 
SET avatar_emoji = '👤' 
WHERE avatar_emoji IS NULL;
