import { supabase } from './supabase';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    energy_reward?: number;
}

export const checkAndUnlockAchievement = async (userId: string, achievementId: string): Promise<Achievement | null> => {
    try {
        // 1. Check if already unlocked
        const { data: existing } = await supabase
            .from('user_achievements')
            .select('unlocked_at')
            .eq('user_id', userId)
            .eq('achievement_id', achievementId)
            .single();

        if (existing) return null; // Already unlocked

        // 2. Get achievement details
        const { data: achievement } = await supabase
            .from('achievements')
            .select('id, title, description, icon, energy_reward')
            .eq('id', achievementId)
            .single();

        if (!achievement) return null;

        // 3. Unlock
        const { error } = await supabase
            .from('user_achievements')
            .insert({
                user_id: userId,
                achievement_id: achievementId,
                unlocked_at: new Date().toISOString()
            });

        if (error) throw error;

        return achievement as Achievement; // Return achievement data for toast
    } catch (err) {
        console.error("Error unlocking achievement:", err);
        return null;
    }
};

export const checkBookCountAchievements = async (userId: string): Promise<Achievement[]> => {
    const unlockedAchievements: Achievement[] = [];
    
    const { count } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);
    
    const bookCount = count || 0;
    
    // Check all book count milestones
    if (bookCount >= 1) {
        const ach = await checkAndUnlockAchievement(userId, 'first_book');
        if (ach) unlockedAchievements.push(ach);
    }
    if (bookCount >= 5) {
        const ach = await checkAndUnlockAchievement(userId, 'beginner_writer');
        if (ach) unlockedAchievements.push(ach);
    }
    if (bookCount >= 15) {
        const ach = await checkAndUnlockAchievement(userId, 'creative_genius');
        if (ach) unlockedAchievements.push(ach);
    }
    if (bookCount >= 30) {
        const ach = await checkAndUnlockAchievement(userId, 'story_master');
        if (ach) unlockedAchievements.push(ach);
    }
    if (bookCount >= 50) {
        const ach = await checkAndUnlockAchievement(userId, 'legendary_author');
        if (ach) unlockedAchievements.push(ach);
    }
    
    return unlockedAchievements;
};

export const checkCustomBookAchievements = async (userId: string): Promise<Achievement[]> => {
    const unlockedAchievements: Achievement[] = [];
    
    // Count custom books - they have tier 'basic' or 'premium' and visual_style 'watercolor'
    const { count } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('visual_style', 'watercolor'); // CustomBookEditor uses 'watercolor'
    
    const customCount = count || 0;
    
    // Check custom book milestones
    if (customCount >= 1) {
        const ach = await checkAndUnlockAchievement(userId, 'first_custom');
        if (ach) unlockedAchievements.push(ach);
    }
    if (customCount >= 3) {
        const ach = await checkAndUnlockAchievement(userId, 'custom_creator');
        if (ach) unlockedAchievements.push(ach);
    }
    if (customCount >= 10) {
        const ach = await checkAndUnlockAchievement(userId, 'custom_master');
        if (ach) unlockedAchievements.push(ach);
    }
    if (customCount >= 20) {
        const ach = await checkAndUnlockAchievement(userId, 'custom_legend');
        if (ach) unlockedAchievements.push(ach);
    }
    if (customCount >= 35) {
        const ach = await checkAndUnlockAchievement(userId, 'custom_god');
        if (ach) unlockedAchievements.push(ach);
    }
    
    return unlockedAchievements;
};

