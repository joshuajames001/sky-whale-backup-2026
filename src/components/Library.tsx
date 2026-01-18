import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { StoryBook } from '../types';
import { BookCard } from './BookCard';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, AlertCircle } from 'lucide-react';
import { getTheme } from '../lib/themes';
import { PublicProfile } from './profile/PublicProfile';
import { AudioConfirmDialog } from './audio/AudioConfirmDialog';
import { useEnergy } from '../hooks/useEnergy';
import { useGuide } from '../hooks/useGuide';


interface LibraryProps {
    onOpenBook: (book: StoryBook) => void;
    onOpenMagic: () => void;
    onCreateCustom: () => void;
    onCreateCard?: () => void;
}

export const Library = ({ onOpenBook, onOpenMagic, onCreateCustom, onCreateCard }: LibraryProps) => {
    const [books, setBooks] = useState<StoryBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Theme Hover Logic
    const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);
    const activeTheme = hoveredStyle ? getTheme(hoveredStyle) : null;

    // GUIDE HOOK
    const { startGuide, hasSeenGroups } = useGuide();

    useEffect(() => {
        // Guide Trigger Logic
        if (!hasSeenGroups['library_welcome']) {
            // Delay to ensure mount
            const timer = setTimeout(() => startGuide('library_welcome'), 1000);
            return () => clearTimeout(timer);
        }
    }, [hasSeenGroups, startGuide]);

    const handleBookHover = useCallback((book: StoryBook | null) => {
        setHoveredStyle(book?.theme_style || null);
    }, []);


    const [activeTab, setActiveTab] = useState<'public' | 'private' | 'favorites' | 'cards'>('public');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    // Pagination state
    const [visibleCount, setVisibleCount] = useState(20);

    // Audio Logic
    const { balance: energyBalance, refreshBalance } = useEnergy();
    const [audioDialog, setAudioDialog] = useState<{
        isOpen: boolean;
        book: StoryBook | null;
        charCount: number;
        cost: number;
        loading: boolean;
    }>({ isOpen: false, book: null, charCount: 0, cost: 0, loading: false });

    // Optimized Fetching
    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            setVisibleCount(20); // Reset pagination on tab change
            try {
                const { data: { user } } = await supabase.auth.getUser();
                console.log("📚 Library Fetch: Current User:", user?.id, "Mode:", activeTab);

                let data: any[] | null = null;
                let error = null;

                // Filter Logic
                if (activeTab === 'cards') {
                    if (!user) {
                        setBooks([]);
                        setLoading(false);
                        return;
                    }
                    // Fetch Greeting Cards (User's own only)
                    const result = await supabase
                        .from('books')
                        .select('*, pages(*)')
                        .eq('owner_id', user.id)
                        .eq('visual_style', 'card_project_v1')
                        .order('created_at', { ascending: false });

                    data = result.data;
                    error = result.error;

                } else if (activeTab === 'private') {
                    if (!user) {
                        setBooks([]);
                        setLoading(false);
                        return; // No user = no private books
                    }

                    // Private: user's own books (Excluding Cards to keep tabs clean)
                    const result = await supabase
                        .from('books')
                        .select('*, pages(*)')
                        .eq('owner_id', user.id)
                        .neq('visual_style', 'card_project_v1') // Exclude cards
                        .order('created_at', { ascending: false });

                    data = result.data;
                    error = result.error;

                } else if (activeTab === 'favorites') {
                    // Favorites Tab
                    if (!user) {
                        setBooks([]);
                        setLoading(false);
                        return;
                    }

                    // 1. Get favorite book IDs
                    const favResult = await supabase
                        .from('user_favorites')
                        .select('book_id')
                        .eq('user_id', user.id);

                    if (favResult.error) throw favResult.error;

                    const favBookIds = favResult.data.map((f: any) => f.book_id);

                    if (favBookIds.length === 0) {
                        data = [];
                    } else {
                        // 2. Fetch books
                        const booksResult = await supabase
                            .from('books')
                            .select('*, pages(*)')
                            .in('id', favBookIds)
                            .order('created_at', { ascending: false });

                        if (booksResult.error) {
                            error = booksResult.error;
                        } else {
                            // 3. Fetch authors for these books
                            const ownerIds = [...new Set(booksResult.data.map((b: any) => b.owner_id))];
                            const profilesResult = await supabase
                                .from('profiles')
                                .select('id, nickname, avatar_emoji')
                                .in('id', ownerIds);

                            // Merge
                            const profilesMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]));
                            data = booksResult.data.map((book: any) => ({
                                ...book,
                                profiles: profilesMap.get(book.owner_id)
                            }));
                        }
                    }

                } else {
                    // Public: all public books with author info (Cards should be hidden from public usually, ensuring filter)
                    // (Assuming cards have visual_style 'card_project_v1' and we might want to hide them from main feed if they accidentally got public)
                    const booksResult = await supabase
                        .from('books')
                        .select('*, pages(*)')
                        .eq('is_public', true)
                        .neq('visual_style', 'card_project_v1') // Ensure cards don't pollute public feed
                        .order('created_at', { ascending: false });

                    if (booksResult.error) {
                        data = null;
                        error = booksResult.error;
                    } else {
                        // Fetch profiles for all unique owner_ids
                        const ownerIds = [...new Set(booksResult.data.map((b: any) => b.owner_id))];
                        const profilesResult = await supabase
                            .from('profiles')
                            .select('id, nickname, avatar_emoji')
                            .in('id', ownerIds);

                        // Merge profiles into books
                        const profilesMap = new Map(
                            (profilesResult.data || []).map((p: any) => [p.id, p])
                        );

                        data = booksResult.data.map((book: any) => ({
                            ...book,
                            profiles: profilesMap.get(book.owner_id)
                        }));
                        error = null;
                    }
                }

                console.log("📚 Library Fetch Result:", { length: data?.length, error });

                if (error) throw error;

                // Data Mapper: Normalize DB columns to Application Domain Model
                const mappedBooks = (data || []).map((book: any) => ({
                    ...book,
                    book_id: book.id,            // Fix: Map DB 'id' to App 'book_id'
                    cover_image: book.cover_image_url, // Map DB column to Type
                    author_id: book.owner_id,   // Ensure author_id is mapped from owner_id
                    author_profile: book.profiles, // Add structured author info
                    author: book.profiles?.nickname || 'Unknown', // Set legacy author string to nickname
                    pages: (book.pages || [])
                        .sort((a: any, b: any) => (a.page_number ?? a.page_index) - (b.page_number ?? b.page_index))
                        .map((p: any) => ({
                            ...p,
                            page_number: p.page_number || p.page_index, // Support both for safety
                            text: p.content,           // Map DB column to Type
                            is_generated: !!p.image_url,
                            layout_type: p.layout_type || 'standard'
                        }))
                }));

                setBooks(mappedBooks);

                // Fetch all favorites for the current user to avoid N+1 requests
                if (user) {
                    const { data: favData } = await supabase
                        .from('user_favorites')
                        .select('book_id')
                        .eq('user_id', user.id);

                    if (favData) {
                        const ids = new Set(favData.map((f: any) => f.book_id));
                        setFavoriteIds(ids);
                    }
                }

            } catch (err: any) {
                console.error("Error fetching library:", err);
                setError("Nepodařilo se načíst knihovnu.");
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, [activeTab]); // Re-run when tab changes

    // Handler for toggling public/private status
    const handleTogglePublic = useCallback(async (bookId: string, currentStatus: boolean) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newStatus = !currentStatus;
        const { error } = await supabase
            .from('books')
            .update({ is_public: newStatus })
            .eq('id', bookId)
            .eq('owner_id', user.id);

        if (!error) {
            setBooks(prev => prev.map(b =>
                b.book_id === bookId ? { ...b, is_public: newStatus } : b
            ));
            console.log(`📚 Book ${bookId} ${newStatus ? 'published' : 'hidden'}`);
        }
    }, []);

    // Handler for deleting books
    const handleDelete = useCallback(async (bookId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId)
            .eq('owner_id', user.id);

        if (!error) {
            setBooks(prev => prev.filter(b => b.book_id !== bookId));
            console.log(`🗑️ Book ${bookId} deleted`);
        }
    }, []);

    // Handler for favorites
    const handleToggleFavorite = useCallback(async (bookId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isFavorited = favoriteIds.has(bookId);

        // 1. Update Favorites Set
        setFavoriteIds(prev => {
            const newSet = new Set(prev);
            if (isFavorited) newSet.delete(bookId);
            else newSet.add(bookId);
            return newSet;
        });

        // 2. Update Books list (if in favorites tab)
        if (activeTab === 'favorites') {
            if (isFavorited) {
                setBooks(prev => prev.filter(b => b.book_id !== bookId));
            }
        }

        // 3. DB Call
        if (isFavorited) {
            await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('book_id', bookId);
        } else {
            await supabase.from('user_favorites').insert({ user_id: user.id, book_id: bookId });
        }
    }, [favoriteIds, activeTab]);

    // Helper for Supabase Image Transform (if enabled project-side)

    // Audio Handlers
    const handleOpenAudioDialog = useCallback((bookId: string) => {
        const book = books.find(b => b.book_id === bookId);
        if (!book) return;

        const fullText = book.pages?.map(p => p.text || '').join(' ') || '';
        const charCount = fullText.length;
        const cost = Math.max(1, Math.ceil(charCount / 20));

        setAudioDialog({
            isOpen: true,
            book,
            charCount,
            cost,
            loading: false
        });
    }, [books]);

    const handleGenerateAudioConfirm = useCallback(async () => {
        if (!audioDialog.book) return;
        setAudioDialog(prev => ({ ...prev, loading: true }));

        const fullText = audioDialog.book.pages?.map(p => p.text || '').join(' ') || '';
        if (!fullText) {
            alert("Kniha neobsahuje žádný text!");
            setAudioDialog(prev => ({ ...prev, loading: false }));
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("Nejsi přihlášený!");
            setAudioDialog(prev => ({ ...prev, loading: false }));
            return;
        }

        const { data, error } = await supabase.functions.invoke('generate-audio', {
            body: {
                bookId: audioDialog.book.book_id,
                text: fullText
            },
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });

        if (error || (data && data.error)) {
            console.error("Audio generation error:", error || data?.error);
            alert("Chyba: " + (data?.error || error?.message || "Neznámá chyba"));
            setAudioDialog(prev => ({ ...prev, loading: false }));
            return;
        }

        // Success
        setBooks(prev => prev.map(b =>
            b.book_id === audioDialog.book?.book_id
                ? { ...b, audio_url: data.audioUrl }
                : b
        ));

        await refreshBalance(); // Update energy UI
        setAudioDialog(prev => ({ ...prev, isOpen: false }));

    }, [audioDialog.book]);


    return (
        <div
            className="h-screen w-full relative overflow-y-auto font-sans scroll-smooth custom-scrollbar"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <style>{`
                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 14px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 4px solid rgba(0, 0, 0, 0);
                    background-clip: padding-box;
                    border-radius: 9999px;
                    transition: background-color 0.3s;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.4);
                }
            `}</style>
            {/* BACKGROUND LAYER */}
            {/* Base (Light) */}


            {/* Theme Gradient Overlay */}
            <div
                className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${activeTheme ? 'opacity-100' : 'opacity-0'} ${activeTheme?.bgGradient}`}
            />

            {/* Background Texture (Shared) */}
            <div className="fixed inset-0 pointer-events-none opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

            <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
                    <div className="text-center md:text-left">
                        <h1 className={`text-5xl md:text-6xl font-black mb-2 tracking-tight transition-colors duration-700 ${activeTheme ? 'text-white drop-shadow-lg' : 'text-slate-800'}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                            {activeTab === 'public' && 'Veřejná Knihovna'}
                            {activeTab === 'private' && 'Moje Polička'}
                            {activeTab === 'favorites' && 'Oblíbené Příběhy'}
                            {activeTab === 'cards' && 'Moje Přáníčka'}
                        </h1>
                        <p className={`text-lg font-medium transition-colors duration-700 ${activeTheme ? 'text-white/80' : 'text-slate-500'}`} style={{ fontFamily: 'Quicksand, sans-serif' }}>
                            {activeTab === 'public' && 'Objevujte příběhy ostatních tvůrců'}
                            {activeTab === 'private' && 'Vaše soukromá sbírka magických knih'}
                            {activeTab === 'favorites' && 'Příběhy, které vás chytily za srdce'}
                            {activeTab === 'cards' && 'Vaše vytvořená přáníčka a pohlednice'}
                        </p>

                        {/* GUIDE RESTART BUTTON */}
                        <button
                            onClick={() => startGuide('library_welcome')}
                            className="mt-2 text-xs font-bold text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1 opacity-60 hover:opacity-100"
                        >
                            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">?</span>
                            Spustit průvodce
                        </button>

                        {/* TAB SWITCHER */}
                        <div id="library-tabs" className="flex items-center gap-1 bg-black/5 backdrop-blur-md p-1 rounded-full border border-white/10 mt-6 w-fit">
                            <button
                                onClick={() => setActiveTab('public')}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'public'
                                    ? 'bg-white text-slate-900 shadow-lg'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                            >
                                🌍 Veřejná
                            </button>
                            <button
                                onClick={() => setActiveTab('favorites')}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'favorites'
                                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                            >
                                ❤️ Oblíbené
                            </button>
                            <button
                                onClick={() => setActiveTab('private')}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'private'
                                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                            >
                                👤 Moje
                            </button>
                            <button
                                onClick={() => setActiveTab('cards')}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'cards'
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                            >
                                💌 Přáníčka
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {/* Use same "Deep Clean" button here... omitted for brevity if unchanged */}
                        <button
                            onClick={async () => {
                                const confirmMsg = '⚠️ VAROVÁNÍ: Tato akce smaže VŠECHNY knihy, které nemají trvale uloženou obálku v Supabase.\n\nTo zahrnuje:\n- Prázdné obálky\n- Dočasné odkazy z Replicate (expirované)\n- Jakékoli externí URL\n\nOpravdu pokračovat?';
                                if (confirm(confirmMsg)) {
                                    // ... existing cleanup logic ...
                                    const { data: candidates, error: fetchError } = await supabase
                                        .from('books')
                                        .select('id, cover_image_url');

                                    if (fetchError) {
                                        alert('Chyba při kontrole: ' + fetchError.message);
                                        return;
                                    }

                                    const brokenBooks = candidates.filter(b => {
                                        const url = b.cover_image_url;
                                        if (!url) return true;
                                        if (!url.includes('storage/v1/object/public')) return true;
                                        return false;
                                    });

                                    if (brokenBooks.length === 0) {
                                        alert("✨ Čisto! Všechny knihy jsou bezpečně uloženy v Supabase.");
                                        return;
                                    }

                                    const msg = `Nalezeno ${brokenBooks.length} knih k promazání.\n(Tyto knihy nemají trvalý obrázek).\n\nSmazat je navždy?`;
                                    if (!confirm(msg)) return;

                                    const idsToDelete = brokenBooks.map(b => b.id);
                                    const { error: deleteError } = await supabase
                                        .from('books')
                                        .delete()
                                        .in('id', idsToDelete);

                                    if (deleteError) {
                                        alert('Chyba při mazání: ' + deleteError.message);
                                    } else {
                                        alert(`🗑️ Úspěšně smazáno ${idsToDelete.length} knih.`);
                                        window.location.reload();
                                    }
                                }
                            }}
                            className="text-slate-400 hover:text-red-400 font-medium transition-colors text-sm px-4"
                        >
                            🛠️ Hloubkové čištění
                        </button>





                        {/* PRIMARY: Create Action (Context Aware) */}
                        <button
                            id="create-btn" // Added ID for Guide
                            onClick={activeTab === 'cards' && onCreateCard ? onCreateCard : onCreateCustom}
                            className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold border border-white/20 hover:border-white/40 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                        >
                            <div className="bg-white/20 p-1.5 rounded-full group-hover:rotate-90 transition-transform">
                                <Plus size={20} className="stroke-[3px] text-white" />
                            </div>
                            <span className="tracking-wide">
                                {activeTab === 'cards' ? 'Vytvořit Přáníčko' : 'Vytvořit Vlastní Knihu'}
                            </span>
                        </button>

                        {/* SECONDARY: Magic Generator (NEW) */}
                        <button
                            onClick={onOpenMagic}
                            className="relative group flex items-center gap-3 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-6 py-4 rounded-full font-bold border border-white/10 hover:border-sky-500/50 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Sparkles size={18} className="text-sky-400 group-hover:text-white transition-colors" />
                            <span className="tracking-wide text-sm">Zkusit Magický Příběh</span>
                            <span className="ml-2 text-[10px] bg-sky-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-lg shadow-sky-500/40 animate-pulse">
                                NOVINKA
                            </span>
                        </button>

                    </div>
                </header>

                {/* Content Area */}
                {loading ? (
                    /* Loading Skeletons */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white/5 rounded-[24px] overflow-hidden p-4 shadow-sm h-[400px] animate-pulse border border-white/10">
                                <div className="w-full h-3/5 bg-white/10 rounded-[16px] mb-4" />
                                <div className="h-6 bg-white/10 rounded-full w-3/4 mb-3" />
                                <div className="h-4 bg-white/10 rounded-full w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-red-400 gap-4 bg-red-500/10 rounded-[32px] border border-red-500/20 backdrop-blur-md">
                        <AlertCircle size={48} />
                        <p className="font-bold">{error}</p>
                        <button onClick={() => window.location.reload()} className="underline hover:text-red-300">Zkusit znovu</button>
                    </div>
                ) : books.length === 0 ? (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-24 text-center px-4"
                    >
                        <div className="bg-white/5 p-8 rounded-full shadow-xl mb-8 border border-white/10 backdrop-blur-sm">
                            <Sparkles size={64} className="text-violet-400" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                            Tvoje police zeje prázdnotou!
                        </h3>
                        <p className="text-slate-400 text-xl max-w-md mb-8 leading-relaxed" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                            Pojďme společně vyčarovat tvůj první příběh. Stačí jeden klik a magie začne.
                        </p>
                        <button
                            onClick={activeTab === 'cards' && onCreateCard ? onCreateCard : onCreateCustom}
                            className="bg-white border-2 border-transparent hover:border-violet-500 text-violet-900 px-8 py-3 rounded-full font-bold transition-all shadow-lg animate-pulse"
                        >
                            {activeTab === 'cards' ? 'Vytvořit první přáníčko' : 'Začít psát'}
                        </button>
                    </motion.div>
                ) : (
                    /* Books Grid - NEW CARD SYSTEM */
                    <div className="flex flex-col gap-8 pb-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            <AnimatePresence mode="popLayout">
                                {books.slice(0, visibleCount).map((book, index) => (
                                    <BookCard
                                        key={book.book_id}
                                        book={book}
                                        index={index}
                                        onClick={onOpenBook}
                                        onHover={handleBookHover}
                                        showMenu={activeTab === 'private'}
                                        onTogglePublic={handleTogglePublic}
                                        onDelete={handleDelete}
                                        onAuthorClick={(activeTab === 'public' || activeTab === 'favorites') && book.author_profile ? () => setSelectedUserId(book.author_profile!.id) : undefined}
                                        showReactions={activeTab === 'public' || activeTab === 'favorites'}
                                        isFavorited={favoriteIds.has(book.book_id!)}
                                        onToggleFavorite={handleToggleFavorite}
                                        onGenerateAudio={handleOpenAudioDialog}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {visibleCount < books.length && (
                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 20)}
                                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold backdrop-blur-md transition-all border border-white/10 hover:border-white/30"
                                >
                                    Načíst další ({Math.min(20, books.length - visibleCount)})
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AudioConfirmDialog
                isOpen={audioDialog.isOpen}
                onClose={() => setAudioDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleGenerateAudioConfirm}
                bookTitle={audioDialog.book?.title || ''}
                charCount={audioDialog.charCount}
                cost={audioDialog.cost}
                currentEnergy={energyBalance || 0}
                loading={audioDialog.loading}
            />

            {/* Public Profile Modal */}
            {selectedUserId && (
                <PublicProfile
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    onOpenBook={onOpenBook}
                />
            )}
        </div>

    );
};
