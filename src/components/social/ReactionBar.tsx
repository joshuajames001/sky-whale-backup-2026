import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface Reaction {
    type: 'heart' | 'star' | 'fire' | 'clap' | 'rocket';
    count: number;
    userReacted: boolean;
}

const REACTION_ICONS = {
    heart: '❤️',
    star: '⭐',
    fire: '🔥',
    clap: '👏',
    rocket: '🚀'
};

interface ReactionBarProps {
    bookId: string;
    showCount?: boolean;
}

export const ReactionBar = ({ bookId, showCount = true }: ReactionBarProps) => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [reactions, setReactions] = useState<Reaction[]>([
        { type: 'heart', count: 0, userReacted: false },
        { type: 'star', count: 0, userReacted: false },
        { type: 'fire', count: 0, userReacted: false },
        { type: 'clap', count: 0, userReacted: false },
        { type: 'rocket', count: 0, userReacted: false }
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get current user first
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        getUser();
    }, []);

    useEffect(() => {
        if (!currentUserId) return; // Wait for user info
        fetchReactions();

        // Subscribe to changes
        const subscription = supabase
            .channel(`public:book_reactions:book_id=eq.${bookId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'book_reactions',
                filter: `book_id=eq.${bookId}`
            }, () => {
                fetchReactions();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [bookId, currentUserId]);

    const fetchReactions = async () => {
        try {
            // Get all reactions for this book
            const { data, error } = await supabase
                .from('book_reactions')
                .select('reaction_type, user_id')
                .eq('book_id', bookId);

            if (error) console.error('Error fetching reactions:', error);

            if (data) {
                const newReactions = reactions.map(r => {
                    const typeReactions = data.filter((d: any) => d.reaction_type === r.type);
                    return {
                        ...r,
                        count: typeReactions.length,
                        userReacted: currentUserId ? typeReactions.some((d: any) => d.user_id === currentUserId) : false
                    };
                });
                setReactions(newReactions);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReact = async (type: string) => {
        if (!currentUserId) return; // Must be logged in

        const currentReaction = reactions.find(r => r.type === type);
        if (!currentReaction) return;

        // Optimistic update
        setReactions(prev => prev.map(r =>
            r.type === type
                ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
                : r
        ));

        if (currentReaction.userReacted) {
            // Remove reaction
            await supabase
                .from('book_reactions')
                .delete()
                .eq('book_id', bookId)
                .eq('user_id', currentUserId)
                .eq('reaction_type', type);
        } else {
            // Add reaction
            await supabase
                .from('book_reactions')
                .insert({
                    book_id: bookId,
                    user_id: currentUserId,
                    reaction_type: type
                });
        }
    };

    if (loading) return <div className="h-6" />;

    return (
        <div className="flex items-center gap-1 mt-3 w-full justify-start px-0">
            {reactions.map((reaction) => (
                <motion.button
                    key={reaction.type}
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleReact(reaction.type);
                    }}
                    className={`
                        relative group flex flex-col items-center justify-center p-1.5 rounded-xl transition-all
                        ${reaction.userReacted ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'}
                    `}
                >
                    <span className="text-base filter drop-shadow-lg grayscale-[0.3] group-hover:grayscale-0 transition-all">
                        {REACTION_ICONS[reaction.type]}
                    </span>
                    {showCount && reaction.count > 0 && (
                        <span className={`
                            text-[9px] font-bold mt-0.5
                            ${reaction.userReacted ? 'text-white' : 'text-slate-500'}
                        `}>
                            {reaction.count}
                        </span>
                    )}
                </motion.button>
            ))}
        </div>
    );
};
