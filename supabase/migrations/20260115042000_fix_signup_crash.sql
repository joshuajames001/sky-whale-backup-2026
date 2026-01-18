-- Update handle_new_user to capture referral code from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code text;
  v_referrer_id uuid;
BEGIN
  -- Wrap referral logic to prevent signup failure
  BEGIN
      v_referral_code := new.raw_user_meta_data->>'referral_code';
      
      IF v_referral_code IS NOT NULL THEN
        -- Add LIMIT 1 just in case, though it should be unique
        SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referral_code LIMIT 1;
      END IF;
  EXCEPTION WHEN OTHERS THEN
      -- Log error (visible in Supabase logs) but do NOT fail the transaction
      RAISE WARNING 'Referral lookup failed for user %: %', new.id, SQLERRM;
      v_referrer_id := NULL;
  END;

  INSERT INTO public.profiles (id, email, referred_by)
  VALUES (new.id, new.email, v_referrer_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
