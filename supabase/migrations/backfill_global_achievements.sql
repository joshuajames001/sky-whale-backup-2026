-- KOMPLETNÍ BACKFILL VŠECH ÚSPĚCHŮ
-- Tento skript projde historii a dopočítá chybějící úspěchy pro:
-- 1. Počet knih
-- 2. Počet samolepek (přáníček)
-- 3. Utracenou energii (odhadnuto z nákupu) - POZOR: Nemáme log útraty, ale můžeme dopočítat nákupy.
-- 4. Zakoupenou energii

DO $$
DECLARE
    u RECORD;
    book_cnt INT;
    card_cnt INT;
    total_bought INT;
    recharge_cnt INT;
BEGIN
    FOR u IN SELECT id FROM profiles LOOP
        
        -- 1. POČET KNIH
        SELECT count(*) INTO book_cnt FROM books WHERE owner_id = u.id;
        
        IF book_cnt >= 1 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'first_book') ON CONFLICT DO NOTHING; END IF;
        IF book_cnt >= 5 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'storyteller_novice') ON CONFLICT DO NOTHING; END IF;
        IF book_cnt >= 10 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'creative_genius') ON CONFLICT DO NOTHING; END IF;
        IF book_cnt >= 30 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'story_master') ON CONFLICT DO NOTHING; END IF;
        IF book_cnt >= 50 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'legendary_author') ON CONFLICT DO NOTHING; END IF;

        -- 2. POČET SAMOLEPEK (Greeting Cards) / Vlastních knih
        -- Uživatel říká "samolepky", což asi myslí greeting_cards nebo custom knihy?
        -- V DB je 'greeting_cards' a achievementy 'first_sticker', 'card_designer' atd.
        SELECT count(*) INTO card_cnt FROM greeting_cards WHERE owner_id = u.id;
        
        IF card_cnt >= 1 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'first_sticker') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 10 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'card_designer') ON CONFLICT DO NOTHING; END IF; 
        IF card_cnt >= 25 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'studio_master') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 50 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'artistic_soul') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 100 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'creative_legend') ON CONFLICT DO NOTHING; END IF;

        -- 3. ENERGIE (Zakoupená)
        SELECT sum(energy_amount), count(*) INTO total_bought, recharge_cnt FROM transactions WHERE user_id = u.id AND status = 'completed';
        total_bought := COALESCE(total_bought, 0);
        recharge_cnt := COALESCE(recharge_cnt, 0);

        -- Počet dobití
        IF recharge_cnt >= 1 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'first_recharge') ON CONFLICT DO NOTHING; END IF;
        IF recharge_cnt >= 5 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'regular_customer') ON CONFLICT DO NOTHING; END IF;
        IF recharge_cnt >= 15 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'big_investor') ON CONFLICT DO NOTHING; END IF;
        IF recharge_cnt >= 30 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'energy_magnate') ON CONFLICT DO NOTHING; END IF;

        -- Celkové množství energie (jako proxy pro utracenou, pokud nemáme log útraty)
        -- 'energy_spent' achievementy jsou: 'energy_spender' (100), 'investor' (200), 'big_spender' (500), 'energy_king' (1000)
        -- Pokud nemáme tabulku 'usage_logs', nemůžeme přesně vědět, kolik UTRATIL. 
        -- Ale můžeme předpokládat, že pokud si koupil X, tak je "Velký Utráceč" (nebo investor).
        -- Pro teď použijeme 'total_bought' jako metriku, protože to je to nejlepší co máme.
        
        IF total_bought >= 50 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'first_purchase') ON CONFLICT DO NOTHING; END IF; -- 50 Energie (První nákup)
        IF total_bought >= 200 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'energy_investor') ON CONFLICT DO NOTHING; END IF;
        IF total_bought >= 500 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'big_spender') ON CONFLICT DO NOTHING; END IF;
        IF total_bought >= 1000 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'energy_king') ON CONFLICT DO NOTHING; END IF;

    END LOOP;
END $$;
