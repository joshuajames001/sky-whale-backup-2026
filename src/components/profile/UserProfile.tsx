import { motion } from 'framer-motion';
import { Trophy, Book, Star, Zap, User as UserIcon, Lock, Plus, LogOut, Edit2, Calendar, TrendingUp, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useEnergy } from '../../hooks/useEnergy';
import { AvatarPicker } from './AvatarPicker';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    condition_type: string;
    threshold: number;
    unlocked_at?: string;
}

interface UserProfileProps {
    user: any;
    onBack: () => void;
    onLogin?: () => void;
    onLogout?: () => void;
    onNavigate?: (view: any) => void;
}

export const UserProfile = ({ user, onBack, onLogin, onLogout, onNavigate }: UserProfileProps) => {
    const { balance } = useEnergy();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [stats, setStats] = useState({
        booksCount: 0,
        customBooksCount: 0,
        longestBook: 0,
        favoriteStyle: 'Neznámý',
        memberSince: null as Date | null,
        referralCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [nickname, setNickname] = useState('');
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [tempNickname, setTempNickname] = useState('');
    const [avatarEmoji, setAvatarEmoji] = useState('👤');
    const [level, setLevel] = useState(1);

    const [referralCode, setReferralCode] = useState<string | null>(null);

    // Calculate level based on unlocked achievements
    const calculateLevel = (unlockedCount: number): number => {
        if (unlockedCount >= 50) return 8;
        if (unlockedCount >= 40) return 7;
        if (unlockedCount >= 30) return 6;
        if (unlockedCount >= 20) return 5;
        if (unlockedCount >= 15) return 4;
        if (unlockedCount >= 10) return 3;
        if (unlockedCount >= 5) return 2;
        return 1;
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch Profile Data
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('nickname, avatar_emoji, created_at, referral_code, subscription_status, next_energy_grant')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setNickname(profile.nickname || '');
                    setAvatarEmoji(profile.avatar_emoji || '👤');
                    setReferralCode(profile.referral_code || null);
                    setStats(prev => ({ ...prev, memberSince: profile.created_at ? new Date(profile.created_at) : null }));
                }

                // 2. Fetch Book Stats
                const { count: booksCount } = await supabase
                    .from('books')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', user.id);

                // 3. Fetch Custom Books Count
                const { count: customBooksCount } = await supabase
                    .from('books')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', user.id)
                    .eq('visual_style', 'watercolor');

                // 4. Fetch Books with Pages for longest book
                const { data: books } = await supabase
                    .from('books')
                    .select('id, pages(count)')
                    .eq('owner_id', user.id);

                const longestBook = books?.reduce((max, book: any) => {
                    const pageCount = book.pages?.[0]?.count || 0;
                    return pageCount > max ? pageCount : max;
                }, 0) || 0;

                // 5. Fetch Most Used Style
                const { data: styleData } = await supabase
                    .from('books')
                    .select('visual_style')
                    .eq('owner_id', user.id);

                const styleCounts: Record<string, number> = {};
                styleData?.forEach((book: any) => {
                    const style = book.visual_style || 'Neznámý';
                    styleCounts[style] = (styleCounts[style] || 0) + 1;
                });

                const favoriteStyle = Object.keys(styleCounts).length > 0
                    ? Object.keys(styleCounts).reduce((a, b) => styleCounts[a] > styleCounts[b] ? a : b)
                    : 'Neznámý';

                setStats({
                    booksCount: booksCount || 0,
                    customBooksCount: customBooksCount || 0,
                    longestBook,
                    favoriteStyle,
                    memberSince: profile?.created_at ? new Date(profile.created_at) : null,
                    referralCount: 0 // Placeholder
                });

                // 5.5 Fetch Referral Count (Securely using RPC)
                const { data: referralCount, error: refError } = await supabase
                    .rpc('get_referral_count', { p_referrer_id: user.id });

                if (refError) console.error("Referral Count Error:", refError);

                setStats(prev => ({ ...prev, referralCount: referralCount || 0 }));


                // 6. Subscription Info
                setStats(prev => ({
                    ...prev,
                    subscription: {
                        status: profile?.subscription_status,
                        nextGrant: profile?.next_energy_grant
                    }
                }));

                // 7. Fetch Achievements
                const { data: allAchievements } = await supabase
                    .from('achievements')
                    .select('*');

                const { data: userUnlocks } = await supabase
                    .from('user_achievements')
                    .select('achievement_id, unlocked_at')
                    .eq('user_id', user.id);

                const merged = (allAchievements || []).map(ach => {
                    const unlock = userUnlocks?.find(u => u.achievement_id === ach.id);
                    return {
                        ...ach,
                        unlocked_at: unlock ? unlock.unlocked_at : undefined
                    };
                });

                setAchievements(merged);

                // Calculate and set level
                const unlockedCount = merged.filter(a => a.unlocked_at).length;
                setLevel(calculateLevel(unlockedCount));

            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [user]);

    const handleAvatarChange = async (emoji: string) => {
        setAvatarEmoji(emoji);
        if (user) {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    avatar_emoji: emoji
                }, {
                    onConflict: 'id'
                });

            if (error) {
                console.error('Error saving avatar:', error);
            }
        }
    };

    const handleNicknameEdit = () => {
        setTempNickname(nickname);
        setIsEditingNickname(true);
    };

    const handleNicknameSave = async () => {
        if (user && tempNickname.trim()) {
            setNickname(tempNickname);
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    nickname: tempNickname
                }, {
                    onConflict: 'id'
                });

            if (error) {
                console.error('Error saving nickname:', error);
            }
        }
        setIsEditingNickname(false);
    };

    const handleNicknameCancel = () => {
        setTempNickname('');
        setIsEditingNickname(false);
    };

    return (
        <div className="h-screen w-full relative overflow-y-auto bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 text-slate-800 font-sans custom-scrollbar">
            {/* Playful Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Clouds */}
                <div className="absolute top-10 left-10 text-6xl opacity-40">☁️</div>
                <div className="absolute top-32 right-20 text-5xl opacity-30">☁️</div>
                <div className="absolute top-64 left-1/3 text-7xl opacity-20">☁️</div>
                {/* Stars */}
                <div className="absolute top-20 right-1/4 text-3xl animate-pulse">⭐</div>
                <div className="absolute top-96 left-1/4 text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
                <div className="absolute bottom-32 right-1/3 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>🌟</div>
            </div>

            {/* Header / Nav */}
            <div className="absolute top-6 left-6 z-50">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider text-xs font-bold bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
                >
                    ← Zpět
                </button>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-8 pt-24">

                {/* 1. Identity Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col md:flex-row items-center gap-8 mb-16"
                >
                    {/* AVATAR */}
                    <div className="relative group">
                        <button
                            onClick={() => user && setShowAvatarPicker(true)}
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 p-1.5 shadow-2xl shadow-purple-300/50 hover:scale-105 hover:rotate-3 transition-all cursor-pointer relative"
                        >
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center border-4 border-white overflow-hidden text-6xl md:text-7xl shadow-inner">
                                {avatarEmoji}
                            </div>
                            {/* Edit icon overlay */}
                            {user && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-pink-500/80 to-purple-500/80 rounded-full pointer-events-none">
                                    <Edit2 size={24} className="text-white drop-shadow-lg" />
                                </div>
                            )}
                        </button>
                        {user && (
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-400 border-2 border-white px-3 py-1 rounded-full text-xs font-black text-white shadow-lg">
                                LVL {level} ⭐
                            </div>
                        )}
                    </div>

                    {/* INFO */}
                    <div className="text-center md:text-left flex-1 flex flex-col items-center md:items-start">
                        {/* Nickname/Email */}
                        {isEditingNickname ? (
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={tempNickname}
                                    onChange={(e) => setTempNickname(e.target.value)}
                                    className="bg-white text-slate-800 text-3xl font-black px-4 py-2 rounded-2xl border-2 border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-200 shadow-lg"
                                    placeholder="Tvoje přezdívka"
                                    autoFocus
                                />
                                <button onClick={handleNicknameSave} className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded-2xl shadow-lg hover:scale-105 transition-transform">
                                    <Check size={20} />
                                </button>
                                <button onClick={handleNicknameCancel} className="p-3 bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white rounded-2xl shadow-lg hover:scale-105 transition-transform">
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                                    {nickname || user?.email?.split('@')[0] || "Anonymní Návštěvník"}
                                </h1>
                                {user && (
                                    <button
                                        onClick={handleNicknameEdit}
                                        className="p-2 hover:bg-purple-100 rounded-xl transition-colors text-purple-400 hover:text-purple-600"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                        <p className="text-slate-600 text-lg mb-6 font-semibold">{user ? "Novic Spisovatel 📖" : "Pro uložení postupu se prosím přihlas"}</p>

                        {!user && onLogin && (
                            <button
                                onClick={onLogin}
                                className="mb-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                            >
                                Přihlásit se
                            </button>
                        )}

                        {user && onLogout && (
                            <button
                                onClick={onLogout}
                                className="mb-6 px-6 py-2 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 font-bold rounded-full border-2 border-red-200 hover:border-red-400 transition-all text-sm flex items-center gap-2 shadow-lg"
                            >
                                <LogOut size={14} /> Odhlásit se
                            </button>
                        )}

                        {/* Stats Row */}
                        {user && (
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div
                                    className="bg-white border-2 border-amber-200 px-6 py-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-amber-400 hover:shadow-xl transition-all hover:scale-105"
                                    onClick={() => onNavigate && onNavigate('energy_store')}
                                >
                                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-xl text-white shadow-lg">
                                        <Zap size={20} className="fill-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs text-amber-600 font-bold uppercase tracking-wider flex items-center gap-1">
                                            Energie <Plus size={10} className="text-amber-500" />
                                        </div>
                                        <div className="text-xl font-black text-slate-800">{balance || 0}</div>
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-purple-200 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
                                    <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-2 rounded-xl text-white shadow-lg">
                                        <Book size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs text-purple-600 font-bold uppercase tracking-wider">Příběhy</div>
                                        <div className="text-xl font-black text-slate-800">{stats.booksCount}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 2. Detailed Statistics */}
                {user && (
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.05 }}
                        className="mb-16"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <TrendingUp className="text-blue-500" size={28} />
                            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Statistiky</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white border-2 border-green-200 p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                <div className="text-xs text-green-600 font-bold uppercase mb-1">Vlastní Knihy</div>
                                <div className="text-2xl font-black text-slate-800">{stats.customBooksCount}</div>
                            </div>
                            <div className="bg-white border-2 border-blue-200 p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                <div className="text-xs text-blue-600 font-bold uppercase mb-1">Nejdelší Kniha</div>
                                <div className="text-2xl font-black text-slate-800">{stats.longestBook} str.</div>
                            </div>
                            <div className="bg-white border-2 border-pink-200 p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                <div className="text-xs text-pink-600 font-bold uppercase mb-1">Oblíbený Styl</div>
                                <div className="text-lg font-black text-slate-800 truncate">{stats.favoriteStyle}</div>
                            </div>
                            <div className="bg-white border-2 border-purple-200 p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                <div className="text-xs text-purple-600 font-bold uppercase mb-1 flex items-center gap-1">
                                    <Calendar size={12} /> Člen Od
                                </div>
                                <div className="text-lg font-black text-slate-800">
                                    {stats.memberSince ? new Date(stats.memberSince).toLocaleDateString('cs-CZ', { month: 'short', year: 'numeric' }) : '-'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 1.5 Subscription Status & Monthly Claim */}
                {user && (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.02 }}
                        className="mb-16"
                    >
                        {/* Only show if user has ever had a subscription or active one */}
                        {(stats as any).subscription?.status === 'active' || (stats as any).subscription?.status === 'past_due' ? (
                            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                                {/* Background Glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                            <div className="bg-indigo-500/30 p-2 rounded-lg">
                                                <Calendar size={20} className="text-indigo-300" />
                                            </div>
                                            <span className="text-indigo-300 font-bold uppercase tracking-wider text-sm">Předplatné</span>
                                            <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Aktivní</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-1">Měsíční Příděl Energie</h3>
                                        <p className="text-indigo-200/80 text-sm">
                                            {(stats as any).subscription?.nextGrant && new Date((stats as any).subscription.nextGrant) <= new Date()
                                                ? "Tvoje dávka energie je připravena k vyzvednutí!"
                                                : `Další příděl energie bude dostupný ${new Date((stats as any).subscription.nextGrant).toLocaleDateString()}.`}
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <div>
                                        {(stats as any).subscription?.nextGrant && new Date((stats as any).subscription.nextGrant) <= new Date() ? (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { data, error } = await supabase.rpc('claim_monthly_energy');
                                                        if (error) throw error;
                                                        if (data?.success) {
                                                            alert(`🎉 Energie připsána! Získáváš ${data.energy_added} Energie.`);
                                                            // Refresh profile to update balance and date
                                                            window.location.reload();
                                                        } else {
                                                            alert("Něco se pokazilo: " + (data?.message || "Neznámá chyba"));
                                                        }
                                                    } catch (e: any) {
                                                        console.error("Claim Error:", e);
                                                        alert("Chyba při nárokování energie: " + e.message);
                                                    }
                                                }}
                                                className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                            >
                                                <Zap size={20} className="fill-white" /> Nárokovat Energii
                                            </button>
                                        ) : (
                                            <button disabled className="px-8 py-3 bg-white/10 text-white/40 font-bold rounded-xl border border-white/5 cursor-not-allowed flex items-center gap-2">
                                                <Lock size={16} />
                                                Brzy dostupné
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                )}

                {/* 3. Referral Program (NEW) */}
                {user && (
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.08 }}
                        className="mb-16"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <Star className="text-yellow-400" size={28} />
                            <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Pozvi Přátele</h2>
                        </div>

                        <div className="bg-white/80 backdrop-blur-md border-2 border-yellow-200 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/20 transition-all" />

                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Sdílej radost z tvoření!</h3>
                                    <p className="text-slate-600 mb-4">
                                        Pošli svůj unikátní kód přátelům. Když se zaregistrují, získáte oba extra Energii! ⚡
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-2 font-mono text-lg font-bold tracking-widest text-slate-700 select-all">
                                            {referralCode ? `${window.location.origin}/?ref=${referralCode}` : 'Načítám...'}
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (referralCode) {
                                                    const link = `${window.location.origin}/?ref=${referralCode}`;
                                                    navigator.clipboard.writeText(link);
                                                    alert("Odkaz zkopírován! 📋");
                                                }
                                            }}
                                            className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-xl shadow-md transition-all hover:scale-105 disabled:opacity-50"
                                            disabled={!referralCode}
                                        >
                                            Zkopírovat Odkaz
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full md:w-auto flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-bold bg-white/50 px-3 py-1 rounded-full">
                                        <span>👯 Přivedeno přátel:</span>
                                        <span className="text-yellow-600 text-lg">{stats.referralCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 4. Achievements Grid */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-3 mb-8">
                        <Trophy className="text-amber-500" size={28} />
                        <h2 className="text-2xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Úspěchy</h2>
                        <span className="ml-auto text-sm text-slate-600 font-bold bg-white px-3 py-1 rounded-full shadow-md">
                            {achievements.filter(a => a.unlocked_at).length} / {achievements.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-32 bg-white/50 rounded-2xl animate-pulse" />)
                        ) : achievements.map((ach) => {
                            const isUnlocked = !!ach.unlocked_at;

                            let progress = 0;
                            let progressText = '';
                            if (!isUnlocked && ach.condition_type === 'book_count') {
                                progress = Math.min((stats.booksCount / ach.threshold) * 100, 100);
                                progressText = `${stats.booksCount}/${ach.threshold}`;
                            } else if (!isUnlocked && ach.condition_type === 'referral_count') {
                                progress = Math.min(((stats.referralCount || 0) / ach.threshold) * 100, 100);
                                progressText = `${(stats.referralCount || 0)}/${ach.threshold}`;
                            }

                            return (
                                <div
                                    key={ach.id}
                                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 shadow-lg hover:shadow-xl ${isUnlocked
                                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
                                        : 'bg-white/60 border-slate-200 opacity-70'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md ${isUnlocked ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white' : 'bg-slate-100'
                                            }`}>
                                            {isUnlocked ? ach.icon : <Lock size={20} className="text-slate-400" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold mb-1 ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                                                {ach.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 leading-tight">
                                                {ach.description}
                                            </p>

                                            {!isUnlocked && progress > 0 && (
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs text-slate-600 font-bold">{progressText}</span>
                                                        <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isUnlocked && (
                                        <div className="absolute top-4 right-4 text-amber-400/30">
                                            <Star size={64} className="fill-current rotate-12" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

            </div>

            {/* Avatar Picker Modal */}
            {showAvatarPicker && (
                <AvatarPicker
                    currentAvatar={avatarEmoji}
                    onSelect={handleAvatarChange}
                    onClose={() => setShowAvatarPicker(false)}
                />
            )}
        </div>
    );
};
