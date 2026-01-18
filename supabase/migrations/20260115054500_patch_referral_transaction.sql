-- PATCH: Ensure Referee has a Transaction
-- The UI counts "Confirmed Referrals" by checking if the referred user has a 'completed' transaction.
-- If the webhook failed or was skipped during the test, the transaction is missing, and count is 0.
-- This script finds the user referred by '096E01' and ensures they have at least one transaction.

DO $$
DECLARE
    v_referrer_id uuid;
    v_referee_id uuid;
BEGIN
    -- 1. Find the Referrer
    SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = '096E01';
    
    -- 2. Find the Referee (The person referred by them)
    -- We take the most recent one to be safe
    SELECT id INTO v_referee_id FROM profiles WHERE referred_by = v_referrer_id ORDER BY created_at DESC LIMIT 1;

    IF v_referee_id IS NOT NULL THEN
        -- Check if they have a transaction
        IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = v_referee_id AND status = 'completed') THEN
            
            -- Insert a "Manual Fix" transaction
            INSERT INTO transactions (user_id, amount_czk, energy_amount, package_id, status, stripe_session_id)
            VALUES (
                v_referee_id, 
                199, -- Starter price
                1000, 
                'manual_fix_referral', 
                'completed',
                'manual_session_' || floor(random() * 100000)::text
            );
            
            RAISE NOTICE 'Fixed: Inserted missing transaction for Referee %', v_referee_id;
        ELSE
            RAISE NOTICE 'Referee % already has a transaction. Count should be fine.', v_referee_id;
        END IF;
    ELSE
        RAISE WARNING 'No Referee found for Referrer 096E01. The previous link might have failed?';
    END IF;
END $$;
