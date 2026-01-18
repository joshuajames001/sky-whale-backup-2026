-- EMERGENCY FIX: Signup Crash & Referral Permissions
-- 1. Makes generate_referral_code SECURITY DEFINER (so it can read profiles even if RLS blocks)
-- 2. Makes handle_new_user robust with search_path and EXCEPTION handling

BEGIN;

-- A. Fix generate_referral_code (Called by trigger on profiles)
CREATE OR REPLACE FUNCTION public.generate_referral_code() 
RETURNS text AS $$
DECLARE
    new_code text;
    done bool;
BEGIN
    done := false;
    WHILE NOT done LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        -- Run with Admin privileges due to SECURITY DEFINER below
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) THEN
            done := true;
        END IF;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- B. Fix handle_new_user (Called by trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code text;
  v_referrer_id uuid;
BEGIN
  -- 1. Try to find referrer
  BEGIN
      v_referral_code := new.raw_user_meta_data->>'referral_code';
      
      IF v_referral_code IS NOT NULL THEN
         SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referral_code LIMIT 1;
      END IF;
  EXCEPTION WHEN OTHERS THEN
      -- Log but continue
      RAISE WARNING 'Referral lookup error for %: %', new.id, SQLERRM;
      v_referrer_id := NULL;
  END;

  -- 2. Insert Profile (If this fails, we want it to fail, but let's be explicit about schema)
  INSERT INTO public.profiles (id, email, referred_by)
  VALUES (new.id, new.email, v_referrer_id)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email; -- Soften duplicate handling

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
