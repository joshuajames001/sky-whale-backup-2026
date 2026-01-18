-- Add or Update Recruiter Achievements
-- Condition: 'referral_count' (Count of referred users who made a purchase)

INSERT INTO public.achievements (id, title, description, icon, condition_type, threshold, energy_reward)
VALUES
('recruiter_novice', 'Lovec Talentů', 'Přivedl jsi prvního kamaráda, který si dobil energii!', '🤝', 'referral_count', 1, 200),
('recruiter_pro', 'Ostřílený Náborář', 'Přivedl jsi 5 kamarádů, kteří si dobili energii.', '📢', 'referral_count', 5, 1000),
('recruiter_elite', 'Velvyslanec Kreativity', 'Přivedl jsi 10 kamarádů, kteří si dobili energii!', '👑', 'referral_count', 10, 2000),
('recruiter_legend', 'Kmotr Komunity', 'Přivedl jsi 25 kamarádů, kteří si dobili energii!', '🏛️', 'referral_count', 25, 5000)
ON CONFLICT (id) DO UPDATE 
SET 
    energy_reward = EXCLUDED.energy_reward,
    description = EXCLUDED.description;
