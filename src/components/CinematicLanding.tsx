import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Loader2, BookOpen, Wand2, Star, ChevronRight, Play, Clapperboard, Music, Lock, Globe, GraduationCap, Heart, Rocket } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CinematicLandingProps {
    onEnter: (bookId?: string) => void;
    onNavigate?: (view: any) => void;
}

interface ShowcaseBook {
    id: string;
    title: string;
    cover_url: string | null;
}

export const CinematicLanding = ({ onEnter, onNavigate }: CinematicLandingProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [books, setBooks] = useState<ShowcaseBook[]>([]);
    const [loading, setLoading] = useState(true);
    const { scrollY } = useScroll({ target: containerRef });

    // Parallax & Fade Effects
    const opacityHero = useTransform(scrollY, [0, 500], [1, 0]);
    const scaleHero = useTransform(scrollY, [0, 500], [1, 0.9]);
    const yHero = useTransform(scrollY, [0, 500], [0, 100]);

    // Optimized Image Helper
    const getOptimizedUrl = (url: string | null) => {
        if (!url) return null;
        if (url.includes('supabase.co')) {
            return `${url}?width=400&quality=80&format=webp`;
        }
        return url;
    };

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchShowcase = async () => {
            const { data, error } = await supabase
                .from('books')
                .select('id, title, cover_image_url')
                .neq('cover_image_url', null)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) console.error("Landing Data Error:", error);

            let displayBooks: any[] = [];
            if (data && data.length > 0) {
                displayBooks = data.map(b => ({
                    id: b.id,
                    title: b.title,
                    cover_url: getOptimizedUrl(b.cover_image_url)
                }));
            }

            const mockBooks = [
                { id: 'mock-1', title: 'The Starlight Journey', cover_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop' },
                { id: 'mock-2', title: 'Ocean Whispers', cover_url: 'https://images.unsplash.com/photo-1498931299472-f7a63a02976be?q=80&w=400&auto=format&fit=crop' },
                { id: 'mock-3', title: 'Forest of Dreams', cover_url: 'https://images.unsplash.com/photo-1448375240586-dfd8f3f0d8ac?q=80&w=400&auto=format&fit=crop' },
                { id: 'mock-4', title: 'Cyber City 2099', cover_url: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=400&auto=format&fit=crop' },
                { id: 'mock-5', title: 'Ancient Legends', cover_url: 'https://images.unsplash.com/photo-1461301214746-1e790926d323?q=80&w=400&auto=format&fit=crop' }
            ];

            if (displayBooks.length < 5) {
                displayBooks = [...displayBooks, ...mockBooks].slice(0, 8);
            }
            if (displayBooks.length === 0) displayBooks = mockBooks;

            setBooks(displayBooks);
            setLoading(false);
        };
        fetchShowcase();
    }, []);

    const handleBookClick = (id?: string) => {
        onEnter(id);
    };

    return (
        <div ref={containerRef} className="relative w-full min-h-screen bg-[#050510] text-white selection:bg-purple-500/30 overflow-x-hidden">

            {/* 1. CINEMATIC VIDEO BACKGROUND (Fixed) */}
            <div className="fixed inset-0 z-0 overflow-hidden">
                {/* Placeholder for user video - defaulting to a subtle gradient animation if no video */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#050510] to-[#050510] z-0 animate-pulse-slow" />

                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-100" // Removed mix-blend-screen for performance
                    poster="/portal-poster.jpg"
                >
                    <source src="/portal.mp4" type="video/mp4" />
                </video>

                {/* Cinematic Overlays - Optimized & Lightened */}
                <div className="absolute inset-0 bg-black/20 z-10" /> {/* Lightened from 60 to 20 */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]/30 z-10" />
            </div>

            {/* 2. TOP NAVIGATION (KlingAI Style) */}
            <nav className="fixed top-0 left-0 w-full z-50 py-6 px-8 flex items-center justify-between transition-all duration-300 bg-gradient-to-b from-black/80 to-transparent">
                {/* Logo */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                        transition={{
                            duration: 0.8,
                            y: { duration: 4, repeat: Infinity, ease: "easeInOut" } // Floating effect
                        }}
                        className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    >
                        <motion.svg
                            width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                            className="text-white drop-shadow-md"
                        >
                            <motion.path
                                d="M2.00024 16.0001C2.50024 13.5001 4.50024 7.0001 11.0002 7.0001C11.0002 4.0001 12.5002 2.0001 14.5002 2.0001C15.0002 2.0001 15.1147 2.68656 14.8698 3.09477C14.0754 4.41872 13.0002 6.5001 13.0002 8.0001C13.0002 8.0001 19.0002 7.5001 21.0002 11.0001C22.6575 13.9004 20.5002 18.0001 16.0002 18.0001C11.5002 18.0001 9.00024 22.0001 2.00024 22.0001"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                            <motion.circle
                                cx="15.5" cy="11.5" r="1.5" fill="currentColor" fillOpacity="0.8"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.5, duration: 0.3 }}
                            />
                        </motion.svg>
                    </motion.div>
                    <span className="font-title text-xl font-bold tracking-wide text-white drop-shadow-md group-hover:text-purple-200 transition-colors">Skywhale.</span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-widest uppercase text-white/80">

                    {/* [NEW] STUDIO DROPDOWN (Hover Trigger) */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all py-2">
                            Studio <ChevronRight size={12} className="rotate-90 group-hover:-rotate-90 transition-transform duration-300" />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 w-64">
                            <div className="bg-[#0a0a16]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col gap-1">

                                {/* 1. BOOKS (Active) */}
                                <button
                                    onClick={() => onEnter()}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left group/item"
                                >
                                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 group-hover/item:text-white transition-colors">
                                        <BookOpen size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white tracking-widest">Příběhy</span>
                                        <span className="text-[10px] text-zinc-400 normal-case tracking-normal">Vytvořit ilustrovanou knihu</span>
                                    </div>
                                </button>

                                {/* 2. MOVIES (Coming Soon) */}
                                <div className="flex items-center gap-3 p-3 rounded-xl opacity-50 cursor-not-allowed">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-300">
                                        <Clapperboard size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white tracking-widest">Filmy</span>
                                            <span className="text-[8px] bg-blue-500/20 text-blue-200 px-1.5 rounded border border-blue-500/30">SOON</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-400 normal-case tracking-normal">Animovat postavy z knih</span>
                                    </div>
                                </div>

                                {/* 3. SOUNDS (Coming Soon) */}
                                <div className="flex items-center gap-3 p-3 rounded-xl opacity-50 cursor-not-allowed">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-300">
                                        <Music size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white tracking-widest">Zvuky</span>
                                            <span className="text-[8px] bg-emerald-500/20 text-emerald-200 px-1.5 rounded border border-emerald-500/30">SOON</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-400 normal-case tracking-normal">Generovat hudbu a efekty</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            window.location.hash = 'why-skywhale';
                            onNavigate?.('landing');
                        }}
                        className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all"
                    >
                        O Nás
                    </button>
                    <button
                        onClick={() => onNavigate?.('terms')}
                        className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all"
                    >
                        Pravidla
                    </button>
                    <button
                        onClick={() => window.location.href = 'mailto:support@skywhale.art'}
                        className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all"
                    >
                        Kontakt
                    </button>
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => onNavigate?.('landing')}
                    className="px-6 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                    Vstoupit do Aplikace
                </button>
            </nav>



            {/* 3. HERO SECTION */}
            <motion.div
                style={{ opacity: opacityHero, scale: scaleHero, y: yHero }}
                className="relative z-20 h-screen flex flex-col items-center justify-center px-4 text-center"
            >


                <h1 className="font-title text-6xl md:text-8xl lg:text-9xl mb-6 text-white drop-shadow-2xl tracking-tighter">
                    Skywhale<span className="text-purple-400">.</span>
                </h1>

                <p className="font-sans text-lg md:text-xl text-zinc-300 max-w-xl mx-auto leading-relaxed mb-10 text-pretty">
                    Vytvářejte filmové příběhy pomocí generativní umělé inteligence.
                </p>

                <div className="flex flex-col items-center mt-12">
                    <button
                        onClick={() => onNavigate?.('landing')}
                        className="group relative px-10 py-4 rounded-full border border-white/30 hover:border-white bg-transparent hover:bg-white/5 transition-all w-64 text-center overflow-hidden"
                    >
                        <span className="relative z-10 font-bold text-lg tracking-widest uppercase flex items-center justify-center gap-2 text-white">
                            Vstoupit <ChevronRight size={16} />
                        </span>
                    </button>
                </div>
            </motion.div>


            {/* 4. CONTENT SECTIONS (Below Fold - Glass Panels) */}
            <div className="relative z-20 pb-24">

                {/* GALLERY CAROUSEL */}
                <div className="w-full py-24 border-t border-white/5 bg-[#050510]/50 backdrop-blur-sm">
                    <h2 className="text-center font-title text-3xl mb-12 text-white/60">Poslední výtvory</h2>

                    <div className="w-full overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-purple-500" />
                            </div>
                        ) : (
                            <div className="flex w-max marquee-content animate-marquee gap-8 px-4">
                                {[...books, ...books].map((book, idx) => (
                                    <div
                                        key={`${book.id}-${idx}`}
                                        onClick={() => handleBookClick(book.id)}
                                        className="
                                            group relative w-48 aspect-[2/3] rounded-2xl overflow-hidden 
                                            bg-white/5 border border-white/10 
                                            cursor-pointer transition-all duration-500
                                            hover:-translate-y-4 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]
                                        "
                                    >
                                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                        {book.cover_url ? (
                                            <img src={book.cover_url} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-purple-900/20"><Sparkles className="text-white/20" /></div>
                                        )}
                                        <div className="absolute bottom-4 left-4 right-4 z-20 translate-y-2 group-hover:translate-y-0 transition-transform">
                                            <p className="font-bold text-sm leading-tight line-clamp-2 text-white drop-shadow-md">{book.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* FEATURES GRID */}
                {/* FEATURES GRID */}
                <div id="why-skywhale" className="max-w-7xl mx-auto px-6 py-24">
                    <h2 className="text-center font-title text-3xl md:text-5xl mb-16 text-white/80 drop-shadow-lg">
                        Proč Skywhale.?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* 1. VISUAL CONSISTENCY */}
                        <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-purple-500/20 group text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Sparkles size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-cyan-300 transition-colors">Vizuální Konzistence</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Unikátní technologie Identity™ zajistí, že hrdina vaší knihy bude vypadat stejně na první i poslední stránce.
                            </p>
                        </div>

                        {/* 2. SPEED */}
                        <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-fuchsia-500/20 group text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Rocket size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-fuchsia-300 transition-colors">Blesková Tvorba</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Žádné zbytečné čekání. Od prvotního nápadu k plnohodnotné ilustrované knize během krátké chvíle.
                            </p>
                        </div>

                        {/* 3. SAFETY */}
                        <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-emerald-500/20 group text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Heart size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-emerald-300 transition-colors">Bezpečný Přístav</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Garantujeme 100% bezpečné prostředí pro děti. Každý příběh prochází naší etickou AI ochranou.
                            </p>
                        </div>

                        {/* 4. FIRST OF KIND */}
                        <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-amber-500/20 group text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Globe size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-amber-300 transition-colors">První Svého Druhu</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Jsme jediná platforma na světě spojující generování knih, filmů a audia do jednoho rodinného studia.
                            </p>
                        </div>

                        {/* 5. EDUCATION */}
                        <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-indigo-500/20 group text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <GraduationCap size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-indigo-300 transition-colors">Vzdělávání Budoucnosti</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Rozvíjíme kreativitu a učíme děti komunikovat s technologií. Prompting je jazyk 21. století.
                            </p>
                        </div>

                        {/* 6. LEGACY */}
                        <div className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-rose-500/20 group text-center">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <BookOpen size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-rose-300 transition-colors">Rodinné Dědictví</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Tvořte příběhy, které zůstanou navždy. Od digitální podoby v cloudu až po možnost tisku fyzické knihy.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ABOUT US SECTION */}
                <div id="about-us-cinematic" className="relative z-30 w-full bg-[#050510] border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-6 py-32 text-center">
                        <h2 className="font-title text-3xl md:text-5xl mb-8 text-white/90 drop-shadow-lg">
                            Náš Příběh
                        </h2>
                        <div className="font-serif text-lg md:text-xl text-white/70 leading-relaxed mb-12 text-center">
                            <p>
                                Dnešní děti vnímají svět skrze digitální okna. Místo zákazů jsme zvolili jinou cestu – <span className="text-cyan-300 italic">dali jsme tomuto světu hlubší smysl.</span>
                            </p>
                            <br />
                            <p>
                                Skywhale. proměňuje pasivní čas u obrazovky v radost z tvoření. Spojujeme nejmodernější technologie s lidským citem, abychom vytvořili bezpečný prostor, kde se z malých konzumentů stávají velcí vypravěči.
                                Do každého detailu dáváme srdce, protože věříme, že technologie mají sloužit snům, ne je nahrazovat.
                            </p>
                        </div>

                        <div className="flex justify-center gap-8">
                            {/* Stats ... */}
                            <div className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                                <span className="block text-3xl font-bold text-white mb-1">1000+</span>
                                <span className="text-xs uppercase tracking-widest text-zinc-500">Příběhů</span>
                            </div>
                            <div className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                                <span className="block text-3xl font-bold text-white mb-1">AI</span>
                                <span className="text-xs uppercase tracking-widest text-zinc-500">Powered</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LEGAL FOOTER */}
                <footer className="w-full py-12 px-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 uppercase tracking-widest gap-4 max-w-7xl mx-auto">
                    <div className="flex gap-6">
                        <button onClick={() => { window.location.hash = 'why-skywhale'; onNavigate?.('landing'); }} className="hover:text-white transition-colors">O Nás</button>
                        <button onClick={() => onNavigate?.('terms')} className="hover:text-white transition-colors">Podmínky</button>
                        <button onClick={() => onNavigate?.('privacy')} className="hover:text-white transition-colors">Soukromí</button>
                    </div>
                    <div>&copy; {new Date().getFullYear()} Skywhale.</div>
                </footer>

            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
                .shadow-glow {
                     box-shadow: 0 0 20px rgba(168,85,247,0.5);
                }
            `}</style>
        </div>
    );
};
