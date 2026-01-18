import { useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, Loader2, BookOpen, PenTool, Globe, GraduationCap, Heart, Rocket, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ElevenLabsProfile } from './layout/ElevenLabsProfile';

interface LandingPageProps {
    onEnter: (bookId?: string) => void;
    onOpenCustomBook?: () => void;
    onNavigate?: (view: any) => void;
    user?: SupabaseUser | null;
    onLogin?: () => void;
    hideUI?: boolean;
}

interface ShowcaseBook {
    id: string;
    title: string;
    cover_url: string | null;
}

export const LandingPage = ({ onEnter, onNavigate, user, onLogin, hideUI = false }: LandingPageProps) => {
    // Parallax Logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const [books, setBooks] = useState<ShowcaseBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    // Optimized Image Helper
    const getOptimizedUrl = (url: string | null) => {
        if (!url) return null;
        if (url.includes('supabase.co')) {
            return `${url}?width=400&quality=80&format=webp`;
        }
        return url;
    };

    useEffect(() => {
        // Handle Hash Navigation (from Cinematic Landing)
        if (window.location.hash === '#why-skywhale') {
            setTimeout(() => {
                document.getElementById('why-skywhale')?.scrollIntoView({ behavior: 'smooth' });
                // Clean up hash after scroll
                window.history.replaceState(null, '', ' ');
            }, 800); // Slight delay for render
        } else {
            // Force scroll to top on normal mount
            window.scrollTo(0, 0);
        }

        const fetchShowcase = async () => {
            const { data, error } = await supabase
                .from('books')
                .select('id, title, cover_image_url')
                .neq('cover_image_url', null) // Only books with covers
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error("Landing Data Error:", error);
            }

            let displayBooks: any[] = [];

            if (data && data.length > 0) {
                displayBooks = data.map(b => ({
                    id: b.id,
                    title: b.title,
                    cover_url: getOptimizedUrl(b.cover_image_url)
                }));
            }

            // Fill with mocks if we have fewer than 5 books to ensure nice loop
            const mockBooks = [
                { id: 'mock-1', title: 'The Starlight Journey', cover_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop' },
                { id: 'mock-2', title: 'Ocean Whispers', cover_url: 'https://images.unsplash.com/photo-1498931299472-f7a63a02976be?q=80&w=400&auto=format&fit=crop' },
                { id: 'mock-3', title: 'Forest of Dreams', cover_url: 'https://images.unsplash.com/photo-1448375240586-dfd8f3f0d8ac?q=80&w=400&auto=format&fit=crop' },
                { id: 'mock-4', title: 'Cyber City 2099', cover_url: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=400&auto=format&fit=crop' },
                { id: 'mock-5', title: 'Ancient Legends', cover_url: 'https://images.unsplash.com/photo-1461301214746-1e790926d323?q=80&w=400&auto=format&fit=crop' }
            ];

            // If we have few real books, pad with mocks or duplicate
            if (displayBooks.length < 5) {
                // Combine real and mock
                displayBooks = [...displayBooks, ...mockBooks].slice(0, 8);
            }

            // If we still have enough, fine. If entirely empty (shouldn't happen with mocks), use mocks.
            if (displayBooks.length === 0) displayBooks = mockBooks;


            setBooks(displayBooks);
            setLoading(false);
        };
        fetchShowcase();
    }, []);

    // Fetch profile data when user is logged in
    useEffect(() => {
        if (!user) {
            setProfile(null);
            return;
        }

        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('nickname, avatar_emoji, energy_balance')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile(data);
            }
        };

        fetchProfile();
    }, [user]);

    const handleMouseMove = ({ clientX, clientY }: React.MouseEvent) => {
        const { innerWidth, innerHeight } = window;
        const x = clientX / innerWidth - 0.5;
        const y = clientY / innerHeight - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };



    const handleBookClick = (id?: string) => {
        onEnter(id);
    };

    // Parallax Transforms
    const moveX = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);
    const moveY = useTransform(mouseY, [-0.5, 0.5], [-20, 20]);

    const uspVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.2, duration: 0.8, type: "spring" }
        })
    };

    return (
        <div
            className="fixed inset-0 w-full h-[100dvh] overflow-y-auto bg-transparent text-white pb-32 no-scrollbar"
            onMouseMove={handleMouseMove}
        >
            {/* 3. HERO CONTENT Section (Full Height) */}
            <div className="relative z-10 flex flex-col items-center justify-center h-screen text-center px-4 pointer-events-none pb-48">

                {/* RETURN TO PORTAL BUTTON - Hidden if hideUI is true */}
                {!hideUI && (
                    <button
                        onClick={() => onNavigate?.('cinematic')}
                        className="fixed bottom-6 left-6 z-50 pointer-events-auto px-4 py-2 bg-white/5 backdrop-blur-md text-white/50 hover:text-white text-xs font-bold rounded-full border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 group"
                    >
                        <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                        <span>Zpět na Intro</span>
                    </button>
                )}

                {/* LOGIN / PROFILE BUTTON - Hidden if hideUI is true */}
                {!hideUI && (!user ? (
                    <button
                        onClick={() => onLogin?.()}
                        className="fixed top-6 right-6 z-50 pointer-events-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-full border border-white/20 shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2 group hover:scale-105 active:scale-95"
                    >
                        <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                        <span>Přihlásit se</span>
                    </button>
                ) : profile && (
                    <div className="fixed top-6 right-6 z-50">
                        <ElevenLabsProfile
                            user={user}
                            profile={profile}
                            onOpenProfile={() => onNavigate?.('profile')}
                            onOpenStore={() => onNavigate?.('energy_store')}
                        />
                    </div>
                ))}


                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ x: moveX, y: moveY }}
                    transition={{ duration: 1, type: "spring" }}
                    className="mb-8"
                >
                    <span className="inline-block px-4 py-1 mb-4 rounded-full bg-white/5 border border-white/10 text-purple-200 text-sm font-bold tracking-widest uppercase backdrop-blur-md">
                        Nová generace vyprávění příběhů
                    </span>
                    <h1 className="font-title text-5xl md:text-8xl lg:text-9xl mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-100 to-purple-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                        Skywhale.
                    </h1>
                    <p className="font-serif italic text-xl md:text-2xl text-purple-200/60 max-w-2xl mx-auto">
                        "Kde příběhy ožívají jediným dotykem..."
                    </p>
                    <div
                        className="mt-8 animate-bounce text-purple-300/50 text-sm font-bold uppercase tracking-widest pointer-events-auto cursor-pointer flex flex-col items-center gap-2"
                        onClick={() => {
                            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                        }}
                    >
                        <span>Zjistit Více</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                        </svg>
                    </div>
                </motion.div>

                {/* 4. LIVE CAROUSEL (Relocated INSIDE Hero to stick to bottom of viewport) */}
                <div className="absolute bottom-0 left-0 w-full h-auto z-30 pointer-events-auto overflow-hidden pb-8 pl-4">
                    {/* Gradient to fade top of carousel into hero */}
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-transparent to-[#050510]/80 -translate-y-full pointer-events-none" />

                    {loading ? (
                        <div className="flex justify-center items-center h-32 gap-4">
                            <Loader2 size={24} className="animate-spin text-purple-500" />
                            <span className="text-purple-300 text-sm">Přivolávám knihy...</span>
                        </div>
                    ) : (
                        <div className="flex w-max marquee-content animate-marquee gap-6">
                            {/* TRIPLE LOOP for smooth infinite scroll */}
                            {[...books, ...books, ...books].map((book, idx) => (
                                <div
                                    key={`${book.id}-${idx}`}
                                    onClick={() => handleBookClick(book.id)}
                                    className="
                                        group relative w-32 md:w-40 aspect-[2/3] rounded-xl overflow-hidden 
                                        shadow-lg border border-white/20 transform transition-all duration-300 
                                        cursor-pointer
                                        hover:-translate-y-4 hover:scale-110 hover:z-50 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]
                                        bg-[#1a1a2e] block shrink-0
                                    "
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-end pb-4">
                                        <span className="text-white font-title text-xs drop-shadow-md px-1 text-center line-clamp-2">{book.title}</span>
                                    </div>

                                    {book.cover_url ? (
                                        <img
                                            src={book.cover_url}
                                            alt={book.title}
                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
                                            <Sparkles size={20} className="text-purple-300/50 mb-1" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 5. COMPETITIVE ADVANTAGES (Below Fold) */}
            <div id="why-skywhale" className="relative z-10 w-full py-24 px-6 md:px-12 bg-[#050510] border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-center font-title text-3xl md:text-5xl mb-16 text-white/80 drop-shadow-lg">
                        Proč Skywhale.?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* 1. VISUAL CONSISTENCY */}
                        <motion.div
                            custom={0}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={uspVariants}
                            className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-purple-500/20 group text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Sparkles size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-cyan-300 transition-colors">Vizuální Konzistence</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Unikátní technologie Identity™ zajistí, že hrdina vaší knihy bude vypadat stejně na první i poslední stránce.
                            </p>
                        </motion.div>

                        {/* 2. SPEED */}
                        <motion.div
                            custom={1}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={uspVariants}
                            className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-fuchsia-500/20 group text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Rocket size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-fuchsia-300 transition-colors">Blesková Tvorba</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Žádné zbytečné čekání. Od prvotního nápadu k plnohodnotné ilustrované knize během krátké chvíle.
                            </p>
                        </motion.div>

                        {/* 3. SAFETY */}
                        <motion.div
                            custom={2}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={uspVariants}
                            className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-emerald-500/20 group text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Heart size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-emerald-300 transition-colors">Bezpečný Přístav</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Garantujeme 100% bezpečné prostředí pro děti. Každý příběh prochází naší etickou AI ochranou.
                            </p>
                        </motion.div>

                        {/* 4. FIRST OF KIND */}
                        <motion.div
                            custom={3}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={uspVariants}
                            className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-amber-500/20 group text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Globe size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-amber-300 transition-colors">První Svého Druhu</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Jsme jediná platforma na světě spojující generování knih, filmů a audia do jednoho rodinného studia.
                            </p>
                        </motion.div>

                        {/* 5. EDUCATION */}
                        <motion.div
                            custom={4}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={uspVariants}
                            className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-indigo-500/20 group text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <GraduationCap size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-indigo-300 transition-colors">Vzdělávání Budoucnosti</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Rozvíjíme kreativitu a učíme děti komunikovat s technologií. Prompting je jazyk 21. století.
                            </p>
                        </motion.div>

                        {/* 6. LEGACY */}
                        <motion.div
                            custom={5}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={uspVariants}
                            className="bg-white/5 backdrop-blur-md rounded-[40px] p-8 border border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-xl hover:shadow-rose-500/20 group text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <BookOpen size={32} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-title font-bold mb-4 text-white group-hover:text-rose-300 transition-colors">Rodinné Dědictví</h3>
                            <p className="font-sans text-lg text-white/60 leading-relaxed">
                                Tvořte příběhy, které zůstanou navždy. Od digitální podoby v cloudu až po možnost tisku fyzické knihy.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* 6. ABOUT US SECTION */}
            <div id="about-us" className="relative z-10 w-full py-24 px-6 md:px-12 bg-[#050510] border-t border-white/5 bg-gradient-to-b from-transparent to-purple-900/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-title text-3xl md:text-5xl mb-8 text-white/90 drop-shadow-lg">
                        Náš Příběh
                    </h2>
                    <p className="font-serif text-lg md:text-xl text-white/70 leading-relaxed mb-12">
                        Dnešní děti vnímají svět skrze digitální okna. Místo zákazů jsme zvolili jinou cestu – <span className="text-purple-300 italic">dali jsme tomuto světu hlubší smysl.</span><br /><br />
                        Skywhale. není jen aplikace, je to kreativní ateliér, který proměňuje pasivní čas u obrazovky v radost z tvoření. Spojujeme nejmodernější technologie s lidským citem, abychom vytvořili bezpečný prostor, kde se z malých konzumentů stávají velcí vypravěči.
                        <br /><br />
                        Do každého detailu dáváme srdce, protože věříme, že technologie mají sloužit snům, ne je nahrazovat.
                    </p>
                    <div className="flex justify-center gap-4">
                        <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <span className="block text-2xl font-bold text-white mb-1">1000+</span>
                            <span className="text-xs uppercase tracking-widest text-white/40">Příběhů</span>
                        </div>
                        <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <span className="block text-2xl font-bold text-white mb-1">AI</span>
                            <span className="text-xs uppercase tracking-widest text-white/40">Powered</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 7. LEGAL FOOTER */}
            <footer className="relative z-10 w-full py-12 px-6 bg-[#050510] border-t border-white/5 flex flex-col items-center">
                <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm font-medium text-white/40">
                    <button
                        onClick={() => document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-purple-400 transition-colors uppercase tracking-widest"
                    >
                        O Nás
                    </button>
                    <button
                        onClick={() => onNavigate?.('terms')}
                        className="hover:text-purple-400 transition-colors uppercase tracking-widest"
                    >
                        Podmínky služby
                    </button>
                    <button
                        onClick={() => onNavigate?.('pricing')}
                        className="hover:text-purple-400 transition-colors uppercase tracking-widest"
                    >
                        Ceník
                    </button>
                    <button
                        onClick={() => onNavigate?.('privacy')}
                        className="hover:text-purple-400 transition-colors uppercase tracking-widest"
                    >
                        Ochrana soukromí
                    </button>
                    <a
                        href="mailto:support@skywhale.art"
                        className="hover:text-purple-400 transition-colors uppercase tracking-widest"
                    >
                        Kontakt
                    </a>
                </div>
                <div className="text-white/20 text-xs">
                    &copy; {new Date().getFullYear()} Skywhale. Inc. All rights reserved.
                </div>
            </footer>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
            `}</style>
        </div>
    );
};
