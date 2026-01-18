import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Puzzle, X, Brain, Palette, Sparkles, Lock, BookOpen, Loader2, Image as ImageIcon } from 'lucide-react';
import { PuzzleGame } from './PuzzleGame';
import { MemoryGame } from './MemoryGame';
import { ColoringGame } from './magic-coloring/ColoringGame';
import { supabase } from '../../lib/supabase';
import { StoryBook } from '../../types';

interface GameHubProps {
    imageUrl: string | null;
    onClose: () => void;
}

export const GameHub = ({ imageUrl: initialImageUrl, onClose }: GameHubProps) => {
    const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
    const [difficulty, setDifficulty] = useState<3 | 4 | 5>(3);

    // VIEW STATE MACHINE
    // Added 'page-select' for choosing specific illustration from a story
    const [view, setView] = useState<'menu' | 'book-select' | 'page-select' | 'difficulty' | 'game' | 'memory-game' | 'coloring-game'>('menu');

    // DATA STATE
    const [books, setBooks] = useState<StoryBook[]>([]);
    const [selectedBook, setSelectedBook] = useState<StoryBook | null>(null);
    const [bookPages, setBookPages] = useState<string[]>([]); // URLs of pages

    const [loading, setLoading] = useState(false);
    const [memoryImages, setMemoryImages] = useState<string[]>([]); // Pexeso

    // Track which game type enabled the book selection
    const [selectedGame, setSelectedGame] = useState<'puzzle' | 'coloring' | null>(null);

    // Initialize View based on props
    useEffect(() => {
        if (initialImageUrl) {
            // If direct image passed, maybe just show menu or keep old logic
            // For now, allow flow to proceed
        }
    }, [initialImageUrl]);

    const fetchAllBooksForGame = async (): Promise<StoryBook[]> => {
        try {
            const { data } = await supabase
                .from('books')
                .select('id, title, cover_image_url')
                .order('created_at', { ascending: false });

            if (data) {
                return data.map((b: any) => ({
                    book_id: b.id,
                    title: b.title,
                    cover_image: b.cover_image_url,
                    author: '',
                    theme_style: '',
                    pages: [],
                    tier: 'basic'
                } as any));
            }
            return [];
        } catch (e) {
            console.error("Failed to load books", e);
            return [];
        }
    };

    // Fetch Books for Selection
    const fetchBooks = async () => {
        setLoading(true);
        try {
            const data = await fetchAllBooksForGame();
            const processed = data
                .filter(b => b.cover_image)
                .slice(0, 50); // Show more books
            setBooks(processed);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Pages for a Book
    const fetchPagesForBook = async (bookId: string) => {
        setLoading(true);
        try {
            // Get Pages
            const { data: pages } = await supabase
                .from('pages')
                .select('image_url')
                .eq('book_id', bookId)
                .order('page_number', { ascending: true });

            const urls: string[] = [];
            // Add Cover?
            // Usually cover is separate, but we can check if it's already in pages (page 0)

            if (pages) {
                pages.forEach((p: any) => {
                    if (p.image_url) urls.push(p.image_url);
                });
            }

            setBookPages(urls);

            // If no pages found (e.g. only cover in book metadata but not in pages table?), use cover from book object
            if (urls.length === 0 && selectedBook?.cover_image) {
                setBookPages([selectedBook.cover_image]);
                return [selectedBook.cover_image];
            }

            return urls;
        } catch (e) {
            console.error(e);
            return [];
        } finally {
            setLoading(false);
        }
    };


    // Handle Game Selection
    const handleGameSelect = async (type: 'puzzle' | 'pexeso' | 'coloring') => {
        if (type === 'puzzle') {
            if (imageUrl) {
                setView('difficulty');
            } else {
                setSelectedGame('puzzle');
                fetchBooks();
                setView('book-select');
            }
        } else if (type === 'pexeso') {
            setLoading(true);
            const loadedBooks = await fetchAllBooksForGame();
            setLoading(false);

            if (loadedBooks.length > 0) {
                const images = loadedBooks
                    .filter(b => b.cover_image)
                    .map(b => b.cover_image!)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 8);

                setMemoryImages(images);
                setView('memory-game');
            }
        } else if (type === 'coloring') {
            if (imageUrl) {
                setView('coloring-game');
            } else {
                setSelectedGame('coloring');
                fetchBooks();
                setView('book-select');
            }
        }
    };

    // Handle Book Selection
    const handleBookSelect = async (book: StoryBook) => {
        setSelectedBook(book);

        // Fetch pages for this book
        const pages = await fetchPagesForBook(book.book_id);

        if (pages.length > 1) {
            // If multiple pages, let user choose
            setView('page-select');
        } else if (pages.length === 1) {
            // Only one page, select it
            handleImageSelect(pages[0]);
        } else if (book.cover_image) {
            // Fallback to cover
            handleImageSelect(book.cover_image);
        }
    };

    const handleImageSelect = (url: string) => {
        setImageUrl(url);
        if (selectedGame === 'coloring') {
            setView('coloring-game');
        } else {
            setView('difficulty');
        }
    };

    const startGame = (diff: 3 | 4 | 5) => {
        setDifficulty(diff);
        setView('game');
    };

    const goBack = () => {
        if (view === 'page-select') {
            setView('book-select');
        } else if (view === 'difficulty') {
            setView('page-select');
            // Or 'book-select' if we skipped page select? 
            // Simplified: always go back to page-select if we were there, otherwise book-select
        } else if (view === 'book-select') {
            setView('menu');
        } else if (view === 'game' || view === 'coloring-game' || view === 'memory-game') {
            // If we had initial image, probably close?
            if (initialImageUrl) onClose();
            else setView('menu');
        } else {
            onClose();
        }
    };

    // RENDER HELPERS
    if (view === 'game' && imageUrl) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl">
                <BackButton onClick={() => setView('difficulty')} />
                <div className="w-full h-full max-w-7xl max-h-[90vh] p-4">
                    <PuzzleGame
                        imageUrl={imageUrl}
                        difficulty={difficulty}
                        onClose={() => setView('difficulty')}
                    />
                </div>
            </div>
        );
    }

    if (view === 'memory-game') {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl">
                <BackButton onClick={() => setView('menu')} />
                <div className="w-full h-full max-w-7xl max-h-[90vh] p-4">
                    <MemoryGame
                        images={memoryImages}
                        onClose={() => setView('menu')}
                    />
                </div>
            </div>
        );
    }

    if (view === 'coloring-game' && imageUrl) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl">
                <div className="w-full h-full max-w-[95vw] max-h-[95vh] p-4">
                    <ColoringGame
                        imageUrl={imageUrl}
                        onClose={() => {
                            // Smart Back: If we came from page select, go there.
                            if (bookPages.length > 0) setView('page-select');
                            else if (initialImageUrl) onClose();
                            else setView('book-select');
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />

            {/* Main Container */}
            <div className="w-full max-w-7xl max-h-[100dvh] md:max-h-[90vh] relative flex flex-col items-center overflow-y-auto no-scrollbar p-6">
                <style>{`
                    /* Hide scrollbar for Chrome, Safari and Opera */
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    /* Hide scrollbar for IE, Edge and Firefox */
                    .no-scrollbar {
                        -ms-overflow-style: none;  /* IE and Edge */
                        scrollbar-width: none;  /* Firefox */
                    }
                `}</style>

                {/* Close Button Removed (Managed by NavigationHub) */}

                <div className="flex flex-col items-center w-full gap-8 md:gap-12 relative min-h-0">

                    {/* Header Text */}
                    <div className="text-center space-y-4 relative z-10 shrink-0">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium uppercase tracking-widest mb-2"
                        >
                            <Sparkles size={14} className="text-amber-400" />
                            <span>Síň Zázraků</span>
                        </motion.div>
                        <motion.h2
                            key={view}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-title font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-400 drop-shadow-2xl"
                        >
                            {view === 'menu' ? 'Jak si budeme hrát?' :
                                view === 'book-select' ? 'Vyber příběh' :
                                    view === 'page-select' ? 'Kterou stránku?' :
                                        'Zvol obtížnost'}
                        </motion.h2>
                    </div>

                    {/* CONTENT CONTAINER */}
                    <div className="w-full flex items-start justify-center relative perspective-1000 py-8">
                        <AnimatePresence mode="wait">

                            {/* 1. MAIN MENU */}
                            {view === 'menu' && (
                                <div className="flex flex-wrap items-center justify-center gap-8">
                                    <GameCard
                                        title="Kouzelné Puzzle"
                                        icon={Puzzle}
                                        color="amber"
                                        description="Slož rozbitý obraz zpět dohromady."
                                        onClick={() => handleGameSelect('puzzle')}
                                        delay={0.1}
                                    />
                                    <GameCard
                                        title="Zrcadla Paměti"
                                        icon={Brain}
                                        color="cyan"
                                        description="Najdi dvě stejné karty."
                                        onClick={() => handleGameSelect('pexeso')}
                                        delay={0.2}
                                    />
                                    <GameCard
                                        title="Živé Omálovánky"
                                        icon={Palette}
                                        color="fuchsia"
                                        description="Vybarvi svět podle čísel."
                                        onClick={() => handleGameSelect('coloring')}
                                        delay={0.3}
                                    />
                                    <GameCard
                                        title="Magické Zrcadlo"
                                        icon={Sparkles}
                                        color="indigo"
                                        description="???"
                                        onClick={() => { }}
                                        delay={0.4}
                                        locked={true}
                                    />
                                </div>
                            )}

                            {/* 2. BOOK SELECT */}
                            {view === 'book-select' && (
                                <div className="w-full h-full overflow-y-auto no-scrollbar pt-20 pb-8 px-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <Loader2 className="animate-spin text-indigo-400" size={48} />
                                        </div>
                                    ) : books.length === 0 ? (
                                        <div className="text-center text-slate-400 py-12">
                                            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>Žádné příběhy v knihovně.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap justify-center gap-y-12 -space-x-24 md:-space-x-32 max-w-6xl mx-auto">
                                            {books.map((book, i) => (
                                                <motion.div
                                                    key={book.book_id}
                                                    className="relative w-48 md:w-56 aspect-[2/3] group perspective-1000"
                                                    initial={{ opacity: 0, x: -50, rotateY: -20 }}
                                                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    whileHover={{ zIndex: 100 }}
                                                    style={{ zIndex: i }}
                                                >
                                                    <motion.button
                                                        whileHover={{
                                                            y: -100,
                                                            scale: 1.15,
                                                            rotate: 0,
                                                            transition: { duration: 0.2, ease: "circOut" }
                                                        }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleBookSelect(book)}
                                                        className="w-full h-full rounded-2xl overflow-hidden relative border-4 border-white/10 group-hover:border-amber-400/50 shadow-2xl bg-white/5 transition-all origin-bottom"
                                                    >
                                                        <img
                                                            src={book.cover_image!}
                                                            alt={book.title}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 brightness-75 group-hover:brightness-110"
                                                        />
                                                        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-end opacity-100 transition-opacity">
                                                            <span className="text-white font-bold text-sm leading-tight text-left shadow-black drop-shadow-md">{book.title}</span>
                                                        </div>
                                                    </motion.button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. PAGE SELECT (New) */}
                            {view === 'page-select' && (
                                <div className="w-full h-full overflow-y-auto no-scrollbar pb-8 px-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 place-items-center">
                                        {bookPages.map((url, i) => (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => handleImageSelect(url)}
                                                className="relative group w-full aspect-square rounded-xl overflow-hidden border-2 border-white/10 hover:border-fuchsia-400 hover:shadow-[0_0_30px_rgba(232,121,249,0.3)] transition-all"
                                            >
                                                <img
                                                    src={url}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    alt={`Strana ${i + 1}`}
                                                />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. DIFFICULTY SELECT */}
                            {view === 'difficulty' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-wrap items-center justify-center gap-6"
                                >
                                    <DifficultyCard level={3} label="Učeň" grid="3x3" color="emerald" onClick={() => startGame(3)} />
                                    <DifficultyCard level={4} label="Kouzelník" grid="4x4" color="cyan" onClick={() => startGame(4)} />
                                    <DifficultyCard level={5} label="Velmistr" grid="5x5" color="violet" onClick={() => startGame(5)} />
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {/* Back Button (Contextual) */}
                    {view !== 'menu' && (
                        <button
                            onClick={goBack}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-6 py-3 rounded-full font-medium transition-colors border border-white/5 backdrop-blur mt-4"
                        >
                            Zpět
                        </button>
                    )}

                </div>
            </div>
        </motion.div>
    );
};

// ----------------------------------------------------------------------
// SUBCOMPONENTS
// ----------------------------------------------------------------------

const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={onClick}
        className="absolute top-4 right-4 z-50 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
    >
        <X size={24} />
        <span className="sr-only">Zavřít</span>
    </button>
);

const GameCard = ({ title, icon: Icon, color, description, onClick, delay, locked }: any) => {
    const colorStyles: any = {
        amber: 'group-hover:text-amber-400 from-amber-500/20 to-amber-500/5 hover:border-amber-500/50',
        cyan: 'group-hover:text-cyan-400 from-cyan-500/20 to-cyan-500/5 hover:border-cyan-500/50',
        fuchsia: 'group-hover:text-fuchsia-400 from-fuchsia-500/20 to-fuchsia-500/5 hover:border-fuchsia-500/50',
        indigo: 'group-hover:text-indigo-400 from-indigo-500/20 to-indigo-500/5 hover:border-indigo-500/50',
    };

    const activeStyle = colorStyles[color];

    return (
        <motion.button
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay, type: "spring" }}
            whileHover={!locked ? { y: -20, scale: 1.05, rotateX: 5, zIndex: 10 } : {}}
            whileTap={!locked ? { scale: 0.95 } : {}}
            onClick={onClick}
            disabled={locked}
            className={`group relative w-72 h-96 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center justify-between p-8 transition-all duration-500 ${!locked ? activeStyle : 'opacity-60 grayscale cursor-not-allowed'}`}
        >
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-b ${activeStyle.split(' ')[1]} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[32px]`} />

            {/* Icon Floating */}
            <div className="relative mt-8">
                <div className={`w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 ${locked ? '' : 'animate-float'}`}>
                    <Icon size={40} className="text-white group-hover:text-white transition-colors" />
                </div>
                {/* Orbital Ring */}
                {!locked && (
                    <div className={`absolute inset-0 rounded-full border border-${color}-400/30 scale-125 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-spin-slow`} />
                )}
            </div>

            <div className="relative text-center z-10">
                <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                <p className="text-indigo-200/60 text-sm leading-relaxed">{description}</p>
            </div>

            <div className="relative pt-4">
                {locked ? (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/20">
                        <Lock size={12} /> Brzy
                    </div>
                ) : (
                    <div className="w-12 h-1 bg-white/10 rounded-full group-hover:w-24 group-hover:bg-white transition-all duration-500" />
                )}
            </div>
        </motion.button>
    );
};

const DifficultyCard = ({ level, label, grid, color, onClick }: any) => {
    const bgColors: any = {
        emerald: 'bg-emerald-500',
        cyan: 'bg-cyan-500',
        violet: 'bg-violet-500'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="w-48 h-64 bg-slate-800/80 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden group hover:bg-slate-800"
        >
            <div className={`absolute inset-0 ${bgColors[color]} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

            <div className={`w-16 h-16 rounded-2xl ${bgColors[color]} flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
                <span className="text-white font-bold text-2xl">{level}</span>
            </div>

            <div className="text-center">
                <h4 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                    {label}
                </h4>
                <p className="text-indigo-300/50 font-mono text-sm mt-1">{grid}</p>
            </div>
        </motion.button>
    );
};
