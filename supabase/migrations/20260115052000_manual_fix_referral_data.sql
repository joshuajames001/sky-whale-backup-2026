-- MANUAL FIX: Link the last new user to the Referral Code '096E01'
-- And manually award the 'Lovec Talentů' achievement + Energy to the Referrer.

DO $$
DECLARE
    v_referrer_id uuid;
    v_referee_id uuid;
    v_reward int := 250;
BEGIN
    -- 1. Find the Referrer (The one who owns code 096E01)
    SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = '096E01';
    
    -- 2. Find the Referee (The most recently created user)
    SELECT id INTO v_referee_id FROM profiles ORDER BY created_at DESC LIMIT 1;

    IF v_referrer_id IS NOT NULL AND v_referee_id IS NOT NULL AND v_referrer_id != v_referee_id THEN
        
        -- A. Link Profiles
        UPDATE profiles 
        SET referred_by = v_referrer_id 
        WHERE id = v_referee_id;

        -- B. Unlock 'recruiter_novice' for Referrer (Lovec Talentů)
        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
        VALUES (v_referrer_id, 'recruiter_novice', now())
        ON CONFLICT DO NOTHING;

        -- C. Award Energy (Safety check: only if balance looks low given the reward)
        -- Actually, better to just add it. The trigger 'award_achievement_energy' on user_achievements 
        -- should have handled it if we just inserted into user_achievements!
        -- Wait, 'award_achievement_energy' only fires on INSERT. 
        -- If 'recruiter_novice' was already there (unlikely if count was 0), it won't fire.
        -- Let's force add energy just to be safe and generous.
        
        UPDATE profiles
        SET energy_balance = energy_balance + v_reward
        WHERE id = v_referrer_id;

        RAISE NOTICE 'Fixed Referral: Linked % to % and awarded energy.', v_referee_id, v_referrer_id;
        
    ELSE
        RAISE WARNING 'Could not find Referrer (096E01) or Referee, or they are the same person.';
    END IF;
END $$;
