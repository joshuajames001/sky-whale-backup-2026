import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CardPage } from './types';
import { CardCanvas } from './CardCanvas';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { StarryBackground } from '../StarryBackground';

// Helper for single page in spread
const ViewerPage = ({ page }: { page: CardPage }) => {
    return (
        <CardCanvas
            items={page.items}
            background={page.background}
            selectedId={null} // Read-only
            onSelect={() => { }} // No-op
            onUpdate={() => { }} // No-op
        // domRef={null}
        />
    );
};

export const CardViewer = ({ cardId, onClose }: { cardId: string | null, onClose: () => void }) => {
    const [pages, setPages] = useState<CardPage[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewStartIndex, setViewStartIndex] = useState(0);

    useEffect(() => {
        if (!cardId) return;

        const fetchCard = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('shared_cards')
                .select('pages')
                .eq('id', cardId)
                .single();

            if (data && data.pages) {
                setPages(data.pages);
            } else {
                console.error("Failed to load card", error);
            }
            setLoading(false);
        };

        fetchCard();
    }, [cardId]);

    const goToPrevPage = () => {
        if (viewStartIndex === 0) return;
        if (viewStartIndex === 1) setViewStartIndex(0);
        else setViewStartIndex(prev => prev - 2);
    };

    const goToNextPage = () => {
        if (!pages) return;
        if (viewStartIndex === 0) setViewStartIndex(1);
        else if (viewStartIndex + 2 < pages.length) setViewStartIndex(prev => prev + 2);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (!pages) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
                <p>Card not found or magic dissipated...</p>
                <button onClick={onClose} className="text-sm underline">Return Home</button>
            </div>
        );
    }

    const canGoNext = viewStartIndex === 0 ? pages.length > 1 : viewStartIndex + 2 < pages.length;
    const canGoPrev = viewStartIndex > 0;

    return (
        <div className="fixed inset-0 overflow-hidden bg-slate-950 text-slate-100 font-sans z-50">
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                <StarryBackground />
            </div>

            <div className="relative z-10 w-full h-full flex items-center justify-center p-8 select-none">

                {/* Close / Back */}
                <button onClick={onClose} className="absolute top-6 left-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-xs uppercase tracking-widest backdrop-blur-md">
                    Close Viewer
                </button>

                {/* VIEW RENDERER */}
                {viewStartIndex === 0 ? (
                    // COVER
                    <div className="relative shadow-2xl shadow-indigo-500/20">
                        <CardCanvas
                            items={pages[0].items}
                            background={pages[0].background}
                            selectedId={null}
                            onSelect={() => { }}
                            onUpdate={() => { }}
                        />
                        <div className="text-center mt-4 text-slate-500 text-xs uppercase tracking-widest font-bold">Front Cover</div>
                    </div>
                ) : (
                    // SPREAD
                    <div className="flex items-center gap-0 relative shadow-2xl shadow-indigo-500/20">
                        {/* SPINE */}
                        <div className="absolute left-1/2 top-4 bottom-4 w-12 -ml-6 bg-gradient-to-r from-transparent via-black/20 to-transparent z-10 pointer-events-none" />

                        <div className="relative">
                            <ViewerPage page={pages[viewStartIndex]} />
                        </div>
                        <div className="relative">
                            {pages[viewStartIndex + 1] ? (
                                <ViewerPage page={pages[viewStartIndex + 1]} />
                            ) : (
                                <div className="w-[400px] h-[560px] bg-slate-900/50 flex items-center justify-center" />
                            )}
                        </div>
                    </div>
                )}

                {/* CONTROLS */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-slate-900/90 backdrop-blur-md rounded-full border border-white/10 shadow-xl z-50">
                    <button onClick={goToPrevPage} disabled={!canGoPrev} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"><ChevronLeft size={20} /></button>
                    <div className="flex flex-col items-center text-center w-24">
                        <span className="text-sm font-semibold text-white tracking-widest">{viewStartIndex === 0 ? "COVER" : `SPREAD`}</span>
                    </div>
                    <button onClick={goToNextPage} disabled={!canGoNext} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"><ChevronRight size={20} /></button>
                </div>

            </div>
        </div>
    );
};
