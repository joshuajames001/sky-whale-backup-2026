-- Skript pro zpětné dopočítání úspěchů (Backfill)
-- Tento skript projde všechny uživatele a zkontroluje, zda mají nárok na odměny za nábor, 
-- i když se to nestalo "právě teď" přes webhook.

DO $$
DECLARE
    referrer RECORD;
    ref_count INT;
BEGIN
    -- Projdeme všechny uživatele, kteří někoho doporučili
    FOR referrer IN SELECT DISTINCT referred_by FROM profiles WHERE referred_by IS NOT NULL LOOP
        
        -- Spočítáme platící "rekruty" pro tohoto uživatele
        SELECT COUNT(DISTINCT p.id) INTO ref_count
        FROM profiles p
        JOIN transactions t ON t.user_id = p.id
        WHERE p.referred_by = referrer.referred_by 
          AND t.status = 'completed';

        -- Odemkneme úspěchy podle počtu
        IF ref_count >= 1 THEN
            INSERT INTO user_achievements (user_id, achievement_id) 
            VALUES (referrer.referred_by, 'recruiter_novice') 
            ON CONFLICT DO NOTHING;
        END IF;

        IF ref_count >= 5 THEN
            INSERT INTO user_achievements (user_id, achievement_id) 
            VALUES (referrer.referred_by, 'recruiter_pro') 
            ON CONFLICT DO NOTHING;
        END IF;

        IF ref_count >= 10 THEN
            INSERT INTO user_achievements (user_id, achievement_id) 
            VALUES (referrer.referred_by, 'recruiter_elite') 
            ON CONFLICT DO NOTHING;
        END IF;

        IF ref_count >= 25 THEN
            INSERT INTO user_achievements (user_id, achievement_id) 
            VALUES (referrer.referred_by, 'recruiter_legend') 
            ON CONFLICT DO NOTHING;
        END IF;
        
    END LOOP;
END $$;
