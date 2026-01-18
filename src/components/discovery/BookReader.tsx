import { useState, useEffect, useRef } from 'react';
import { DiscoveryPage, DiscoveryHotspot } from '../../types/discovery';
import { supabase } from '../../lib/supabase';
import { Info, X, Volume2, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const BookReader = ({ page, isDino, onPageComplete }: { page: DiscoveryPage; isDino?: boolean; onPageComplete?: () => void }) => {
    // GUARD CLAUSE: When pages are cleared (e.g. on back), this might be undefined during exit animation.
    if (!page) return null;

    // Kontrola koncovky - musí být malými písmeny, 'includes' řeší i query parametry (?v=123)
    const isVideo = page.image_url?.toLowerCase().includes('.mp4');

    const [hotspots, setHotspots] = useState<DiscoveryHotspot[]>([]);
    const [activeHotspot, setActiveHotspot] = useState<DiscoveryHotspot | null>(null);

    // AUDIO STATE
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch Hotspots
    useEffect(() => {
        const fetchHotspots = async () => {
            const { data } = await supabase
                .from('discovery_hotspots')
                .select('*')
                .eq('page_id', page.id);
            setHotspots(data || []);
            setActiveHotspot(null);
        };
        fetchHotspots();
    }, [page.id]);

    // Handle Audio
    useEffect(() => {
        // Cleanup previous audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        if (page.audio_url) {
            const audio = new Audio(page.audio_url);

            // Event Listeners
            audio.onplay = () => setIsPlaying(true);
            audio.onpause = () => setIsPlaying(false);

            // Auto-turn on end
            audio.onended = () => {
                setIsPlaying(false);
                setCurrentTime(0);
                if (onPageComplete) onPageComplete();
            };

            audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
            audio.onloadedmetadata = () => setDuration(audio.duration);

            audioRef.current = audio;

            // AUTO PLAY with User Interaction Safety
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Auto-play prevented:", error);
                    setIsPlaying(false);
                });
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [page.audio_url, onPageComplete]);

    const toggleAudio = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="w-full h-full flex flex-col md:flex-row shadow-2xl overflow-hidden md:rounded-[2rem]">
            {/* Illustration Area (Top half on mobile, left on desktop) */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full relative group overflow-hidden shrink-0">
                {isVideo ? (
                    <video
                        key={page.image_url}
                        src={page.image_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover"
                    >
                        Váš prohlížeč nepodporuje přehrávání videa.
                    </video>
                ) : (
                    <div className="w-full h-full relative overflow-hidden bg-slate-950">
                        {/* Blurred Background (The 'Environment' feel) */}
                        {isDino && (
                            <div
                                className="absolute inset-0 scale-110 blur-2xl opacity-40 saturate-150"
                                style={{
                                    backgroundImage: `url(${page.image_url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                        )}

                        <motion.img
                            key={page.image_url}
                            src={page.image_url}
                            alt={page.title}
                            className={`relative w-full h-full ${isDino ? 'object-contain' : 'object-cover'}`}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                {/* HOTSPOTS OVERLAY */}
                <div className="absolute inset-0 z-20">
                    {hotspots.map((hs) => (
                        <div
                            key={hs.id}
                            className="absolute"
                            style={{ left: `${hs.x_pos}%`, top: `${hs.y_pos}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <button
                                onClick={() => setActiveHotspot(activeHotspot?.id === hs.id ? null : hs)}
                                className={`relative group/hotspot ${activeHotspot?.id === hs.id ? 'z-[60]' : 'z-30'}`}
                            >
                                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                                <div className="relative w-10 h-10 md:w-8 md:h-8 bg-white/30 backdrop-blur-md border border-white/50 rounded-full flex items-center justify-center hover:bg-white/40 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                                    <div className="w-3 h-3 md:w-3 md:h-3 bg-white rounded-full shadow-sm" />
                                </div>
                            </button>

                            {/* TOOLTIP / POPOVER */}
                            <AnimatePresence>
                                {activeHotspot?.id === hs.id && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                        className="absolute left-1/2 bottom-full mb-4 -translate-x-1/2 w-[80vw] md:w-80 bg-slate-950/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl z-50 text-left"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-white font-bold leading-tight">{hs.title}</h3>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveHotspot(null); }}
                                                className="text-slate-400 hover:text-white p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <p className="text-slate-200 text-sm leading-relaxed">{hs.content}</p>

                                        {/* Arrow */}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-slate-950/95" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Page number hint */}
                <span className="absolute bottom-4 left-6 font-serif text-sm text-white/50 z-10">
                    Strana {page.page_number}
                </span>
            </div>

            {/* Text Area (Bottom half on mobile, right on desktop) */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full relative p-6 md:p-12 lg:p-16 flex flex-col justify-start bg-black/20 overflow-y-auto custom-scrollbar">
                {/* Night Sky Texture to match StorySpread */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
                        backgroundRepeat: 'repeat'
                    }}
                />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 md:mb-8">
                        <h2 className="text-2xl md:text-4xl font-black text-white leading-tight font-title">
                            {page.title}
                        </h2>

                        {/* AUDIO BUTTON */}
                        {page.audio_url && (
                            <div className="flex flex-col gap-2 relative group/audio shrink-0">
                                <button
                                    onClick={toggleAudio}
                                    className={`
                                        p-3 rounded-full border transition-all duration-300
                                        ${isPlaying
                                            ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }
                                    `}
                                >
                                    {isPlaying ? <Pause size={20} /> : <Volume2 size={20} />}
                                </button>
                                {duration > 0 && (
                                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 transition-all duration-200"
                                            style={{ width: `${(currentTime / duration) * 100}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <motion.div
                        className="font-serif text-lg md:text-xl leading-[1.8] text-indigo-50/90 text-justify tracking-wide selection:bg-purple-900/50 pb-20 md:pb-0"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {page.content_text}
                    </motion.div>
                </div>

                <span className="absolute bottom-10 right-12 font-serif text-indigo-300/10 text-xl z-0 pointer-events-none">
                    ✦
                </span>
            </div>
        </div>
    );
};
