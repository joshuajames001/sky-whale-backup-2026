-- Add energy_reward column to achievements table
ALTER TABLE achievements 
ADD COLUMN IF NOT EXISTS energy_reward INTEGER DEFAULT 0;

-- Create function to award energy when achievement is unlocked
CREATE OR REPLACE FUNCTION award_achievement_energy()
RETURNS TRIGGER AS $$
DECLARE
    v_reward INTEGER;
BEGIN
    -- Get energy reward for this achievement
    SELECT energy_reward INTO v_reward
    FROM achievements
    WHERE id = NEW.achievement_id;
    
    -- Add energy to user's balance if reward > 0
    IF v_reward > 0 THEN
        UPDATE profiles
        SET energy_balance = energy_balance + v_reward
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_achievement_unlocked_award_energy ON user_achievements;

-- Create trigger on user_achievements insert
CREATE TRIGGER on_achievement_unlocked_award_energy
AFTER INSERT ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION award_achievement_energy();

-- Update existing achievements with energy rewards
-- Book count category (5 milestones)
UPDATE achievements SET energy_reward = 0 WHERE id = 'first_book';           -- 1st
UPDATE achievements SET energy_reward = 100 WHERE id = 'beginner_writer';     -- 2nd
UPDATE achievements SET energy_reward = 200 WHERE id = 'creative_genius';     -- 3rd
UPDATE achievements SET energy_reward = 300 WHERE id = 'story_master';        -- 4th
UPDATE achievements SET energy_reward = 500 WHERE id = 'legendary_author';    -- 5th

-- Custom books category (4 milestones)
UPDATE achievements SET energy_reward = 0 WHERE id = 'first_custom';         -- 1st
UPDATE achievements SET energy_reward = 100 WHERE id = 'custom_master';       -- 2nd
UPDATE achievements SET energy_reward = 200 WHERE id = 'creative_craftsman';  -- 3rd
UPDATE achievements SET energy_reward = 300 WHERE id = 'artistic_visionary';  -- 4th

-- Stickers category (5 milestones)
UPDATE achievements SET energy_reward = 0 WHERE id = 'first_sticker';        -- 1st
UPDATE achievements SET energy_reward = 100 WHERE id = 'card_designer';       -- 2nd
UPDATE achievements SET energy_reward = 200 WHERE id = 'studio_master';       -- 3rd
UPDATE achievements SET energy_reward = 300 WHERE id = 'artistic_soul';       -- 4th
UPDATE achievements SET energy_reward = 500 WHERE id = 'creative_legend';     -- 5th

-- Energy purchased category (4 milestones)
UPDATE achievements SET energy_reward = 0 WHERE id = 'first_recharge';       -- 1st
UPDATE achievements SET energy_reward = 100 WHERE id = 'regular_customer';    -- 2nd
UPDATE achievements SET energy_reward = 200 WHERE id = 'big_investor';        -- 3rd
UPDATE achievements SET energy_reward = 300 WHERE id = 'energy_tycoon';       -- 4th

-- Energy spent category (4 milestones)
UPDATE achievements SET energy_reward = 0 WHERE id = 'first_spend';          -- 1st
UPDATE achievements SET energy_reward = 100 WHERE id = 'energy_investor';     -- 2nd
UPDATE achievements SET energy_reward = 200 WHERE id = 'big_spender';         -- 3rd
UPDATE achievements SET energy_reward = 300 WHERE id = 'energy_king';         -- 4th
