import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';

interface AvatarPickerProps {
    currentAvatar: string;
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const AVATAR_CATEGORIES = {
    'Zvířátka': ['🐱', '🐶', '🦊', '🐻', '🐰', '🦉', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵'],
    'Postavičky': ['👦', '👧', '🧙', '👸', '🤖', '👽', '🧚', '🦸', '🧛', '🧜', '🧞', '🎅'],
    'Abstraktní': ['⭐', '🌟', '✨', '💫', '🔮', '🎨', '🌈', '🎭', '🎪', '🎯', '🎲', '🎰'],
    'Příroda': ['🌸', '🌺', '🌻', '🌹', '🌷', '🌲', '🌴', '🍀', '🍄', '🌵', '🌾', '🪴'],
};

export const AvatarPicker = ({ currentAvatar, onSelect, onClose }: AvatarPickerProps) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('Zvířátka');

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-slate-900 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Vyber si Avatar</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 p-4 border-b border-white/10 overflow-x-auto">
                        {Object.keys(AVATAR_CATEGORIES).map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === category
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Avatar Grid */}
                    <div className="p-6 grid grid-cols-6 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {AVATAR_CATEGORIES[selectedCategory as keyof typeof AVATAR_CATEGORIES].map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => {
                                    onSelect(emoji);
                                    onClose();
                                }}
                                className={`aspect-square rounded-2xl text-4xl flex items-center justify-center transition-all hover:scale-110 ${currentAvatar === emoji
                                        ? 'bg-purple-600 ring-4 ring-purple-400/50'
                                        : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10 text-center">
                        <p className="text-sm text-slate-400">
                            Aktuální: <span className="text-3xl ml-2">{currentAvatar}</span>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
