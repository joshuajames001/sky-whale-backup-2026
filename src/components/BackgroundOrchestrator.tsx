import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- DATA TYPES ---
type ParticleType = 'circle' | 'square' | 'line' | 'hexagon' | 'cloud' | 'holo';

interface RealmTheme {
    id: string;
    label: string;
    colors: {
        primary: string;   // Center/Start
        secondary: string; // Edge/End
        accent: string;    // Particles
    };
    particle: {
        type: ParticleType;
        count: number;
        opacity: number[];
        // Animation physics (Framer Motion variants)
        animate: any;
        // Static overrides
        shapeClass?: string;
    };
}

// --- THEME DEFINITIONS ---
const REALMS: RealmTheme[] = [
    {
        id: 'forest',
        label: 'Šeptající les',
        colors: { primary: '#064e3b', secondary: '#022c22', accent: '#10b981' },
        particle: {
            type: 'circle',
            count: 25,
            opacity: [0.2, 0.6, 0.2],
            animate: { y: [-10, -100], x: [0, 20] }, // Rising pollen
            shapeClass: 'rounded-full blur-[1px]'
        }
    },
    {
        id: 'lake',
        label: 'Hluboké jezero',
        colors: { primary: '#0c4a6e', secondary: '#082f49', accent: '#22d3ee' },
        particle: {
            type: 'circle', // Ring via border? Or just bubble.
            count: 20,
            opacity: [0, 0.5, 0],
            animate: { y: [100, -100], x: [-10, 10] }, // Bubbles
            shapeClass: 'rounded-full border border-cyan-400/30'
        }
    },
    {
        id: 'desert',
        label: 'Zlatá savana',
        colors: { primary: '#78350f', secondary: '#451a03', accent: '#fbbf24' },
        particle: {
            type: 'circle',
            count: 30,
            opacity: [0, 0.4, 0],
            animate: { rotate: 360, x: [0, 50], y: [0, -20] }, // Dust in wind
            shapeClass: 'rounded-full'
        }
    },
    {
        id: 'arctic',
        label: 'Ledové království',
        colors: { primary: '#0f172a', secondary: '#1e293b', accent: '#bae6fd' }, // Corrected order per user request logic (Primary=Start)
        particle: {
            type: 'hexagon',
            count: 40,
            opacity: [0, 0.8, 0],
            animate: { y: [-20, 100], rotate: [0, 180] }, // Snow
        }
    },
    {
        id: 'cloud',
        label: 'Nad mraky',
        colors: { primary: '#0ea5e9', secondary: '#38bdf8', accent: '#ffffff' },
        particle: {
            type: 'cloud',
            count: 8,
            opacity: [0.3, 0.7, 0.3],
            animate: { x: [-100, 100] }, // Parallax clouds
            shapeClass: 'rounded-full blur-xl'
        }
    },
    {
        id: 'sunset',
        label: 'Západ slunce',
        colors: { primary: '#4c1d95', secondary: '#831843', accent: '#fb923c' },
        particle: {
            type: 'circle',
            count: 15,
            opacity: [0.2, 0.6, 0.2],
            animate: { scale: [1, 1.5, 1] }, // Pulsing orbs
            shapeClass: 'rounded-full blur-md'
        }
    },
    {
        id: 'storm',
        label: 'Bouřková noc',
        colors: { primary: '#1e1b4b', secondary: '#312e81', accent: '#6366f1' },
        particle: {
            type: 'line',
            count: 50,
            opacity: [0, 0.8, 0],
            animate: { y: [-50, 400], skewY: 20 }, // Fast Rain
            shapeClass: 'w-[2px] h-10'
        }
    },
    {
        id: 'cave',
        label: 'Křišťálová jeskyně',
        colors: { primary: '#2e1065', secondary: '#020617', accent: '#d946ef' },
        particle: {
            type: 'square',
            count: 25,
            opacity: [0, 1, 0],
            animate: { scale: [0, 1.2, 0] }, // Twinkle crystals
            shapeClass: 'rotate-45' // Diamonds
        }
    },
    {
        id: 'candy',
        label: 'Cukrovinkový svět',
        colors: { primary: '#be185d', secondary: '#9d174d', accent: '#fce7f3' },
        particle: {
            type: 'circle',
            count: 15,
            opacity: [0.4, 0.8, 0.4],
            animate: { y: [-10, 10], scale: [0.8, 1.1] }, // Floating syrup
            shapeClass: 'rounded-full shadow-sm'
        }
    },
    {
        id: 'paper',
        label: 'Papírový svět',
        colors: { primary: '#44403c', secondary: '#292524', accent: '#a8a29e' },
        particle: {
            type: 'square',
            count: 12,
            opacity: [0.2, 0.6, 0.2],
            animate: { y: [0, 100], rotateX: 360, rotateY: 180 }, // Confetti fall
        }
    },
    {
        id: 'neon',
        label: 'Digitální mlhovina',
        colors: { primary: '#020617', secondary: '#0f172a', accent: '#22d3ee' },
        particle: {
            type: 'square',
            count: 40,
            opacity: [0, 1, 0],
            animate: { x: [0, 100] }, // Data bits
            shapeClass: 'w-1 h-1'
        }
    },
    {
        id: 'holo',
        label: 'Holografický prostor',
        colors: { primary: '#1e1b4b', secondary: '#312e81', accent: '#c084fc' },
        particle: {
            type: 'holo',
            count: 30,
            opacity: [0, 0.5, 0],
            animate: { pathLength: [0, 1] }, // Drawing lines. Needs SVG.
        }
    }
];

// --- ORCHESTRATOR COMPONENT ---

export const BackgroundOrchestrator = ({ className }: { className?: string }) => {
    const [theme, setTheme] = useState<RealmTheme>(REALMS[0]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Random selection on mount
        const randomTheme = REALMS[Math.floor(Math.random() * REALMS.length)];
        setTheme(randomTheme);
        setMounted(true);
        console.log(`🎨 Background Engine: ${randomTheme.label} [${randomTheme.id}]`);
    }, []);

    const containerClass = className || "fixed inset-0 z-[-1]";

    if (!mounted) return <div className={`${containerClass} bg-[#020617]`} />;

    return (
        <div className={`${containerClass} overflow-hidden bg-black`}>
            <AnimatePresence mode='wait'>
                <motion.div
                    key={theme.id} // Switch triggers exit/enter
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full"
                    style={{
                        background: `radial-gradient(circle at center, ${theme.colors.primary}, ${theme.colors.secondary})`
                    }}
                >
                    {/* PARTICLE SYSTEM */}
                    {[...Array(theme.particle.count)].map((_, i) => (
                        <Particle
                            key={`${theme.id}-${i}`}
                            config={theme.particle}
                            color={theme.colors.accent}
                            index={i}
                        />
                    ))}

                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// --- PARTICLE COMPONENT ---

const Particle = ({ config, color, index }: { config: RealmTheme['particle'], color: string, index: number }) => {

    // Generate Random Starting Position
    // Use useMemo ensures consistency during render, but we want new randoms on mount of this particle instance.
    const randoms = useMemo(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        scale: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 5,
        duration: Math.random() * 5 + 5
    }), []);

    const isHolo = config.type === 'holo';

    // Size logic
    const sizeClass = config.type === 'line' ? 'w-[1px] h-8' :
        config.type === 'cloud' ? 'w-32 h-16' :
            'w-2 h-2';

    // SVG logic for Holo
    if (isHolo) {
        return (
            <motion.svg
                className="absolute overflow-visible"
                style={{
                    top: randoms.top,
                    left: randoms.left,
                    width: '100px',
                    height: '100px',
                    opacity: 0.5
                }}
            >
                <motion.path
                    d={`M 0 50 Q 50 ${Math.random() * 100} 100 50`} // Random curve
                    stroke={color}
                    strokeWidth="2"
                    fill="transparent"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
                    transition={{
                        duration: randoms.duration,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "linear",
                        delay: randoms.delay
                    }}
                />
            </motion.svg>
        );
    }

    return (
        <motion.div
            className={`absolute ${sizeClass} ${config.shapeClass || ''}`}
            style={{
                top: randoms.top,
                left: randoms.left,
                backgroundColor: color
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                ...config.animate,
                opacity: config.opacity, // Override opacity
                scale: config.animate.scale || [randoms.scale, randoms.scale * 1.2, randoms.scale] // Default scale loop if not in animate
            }}
            transition={{
                duration: config.type === 'line' ? 1.5 : randoms.duration, // Rain is fast
                repeat: Infinity,
                ease: "linear", // Requested linear or easeInOut
                delay: randoms.delay
            }}
        />
    );
};
