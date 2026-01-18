-- Add referral columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);

-- Create index for faster lookup by referral code
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles(referral_code);

-- Function to generate random referral code (simple version)
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS text AS $$
DECLARE
    new_code text;
    done bool;
BEGIN
    done := false;
    WHILE NOT done LOOP
        -- Generate 6 char random string (uppercase alphanumeric)
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        -- Check if it exists
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code) THEN
            done := true;
        END IF;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically assign referral code on profile creation
CREATE OR REPLACE FUNCTION set_referral_code() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_profile_created_referral
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_referral_code();

-- Backfill existing profiles with referral codes
DO $$
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM profiles WHERE referral_code IS NULL LOOP
        UPDATE profiles 
        SET referral_code = generate_referral_code() 
        WHERE id = r.id;
    END LOOP;
END $$;
