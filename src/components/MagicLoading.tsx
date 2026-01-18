import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Gem } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface MagicLoadingProps {
    status?: string | null; // Optional override from parent
    style?: string; // To adapt colors
    className?: string; // For embedding (not fixed)
    isCover?: boolean; // Context: Cover vs Page
    customMessage?: string;
}

export const MagicLoading = ({ status, style = 'Watercolor', className, isCover = false, customMessage }: MagicLoadingProps) => {
    // START WITH CUSTOM MESSAGE IF PROVIDED
    const [message, setMessage] = useState(customMessage || status || "Múzy se probouzejí...");

    // --- PEARLS OF WISDOM (Themed Loading Text) ---
    const getMessages = () => {
        const general = [
            "Múzy si právě šeptají tvůj nápad...",
            "Sbíráme hvězdný prach na první stránku...",
            "Vypadá to, že tvůj příběh bude legenda!"
        ];

        let themed: string[] = [];

        // Map internal styles to Themes
        const lowerStyle = style.toLowerCase();

        if (lowerStyle.includes('water') || lowerStyle.includes('cloud') || lowerStyle.includes('mráček')) {
            themed = [
                "Mícháme barvy z ranních červánků...",
                "Bublinky nesou tvá slova až k nebi...",
                "Veselé obláčky právě vybarvují tvůj svět..."
            ];
        } else if (lowerStyle.includes('pixar') || lowerStyle.includes('3d') || lowerStyle.includes('clay') || lowerStyle.includes('hliněný')) {
            themed = [
                "Pečeme tvůj příběh s extra dávkou 3D fantazie...",
                "Modelujeme každou postavičku s láskou...",
                "Šotci právě leští poslední detaily ve 3D..."
            ];
        } else if (lowerStyle.includes('futur') || lowerStyle.includes('cyber') || lowerStyle.includes('pixel')) {
            themed = [
                "Vesmírný inkoust právě zasychá na stránkách...",
                "Nabíjíme tvůj příběh neonovou energií...",
                "Skládáme pixely do velkolepého dobrodružství..."
            ];
        } else if (lowerStyle.includes('ghibli') || lowerStyle.includes('watercolor')) {
            themed = [
                "Akvarelové kapky tančí po papíře...",
                "Vdechujeme duši do každého štětce...",
                "Múzy právě malují tvůj svět barvami snů..."
            ];
        } else if (lowerStyle.includes('felt') || lowerStyle.includes('felted') || lowerStyle.includes('plstěný') || lowerStyle.includes('paper') || lowerStyle.includes('vystřihovánka')) {
            themed = [
                "Stříháme a lepíme tvůj svět z papíru a vlny...",
                "Každý steh v tvém příběhu je ručně šitý...",
                "Vystřihujeme ty nejhezčí momenty jen pro tebe..."
            ];
        } else {
            themed = [
                "Kouzla se proplétají tvými slovy...",
                "Hledáme tu správnou barvu pro tvůj svět...",
                "Pečlivě skládáme každou větu..."
            ];
        }

        // Return both lists
        return { general, themed };
    };

    const { general, themed } = useMemo(() => getMessages(), [style]);

    // Combine for cycle logic
    const [currentMsg, setCurrentMsg] = useState('');

    useEffect(() => {
        // Shuffle helper
        const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);

        // 1. Prepare Themed Queue (Shuffled)
        // If themed is empty (fallback), use shuffled general
        const themedQueue = themed.length > 0 ? shuffle(themed) : shuffle(general);

        // PAGE STRATEGIES
        let initialMsg = "";
        let queue = themedQueue;
        let queueIndex = 0;

        if (isCover) {
            // COVER STRATEGY: One General "Múzy..." -> Then Themed Loop
            initialMsg = "Múzy si právě šeptají tvůj nápad...";
        } else {
            // PAGE STRATEGY: Random Themed immediately -> Themed Loop
            // Pick a random start from the queue
            initialMsg = themedQueue[0];
            queueIndex = 1; // Prepare next item
        }

        setCurrentMsg(initialMsg);

        const updateMessage = () => {
            setCurrentMsg(queue[queueIndex % queue.length]);
            queueIndex++;
        };

        // LOOP SPEED
        // Cover gets a bit longer initial moment (3.5s) for the "Múzy" effect, then faster
        // Pages cycle fast (2.8s)
        const delay = isCover ? 3500 : 2800;
        const interval = setInterval(updateMessage, delay);

        return () => clearInterval(interval);
    }, [general, themed, isCover]);

    // Determine Gradient based on Style
    const getGradient = () => {
        const lowerStyle = style.toLowerCase();
        if (lowerStyle.includes('futur') || lowerStyle.includes('cyber')) return 'from-cyan-400/20 via-blue-500/20 to-indigo-600/20';
        if (lowerStyle.includes('pixar') || lowerStyle.includes('pop')) return 'from-orange-400/20 via-red-500/20 to-purple-600/20';
        if (lowerStyle.includes('sketch') || lowerStyle.includes('oil')) return 'from-stone-200 via-stone-400/20 to-stone-800/20';
        if (lowerStyle.includes('ghibli') || lowerStyle.includes('water')) return 'from-green-400/20 via-emerald-500/20 to-blue-600/20';
        if (lowerStyle.includes('frozen')) return 'from-cyan-100 via-blue-200/20 to-indigo-300/20';
        return 'from-indigo-500/20 via-purple-500/20 to-pink-500/20'; // Default
    };

    // Generate particles once
    const particles = useMemo(() => {
        return [...Array(15)].map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            duration: 2 + Math.random() * 3,
            delay: Math.random() * 2,
            xOffset: (Math.random() - 0.5) * 50
        }));
    }, []);



    return (
        <div className={className || `fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-slate-900/95 backdrop-blur-xl`}>
            {/* ATMOSPHERE BACKGROUND */}
            <motion.div
                animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-0 bg-gradient-to-br ${getGradient()} blur-[100px] pointer-events-none`}
            />

            {/* --- NEW: MAGIC MIST LAYERS --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Mist Layer 1 (Clockwise) */}
                <motion.div
                    animate={{ rotate: 360, scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-transparent blur-[100px] rounded-[40%]"
                />
                {/* Mist Layer 2 (Counter-Clockwise) */}
                <motion.div
                    animate={{ rotate: -360, scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-bl from-fuchsia-500/10 via-blue-500/10 to-transparent blur-[120px] rounded-[45%]"
                />
            </div>


            {/* CENTRAL MAGIC CORE */}
            <div className="relative w-64 h-64 flex items-center justify-center">

                {/* 1. Orbiting Particles Ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.2)]"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Star size={16} className="text-amber-300 fill-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                        <Sparkles size={12} className="text-fuchsia-300" />
                    </div>
                </motion.div>

                {/* 2. Inner Faster Ring */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 rounded-full border border-white/5 border-dashed"
                />

                {/* 3. Pulsing Core Icon */}
                <motion.div
                    animate={{ scale: [1, 1.1, 1], filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                >
                    <Gem size={64} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" />
                </motion.div>

                {/* 4. Rising Particles Effect (Enhanced) */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            className="absolute bg-white rounded-full shadow-[0_0_5px_white]"
                            style={{
                                width: p.width,
                                height: p.height,
                                left: p.left,
                                top: '80%' // Start slightly higher
                            }}
                            animate={{
                                y: -250,
                                x: p.xOffset,
                                opacity: [0, 0.8, 0],
                                scale: [0, 1, 0]
                            }}
                            transition={{
                                duration: p.duration,
                                repeat: Infinity,
                                delay: p.delay,
                                ease: "easeOut"
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* TEXT & COPYWRITING - PEARLS */}
            <div className="mt-16 text-center relative z-10 max-w-lg px-6">
                <AnimatePresence mode='wait'>
                    <motion.h3
                        key={status || currentMsg} // Trigger animation on text change
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -15, scale: 1.05 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="text-2xl md:text-3xl font-serif text-white/90 leading-relaxed"
                        style={{ textShadow: "0 0 20px rgba(255,255,255,0.5), 0 0 10px rgba(168,85,247,0.5)" }}
                    >
                        {status || currentMsg}
                    </motion.h3>
                </AnimatePresence>

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.5, repeat: Infinity }} // Visual progress bar simulation
                    className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mt-6 rounded-full opacity-50"
                />
            </div>
        </div>
    );
};
