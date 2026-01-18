-- 10x ENERGY INFLATION MIGRATION
-- Multiplies all existing user balances and achievement rewards by 10

BEGIN;

-- 1. Inflate User Balances
UPDATE public.profiles
SET energy_balance = energy_balance * 10;

-- 2. Inflate Achievement Rewards
UPDATE public.achievements
SET energy_reward = energy_reward * 10;

COMMIT;
