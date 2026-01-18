-- CORRECTION MIGRATION: Enforce 10x Economy on Achievements
-- Run this to fix existing low-value rewards in the database.

BEGIN;

UPDATE public.achievements SET energy_reward = 100 WHERE id IN ('beginner_writer', 'custom_creator', 'card_designer', 'regular_customer', 'energy_investor');
UPDATE public.achievements SET energy_reward = 200 WHERE id IN ('creative_genius', 'custom_master', 'studio_master', 'big_investor', 'big_spender');
UPDATE public.achievements SET energy_reward = 300 WHERE id IN ('story_master', 'custom_legend', 'artistic_soul', 'energy_magnate');
UPDATE public.achievements SET energy_reward = 500 WHERE id IN ('legendary_author', 'custom_god', 'creative_legend', 'energy_king');

-- Also update 'spent' thresholds to match 10x inflation if they were low
UPDATE public.achievements SET threshold = 500 WHERE id = 'first_spend' AND threshold = 50;
UPDATE public.achievements SET threshold = 2000 WHERE id = 'energy_investor' AND threshold = 200;
UPDATE public.achievements SET threshold = 5000 WHERE id = 'big_spender' AND threshold = 500;
UPDATE public.achievements SET threshold = 10000 WHERE id = 'energy_king' AND threshold = 1000;

COMMIT;
