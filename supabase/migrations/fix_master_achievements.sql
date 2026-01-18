-- MASTER FIX SCRIPT
-- 1. Ensure all Definitions exist (Sjednocení ID s kódem)
-- 2. Backfill (Dopočítání)

-- A. Vložení/Oprava definic úspěchů (aby seděly s kódem a webhookem)
INSERT INTO public.achievements (id, title, description, icon, condition_type, threshold, energy_reward)
VALUES
-- Knihy (podle achievements.ts)
('beginner_writer', 'Začínající Spisovatel', 'Vytvořil jsi 5 knih.', '✍️', 'book_count', 5, 100),
('creative_genius', 'Kreativní Génius', 'Vytvořil jsi 10 knih!', '🎨', 'book_count', 10, 200),
('story_master', 'Mistr Příběhů', 'Vytvořil jsi 30 knih!', '📚', 'book_count', 30, 300),
('legendary_author', 'Legendární Autor', 'Vytvořil jsi 50 knih!', '🏆', 'book_count', 50, 500),

-- Vlastní knihy (podle achievements.ts)
('first_custom', 'První Editace', 'Vytvořil jsi svou první vlastní knihu.', '✨', 'custom_book_count', 1, 0),
('custom_creator', 'Kreativní Tvůrce', 'Vytvořil jsi 5 vlastních knih.', '🖌️', 'custom_book_count', 5, 100),
('custom_master', 'Mistr Ateliéru', 'Vytvořil jsi 10 vlastních knih.', '🎨', 'custom_book_count', 10, 200),
('custom_legend', 'Legenda Designu', 'Vytvořil jsi 20 vlastních knih!', '🌟', 'custom_book_count', 20, 300),
('custom_god', 'Bůh Kreativity', 'Vytvořil jsi 35 vlastních knih!', '⚡', 'custom_book_count', 35, 500),

-- Samolepky (nové, konzistentní ID)
('first_sticker', 'První Nálepka', 'Vytvořil jsi první nálepku!', '🏷️', 'sticker_count', 1, 0),
('card_designer', 'Designér Přání', 'Vytvořil jsi 10 nálepek.', '💌', 'sticker_count', 10, 100),
('studio_master', 'Mistr Ateliéru', 'Vytvořil jsi 25 nálepek!', '🎭', 'sticker_count', 25, 200),
('artistic_soul', 'Umělecká Duše', 'Vytvořil jsi 50 nálepek!', '🎨', 'sticker_count', 50, 300),
('creative_legend', 'Kreativní Legenda', 'Vytvořil jsi 100 nálepek!', '👑', 'sticker_count', 100, 500),

-- Nákup Energie (Webhook používá 'energy_magnate' pro 30)
('energy_magnate', 'Energetický Magnát', 'Dobil jsi energii 30x!', '🔋', 'energy_purchased', 30, 300),
('big_investor', 'Velký Investor', 'Dobil jsi energii 15x!', '💎', 'energy_purchased', 15, 200),
('regular_customer', 'Pravidelný Zákazník', 'Dobil jsi energii 5x.', '🛒', 'energy_purchased', 5, 100),

-- Utracená Energie
('first_spend', 'První Nákup', 'Utratil jsi prvních 500 Energie.', '💸', 'energy_spent', 500, 0),
('energy_investor', 'Investor', 'Utratil jsi 2000 Energie.', '📈', 'energy_spent', 2000, 100),
('big_spender', 'Velký Utráceč', 'Utratil jsi 5000 Energie!', '🏦', 'energy_spent', 5000, 200),
('energy_king', 'Energetický Král', 'Utratil jsi 10000 Energie!', '👑', 'energy_spent', 10000, 500)

ON CONFLICT (id) DO UPDATE 
SET energy_reward = EXCLUDED.energy_reward; -- Zajistí, že odměny budou nastaveny

-- B. BACKFILL LOGIC (Nyní bezpečný, protože ID existují)
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
        IF book_cnt >= 5 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'beginner_writer') ON CONFLICT DO NOTHING; END IF;
        IF book_cnt >= 10 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'creative_genius') ON CONFLICT DO NOTHING; END IF;
        IF book_cnt >= 30 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'story_master') ON CONFLICT DO NOTHING; END IF;
        IF book_cnt >= 50 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'legendary_author') ON CONFLICT DO NOTHING; END IF;

        -- 2. VLASTNÍ KNIHY
        SELECT count(*) INTO card_cnt FROM books WHERE owner_id = u.id AND visual_style = 'watercolor';
        
        IF card_cnt >= 1 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'first_custom') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 5 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'custom_creator') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 10 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'custom_master') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 20 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'custom_legend') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 35 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'custom_god') ON CONFLICT DO NOTHING; END IF;

        -- 3. SAMOLEPKY (Greeting Cards)
        SELECT count(*) INTO card_cnt FROM greeting_cards WHERE owner_id = u.id;
        
        IF card_cnt >= 1 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'first_sticker') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 10 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'card_designer') ON CONFLICT DO NOTHING; END IF; 
        IF card_cnt >= 25 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'studio_master') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 50 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'artistic_soul') ON CONFLICT DO NOTHING; END IF;
        IF card_cnt >= 100 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'creative_legend') ON CONFLICT DO NOTHING; END IF;

        -- 4. ENERGIE (Zakoupená)
        SELECT sum(energy_amount), count(*) INTO total_bought, recharge_cnt FROM transactions WHERE user_id = u.id AND status = 'completed';
        total_bought := COALESCE(total_bought, 0);
        recharge_cnt := COALESCE(recharge_cnt, 0);

        IF recharge_cnt >= 1 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'first_recharge') ON CONFLICT DO NOTHING; END IF;
        IF recharge_cnt >= 5 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'regular_customer') ON CONFLICT DO NOTHING; END IF;
        IF recharge_cnt >= 15 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'big_investor') ON CONFLICT DO NOTHING; END IF;
        IF recharge_cnt >= 30 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'energy_magnate') ON CONFLICT DO NOTHING; END IF;

        IF total_bought >= 50 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'first_spend') ON CONFLICT DO NOTHING; END IF;
        IF total_bought >= 200 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'energy_investor') ON CONFLICT DO NOTHING; END IF;
        IF total_bought >= 500 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'big_spender') ON CONFLICT DO NOTHING; END IF;
        IF total_bought >= 1000 THEN INSERT INTO user_achievements (user_id, achievement_id) VALUES (u.id, 'energy_king') ON CONFLICT DO NOTHING; END IF;

    END LOOP;
END $$;
