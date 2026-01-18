import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface StyleSelectorProps {
    selected: string;
    onSelect: (value: string) => void;
}

export const StyleSelector = ({ selected, onSelect }: StyleSelectorProps) => {
    const options = [
        { id: 'watercolor', label: 'Akvarel', color: 'from-blue-200 to-purple-200' },
        { id: 'pixar_3d', label: 'Pixar 3D', color: 'from-orange-200 to-yellow-200' },
        { id: 'futuristic', label: 'Futuristický', color: 'from-cyan-400 to-blue-500 text-white' },
        { id: 'sketch', label: 'Kresba', color: 'from-stone-200 to-stone-300' },
        { id: 'ghibli_anime', label: 'Studio Ghibli', color: 'from-green-100 to-emerald-200' },
        { id: 'cyberpunk', label: 'Cyberpunk', color: 'from-fuchsia-600 to-purple-900 text-white' },
        { id: 'felted_wool', label: 'Plstěný', color: 'from-amber-100 to-orange-200' },
        { id: 'paper_cutout', label: 'Vystřihovánka', color: 'from-red-100 to-rose-200' },
        { id: 'claymation', label: 'Hliněný', color: 'from-amber-700 to-orange-800 text-white' },
        { id: 'pop_art', label: 'Pop Art', color: 'from-yellow-400 to-red-500 text-white' },
        { id: 'dark_oil', label: 'Temná malba', color: 'from-slate-800 to-black text-white' },
        { id: 'vintage_parchment', label: 'Starý pergamen', color: 'from-orange-50/50 to-amber-100/50' },
        { id: 'pixel_art', label: 'Pixel Art', color: 'from-green-400 to-blue-500 text-white' },
        { id: 'frozen_crystal', label: 'Ledové království', color: 'from-cyan-100 to-blue-200' },
        { id: 'happy_cloud', label: 'Veselý mráček', color: 'from-pink-200 via-orange-200 to-yellow-200' },
    ];

    return (
        <div className="grid grid-cols-3 gap-2 md:gap-3 max-h-[320px] overflow-y-auto pr-2 no-scrollbar p-1 border-y border-slate-50 py-4">
            {options.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                    <motion.button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className={`relative h-16 md:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ease-out group ${isSelected ? 'border-violet-500 scale-[1.02]' : 'border-transparent md:hover:scale-[1.02]'}`}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Background Mockup */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${opt.color} opacity-80 group-hover:opacity-100 transition-opacity duration-300 ease-out`} />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`font-title font-bold text-[10px] md:text-sm text-center px-1 drop-shadow-md ${opt.id === 'Futuristic' ? 'text-white' : 'text-slate-800'}`}>
                                {opt.label}
                            </span>
                        </div>

                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-sm"
                            >
                                <Sparkles size={12} className="text-violet-500" />
                            </motion.div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
};
