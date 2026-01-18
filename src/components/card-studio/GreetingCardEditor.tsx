import { useState, useRef, useEffect } from 'react';
import { CardCanvas } from './CardCanvas';
import { ToolsDock } from './ToolsDock';
import { useStory } from '../../hooks/useStory';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { StarryBackground } from '../StarryBackground';
import { SKYWHALE_STICKERS } from './data/stickers';
import { supabase } from '../../lib/supabase';
import { assertContentSafe } from '../../lib/moderation';
import Konva from 'konva';
import { Undo2, Redo2, ChevronLeft, ChevronRight, Home, Loader2, X, Share2, Save, Download, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CardPage, CardItem } from './types';
import { invokeEdgeFunction } from '../../lib/edge-functions';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- HELPER COMPONENT ---
const GreetingCardPage = ({ page, selectedId, onSelect, onUpdate, onItemDragStart, onItemDragEnd, stageRef }: any) => {
    if (!page) return <div className="w-full h-full bg-slate-100 animate-pulse" />;

    return (
        <CardCanvas
            items={page.items || []}
            background={page.background || "#fffcf5"}
            selectedId={selectedId}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onItemDragStart={onItemDragStart}
            onItemDragEnd={onItemDragEnd}
            domRef={stageRef}
        />
    )
}

interface GreetingCardEditorProps {
    initialProject?: {
        id: string;
        title: string;
        pages: CardPage[];
    } | null;
}

export const GreetingCardEditor = ({ initialProject }: GreetingCardEditorProps) => {
    const [activeTool, setActiveTool] = useState<'background' | 'stickers' | 'text' | 'ai' | 'templates' | null>(null);
    const [isDraggingSticker, setIsDraggingSticker] = useState(false); // Track item drag to disable page swipe

    // --- RESPONSIVE STATE ---
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- CONSTANTS ---
    const PAGE_COVER = 0;
    const PAGE_SPREAD = 1; // Shows Index 1 (Left) & 2 (Right)
    const PAGE_BACK = 3;

    // --- STATE: PAGES (Strict 4-Page Booklet) ---
    // --- STATE: PAGES (Strict 4-Page Booklet) ---
    // PERSISTENCE: Use local storage for drafts
    const [pages, setPages] = useLocalStorage<CardPage[]>('skywhale_draft_card_pages', (() => {
        if (initialProject && initialProject.pages) {
            return initialProject.pages;
        }
        return [
            { id: 'p0', name: 'Titulní strana', items: [], background: "#fffcf5" }, // Cover
            { id: 'p1', name: 'Levá strana', items: [], background: "#fffcf5" },    // Inside Left
            { id: 'p2', name: 'Pravá strana', items: [], background: "#fffcf5" },   // Inside Right (LINED)
            { id: 'p3', name: 'Zadní strana', items: [], background: "#fffcf5" }    // Back
        ];
    })());

    // View State (0 = Cover, 1 = Spread, 3 = Back)
    const [viewStartIndex, setViewStartIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    // Which page is currently receiving inputs (stickers, text)?
    // Defaults to viewStartIndex, but user can click the other page in a spread
    const [focusedPageIndex, setFocusedPageIndex] = useState(0);

    // Sync focused page when view changes
    useEffect(() => {
        setFocusedPageIndex(viewStartIndex);
    }, [viewStartIndex]);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Text Style State
    const [textColor, setTextColor] = useState<string>("#ffffff");
    const [textFont, setTextFont] = useState<string>("Inter");

    // History State (Tracks the ENTIRE Book)
    const [history, setHistory] = useState<CardPage[][]>([pages]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const { saveCardProject, saving: isSaving } = useStory();

    // Ref for the Konva Stage
    const stageRef = useRef<Konva.Stage>(null);

    // History Helpers
    const addToHistory = (newPages: CardPage[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPages);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setPages(newPages);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setPages(history[newIndex]);
            if (viewStartIndex >= history[newIndex].length) {
                // Approximate view restoration
                if (viewStartIndex === 1 && history[newIndex].length < 3) setViewStartIndex(0);
            }
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setPages(history[newIndex]);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, historyIndex]);

    // Dependencies for AI/Export
    const handleSetBackground = (bg: string) => {
        const newPages = [...pages];
        if (newPages[focusedPageIndex]) {
            newPages[focusedPageIndex] = { ...newPages[focusedPageIndex], background: bg };
            addToHistory(newPages);
        }
    };

    const generateAI = async (prompt: string, mode: 'sticker' | 'background', referenceUrl?: string | null) => {
        try {
            setIsGenerating(true);

            // 🛡️ SAFETY CHECK: Moderate prompt before AI generation
            await assertContentSafe(prompt);

            if (mode === 'sticker') {
                handleAddImage(data.imageUrl);
            } else {
                handleSetBackground(data.imageUrl);
            }
        } catch (e: any) {
            console.error("AI Generation failed:", e);
            const msg = e.message || JSON.stringify(e);

            // User-friendly error for inappropriate content
            if (msg.includes('Obsah není vhodný')) {
                alert("⚠️ Tento text není vhodný pro děti.\n\nZkus napsat něco jiného, prosím! 🌟");
                return;
            }

            if (msg.includes('402') || msg.includes('Insufficient credit')) {
                alert("💳 Platba přijata! Replicate systém však potřebuje 3-5 minut na připsání kreditu.\n\nZkuste to prosím za chvilku znovu.");
            } else {
                alert(`Došel kouzelný prach! Chyba: ${msg}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddImage = (url: string) => {
        addItem({ type: 'image', content: url, scaleX: 0.15, scaleY: 0.15 });
    };

    const handleAddText = (text: string) => {
        addItem({
            type: 'text', content: text, color: textColor, fontFamily: textFont
        });
    };

    const addItem = (props: Partial<CardItem>) => {
        const newItem: CardItem = {
            id: generateId(),
            type: 'icon', content: null, x: 100, y: 100, scaleX: 1, scaleY: 1,
            rotation: (Math.random() - 0.5) * 10,
            ...props
        };

        const newPages = [...pages];
        const targetIndex = focusedPageIndex;

        if (newPages[targetIndex]) {
            const currentPage = newPages[targetIndex];
            newPages[targetIndex] = { ...currentPage, items: [...currentPage.items, newItem] };
            addToHistory(newPages);
            setSelectedId(newItem.id);
        }
    }

    const handleUpdateItem = (id: string, updates: Partial<CardItem>) => {
        const newPages = [...pages];
        let pageIndex = focusedPageIndex;
        let itemExists = newPages[pageIndex]?.items.some(i => i.id === id);

        if (!itemExists) {
            pageIndex = newPages.findIndex(p => p.items.some(i => i.id === id));
        }

        if (pageIndex !== -1) {
            const currentPage = newPages[pageIndex];
            const updatedItems = currentPage.items.map(item => item.id === id ? { ...item, ...updates } : item);
            newPages[pageIndex] = { ...currentPage, items: updatedItems };
            addToHistory(newPages);
        }
    };

    const handleDownload = async () => {
        if (!stageRef.current) return;
        setIsExporting(true);
        setSelectedId(null);
        setTimeout(async () => {
            try {
                const dataURL = stageRef.current?.toDataURL({ pixelRatio: 2 });
                if (dataURL) {
                    const link = document.createElement('a');
                    link.download = `přáníčko-${focusedPageIndex + 1}.png`;
                    link.href = dataURL;
                    link.click();
                }
            } catch (e) {
                console.error("Download failed", e);
            } finally {
                setIsExporting(false);
            }
        }, 50);
    };

    const handleSaveDB = async () => {
        if (!stageRef.current) {
            alert("Chyba: Nelze zachytit náhled. Zkuste kliknout na stránku, kterou chcete uložit jako náhled.");
            return;
        }

        // 1. Capture Thumbnail from current view
        setSelectedId(null);
        await new Promise(r => setTimeout(r, 50)); // wait for deselect render

        const blob = await new Promise<Blob | null>(resolve =>
            stageRef.current?.toCanvas().toBlob(resolve, 'image/png')
        );

        if (!blob) {
            alert("Nepodařilo se vytvořit náhled.");
            return;
        }

        // 2. Prepare Data
        // Convert pages to clean object (remove functions if any, but they are pure data)
        const projectData = {
            // Better: use one persistent ID for the whole card project.
            // For now, generate a new ID or use the first page ID as base.
            // Let's create a dedicated state for projectID if strictly needed, but random is ok for new saves (creates new copy).
            // NOTE: If we want to UPDATE, we need to store initial ID.
            // For MVP (Save New):
            id: crypto.randomUUID(),
            title: `Přáníčko ${new Date().toLocaleDateString()}`,
            pages: pages,
            thumbnailBlob: blob
        };

        const success = await saveCardProject(projectData);
        if (success) {
            // maybe redirect or just notify. Notification handled in hook.
        }
    };

    const handleShare = () => {
        const referralCode = localStorage.getItem('referral_code') || '';
        const shareUrl = `${window.location.origin}/?ref=${referralCode || 'friend'}`;
        if (confirm("✨ Chceš zkopírovat odkaz na aplikaci pro kamarády?")) {
            navigator.clipboard.writeText(shareUrl);
            alert("Odkaz zkopírován! 📋");
        }
    };

    const handleNewProject = () => {
        if (window.confirm('Opravdu chceš začít nové přání? Současný koncept bude smazán.')) {
            setPages([
                { id: 'p0', name: 'Titulní strana', items: [], background: "#fffcf5" },
                { id: 'p1', name: 'Levá strana', items: [], background: "#fffcf5" },
                { id: 'p2', name: 'Pravá strana', items: [], background: "#fffcf5" },
                { id: 'p3', name: 'Zadní strana', items: [], background: "#fffcf5" }
            ]);
            addToHistory([
                { id: 'p0', name: 'Titulní strana', items: [], background: "#fffcf5" }, // Reset history too
                { id: 'p1', name: 'Levá strana', items: [], background: "#fffcf5" },
                { id: 'p2', name: 'Pravá strana', items: [], background: "#fffcf5" },
                { id: 'p3', name: 'Zadní strana', items: [], background: "#fffcf5" }
            ]);
            setViewStartIndex(0);
        }
    };

    // --- NAVIGATION LOGIC (STRICT) ---
    const goToPrevPage = () => {
        if (viewStartIndex === PAGE_COVER) return;
        setDirection(-1);
        if (viewStartIndex === PAGE_BACK) {
            setViewStartIndex(PAGE_SPREAD);
        } else if (viewStartIndex === PAGE_SPREAD) {
            setViewStartIndex(PAGE_COVER);
        }
    };

    const goToNextPage = () => {
        setDirection(1);
        if (viewStartIndex === PAGE_COVER) {
            setViewStartIndex(PAGE_SPREAD);
        } else if (viewStartIndex === PAGE_SPREAD) {
            setViewStartIndex(PAGE_BACK);
        }
    };

    const canGoNext = viewStartIndex !== PAGE_BACK;
    const canGoPrev = viewStartIndex !== PAGE_COVER;

    const isCover = viewStartIndex === PAGE_COVER;
    const isSpread = viewStartIndex === PAGE_SPREAD;
    const isBack = viewStartIndex === PAGE_BACK;

    const handleSelectTemplate = (template: any) => {
        const newPages = [...pages];
        if (newPages[focusedPageIndex]) {
            const themeBackground = template.pages[0]?.background;
            if (themeBackground) {
                newPages[focusedPageIndex] = { ...newPages[focusedPageIndex], background: themeBackground };
                addToHistory(newPages);
            }
        }
    };

    return (
        <div className="flex flex-col h-[100svh] bg-slate-100 overflow-hidden relative selection:bg-indigo-500/30">
            <StarryBackground />

            {/* TOP BAR / HEADER */}
            <div className="h-16 bg-white/10 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-[60]">
                <div className="flex items-center gap-4">
                    {/* HOME BUTTON (Mobile Only replacement for V2) */}
                    <a href="/?view=landing" className="w-10 h-10 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-xl flex items-center justify-center text-indigo-300 transition-colors">
                        <Home size={20} />
                    </a>
                    <span className="text-white font-bold text-lg block md:hidden">Ateliér</span>
                    <span className="text-white font-bold text-lg hidden md:block">Ateliér Přání v2</span>

                    <button
                        onClick={handleNewProject}
                        className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500 border border-red-500/50 flex items-center justify-center text-red-200 hover:text-white transition-all shrink-0 ml-4 hover:scale-110 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                        title="Nové přání (Smazat)"
                    >
                        <Plus size={16} className="rotate-45" strokeWidth={3} />
                    </button>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2">
                    <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-white/10 rounded-full text-white disabled:opacity-30">
                        <Undo2 size={20} />
                    </button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-white/10 rounded-full text-white disabled:opacity-30">
                        <Redo2 size={20} />
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-1" />
                    <button
                        onClick={handleDownload}
                        disabled={isExporting}
                        title="Stáhnout obrázek"
                        className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 border border-white/20 shadow-lg hover:bg-white/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                        <Download size={18} />
                    </button>
                    <button
                        onClick={handleSaveDB}
                        disabled={isSaving}
                        title="Uložit do Knihovny"
                        className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 border border-white/20 shadow-lg hover:bg-white/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    </button>
                    <button
                        onClick={handleShare}
                        title="Sdílet Odkaz"
                        className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 border border-white/20 shadow-lg hover:bg-white/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                        <Share2 size={18} />
                    </button>
                    {(activeTool === 'templates' || activeTool === 'stickers') && (
                        <button onClick={() => setActiveTool(null)} className="md:hidden p-2 text-white/50">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>


            {/* MAIN WORKSPACE - CENTERING CANVAS */}
            <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-transparent mt-16 mb-20">
                <div className="relative w-full h-full max-w-6xl max-h-[85vh] flex items-center justify-center p-4 md:p-8">

                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        {(() => {
                            // HELPER: Label Badge
                            const PageLabel = ({ label, hasItems }: { label: string, hasItems: boolean }) => (
                                <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full pointer-events-none transition-opacity duration-500 ${hasItems ? 'opacity-0' : 'opacity-100'}`}>
                                    {label}
                                </div>
                            );

                            if (isMobile) {
                                // 1. COVER - Always Single
                                if (isCover) {
                                    return (
                                        <motion.div
                                            key="mobile-cover"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="w-full h-full flex items-center justify-center p-6 pt-36 pb-32"
                                            drag={isDraggingSticker ? false : "x"} // Disable page swipe when dragging a sticker
                                            dragConstraints={{ left: 0, right: 0 }}
                                            onDragEnd={(e, { offset }) => { if (offset.x < -50) goToNextPage(); }}
                                        >
                                            <div className="w-full aspect-[2/3] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 relative">
                                                <div onClick={() => setFocusedPageIndex(0)} className="w-full h-full">
                                                    <GreetingCardPage
                                                        page={pages[0]}
                                                        selectedId={selectedId}
                                                        onSelect={setSelectedId}
                                                        onUpdate={handleUpdateItem}
                                                        onItemDragStart={() => setIsDraggingSticker(true)}
                                                        onItemDragEnd={() => setIsDraggingSticker(false)}
                                                        stageRef={focusedPageIndex === 0 ? stageRef : undefined}
                                                    />
                                                </div>
                                                <PageLabel label="Titulní Strana" hasItems={pages[0].items.length > 0} />
                                            </div>
                                        </motion.div>
                                    );
                                }

                                // 2. BACK - Always Single
                                if (isBack) {
                                    return (
                                        <motion.div
                                            key="mobile-back"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="w-full h-full flex items-center justify-center p-6 pt-36 pb-32"
                                            drag={isDraggingSticker ? false : "x"} // Disable page swipe when dragging a sticker
                                            dragConstraints={{ left: 0, right: 0 }}
                                            onDragEnd={(e, { offset }) => { if (offset.x > 50) goToPrevPage(); }}
                                        >
                                            <div className="w-full aspect-[2/3] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 relative">
                                                <div onClick={() => setFocusedPageIndex(3)} className="w-full h-full">
                                                    <GreetingCardPage
                                                        page={pages[3]}
                                                        selectedId={selectedId}
                                                        onSelect={setSelectedId}
                                                        onUpdate={handleUpdateItem}
                                                        onItemDragStart={() => setIsDraggingSticker(true)}
                                                        onItemDragEnd={() => setIsDraggingSticker(false)}
                                                        stageRef={focusedPageIndex === 3 ? stageRef : undefined}
                                                    />
                                                </div>
                                                <PageLabel label="Zadní Strana" hasItems={pages[3].items.length > 0} />
                                            </div>
                                        </motion.div>
                                    );
                                }

                                // 3. SPREAD (Inner Pages) - HORIZONTAL Double View
                                return (
                                    <motion.div
                                        key={`mobile-spread`}
                                        custom={direction}
                                        initial={{ x: direction * 100 + '%', opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: direction * -100 + '%', opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        drag={isDraggingSticker ? false : "x"} // Disable page swipe when dragging a sticker
                                        dragConstraints={{ left: 0, right: 0 }}
                                        onDragEnd={(e, { offset }) => {
                                            if (offset.x < -50) goToNextPage();
                                            if (offset.x > 50) goToPrevPage();
                                        }}
                                        className="absolute inset-0 flex flex-col items-center justify-center p-2 pt-20 pb-32"
                                    >
                                        {/* Container for the Spread */}
                                        <div className="flex flex-row w-full aspect-[4/3] shadow-2xl rounded-lg overflow-hidden border border-slate-600 bg-slate-800 gap-[2px] relative z-0">
                                            {/* LEFT PAGE */}
                                            <div
                                                className={`flex-1 bg-white relative rounded-l-[1px] overflow-hidden flex items-center justify-center transition-all duration-300 ${focusedPageIndex === 1 ? 'ring-4 ring-indigo-500 z-10 brightness-110' : 'brightness-90 hover:brightness-100'}`}
                                            >
                                                <div
                                                    onPointerDown={(e) => { e.stopPropagation(); setFocusedPageIndex(1); }}
                                                    onTouchStart={(e) => { e.stopPropagation(); setFocusedPageIndex(1); }}
                                                    className="origin-center" style={{ transform: 'scale(0.42)' }}
                                                >
                                                    <GreetingCardPage
                                                        page={pages[1]}
                                                        selectedId={selectedId}
                                                        onSelect={setSelectedId}
                                                        onUpdate={handleUpdateItem}
                                                        onItemDragStart={() => setIsDraggingSticker(true)}
                                                        onItemDragEnd={() => setIsDraggingSticker(false)}
                                                        stageRef={focusedPageIndex === 1 ? stageRef : undefined}
                                                    />
                                                    <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* RIGHT PAGE - LINED */}
                                            <div
                                                className={`flex-1 bg-white relative rounded-r-[1px] overflow-hidden flex items-center justify-center transition-all duration-300 ${focusedPageIndex === 2 ? 'ring-4 ring-indigo-500 z-10 brightness-110' : 'brightness-90 hover:brightness-100'}`}
                                            >
                                                <div
                                                    onPointerDown={(e) => { e.stopPropagation(); setFocusedPageIndex(2); }}
                                                    onTouchStart={(e) => { e.stopPropagation(); setFocusedPageIndex(2); }}
                                                    className="relative origin-center" style={{ transform: 'scale(0.42)' }}
                                                >
                                                    <GreetingCardPage
                                                        page={pages[2]}
                                                        selectedId={selectedId}
                                                        onSelect={setSelectedId}
                                                        onUpdate={handleUpdateItem}
                                                        onItemDragStart={() => setIsDraggingSticker(true)}
                                                        onItemDragEnd={() => setIsDraggingSticker(false)}
                                                        stageRef={focusedPageIndex === 2 ? stageRef : undefined}
                                                    />
                                                    <div className="absolute inset-0 pointer-events-none z-20 mix-blend-multiply opacity-50"
                                                        style={{
                                                            backgroundImage: 'repeating-linear-gradient(transparent, transparent 19px, #94a3b8 20px)'
                                                        }} />
                                                    <div className="absolute top-0 left-0 bottom-0 w-6 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Label for Spread */}
                                            <PageLabel label="Vnitřek listu" hasItems={pages[1].items.length > 0 || pages[2].items.length > 0} />
                                        </div>

                                        <div className="mt-8 text-white/50 text-xs font-medium uppercase tracking-widest flex items-center gap-2">
                                            <ChevronLeft size={12} /> Slide <ChevronRight size={12} />
                                        </div>
                                    </motion.div>
                                );
                            }

                            // --- DESKTOP VIEWS ---
                            if (isCover) {
                                return (
                                    <motion.div key="cover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative flex flex-col items-center justify-center h-full aspect-[2/3]">
                                        <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 relative">
                                            <div onClick={() => setFocusedPageIndex(0)} className="w-full h-full cursor-pointer">
                                                <GreetingCardPage page={pages[0]} selectedId={selectedId} onSelect={setSelectedId} onUpdate={handleUpdateItem} stageRef={focusedPageIndex === 0 ? stageRef : undefined} />
                                            </div>
                                            <PageLabel label="Titulní Strana" hasItems={pages[0].items.length > 0} />
                                        </div>
                                        {/* Desktop Nav Arrows (Side) */}
                                        <button onClick={goToNextPage} className="absolute -right-16 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110">
                                            <ChevronRight size={32} />
                                        </button>
                                    </motion.div>
                                );
                            }
                            if (isBack) {
                                return (
                                    <motion.div key="back" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative flex flex-col items-center justify-center h-full aspect-[2/3]">
                                        <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 relative">
                                            <div onClick={() => setFocusedPageIndex(3)} className="w-full h-full cursor-pointer">
                                                <GreetingCardPage page={pages[3]} selectedId={selectedId} onSelect={setSelectedId} onUpdate={handleUpdateItem} stageRef={focusedPageIndex === 3 ? stageRef : undefined} />
                                            </div>
                                            <PageLabel label="Zadní Strana" hasItems={pages[3].items.length > 0} />
                                        </div>
                                        <button onClick={goToPrevPage} className="absolute -left-16 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110">
                                            <ChevronLeft size={32} />
                                        </button>
                                    </motion.div>
                                );
                            }
                            return (
                                <motion.div key={`spread-${viewStartIndex}`} custom={direction} initial={{ rotateY: direction === 1 ? -90 : 90, opacity: 0, scale: 0.8 }} animate={{ rotateY: 0, opacity: 1, scale: 1 }} exit={{ rotateY: direction === 1 ? 90 : -90, opacity: 0, scale: 0.8 }} transition={{ duration: 0.5 }} className="flex flex-row gap-4 h-full aspect-[4/3] items-center justify-center perspective-1000 relative">
                                    <div className="flex-1 h-full bg-white rounded-l-xl shadow-2xl overflow-hidden border-r border-slate-200 relative group">
                                        <div onClick={() => setFocusedPageIndex(1)} className="w-full h-full cursor-pointer">
                                            <GreetingCardPage page={pages[1]} selectedId={selectedId} onSelect={setSelectedId} onUpdate={handleUpdateItem} stageRef={focusedPageIndex === 1 ? stageRef : undefined} />
                                        </div>
                                    </div>
                                    <div className="flex-1 h-full bg-white rounded-r-xl shadow-2xl overflow-hidden relative group">
                                        <div onClick={() => setFocusedPageIndex(2)} className="w-full h-full cursor-pointer">
                                            <GreetingCardPage page={pages[2]} selectedId={selectedId} onSelect={setSelectedId} onUpdate={handleUpdateItem} stageRef={focusedPageIndex === 2 ? stageRef : undefined} />
                                        </div>
                                    </div>

                                    {/* Centered Label for Desktop Spread */}
                                    <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full pointer-events-none transition-opacity duration-500 ${(pages[1].items.length > 0 || pages[2].items.length > 0) ? 'opacity-0' : 'opacity-100'}`}>
                                        Vnitřek listu
                                    </div>

                                    <button onClick={goToPrevPage} className="absolute -left-16 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110">
                                        <ChevronLeft size={32} />
                                    </button>
                                    <button onClick={goToNextPage} className="absolute -right-16 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110">
                                        <ChevronRight size={32} />
                                    </button>
                                </motion.div>
                            );

                        })()}
                    </AnimatePresence>

                </div>
            </div>

            <ToolsDock
                key={focusedPageIndex}
                isMobile={isMobile}
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onAddSticker={(sticker: any) => {
                    const newItem: CardItem = {
                        id: generateId(), type: 'sticker', content: sticker.content, x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1
                    };
                    // Deep update to ensure React detects change
                    const newPages = [...pages];
                    newPages[focusedPageIndex] = {
                        ...newPages[focusedPageIndex],
                        items: [...newPages[focusedPageIndex].items, newItem]
                    };
                    setPages(newPages);
                    addToHistory(newPages);
                }}
                stickers={SKYWHALE_STICKERS}
                onGenerateAI={(prompt, mode) => generateAI(prompt, mode, null)}
                isGenerating={isGenerating}
                onAddText={handleAddText}
                onChangeBackground={handleSetBackground}
                textColor={textColor}
                onTextColorChange={setTextColor}
                textFont={textFont}
                onTextFontChange={setTextFont}
                onSelectTemplate={handleSelectTemplate}
            />
        </div>
    );
};
