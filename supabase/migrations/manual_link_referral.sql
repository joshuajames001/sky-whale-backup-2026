-- Ruční propojení uživatelů (Manuální Referral)
-- Nahraď emaily skutečnými adresami

DO $$
DECLARE
    v_recruiter_email text := 'EMAIL_TVOJOHO_HLAVNIHO_UCTU@gmail.com'; -- Kdo zve (Ty)
    v_friend_email text := 'EMAIL_KAMARADA@gmail.com';             -- Kdo byl pozván (Tvůj druhý účet)
    
    v_recruiter_id uuid;
    v_friend_id uuid;
BEGIN
    -- 1. Najdeme ID náboráře
    SELECT id INTO v_recruiter_id FROM profiles WHERE email = v_recruiter_email;
    
    -- 2. Najdeme ID kamaráda
    SELECT id INTO v_friend_id FROM profiles WHERE email = v_friend_email;

    -- Kontrola
    IF v_recruiter_id IS NULL THEN
        RAISE EXCEPTION 'Nenašel jsem hlavní účet s emailem: %', v_recruiter_email;
    END IF;
    
    IF v_friend_id IS NULL THEN
        RAISE EXCEPTION 'Nenašel jsem účet kamaráda s emailem: %', v_friend_email;
    END IF;

    -- 3. Provedeme propojení
    UPDATE profiles 
    SET referred_by = v_recruiter_id 
    WHERE id = v_friend_id;

    RAISE NOTICE 'Úspěšně propojeno! % je nyní veden jako doporučený uživatelem %', v_friend_email, v_recruiter_email;
    
END $$;
