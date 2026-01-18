import { Image, Layers, Type, Sparkles, Layout, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useState } from 'react';
import { BACKGROUND_TEXTURES } from './data/stickers';
import { TEMPLATES } from './data/templates';

interface ToolsDockProps {
    activeTool: 'background' | 'stickers' | 'text' | 'ai' | 'templates' | null;
    onToolChange: (tool: 'background' | 'stickers' | 'text' | 'ai' | 'templates' | null) => void;
    onAddSticker: (sticker: any) => void;
    stickers: any[];
    onGenerateAI?: (prompt: string, mode: 'sticker' | 'background') => void;
    isGenerating?: boolean;
    onAddText: (text: string) => void;
    onChangeBackground: (bg: string) => void;
    textColor?: string;
    textFont?: string;
    onTextColorChange?: (color: string) => void;
    onTextFontChange?: (font: string) => void;
    onSelectTemplate?: (template: any) => void;
    isMobile?: boolean; // Prop kept for compatibility but logic is unified
}

const COLORS = [
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#fbbf24' },
    { name: 'Sky', value: '#38bdf8' },
    { name: 'Indigo', value: '#818cf8' },
    { name: 'Emerald', value: '#34d399' },
    { name: 'Purple', value: '#c084fc' }
];

const FONTS = [
    { name: 'Modern', value: 'Inter, sans-serif' },
    { name: 'Elegant', value: 'Playfair Display, serif' },
    { name: 'Script', value: 'Dancing Script, cursive' },
    { name: 'Fun', value: 'Comic Sans MS, cursive' },
];

/**
 * TOOLS DOCK (UNIFIED LAYOUT)
 * Uses a Fixed Bottom Bar + Slide-up Drawer for ALL screens.
 * This ensures consistency between Mobile and Desktop as requested.
 */
export const ToolsDock = ({ activeTool, onToolChange, onAddSticker, stickers, onGenerateAI, isGenerating, onAddText, onChangeBackground, textColor, textFont, onTextColorChange, onTextFontChange, onSelectTemplate }: ToolsDockProps) => {

    const [aiPrompt, setAiPrompt] = useState("");
    const [textInput, setTextInput] = useState("");
    const dragControls = useDragControls(); // Initialize controls

    const tools = [
        { id: 'templates' as const, icon: Layout, label: 'Šablony' },
        { id: 'background' as const, icon: Image, label: 'Pozadí' },
        { id: 'stickers' as const, icon: Layers, label: 'Nálepky' },
        { id: 'text' as const, icon: Type, label: 'Text' },
        { id: 'ai' as const, icon: Sparkles, label: 'AI Studio' },
    ];

    const handleGenerate = (mode: 'sticker' | 'background') => {
        if (onGenerateAI && aiPrompt.trim()) {
            onGenerateAI(aiPrompt, mode);
        }
    };

    // Close drawer helper
    const closeDrawer = () => onToolChange(null);

    return (
        <>
            {/* 1. DRAWER (Slide Up Panel) */}
            <AnimatePresence>
                {activeTool && (
                    <motion.div
                        className="fixed bottom-[90px] left-0 right-0 md:left-auto md:right-auto md:w-[360px] md:bottom-28 md:shadow-2xl md:bg-slate-900/90 md:rounded-2xl z-[9998]"
                        initial={{ y: '110%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '110%', opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        drag="y"
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{ top: 0, bottom: 500 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 50 || info.velocity.y > 200) {
                                closeDrawer();
                            }
                        }}
                    >
                        {/* Mobile Drawer Style (Full Width Bottom Sheet) */}
                        <div className="md:hidden flex flex-col bg-[#1a1a2e] rounded-t-3xl shadow-[0_-10px_60px_rgba(0,0,0,0.8)] border-t border-white/10 h-[50vh]">
                            {/* Drag Handle - Hit Area Expanded */}
                            <div
                                className="w-full h-14 flex items-center justify-center pt-4 cursor-grab active:cursor-grabbing touch-none z-[100]"
                                onPointerDown={(e) => dragControls.start(e)}
                            >
                                <div className="w-16 h-1.5 bg-white/20 rounded-full" />
                            </div>
                            <button onClick={closeDrawer} className="absolute top-4 right-6 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white z-[101]">
                                <X size={24} />
                            </button>

                            {/* Content */}
                            <div className="overflow-y-auto p-4 custom-scrollbar flex-1 pb-16 touch-pan-y">
                                <ContentRenderer
                                    activeTool={activeTool}
                                    onSelectTemplate={onSelectTemplate}
                                    onChangeBackground={onChangeBackground}
                                    onAddSticker={onAddSticker}
                                    stickers={stickers}
                                    textInput={textInput}
                                    setTextInput={setTextInput}
                                    onAddText={onAddText}
                                    textFont={textFont}
                                    onTextFontChange={onTextFontChange}
                                    textColor={textColor}
                                    onTextColorChange={onTextColorChange}
                                    aiPrompt={aiPrompt}
                                    setAiPrompt={setAiPrompt}
                                    handleGenerate={handleGenerate}
                                    isGenerating={isGenerating}
                                />
                            </div>
                        </div>

                        {/* Desktop Drawer Style (Floating Card) */}
                        <div className="hidden md:flex flex-col bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl h-[400px] shadow-2xl relative overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    {tools.find(t => t.id === activeTool)?.icon &&
                                        (() => {
                                            const Icon = tools.find(t => t.id === activeTool)!.icon;
                                            return <Icon size={20} className="text-indigo-400" />
                                        })()
                                    }
                                    <span>{tools.find(t => t.id === activeTool)?.label}</span>
                                </h3>
                                <button onClick={closeDrawer} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                <ContentRenderer
                                    activeTool={activeTool}
                                    onSelectTemplate={onSelectTemplate}
                                    onChangeBackground={onChangeBackground}
                                    onAddSticker={onAddSticker}
                                    stickers={stickers}
                                    textInput={textInput}
                                    setTextInput={setTextInput}
                                    onAddText={onAddText}
                                    textFont={textFont}
                                    onTextFontChange={onTextFontChange}
                                    textColor={textColor}
                                    onTextColorChange={onTextColorChange}
                                    aiPrompt={aiPrompt}
                                    setAiPrompt={setAiPrompt}
                                    handleGenerate={handleGenerate}
                                    isGenerating={isGenerating}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. BOTTOM TOOLBAR (Fixed to bottom, unified) */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#111111]/95 backdrop-blur-xl border-t border-white/10 z-[99999] flex items-center justify-center shadow-[0_-5px_20px_rgba(0,0,0,0.5)] pb-safe-offset-0">
                {/* Scroll Hints (Smart Arrows) */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none md:hidden z-10 flex items-center justify-start pl-1">
                    <div className="animate-pulse text-white/30"><ChevronLeft size={20} /></div> {/* Left Arrow */}
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none md:hidden z-10 flex items-center justify-end pr-1">
                    <div className="animate-pulse text-white/50"><ChevronRight size={20} /></div> {/* Right Arrow */}
                </div>

                <div className="flex items-center gap-4 md:gap-8 px-8 h-full overflow-x-auto no-scrollbar max-w-4xl mx-auto w-full md:w-auto md:justify-center">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => onToolChange(activeTool === tool.id ? null : tool.id)}
                            className={clsx(
                                "relative flex flex-col items-center justify-center h-full gap-1 transition-all active:scale-95 shrink-0 px-2 group min-w-[60px]",
                                activeTool === tool.id ? "text-indigo-400" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <div className={clsx(
                                "p-2 rounded-xl transition-all duration-300",
                                activeTool === tool.id ? "bg-indigo-500/20 translate-y-[-4px]" : "bg-transparent group-hover:bg-white/5"
                            )}>
                                <tool.icon size={26} className={clsx("transition-transform", activeTool === tool.id ? "scale-110" : "")} />
                            </div>
                            <span className={clsx(
                                "text-[10px] font-bold leading-none uppercase tracking-wide transition-opacity",
                                activeTool === tool.id ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                            )}>{tool.label}</span>

                            {/* Active Indicator Dot */}
                            {activeTool === tool.id && (
                                <motion.div layoutId="active-indicator" className="absolute bottom-2 w-1 h-1 rounded-full bg-indigo-500" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};


// --- Sub-component to render content ---
// (Unchanged logic, just re-used for consistency)
const ContentRenderer = (props: any) => {
    const { activeTool, onSelectTemplate, onChangeBackground, onAddSticker, stickers, textInput, setTextInput, onAddText, textFont, onTextFontChange, textColor, onTextColorChange, aiPrompt, setAiPrompt, handleGenerate, isGenerating } = props;

    switch (activeTool) {
        case 'templates':
            return (
                <div className="flex flex-col gap-4 pb-8">
                    <div className="flex flex-col gap-4">
                        {TEMPLATES.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => onSelectTemplate?.(template)}
                                className="group relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-all"
                            >
                                <img src={template.thumbnail} alt={template.name} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                                    <span className="text-white font-medium text-sm">{template.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            );

        case 'background':
            return (
                <div className="flex flex-col gap-6 pb-8">
                    {Object.entries(
                        BACKGROUND_TEXTURES.reduce((acc: any, bg: any) => {
                            const cat = bg.category || 'Ostatní';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(bg);
                            return acc;
                        }, {})
                    ).map(([category, items]: [string, any]) => (
                        <div key={category}>
                            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{category}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                                {items.map((bg: any) => (
                                    <button
                                        key={bg.id}
                                        onClick={() => onChangeBackground(bg.value)}
                                        className="h-20 w-full rounded-lg border border-white/10 relative overflow-hidden bg-cover bg-center hover:scale-105 transition-all"
                                        style={{
                                            backgroundColor: bg.type === 'color' ? bg.value : undefined,
                                            backgroundImage: bg.type === 'image' ? `url(${bg.value})` : undefined
                                        }}
                                    >
                                        <span className="absolute bottom-1 left-2 text-[10px] text-white shadow-black drop-shadow-md">{bg.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={() => onChangeBackground("#000000")} className="py-3 rounded-lg border border-white/10 bg-black text-xs text-white">
                        Reset (Černá)
                    </button>
                </div>
            );

        case 'stickers':
            return (
                <div className="flex flex-col gap-4 pb-8">
                    <div className="grid grid-cols-4 md:grid-cols-4 gap-2">
                        {stickers.map((sticker: any) => (
                            <button
                                key={sticker.id}
                                onClick={() => onAddSticker(sticker)}
                                className="aspect-square rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-3xl transition-transform hover:scale-110"
                            >
                                {sticker.content}
                            </button>
                        ))}
                    </div>
                </div>
            );

        case 'text':
            return (
                <div className="flex flex-col gap-4 pb-8">
                    {/* Font Selector */}
                    <div>
                        <h3 className="text-white/80 text-xs font-bold uppercase mb-2">Písmo</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {FONTS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => onTextFontChange?.(f.value)}
                                    className={clsx(
                                        "p-2 rounded border text-xs transition-all",
                                        textFont === f.value ? "bg-white text-black border-white" : "bg-white/5 text-slate-300 border-white/10"
                                    )}
                                    style={{ fontFamily: f.value }}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selector */}
                    <div>
                        <h3 className="text-white/80 text-xs font-bold uppercase mb-2">Barva</h3>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => onTextColorChange?.(c.value)}
                                    className={clsx(
                                        "w-8 h-8 rounded-full border-2 transition-transform",
                                        textColor === c.value ? "border-white scale-110" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Napiš přání..."
                        className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        style={{ fontFamily: textFont, color: textColor === '#000000' && textInput ? 'white' : textColor }}
                    />
                    <button
                        onClick={() => { if (textInput.trim()) { onAddText(textInput); setTextInput(""); } }}
                        disabled={!textInput.trim()}
                        className="w-full py-3 bg-indigo-600 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-50"
                    >
                        <Type size={14} className="inline mr-2" /> Vložit
                    </button>
                </div>
            );

        case 'ai':
            return (
                <div className="flex flex-col gap-4 pb-8">
                    <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Popiš, co chceš vytvořit..."
                        className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    />
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => handleGenerate('sticker')}
                            disabled={isGenerating || !aiPrompt}
                            className="py-3 bg-indigo-600 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                        >
                            {isGenerating ? <Sparkles size={16} className="animate-spin" /> : <Layers size={16} />}
                            Nálepka
                        </button>
                        <button
                            onClick={() => handleGenerate('background')}
                            disabled={isGenerating || !aiPrompt}
                            className="py-3 bg-slate-700 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                        >
                            {isGenerating ? <Sparkles size={16} className="animate-spin" /> : <Image size={16} />}
                            Pozadí
                        </button>
                    </div>
                </div>
            );

        default:
            return null;
    }
}
