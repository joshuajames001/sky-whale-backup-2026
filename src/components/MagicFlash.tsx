import { motion, AnimatePresence } from 'framer-motion';

interface MagicFlashProps {
    isActive: boolean;
}

export const MagicFlash = ({ isActive }: MagicFlashProps) => {
    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden"
                >
                    {/* 1. Expansion Ring (Shockwave) */}
                    <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute w-[50vw] h-[50vw] rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 opacity-50 blur-[50px]"
                    />

                    {/* 2. Full Screen Whiteout (The Flash) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="absolute inset-0 bg-white"
                    />

                    {/* 3. Post-Flash Tint (Fade to new content) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="absolute inset-0 bg-fuchsia-950 mix-blend-multiply"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
