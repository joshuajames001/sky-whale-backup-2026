import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    energy_reward?: number;
}

interface AchievementToastProps {
    achievement: Achievement | null;
    onDismiss: () => void;
}

export const AchievementToast = ({ achievement, onDismiss }: AchievementToastProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (achievement) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300); // Wait for exit animation
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onDismiss]);

    return (
        <AnimatePresence>
            {isVisible && achievement && (
                <motion.div
                    initial={{ opacity: 0, y: -100, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto"
                >
                    <div className="bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 p-1 rounded-2xl shadow-2xl shadow-amber-500/50">
                        <div className="bg-slate-900 rounded-xl p-6 pr-12 relative min-w-[320px] max-w-md">
                            {/* Close button */}
                            <button
                                onClick={() => {
                                    setIsVisible(false);
                                    setTimeout(onDismiss, 300);
                                }}
                                className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            {/* Content */}
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shrink-0">
                                    {achievement.icon}
                                </div>

                                {/* Text */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="text-amber-400" size={16} />
                                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                            Úspěch Odemčen!
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white mb-1">
                                        {achievement.title}
                                    </h3>
                                    <p className="text-sm text-slate-300 leading-tight mb-2">
                                        {achievement.description}
                                    </p>

                                    {/* Energy Reward */}
                                    {achievement.energy_reward && achievement.energy_reward > 0 && (
                                        <div className="flex items-center gap-2 mt-3 bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-2">
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: [0, 1.2, 1] }}
                                                transition={{ delay: 0.3, duration: 0.5 }}
                                                className="text-2xl"
                                            >
                                                ⚡
                                            </motion.span>
                                            <span className="text-sm font-black text-amber-300">
                                                +{achievement.energy_reward} Energie
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sparkle effect */}
                            <div className="absolute -top-2 -right-2 text-amber-400 animate-pulse">
                                ✨
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
