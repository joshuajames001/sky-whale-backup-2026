import { useState, useEffect, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { StoryBook } from '../types';
import { BookOpen, AlertCircle, Loader2, Calendar, MoreVertical, Globe, Lock, Trash2, Heart, Headphones } from 'lucide-react';
import { ReactionBar } from './social/ReactionBar';
import { supabase } from '../lib/supabase';
import { MiniPlayer } from './audio/MiniPlayer';

interface BookCardProps {
    book: StoryBook;
    onClick: (book: StoryBook) => void;
    onHover?: (book: StoryBook | null) => void;
    index: number;
    onTogglePublic?: (bookId: string, currentStatus: boolean) => void;
    onDelete?: (bookId: string) => void;
    showMenu?: boolean; // Only show menu for user's own books
    onAuthorClick?: () => void; // Click handler for author name/avatar
    showReactions?: boolean; // Show emoji reaction bar
    isFavorited?: boolean;
    onToggleFavorite?: (bookId: string) => void;
    onGenerateAudio?: (bookId: string) => void;
}

const BookCardBase = ({
    book,
    onClick,
    onHover,
    index,
    onTogglePublic,
    onDelete,
    showMenu = false,
    onAuthorClick,
    showReactions = false,
    isFavorited = false,
    onToggleFavorite,
    onGenerateAudio
}: BookCardProps) => {
    const [showDropdown, setShowDropdown] = useState(false);

    // Removed internal favorite fetching logic to prevent request storm


    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseEnter = () => {
        onHover?.(book);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        onHover?.(null);
    };

    // Optimization & Format Helpers
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('cs-CZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getOptimizedUrl = (url: string | null) => {
        if (!url) return null;
        if (url.includes('supabase.co')) {
            return `${url}?width=400&quality=80&format=webp`;
        }
        return url;
    };

    // Image Loader State
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Fallback Color Generator (Consistent Random)
    const getFallbackColor = (seedString: string) => {
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    const fallbackColor = getFallbackColor(book.title || 'book');

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
            style={{
                perspective: 1000,
            }}
            className="w-full h-full transform-gpu backface-hidden will-change-transform"
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => onClick(book)}
                whileHover={{ scale: 1.02 }}
                className="group relative w-full bg-white/5 backdrop-blur-md rounded-[24px] border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl"
            >
                {/* DYNAMIC GLOW (Hover Only) */}
                <div
                    className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl -z-10"
                    style={{ backgroundColor: fallbackColor }}
                />

                {/* HEART LIKE BUTTON (TOP LEFT) - FAVORITES */}
                <div className="absolute top-3 left-3 z-30">
                    <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.(book.book_id!);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 ${isFavorited ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/40' : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:bg-black/60'}`}
                    >
                        <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
                    </motion.button>
                </div>

                {/* THREE-DOT MENU (TOP RIGHT) */}
                {showMenu && (
                    <div className="absolute top-3 right-3 z-30">
                        <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(!showDropdown);
                            }}
                            className="p-2 rounded-full backdrop-blur-md border bg-black/40 border-white/10 text-white/70 hover:text-white transition-all"
                        >
                            <MoreVertical size={20} />
                        </motion.button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    className="absolute top-12 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden min-w-[180px]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {onTogglePublic && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTogglePublic?.(book.book_id!, book.is_public || false);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-violet-50 transition-colors flex items-center gap-3 text-slate-600 font-semibold"
                                        >
                                            {book.is_public ? <Lock size={18} /> : <Globe size={18} />}
                                            <span>{book.is_public ? '🔒 Skrýt (Soukromé)' : '🌍 Publikovat'}</span>
                                        </button>
                                    )}

                                    {onGenerateAudio && !book.audio_url && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onGenerateAudio?.(book.book_id!);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-violet-50 transition-colors flex items-center gap-3 text-violet-600 font-semibold border-t border-slate-100"
                                        >
                                            <Headphones size={18} />
                                            <span>✨ Vytvořit Audio</span>
                                        </button>
                                    )}

                                    {onDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Opravdu chceš smazat tuto knihu?')) {
                                                    onDelete(book.book_id!);
                                                }
                                                setShowDropdown(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600 font-semibold border-t border-slate-100"
                                        >
                                            <Trash2 size={18} />
                                            <span>🗑️ Smazat</span>
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}



                {/* --- COVER IMAGE AREA --- */}
                <div
                    className="relative aspect-[2/3] w-full overflow-hidden rounded-t-[24px] z-10"
                    style={{
                        transform: "translateZ(20px)",
                        WebkitMaskImage: "-webkit-radial-gradient(white, black)" // Fix for Safari corner clipping/flickering
                    }}
                >
                    {/* Placeholder / Blur-Up Layer */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-700 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
                        style={{
                            backgroundColor: fallbackColor,
                            backgroundImage: `linear-gradient(45deg, ${fallbackColor}40, #00000020)`
                        }}
                    >
                        {!imageLoaded && !imageError && book.cover_image && (
                            <div className="flex items-center justify-center w-full h-full">
                                <Loader2 className="animate-spin text-white/50" />
                            </div>
                        )}
                    </div>

                    {book.cover_image && !imageError ? (
                        <img
                            src={getOptimizedUrl(book.cover_image)!}
                            alt={book.title}
                            className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-110 transition-transform duration-700`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => {
                                setImageError(true);
                                setImageLoaded(true); // Stop loader
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-2 bg-zinc-900/50">
                            {imageError ? <AlertCircle /> : <BookOpen />}
                            <span className="text-xs">{imageError ? 'Error' : 'No Cover'}</span>
                        </div>
                    )}

                    {/* STATUS BADGES */}
                    {book.status && book.status !== 'ready' && book.status !== 'draft' && (
                        <div className="absolute top-3 right-3 z-20">
                            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                                {book.status === 'error' ? (
                                    <>
                                        <AlertCircle size={10} className="text-red-400" />
                                        <span className="text-[10px] font-bold text-red-100 uppercase">Chyba</span>
                                    </>
                                ) : (
                                    <>
                                        <Loader2 size={10} className="text-purple-400 animate-spin" />
                                        <span className="text-[10px] font-bold text-purple-100 uppercase">Tvořím</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Audio Player Overlay */}
                    {book.audio_url && (
                        <div className="absolute bottom-4 right-4 z-20">
                            <MiniPlayer audioUrl={book.audio_url} />
                        </div>
                    )}
                </div>

                {/* --- INFO AREA --- */}
                <div
                    className="p-5"
                    style={{ transform: "translateZ(10px)" }}
                >
                    <h3 className="line-clamp-2 text-lg font-bold text-slate-100 mb-2 leading-tight group-hover:text-fuchsia-400 transition-colors font-title">
                        {book.title || "Bezejmenný příběh"}
                    </h3>

                    {/* Author Info (for public books) */}
                    {onAuthorClick && book.author_profile && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAuthorClick();
                            }}
                            className="text-xs text-slate-400 hover:text-purple-400 transition-colors mb-2 flex items-center gap-1.5"
                        >
                            <span>{book.author_profile.avatar_emoji || '👤'}</span>
                            <span className="font-semibold">od {book.author_profile.nickname}</span>
                        </button>
                    )}

                    <div className="flex items-center justify-between text-slate-400 text-xs font-sans">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(book.created_at)}
                        </span>
                        {/* Optional: Add page count or other meta here */}
                    </div>

                    {/* Emoji Reactions */}
                    {showReactions && <ReactionBar bookId={book.book_id} />}
                </div>

                {/* Reflection/Sheen Effect */}
                <div
                    className="absolute inset-0 rounded-[24px] bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                    style={{ transform: "translateZ(30px)" }}
                />
            </motion.div>
        </motion.div>
    );
};

export const BookCard = memo(BookCardBase);
