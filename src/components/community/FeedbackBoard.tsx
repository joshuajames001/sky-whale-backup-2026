import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Bug, Lightbulb, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FeedbackBoardProps {
    onClose: () => void;
}

interface FeedbackItem {
    id: string;
    content: string;
    category: 'feature' | 'bug' | 'general';
    created_at: string;
    is_public: boolean;
    profiles?: {
        username: string;
        avatar_url: string;
    };
}

export const FeedbackBoard: React.FC<FeedbackBoardProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'write' | 'read'>('read');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'feature' | 'bug' | 'general'>('feature');
    const [isPublic, setIsPublic] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch Feedback
    useEffect(() => {
        if (activeTab === 'read') {
            fetchFeedback();
        }
    }, [activeTab]);

    const fetchFeedback = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('feedback')
            .select('*, profiles(username, avatar_url)')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            setFeedbackList(data as any);
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("Musíš být přihlášen!");
            setIsSubmitting(false);
            return;
        }

        const { error } = await supabase.from('feedback').insert({
            user_id: user.id,
            content,
            category,
            is_public: isPublic
        });

        if (!error) {
            setContent('');
            setActiveTab('read'); // Switch to list to see your item
            fetchFeedback();
        } else {
            console.error("Error submitting feedback:", error);
            alert("Něco se pokazilo. Zkus to později.");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-zinc-900/90 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-blue-900/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <MessageSquare className="text-purple-300" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Centrum nápadů</h2>
                            <p className="text-xs text-white/50">Pomoz nám vylepšit Skywhale.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="text-white/60" size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-black/20 mx-6 mt-6 rounded-lg">
                    <button
                        onClick={() => setActiveTab('read')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'read' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
                    >
                        Nápady komunity
                    </button>
                    <button
                        onClick={() => setActiveTab('write')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'write' ? 'bg-purple-600 text-white shadow-purple-500/20 shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                    >
                        + Přidat nápad
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'read' ? (
                            <motion.div
                                key="read"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                {loading ? (
                                    <div className="text-center py-12 text-white/30">Načítám nápady...</div>
                                ) : feedbackList.length === 0 ? (
                                    <div className="text-center py-12 text-white/30 flex flex-col items-center gap-4">
                                        <Lightbulb size={48} className="opacity-20" />
                                        <p>Zatím žádné nápady. Buď první!</p>
                                    </div>
                                ) : (
                                    feedbackList.map((item) => (
                                        <div key={item.id} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getCategoryIcon(item.category)}
                                                    <span className="text-xs font-bold uppercase tracking-wider text-white/50">{getCategoryLabel(item.category)}</span>
                                                </div>
                                                <span className="text-xs text-white/30">{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                        {item.profiles?.username?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="text-xs text-white/40">{item.profiles?.username || 'Anonym'}</span>
                                                </div>
                                                {/* Future: Voting Mechanism */}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="write"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Category Selection */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'feature', icon: Lightbulb, label: 'Nová Funkce', color: 'text-yellow-300' },
                                        { id: 'bug', icon: Bug, label: 'Chyba', color: 'text-red-400' },
                                        { id: 'general', icon: Heart, label: 'Láska / Jiné', color: 'text-pink-400' }
                                    ].map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCategory(cat.id as any)}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${category === cat.id
                                                ? 'bg-white/10 border-white/40 shadow-lg'
                                                : 'bg-black/20 border-white/5 hover:bg-white/5'
                                                }`}
                                        >
                                            <cat.icon className={cat.color} size={24} />
                                            <span className="text-xs font-bold text-white/70">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Text Area */}
                                <div className="space-y-2">
                                    <label className="text-sm text-white/60 font-medium pl-1">Co máš na srdci?</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder={category === 'feature' ? "Chtěl bych, aby..." : category === 'bug' ? "Nefunguje mi..." : "Líbí se mi..."}
                                        className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 resize-none text-sm"
                                    />
                                </div>

                                {/* Public Toggle */}
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                                    <input
                                        type="checkbox"
                                        id="public"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-purple-600 focus:ring-purple-500"
                                    />
                                    <label htmlFor="public" className="text-sm text-white/70 cursor-pointer select-none">
                                        Zveřejnit pro ostatní (anonymně)
                                    </label>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !content.trim()}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={18} /> Odeslat
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

// Helpers
const getCategoryIcon = (cat: string) => {
    switch (cat) {
        case 'feature': return <Lightbulb size={14} className="text-yellow-300" />;
        case 'bug': return <Bug size={14} className="text-red-400" />;
        default: return <Heart size={14} className="text-pink-400" />;
    }
};

const getCategoryLabel = (cat: string) => {
    switch (cat) {
        case 'feature': return 'Nová Funkce';
        case 'bug': return 'Nahlášená Chyba';
        default: return 'Zpráva';
    }
};
