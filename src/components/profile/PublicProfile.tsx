import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Book, Trophy, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { StoryBook } from '../../types';

interface PublicProfileProps {
    userId: string;
    onClose: () => void;
    onOpenBook: (book: StoryBook) => void;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked_at?: string;
}

export const PublicProfile = ({ userId, onClose, onOpenBook }: PublicProfileProps) => {
    const [profile, setProfile] = useState<any>(null);
    const [books, setBooks] = useState<StoryBook[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [level, setLevel] = useState(1);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Fetch profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, nickname, avatar_emoji, created_at')
                    .eq('id', userId)
                    .single();

                setProfile(profileData);

                // Fetch public books
                const { data: booksData } = await supabase
                    .from('books')
                    .select('*, pages(*)')
                    .eq('owner_id', userId)
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });

                setBooks((booksData || []).map((book: any) => ({
                    ...book,
                    book_id: book.id,
                    cover_image: book.cover_image_url,
                    author_id: book.owner_id,
                    author_profile: profileData, // We already fetched profile data
                    pages: (book.pages || [])
                        .sort((a: any, b: any) => (a.page_number ?? a.page_index) - (b.page_number ?? b.page_index))
                        .map((p: any) => ({
                            ...p,
                            page_number: p.page_number || p.page_index,
                            text: p.content,
                            is_generated: !!p.image_url,
                            layout_type: p.layout_type || 'standard'
                        }))
                })));

                // Fetch achievements
                const { data: achievementsData } = await supabase
                    .from('user_achievements')
                    .select(`
                        achievement_id,
                        unlocked_at,
                        achievements(id, title, description, icon)
                    `)
                    .eq('user_id', userId);

                const unlockedAchievements = (achievementsData || []).map((ua: any) => ({
                    ...ua.achievements,
                    unlocked_at: ua.unlocked_at
                }));

                setAchievements(unlockedAchievements);

                // Calculate level
                const unlockedCount = unlockedAchievements.length;
                if (unlockedCount >= 50) setLevel(8);
                else if (unlockedCount >= 40) setLevel(7);
                else if (unlockedCount >= 30) setLevel(6);
                else if (unlockedCount >= 20) setLevel(5);
                else if (unlockedCount >= 15) setLevel(4);
                else if (unlockedCount >= 10) setLevel(3);
                else if (unlockedCount >= 5) setLevel(2);
                else setLevel(1);

            } catch (err) {
                console.error('Error fetching public profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
                <div className="text-white text-xl">Načítání profilu...</div>
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
                    >
                        <X size={24} className="text-slate-700" />
                    </button>

                    {/* Header */}
                    <div className="text-center pt-12 pb-8 px-8">
                        {/* Avatar */}
                        <div className="relative inline-block mb-4">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 p-1.5 shadow-2xl">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-6xl">
                                    {profile?.avatar_emoji || '👤'}
                                </div>
                            </div>
                            {/* Level Badge */}
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-400 border-2 border-white px-3 py-1 rounded-full text-xs font-black text-white shadow-lg">
                                LVL {level} ⭐
                            </div>
                        </div>

                        {/* Name */}
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                            {profile?.nickname || 'Anonymní Autor'}
                        </h2>

                        {/* Stats */}
                        <div className="flex justify-center gap-6 mt-6">
                            <div className="bg-white rounded-2xl px-6 py-3 shadow-lg border-2 border-green-200">
                                <div className="flex items-center gap-2 text-green-700">
                                    <Book size={20} />
                                    <span className="font-bold">{books.length} Veřejných Knih</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl px-6 py-3 shadow-lg border-2 border-blue-200">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Calendar size={20} />
                                    <span className="font-bold">
                                        Člen Od {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' }) : 'Neznámo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Books Section */}
                    <div className="px-8 pb-8">
                        <h3 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <Book size={24} />
                            Veřejné Knihy
                        </h3>
                        {books.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                Tento autor zatím nemá žádné veřejné knihy.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {books.map((book) => (
                                    <motion.div
                                        key={book.book_id}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => onOpenBook(book)}
                                        className="cursor-pointer bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                                    >
                                        <div className="aspect-[2/3] relative">
                                            {book.cover_image ? (
                                                <img
                                                    src={book.cover_image}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                                                    <Book size={48} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-bold text-sm text-slate-800 truncate">{book.title}</h4>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Achievements Section */}
                    <div className="px-8 pb-8">
                        <h3 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <Trophy size={24} />
                            Úspěchy
                        </h3>
                        {achievements.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                Zatím žádné odemčené úspěchy.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {achievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200 shadow-lg relative overflow-hidden"
                                    >
                                        {/* Golden star watermark */}
                                        <div className="absolute top-2 right-2 text-6xl opacity-10">⭐</div>

                                        <div className="flex items-start gap-3 relative z-10">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg">
                                                {achievement.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-slate-800">{achievement.title}</h4>
                                                <p className="text-sm text-slate-600">{achievement.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
