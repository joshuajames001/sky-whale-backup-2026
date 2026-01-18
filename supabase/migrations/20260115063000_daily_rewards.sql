-- Add columns for Daily Rewards logic
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_claim_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claim_streak INTEGER DEFAULT 0;

-- Comment on columns
COMMENT ON COLUMN profiles.last_claim_date IS 'Timestamp of the last claimed daily reward';
COMMENT ON COLUMN profiles.claim_streak IS 'Current streak of consecutive daily logins';
