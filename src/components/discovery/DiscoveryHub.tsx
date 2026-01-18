import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ArrowLeft, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookReader } from './BookReader';
import { DiscoveryCard } from './DiscoveryCard';
import { MiniPlayer } from '../audio/MiniPlayer';
import { DiscoveryCategory, DiscoveryBook, DiscoveryPage } from '../../types/discovery';
import { supabase } from '../../lib/supabase';

interface DiscoveryHubProps {
    onClose: () => void;
}

export const DiscoveryHub = ({ onClose }: DiscoveryHubProps) => {
    // Internal Routing State
    const [view, setView] = useState<'categories' | 'book-list' | 'reader' | 'trailer'>('categories');

    // Data State
    const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
    const [books, setBooks] = useState<DiscoveryBook[]>([]);
    const [pages, setPages] = useState<DiscoveryPage[]>([]);

    // Trailer Map: categoryId -> videoUrl
    const [categoryTrailers, setCategoryTrailers] = useState<Record<string, string>>({});

    const [selectedCategory, setSelectedCategory] = useState<DiscoveryCategory | null>(null);
    const [selectedBook, setSelectedBook] = useState<DiscoveryBook | null>(null);
    const [readerIndex, setReaderIndex] = useState(0);

    const [loading, setLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(() => {
        // Correctly initialize based on URL presence to prevent flashing "Categories" view
        const params = new URLSearchParams(window.location.search);
        return !!params.get('category');
    });

    // URL Helper
    const updateUrl = (params: Record<string, string | null>, push = false) => {
        const url = new URL(window.location.href);
        Object.entries(params).forEach(([key, value]) => {
            if (value === null) url.searchParams.delete(key);
            else url.searchParams.set(key, value);
        });
        if (push) window.history.pushState({}, '', url);
        else window.history.replaceState({}, '', url);
    };


    // Helper to process books
    const processBooks = (rawBooks: any[]): DiscoveryBook[] => {
        if (!rawBooks) return [];
        return rawBooks.map(b => {
            // HOTFIX DISABLED: T-Rex image should now be correct in DB
            /* if (b.species_code === 'Tyrannosaurus rex' || b.title?.toUpperCase().includes('TYRANOSAURUS') || b.title?.toUpperCase().includes('T-REX')) {
                const { data } = supabase.storage.from('book-media').getPublicUrl('Discovery/T-Rex/discovery-cover.png');
                return { ...b, cover_url: data.publicUrl };
            } */
            return b;
        }).filter((b: any) => {
            const url = b.cover_url || '';
            return !url.includes('your-storage.supabase.co') && !url.includes('placeholder.com');
        });
    };

    // Initial Load: Categories, Trailers & Deep Linking
    useEffect(() => {
        const loadData = async () => {
            // ... (keep existing loadData logic)
            // 1. Load Categories
            const { data: catData } = await supabase
                .from('discovery_categories')
                .select('*')
                .eq('is_active', true);

            // 2. Load Trailers (scan books for trailer_urls to use as category intros)
            const { data: trailerData } = await supabase
                .from('discovery_books')
                .select('category_id, trailer_url')
                .not('trailer_url', 'is', null);

            // --- HARD FIX MOVED UP ---
            const DINO_CAT_ID = '75adc9f6-53e5-44b6-853d-ab77e982f2a2';
            const trailerMap: Record<string, string> = {};

            if (trailerData) {
                trailerData.forEach((item: any) => {
                    // Start with DB value
                    let finalUrl = item.trailer_url;

                    // Override broken URL for Dino category if found
                    if (item.category_id === DINO_CAT_ID) {
                        finalUrl = '/discovery/trailer-final.mp4';
                    }

                    // Use the first trailer found for a category as its intro
                    if (finalUrl && !trailerMap[item.category_id]) {
                        trailerMap[item.category_id] = finalUrl;

                        // PRELOAD IMMEDIATELY
                        const link = document.createElement('link');
                        link.rel = 'preload';
                        link.as = 'fetch'; // 'video' can be buggy in some browsers
                        link.href = finalUrl;
                        document.head.appendChild(link);
                    }
                });
            }
            // Ensure manual override if not found in data
            if (!trailerMap[DINO_CAT_ID]) trailerMap[DINO_CAT_ID] = '/discovery/trailer-final.mp4';

            setCategoryTrailers(trailerMap);

            if (catData) {
                // FALLBACK: If "Vesmír" is missing (likely due to RLS blocking insert), inject it locally so UI works.
                const hasSpace = catData.some(c => c.slug === 'vesmir' || c.title.toLowerCase().includes('vesmír'));
                let finalCategories = [...catData];

                if (!hasSpace) {
                    console.warn("Space category missing in DB, injecting static fallback.");
                    finalCategories.push({
                        id: 'space-static-fallback',
                        title: 'Vesmír',
                        slug: 'vesmir',
                        description: 'Nekonečný vesmír čeká! Odhal skryté krásy hvězd a vzdálených galaxií.',
                        icon_url: '🚀',
                        theme_color_hex: '#0f172a',
                        is_active: true
                    } as DiscoveryCategory);
                }

                setCategories(finalCategories);
            }
            setIsRestoring(false);
        };
        loadData();
    }, []);

    // SCROLL RESET ON VIEW CHANGE
    const contentRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [view, selectedCategory]);

    // Reactive State Sync from URL
    useEffect(() => {
        if (categories.length === 0 || isRestoring) return;

        const syncStateFromUrl = async () => {
            const params = new URLSearchParams(window.location.search);
            const catSlug = params.get('category');
            const bookId = params.get('book');
            const pageNum = params.get('page');

            if (!catSlug) {
                // Only reset if we are not already at root to prevent flashing
                if (view !== 'categories') {
                    setView('categories');
                    setSelectedCategory(null);
                    setBooks([]);
                    setPages([]);
                }
                return;
            }

            const targetCat = categories.find(c =>
                c.slug === catSlug ||
                c.title.toLowerCase() === catSlug.toLowerCase() ||
                (catSlug === 'vesmir' && c.id === 'space-static-fallback')
            );

            if (targetCat) {
                setSelectedCategory(targetCat);

                // Only fetch books if we don't have them OR if category changed
                let currentBooks = books;
                if (books.length === 0 || selectedCategory?.id !== targetCat.id) {
                    // Fetch books fresh if needed
                    const { data: bookData } = await supabase
                        .from('discovery_books')
                        .select('*')
                        .eq('category_id', targetCat.id);

                    currentBooks = processBooks(bookData || []);
                    setBooks(currentBooks);
                }

                if (!bookId) {
                    setView('book-list');
                    setPages([]);
                } else {
                    let targetBook = currentBooks.find(b => b.id === bookId);

                    if (!targetBook) {
                        setLoading(true);
                        const { data: bData } = await supabase
                            .from('discovery_books')
                            .select('*')
                            .eq('id', bookId)
                            .single();
                        if (bData) targetBook = processBooks([bData])[0];
                    }

                    if (targetBook) {
                        setSelectedBook(targetBook);
                        setLoading(true);
                        const { data: pageData } = await supabase
                            .from('discovery_pages')
                            .select('*')
                            .eq('book_id', bookId)
                            .order('page_number', { ascending: true });
                        setPages(pageData || []);
                        setLoading(false);

                        // Only set view and index AFTER pages are loaded
                        setReaderIndex(pageNum ? parseInt(pageNum) : 0);
                        setView('reader');
                    } else {
                        // If book not found, go back to book list
                        setView('book-list');
                        setPages([]);
                    }
                }
            }
        };

        syncStateFromUrl();

        const handlePopState = () => syncStateFromUrl();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [categories, isRestoring]); // Keep dependencies minimal

    // CATEGORY SELECT (With Trailer Logic)
    const handleCategorySelect = async (cat: DiscoveryCategory) => {
        console.log('--- HANDLE CATEGORY SELECT ---');
        console.log('Category:', cat.title, cat.id);

        setSelectedCategory(cat);
        setLoading(true);
        updateUrl({ category: cat.slug || cat.title.toLowerCase(), book: null, page: null }, true);

        // CHECK FOR INTRO TRAILER
        const trailerUrl = categoryTrailers[cat.id];
        const seenKey = `seen_trailer_cat_${cat.id}`;
        const seenTrailer = localStorage.getItem(seenKey) === 'true';

        // Fetch Books (parallel)
        const booksPromise = supabase
            .from('discovery_books')
            .select('*')
            .eq('category_id', cat.id);

        const { data } = await booksPromise;

        const validBooks = processBooks(data || []);

        setBooks(validBooks);
        setLoading(false);

        // Decide View
        if (trailerUrl && !seenTrailer) {
            setView('trailer');
        } else {
            setView('book-list');
        }
    };

    // MANUALLY PLAY TRAILER
    const playTrailer = () => {
        setView('trailer');
    };

    // TRAILER COMPLETE
    const handleTrailerComplete = () => {
        if (selectedCategory) {
            // Mark as seen
            localStorage.setItem(`seen_trailer_cat_${selectedCategory.id}`, 'true');
            // Go to book list
            setView('book-list');
        }
    };

    const handleBookSelect = async (book: DiscoveryBook) => {
        // CRITICAL: Clear old pages FIRST to prevent stale data
        setPages([]);
        setSelectedBook(book);
        setLoading(true);
        updateUrl({ book: book.id, page: '0' }, true);

        const { data } = await supabase
            .from('discovery_pages')
            .select('*')
            .eq('book_id', book.id)
            .order('page_number', { ascending: true });

        setPages(data || []);
        setReaderIndex(0);
        setLoading(false);
        setView('reader');
    };

    const handleBack = () => {
        if (view === 'categories') {
            onClose();
        } else if (view === 'trailer' || view === 'book-list') {
            setView('categories');
            setSelectedCategory(null);
            setBooks([]);
            updateUrl({ category: null, book: null, page: null }, true);
        } else if (view === 'reader') {
            setView('book-list');
            setPages([]); // Clear pages to prevent stale data
            setReaderIndex(0); // Reset reader index
            updateUrl({ book: null, page: null }, true);
        } else {
            // Deep fallback
            setView('categories');
            updateUrl({ category: null, book: null, page: null }, true);
        }
    };

    const isDinoCategory = selectedCategory?.title?.toLowerCase().includes('dino') ||
        selectedCategory?.slug?.includes('dino');

    const isSpaceCategory = selectedCategory?.title?.toLowerCase().includes('vesmír') ||
        selectedCategory?.title?.toLowerCase().includes('space') ||
        selectedCategory?.slug?.includes('space') ||
        selectedCategory?.slug === 'vesmir';

    // Helper to get active trailer URL
    const activeTrailerUrl = selectedCategory ? categoryTrailers[selectedCategory.id] : null;

    if (isRestoring) {
        return (
            <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col items-center justify-center text-white">
                <Loader2 size={48} className="animate-spin opacity-50 mb-4" />
                <p className="text-slate-400 animate-pulse">Obnovuji stránku...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[60] text-white overflow-hidden flex flex-col min-h-[100dvh] ${(isDinoCategory || isSpaceCategory) && view !== 'categories' ? 'bg-black' : 'bg-slate-900/95 backdrop-blur-xl'}`}
        >
            {/* Conditional Background Image (Dino) */}
            {isDinoCategory && view !== 'categories' && (
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/30 z-10" /> {/* Dark Overlay for readability */}
                    <img
                        src="/discovery/dino-bg-v3.jpg"
                        alt="Dino Background"
                        className="w-full h-[100dvh] object-cover opacity-100"
                    />
                </div>
            )}

            {/* Conditional Background Image (Space) */}
            {isSpaceCategory && view !== 'categories' && (
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/40 z-10" /> {/* Dark Overlay for readability */}
                    <img
                        src="/discovery/space-bg.png"
                        alt="Space Background"
                        className="w-full h-[100dvh] object-cover opacity-100"
                    />
                </div>
            )}

            {/* TRAILER OVERLAY (Category Level) */}
            {view === 'trailer' && activeTrailerUrl && (
                <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center">
                    <video
                        src={activeTrailerUrl}
                        autoPlay
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                        onEnded={handleTrailerComplete}
                        onError={(e) => {
                            console.error("Video Error Details:", e);
                            console.log("Attempted URL:", activeTrailerUrl);
                        }}
                    >
                        Váš prohlížeč nepodporuje video.
                    </video>

                    <button
                        onClick={handleTrailerComplete}
                        className="absolute top-8 right-8 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-medium transition-colors border border-white/20 z-[80]"
                    >
                        Přeskočit
                    </button>
                </div>
            )
            }

            {/* Header (Hidden in Trailer) */}
            {
                view !== 'trailer' && (
                    <div className={`p-4 md:p-6 flex items-center gap-4 border-b border-white/5 relative z-[70] ${(isDinoCategory || isSpaceCategory) ? 'bg-transparent' : 'bg-slate-900/50 shadow-lg'} shrink-0`}>
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Compass className="text-amber-400 shrink-0" size={20} />
                            <h1 className="text-base md:text-xl font-bold font-title truncate">
                                {view === 'categories' ? 'Encyklopedie' :
                                    view === 'book-list' ? selectedCategory?.title :
                                        selectedBook?.title}
                            </h1>

                            {/* PLAY TRAILER BUTTON (Only in book-list if trailer exists) */}
                            {view === 'book-list' && activeTrailerUrl && (
                                <button
                                    onClick={playTrailer}
                                    className="ml-2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-amber-300"
                                    title="Přehrát intro"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                </button>
                            )}

                            {/* AUDIO PLAYER (In Reader) */}
                            {view === 'reader' && selectedBook?.audio_url && (
                                <div className="ml-auto mr-2">
                                    <MiniPlayer audioUrl={selectedBook.audio_url} />
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Content Area */}
            {
                view !== 'trailer' && (
                    <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-stretch relative z-20 pb-24 md:pb-0 w-full">
                        <AnimatePresence mode="wait">

                            {/* 1. CATEGORIES */}
                            {view === 'categories' && (
                                <motion.div
                                    key="categories"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto mt-10 p-4"
                                >
                                    {/* Loading State for Categories */}
                                    {categories.length === 0 && (
                                        <div className="col-span-full text-center py-20 text-slate-500">
                                            <Loader2 size={48} className="mx-auto mb-4 animate-spin opacity-50" />
                                            <p>Načítám kategorie...</p>
                                        </div>
                                    )}

                                    {categories.map(cat => {
                                        const isDino = cat.title.toLowerCase().includes('dino') || cat.slug?.includes('dino');
                                        const isSpace = cat.title.toLowerCase().includes('vesmír') || cat.title.toLowerCase().includes('space') || cat.slug?.includes('space');

                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategorySelect(cat)}
                                                className={`
                                            w-full h-64 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4
                                            bg-[#1c1917] border border-white/10 hover:border-white/30 transition-all
                                            group relative overflow-hidden shadow-xl hover:scale-[1.02]
                                            ${isDino || isSpace ? 'md:col-span-2' : ''}
                                        `}
                                            >
                                                {/* Background: Custom Image for Dinos, Color for others */}
                                                {isDino ? (
                                                    <>
                                                        <img
                                                            src="/discovery/dino-card-bg.png"
                                                            alt="Category Background"
                                                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 -translate-y-5 scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                    </>
                                                ) : isSpace ? (
                                                    <>
                                                        <img
                                                            src="/discovery/space-card-bg.png"
                                                            alt="Space Background"
                                                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-blue-900/20 to-transparent" />
                                                    </>
                                                ) : (
                                                    <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-colors bg-[${cat.theme_color_hex}]`} style={{ backgroundColor: cat.theme_color_hex }} />
                                                )}

                                                {/* Content */}
                                                <div className="relative z-10 flex flex-col items-center">
                                                    {/* Hide icon for Space category */}
                                                    {!isSpace && cat.icon_url && <span className="text-6xl group-hover:scale-110 transition-transform duration-500 mb-2 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{cat.icon_url}</span>}
                                                    <h3 className="text-3xl font-black font-title uppercase tracking-wide text-white drop-shadow-md">{cat.title}</h3>
                                                    <p className="text-stone-300 text-sm text-center max-w-[80%] font-medium">{cat.description}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {/* 2. BOOK LIST */}
                            {view === 'book-list' && (
                                <motion.div
                                    key="book-list"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    className="max-w-7xl mx-auto w-full p-4 md:p-8 relative z-50"
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
                                        {books.map((book, index) => (
                                            <div key={book.id} className="flex justify-center w-full">
                                                <DiscoveryCard
                                                    book={book}
                                                    index={index}
                                                    onClick={handleBookSelect}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {!loading && books.length === 0 && (
                                        <div className="text-center py-20 text-slate-500">
                                            <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>V této kategorii zatím nejsou žádné knihy.</p>
                                        </div>
                                    )}

                                    {loading && (
                                        <div className="flex justify-center py-20">
                                            <Loader2 size={48} className="mx-auto mb-4 animate-spin opacity-50 text-white" />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* 3. READER */}
                            {view === 'reader' && (
                                <motion.div
                                    key="reader"
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="flex-1 flex flex-col justify-center items-center h-full w-full"
                                >

                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                            <Loader2 size={32} className="animate-spin mb-4" />
                                            <p>Načítám stránky...</p>
                                        </div>
                                    ) : pages.length > 0 ? (
                                        <>
                                            <div className="flex items-stretch md:items-center justify-center w-full h-full md:h-[85vh] md:px-10 md:gap-8">

                                                {/* PREV BUTTON (Desktop) */}
                                                <button
                                                    onClick={() => {
                                                        const newIndex = Math.max(0, readerIndex - 1);
                                                        setReaderIndex(newIndex);
                                                        updateUrl({ page: newIndex.toString() });
                                                    }}
                                                    disabled={readerIndex === 0}
                                                    className="hidden md:flex p-4 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-0 disabled:pointer-events-none transition-all hover:scale-110 active:scale-95 shrink-0"
                                                >
                                                    <ChevronLeft size={48} strokeWidth={1} />
                                                </button>

                                                {/* READER CONTENT */}
                                                <div className="flex-1 w-full max-w-7xl h-full flex items-stretch md:items-center justify-center relative">
                                                    <motion.div
                                                        key={readerIndex}
                                                        drag="x"
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        dragElastic={0.2}
                                                        onDragEnd={(_, info) => {
                                                            const threshold = 100;
                                                            if (info.offset.x < -threshold && readerIndex < pages.length - 1) {
                                                                const newIndex = readerIndex + 1;
                                                                setReaderIndex(newIndex);
                                                                updateUrl({ page: newIndex.toString() });
                                                            } else if (info.offset.x > threshold && readerIndex > 0) {
                                                                const newIndex = readerIndex - 1;
                                                                setReaderIndex(newIndex);
                                                                updateUrl({ page: newIndex.toString() });
                                                            }
                                                        }}
                                                        className={`w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing ${isSpaceCategory ? 'md:scale-90' : ''}`}
                                                    >
                                                        <BookReader
                                                            page={pages[readerIndex]}
                                                            isDino={isDinoCategory}
                                                            onPageComplete={() => {
                                                                if (readerIndex < pages.length - 1) {
                                                                    const newIndex = readerIndex + 1;
                                                                    setReaderIndex(newIndex);
                                                                    updateUrl({ page: newIndex.toString() });
                                                                }
                                                            }}
                                                        />
                                                    </motion.div>

                                                    {/* Swipe Indicator (Mobile only) */}
                                                    <div className="absolute top-1/2 left-4 text-white/20 md:hidden pointer-events-none -translate-y-1/2">
                                                        {readerIndex > 0 && <ChevronLeft size={32} />}
                                                    </div>
                                                    <div className="absolute top-1/2 right-4 text-white/20 md:hidden pointer-events-none -translate-y-1/2">
                                                        {readerIndex < pages.length - 1 && <ChevronRight size={32} />}
                                                    </div>
                                                </div>

                                                {/* NEXT BUTTON (Desktop) */}
                                                <button
                                                    onClick={() => {
                                                        const newIndex = Math.min(pages.length - 1, readerIndex + 1);
                                                        setReaderIndex(newIndex);
                                                        updateUrl({ page: newIndex.toString() });
                                                    }}
                                                    disabled={readerIndex === pages.length - 1}
                                                    className="hidden md:flex p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-0 disabled:pointer-events-none transition-all hover:scale-110 active:scale-95 shadow-lg shadow-indigo-500/20 shrink-0"
                                                >
                                                    <ChevronRight size={48} strokeWidth={1} />
                                                </button>
                                            </div>

                                            {/* Page Indicator */}
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-500 text-sm font-mono mt-2">
                                                {readerIndex + 1} / {pages.length}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-20 text-slate-500">
                                            <p>Tato kniha zatím nemá žádné stránky.</p>
                                        </div>
                                    )}

                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                )
            }
        </motion.div >
    );
};
