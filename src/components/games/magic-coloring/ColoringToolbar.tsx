import React from 'react';

import { Brush, Eraser, Download, ArrowLeft, RefreshCw, Palette, PaintBucket, Sparkles, Rainbow } from 'lucide-react';

export type ToolType = 'brush' | 'eraser' | 'bucket' | 'neon' | 'rainbow';

interface ColoringToolbarProps {
    palette: string[]; // Dynamic
    activeColorIndex: number | null;
    setActiveColorIndex: (i: number | null) => void;
    onDownload: () => void;
    onBack: () => void;
    onReset: () => void;
}

const COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#84CC16', // Lime
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
    '#881337', // Rose (Dark)
    '#78350F', // Brown
    '#000000', // Black
    '#FFFFFF', // White
];

export const ColoringToolbar: React.FC<ColoringToolbarProps> = ({
    palette, activeColorIndex, setActiveColorIndex, onDownload, onBack, onReset
}) => {
    return (
        <div className="flex flex-col gap-6 p-6 h-full bg-slate-900/80 backdrop-blur-xl border-l border-white/10 w-80 shadow-2xl overflow-y-auto custom-scrollbar">

            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-2">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h3 className="text-xl font-bold text-white font-title">Ateliér</h3>
            </div>

            {/* Tools - Simplified for Paint By Numbers */}
            <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Režim</div>
                <div className="bg-slate-800/50 p-2 rounded-xl text-center text-slate-400 text-sm">
                    Klikni na číslo a vybarvi plochu!
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Dynamic Palette */}
            {palette && palette.length > 0 && (
                <div className="space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paleta barev</div>
                    <div className="grid grid-cols-4 gap-3">
                        {palette.map((c, index) => {
                            const isSelected = activeColorIndex === index;
                            return (
                                <button
                                    key={`${c}-${index}`}
                                    onClick={() => setActiveColorIndex(index)}
                                    className={`relative w-12 h-12 rounded-lg border-2 transition-all transform hover:scale-105 ${isSelected ? 'border-white scale-110 shadow-xl ring-2 ring-indigo-500' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                >
                                    <span className={`absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                        {index + 1}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-auto space-y-3">
                <button
                    onClick={onReset}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium flex items-center justify-center gap-2 transition-colors border border-white/5"
                >
                    <RefreshCw size={18} />
                    Začít znovu
                </button>

                <button
                    onClick={onDownload}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
                >
                    <Download size={20} />
                    Uložit Dílo
                </button>
            </div>

        </div>
    );
};
