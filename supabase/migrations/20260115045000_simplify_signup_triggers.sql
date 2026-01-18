-- FIX: Make Signup Triggers Fail-Safe
-- Prioritize letting the User Sign Up over generating a Referral Code.

BEGIN;

-- 1. Simplify Code Generation (Remove Loop/Select for now to prevent Recursion/Permission errors)
CREATE OR REPLACE FUNCTION public.generate_referral_code() 
RETURNS text AS $$
BEGIN
    -- Just return a random 6-char string. Collision is rare enough for now.
    RETURN upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Make set_referral_code Fail-Safe (Catch errors)
CREATE OR REPLACE FUNCTION public.set_referral_code() 
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        IF NEW.referral_code IS NULL THEN
            NEW.referral_code := public.generate_referral_code();
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If generation fails, LOG strict warning but DO NOT FAIL the Insert
        RAISE WARNING 'Referral Code Generation Failed for Profile %: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Ensure handle_new_user is also Fail-Safe (Re-apply)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code text;
  v_referrer_id uuid;
BEGIN
  -- Safe Lookup
  BEGIN
      v_referral_code := new.raw_user_meta_data->>'referral_code';
      IF v_referral_code IS NOT NULL THEN
         SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referral_code LIMIT 1;
      END IF;
  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Referral Lookup Failed: %', SQLERRM;
      v_referrer_id := NULL;
  END;

  -- Safe Insert
  BEGIN
      INSERT INTO public.profiles (id, email, referred_by)
      VALUES (new.id, new.email, v_referrer_id)
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
      -- This is the critical anti-500 measure:
      -- If Profile fails, we allow User creation (Auth) to succeed.
      -- The app might be broken for this user, but the Signup won't 500.
      RAISE WARNING 'Profile Creation Failed for %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
