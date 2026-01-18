-- FORCE INFLATION: Update all achievements to High-Incentive Values (10x - 20x)
-- Run this to verify and enforce generous rewards.

BEGIN;

-- 1. WRITING ACHIEVEMENTS
UPDATE public.achievements SET energy_reward = 50 WHERE id = 'first_book';          -- Was 0/5
UPDATE public.achievements SET energy_reward = 200 WHERE id = 'beginner_writer';    -- Was 100
UPDATE public.achievements SET energy_reward = 500 WHERE id = 'creative_genius';    -- Was 200
UPDATE public.achievements SET energy_reward = 1000 WHERE id = 'story_master';      -- Was 300
UPDATE public.achievements SET energy_reward = 2500 WHERE id = 'legendary_author';  -- Was 500

-- 2. CUSTOM CREATION
UPDATE public.achievements SET energy_reward = 50 WHERE id = 'first_custom';
UPDATE public.achievements SET energy_reward = 200 WHERE id = 'custom_master';
UPDATE public.achievements SET energy_reward = 500 WHERE id = 'creative_craftsman';
UPDATE public.achievements SET energy_reward = 1000 WHERE id = 'artistic_visionary';

-- 3. STUDIO / CARDS
UPDATE public.achievements SET energy_reward = 50 WHERE id = 'first_sticker';
UPDATE public.achievements SET energy_reward = 150 WHERE id = 'card_designer';
UPDATE public.achievements SET energy_reward = 300 WHERE id = 'studio_master';      -- Was 200
UPDATE public.achievements SET energy_reward = 500 WHERE id = 'artistic_soul';
UPDATE public.achievements SET energy_reward = 1000 WHERE id = 'creative_legend';

-- 4. SPENDING / INVESTING
UPDATE public.achievements SET energy_reward = 0 WHERE id = 'first_recharge';
UPDATE public.achievements SET energy_reward = 150 WHERE id = 'regular_customer';
UPDATE public.achievements SET energy_reward = 300 WHERE id = 'big_investor';
UPDATE public.achievements SET energy_reward = 500 WHERE id = 'energy_tycoon';

UPDATE public.achievements SET energy_reward = 0 WHERE id = 'first_spend';
UPDATE public.achievements SET energy_reward = 150 WHERE id = 'energy_investor';
UPDATE public.achievements SET energy_reward = 300 WHERE id = 'big_spender';
UPDATE public.achievements SET energy_reward = 500 WHERE id = 'energy_king';

-- 5. REFERRALS (Recruiter) - High Incentive to Share
UPDATE public.achievements SET energy_reward = 250 WHERE id = 'recruiter_novice';   -- 1 Friend
UPDATE public.achievements SET energy_reward = 1500 WHERE id = 'recruiter_pro';     -- 5 Friends
UPDATE public.achievements SET energy_reward = 3500 WHERE id = 'recruiter_elite';   -- 10 Friends
UPDATE public.achievements SET energy_reward = 10000 WHERE id = 'recruiter_legend'; -- 25 Friends

COMMIT;
