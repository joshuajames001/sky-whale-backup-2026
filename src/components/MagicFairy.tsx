import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface MagicFairyProps {
    onTrigger: () => void;
    onComplete?: () => void;
}

export const MagicFairy = ({ onTrigger, onComplete }: MagicFairyProps) => {

    useEffect(() => {
        // SIMULATE WAND WAVE at 800ms
        const timer = setTimeout(() => {
            onTrigger();
        }, 800);

        // Complete at 2000ms
        const completeTimer = setTimeout(() => {
            onComplete?.();
        }, 1800);

        return () => {
            clearTimeout(timer);
            clearTimeout(completeTimer);
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }} // Smooth fade out for container
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
            {/* --- MAGIC MIST LAYERS --- */}
            {/* Mist 1: Rotating slow cloud */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                animate={{ opacity: 0.4, scale: 1.5, rotate: 90 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute w-[80vh] h-[80vh] bg-gradient-to-tr from-fuchsia-900/40 to-transparent rounded-full blur-[80px]"
            />
            {/* Mist 2: Counter-rotating highlights */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                animate={{ opacity: 0.3, scale: 1.2, rotate: -45 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
                className="absolute w-[60vh] h-[60vh] bg-gradient-to-bl from-indigo-900/40 to-transparent rounded-full blur-[60px]"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.5, x: -100 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
            >
                {/* COMPOSITE SVG FAIRY */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Glow Aura - Enhanced */}
                    <div className="absolute inset-0 bg-fuchsia-500/30 blur-[60px] rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-white/10 blur-[40px] rounded-full" />

                    <svg width="200" height="200" viewBox="0 0 100 100" className="relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                        {/* WINGS (Animated) */}
                        <motion.g
                            animate={{ rotate: [2, -2], scaleX: [1, 0.9] }}
                            transition={{ repeat: Infinity, repeatType: "mirror", duration: 0.15 }}
                            style={{ originX: "50px", originY: "50px" }}
                        >
                            <path d="M50 50 Q 20 20 10 40 Q 30 60 50 50 Z" fill="url(#wingGradient)" opacity="0.8" />
                            <path d="M50 50 Q 80 20 90 40 Q 70 60 50 50 Z" fill="url(#wingGradient)" opacity="0.8" />
                            <path d="M50 55 Q 25 80 20 65 Q 40 55 50 55 Z" fill="url(#wingGradient)" opacity="0.6" />
                            <path d="M50 55 Q 75 80 80 65 Q 60 55 50 55 Z" fill="url(#wingGradient)" opacity="0.6" />
                        </motion.g>

                        {/* BODY SILHOUETTE */}
                        <path d="M50 35 C 53 35 55 33 55 30 C 55 27 53 25 50 25 C 47 25 45 27 45 30 C 45 33 47 35 50 35 Z" fill="white" /> {/* Head */}
                        <path d="M50 35 C 55 45 60 60 55 80 L 45 80 C 40 60 45 45 50 35 Z" fill="url(#dressGradient)" /> {/* Dress */}

                        {/* ARMS & WAND */}
                        <path d="M48 40 Q 35 50 30 45" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" /> {/* Left Arm */}
                        <g>
                            {/* Right Arm Holding Wand */}
                            <path d="M52 40 Q 65 50 75 35" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
                            {/* THE MAGIC WAND */}
                            <motion.line
                                x1="75" y1="35" x2="85" y2="20"
                                stroke="#e879f9" strokeWidth="1.5"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5 }}
                            />
                            {/* WAND TIP STAR */}
                            <motion.g
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.8, 1], rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <circle cx="85" cy="20" r="2" fill="white" />
                                <path d="M85 15 L 86 19 L 90 20 L 86 21 L 85 25 L 84 21 L 80 20 L 84 19 Z" fill="#ffd700" />
                            </motion.g>

                            {/* PARTICLE HURLING EFFECT - ENHANCED */}
                            {/* Ring 1 */}
                            <motion.circle
                                initial={{ opacity: 0, r: 0 }}
                                animate={{ opacity: [1, 0], r: [1, 30] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 0.8 }}
                                cx="85" cy="20"
                                stroke="white"
                                strokeWidth="1"
                                fill="none"
                            />
                            {/* Ring 2 (Delayed) */}
                            <motion.circle
                                initial={{ opacity: 0, r: 0 }}
                                animate={{ opacity: [0.8, 0], r: [1, 20] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: 1.0 }}
                                cx="85" cy="20"
                                stroke="#e879f9"
                                strokeWidth="0.5"
                                fill="none"
                            />
                        </g>

                        {/* DEFINITIONS */}
                        <defs>
                            <linearGradient id="wingGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.2" />
                            </linearGradient>
                            <linearGradient id="dressGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="#d8b4fe" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-fuchsia-200 font-title text-xl tracking-widest uppercase glow-text drop-shadow-lg animate-pulse">
                        Summoning Magic...
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
};
