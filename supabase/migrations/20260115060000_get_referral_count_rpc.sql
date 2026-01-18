-- FIX: RLS prevents Referrers from seeing Referees' transactions.
-- Solution: Use a SECURITY DEFINER function to count valid referrals.

CREATE OR REPLACE FUNCTION public.get_referral_count(p_referrer_id uuid)
RETURNS integer AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT count(*)
    INTO v_count
    FROM profiles p
    WHERE p.referred_by = p_referrer_id
    AND EXISTS (
        SELECT 1 FROM transactions t 
        WHERE t.user_id = p.id 
        AND t.status = 'completed'
    );
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
