import { motion } from 'framer-motion';
import { getTheme } from '../lib/themes';
import { useEffect, useState } from 'react';

interface StoryNebulaProps {
    style?: string;
    className?: string;
}

const GENERATION_ENVIRONMENTS = [
    {
        id: 'Sky',
        bgGradient: 'bg-gradient-to-b from-blue-400 to-indigo-100', // Sky
        particleColor: 'bg-white',
        particleShape: 'rounded-full', // Clouds/Mist
        effect: 'float'
    },
    {
        id: 'Forest',
        bgGradient: 'bg-gradient-to-b from-emerald-900 to-green-700', // Forest
        particleColor: 'bg-emerald-300',
        particleShape: 'rounded-tl-none rounded-br-none', // Leaves
        effect: 'fall'
    },
    {
        id: 'Lake',
        bgGradient: 'bg-gradient-to-b from-cyan-800 to-blue-900', // Lake
        particleColor: 'bg-cyan-200',
        particleShape: 'rounded-full', // Bubbles
        effect: 'rise'
    },
    {
        id: 'Desert',
        bgGradient: 'bg-gradient-to-b from-orange-200 to-yellow-600', // Desert
        particleColor: 'bg-orange-100', // Heat haze
        particleShape: 'rounded-full',
        effect: 'shimmer'
    }
];

export const StoryNebula = ({ style, className }: StoryNebulaProps) => {

    const [randomEnv, setRandomEnv] = useState(GENERATION_ENVIRONMENTS[0]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setRandomEnv(GENERATION_ENVIRONMENTS[Math.floor(Math.random() * GENERATION_ENVIRONMENTS.length)]);
        setMounted(true);
    }, []);

    // Determine config: Theme if style exists, otherwise Random Realm
    const theme = style ? getTheme(style) : null;

    // Config for Render
    const bgClass = theme ? theme.bgGradient : randomEnv.bgGradient;
    const isThemeMode = !!theme;

    // Variant Logic
    const variant = theme?.variant || 'nebula';
    const showAurora = variant === 'nebula' || variant === 'aurora';
    const isDigital = variant === 'digital';
    const isClean = variant === 'clean';

    const containerClass = className || "fixed inset-0 z-0";

    if (!mounted) return <div className={`${containerClass} bg-[#020617]`} />;

    return (
        <div className={`${containerClass} overflow-hidden ${bgClass} transition-colors duration-1000`}>

            {/* --- NEBULA/AURORA (Only for Cosmic themes) --- */}
            {isThemeMode && theme && showAurora && (
                <>
                    {/* Layer A - Slow flow */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className={`absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] rounded-full blur-[100px] ${theme.nebulaColors.aurora1}`}
                    />
                    {/* Layer B - Counter flow */}
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            rotate: [0, -15, 15, 0],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                        className={`absolute bottom-[-10%] right-[-10%] w-[90vw] h-[90vw] rounded-full blur-[120px] ${theme.nebulaColors.aurora2}`}
                    />
                    {/* Central Vortex */}
                    <motion.div
                        animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] bg-white/5 blur-[80px] rounded-full"
                    />
                </>
            )}

            {/* --- PARTICLES (Adapts to Realm or Theme Variant) --- */}
            <div className="absolute inset-0">
                {[...Array(isThemeMode ? (isClean ? 8 : 20) : 25)].map((_, i) => (
                    <motion.div
                        key={i}
                        className={`absolute 
                            ${isThemeMode ? theme!.nebulaColors.dust : randomEnv.particleShape} 
                            ${isThemeMode ? (isDigital ? 'rounded-xs bg-cyan-400/50' : isClean ? 'rounded-full bg-stone-500/30' : 'blur-[1px]') : 'blur-[2px]'}
                            ${isThemeMode ? '' : randomEnv.particleColor}
                        `}

                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            opacity: 0
                        }}
                        animate={{
                            y: isThemeMode ? (
                                isDigital ? [null, Math.random() * 300] : // Digital Rain
                                    isClean ? [null, Math.random() * 20 - 10] : // Static Float
                                        [null, Math.random() * -200] // Nebula Rise
                            ) :
                                randomEnv.effect === 'fall' ? [null, Math.random() * 200] :
                                    randomEnv.effect === 'rise' ? [null, Math.random() * -200] :
                                        [null, (Math.random() - 0.5) * 50],

                            x: isThemeMode && isDigital ? 0 : // Digital straight down
                                [null, (Math.random() - 0.5) * 50],

                            opacity: isDigital ? [0, 1, 0] : [0, Math.random() * 0.6 + 0.2, 0],
                        }}
                        transition={{
                            duration: isDigital ? Math.random() * 2 + 1 : Math.random() * 10 + 10,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: isDigital ? "linear" : "easeInOut"
                        }}
                    >
                        {/* Theme Mode Dust Shape override if needed */}
                        {isThemeMode && !isDigital && !isClean && <div className={`w-full h-full rounded-full ${theme!.nebulaColors.dust}`} />}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
