import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ControlsProps {
    onNext: () => void;
    onPrev: () => void;
    canNext: boolean;
    canPrev: boolean;
}

export const Controls = ({ onNext, onPrev, canNext, canPrev }: ControlsProps) => {
    return (
        <div className="absolute inset-0 z-40 pointer-events-none flex justify-between items-center px-1 md:px-8">
            {/* Left Hint (Subtle Pulse) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: canPrev ? 1 : 0 }}
                className="h-full flex items-center justify-center w-12 md:w-24 bg-gradient-to-r from-black/20 to-transparent"
            >
                <motion.div
                    animate={{ x: [0, -5, 0], opacity: [0.1, 0.4, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                >
                    <ChevronLeft size={32} className="text-white/50" />
                </motion.div>
            </motion.div>

            {/* Right Hint (Subtle Pulse) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: canNext ? 1 : 0 }}
                className="h-full flex items-center justify-center w-12 md:w-24 bg-gradient-to-l from-black/20 to-transparent"
            >
                <motion.div
                    animate={{ x: [0, 5, 0], opacity: [0.1, 0.4, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                >
                    <ChevronRight size={32} className="text-white/50" />
                </motion.div>
            </motion.div>
        </div>
    );
};
