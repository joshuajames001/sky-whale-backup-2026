import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface AnimatedInputProps {
    label: string;
    icon: LucideIcon;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
}

export const AnimatedInput = ({ label, icon: Icon, value, onChange, placeholder }: AnimatedInputProps) => {
    const [focused, setFocused] = useState(false);

    return (
        <div className="relative group w-full">
            <label className="flex items-center gap-2 text-indigo-200/50 font-bold mb-2 uppercase tracking-wider text-xs">
                <Icon size={14} /> {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    className="w-full py-4 bg-transparent text-xl md:text-2xl font-serif text-white placeholder-white/20 outline-none relative z-10 transition-colors duration-300 ease-out"
                />
                {/* Base Underline */}
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/10 rounded-full" />

                {/* Animated Active Underline */}
                <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: focused ? "100%" : "0%" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full z-20"
                />

                {/* Focus Glow pulse */}
                <AnimatePresence>
                    {focused && (
                        <motion.div
                            layoutId="glow"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute -inset-4 bg-violet-500/5 blur-xl rounded-lg -z-10 pointer-events-none"
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
