import { motion } from 'framer-motion';
import { StoryBook } from '../types';
import { ImageGenerator } from './ImageGenerator';
import { RefreshCw, BookOpen } from 'lucide-react';
import { getTheme } from '../lib/themes';
import { BackgroundOrchestrator } from './BackgroundOrchestrator';

interface BookCoverProps {
    book: StoryBook;
    onOpen: () => void;
    onUpdateCover: (url: string | null, seed?: number, identityUrl?: string, identityLock?: string) => void;
    onUploadImage: (bookId: string, pageNumber: number, url: string, seed?: number) => Promise<string | null>;
    tier?: 'basic' | 'premium';
    referenceImageUrl?: string | null; // Flux 2.0: Character Sheet
}

export const BookCover = ({ book, onOpen, onUpdateCover, onUploadImage, tier, referenceImageUrl }: BookCoverProps) => {

    const theme = getTheme(book.theme_style);

    const handleCoverGenerated = async (tempUrl: string, seed?: number) => {
        // ORCHESTRATION LAYER (The Project Manager)
        // Check if we just generated the Character Sheet (Phase 1) or the Final Cover (Phase 2)

        // Scenario A: We needed a Character Sheet, and this is it.
        if (book.identity_prompt && !book.character_sheet_url) {
            console.log(`🧬 PROJECT MANAGER: Character Sheet Generated. Saving as Master Reference...`);

            // 1. Save Sheet to Database (Page -1)
            const sheetUrl = await onUploadImage(book.book_id, -1, tempUrl, seed); // Page -1 = Character Sheet

            if (sheetUrl) {
                // 2. TRIGGER VISUAL DNA EXTRACTOR (THE VISION NODE)
                // We analyze the ACTUAL image to create a bullet-proof text lock.
                import('../lib/storyteller').then(async ({ extractVisualIdentity }) => {
                    const visionLock = await extractVisualIdentity(sheetUrl, book.main_character || "Unknown Character", book.visual_dna);
                    console.log("👮‍♂️ VISION POLICE REPORT:", visionLock);

                    // 3. Trigger Phase 2: The Cinematic Cover
                    // Pass the visionLock to update the story state
                    onUpdateCover(null, seed, sheetUrl, visionLock);
                });
            }
            return;
        }

        // Scenario B: Standard Cover Generation (Phase 2)
        console.log(`📘 BookCover: Received Final Cover Art [Seed: ${seed}]`);
        onUpdateCover(tempUrl, seed);
        const permanentUrl = await onUploadImage(book.book_id, 0, tempUrl, seed);
        if (permanentUrl) {
            onUpdateCover(permanentUrl, seed);
        }
    };

    // LOGIC TO DETERMINE WHICH PROMPT TO USE
    // If we have no sheet yet, we MUST generate the sheet first.
    // If we have a sheet, we generate the cover.
    const isPhaseOne = book.identity_prompt && !book.character_sheet_url && !referenceImageUrl;
    const activePrompt = (isPhaseOne ? book.identity_prompt : (book.cover_prompt || `A cinematic book cover for ${book.title}`)) || "";
    const activeAspect = isPhaseOne ? "1:1" : "2:3"; // Sheets are square or portrait, Covers are portrait.

    // Status Message for user
    const statusMessage = isPhaseOne
        ? "🏗️ PROJECT MANAGER: Creating Character DNA (Step 1/2)..."
        : "🎨 COVER ARTIST: Painting Cinematic Scene (Step 2/2)...";

    const hasCover = !!book.cover_image;

    return (
        <div
            className={`w-full h-full flex items-center justify-center p-4 md:p-8 relative overflow-hidden transition-all duration-700 backdrop-blur-xl ${hasCover ? 'bg-black/60 border-l-4 border-white/10' : 'bg-black/40 border-l-4 border-indigo-500/20'
                }`}
            style={{
                boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 100px ${theme.glowColor}40`,
                borderRadius: '24px',
                // backgroundImage: hasCover ? `url(${book.cover_image})` : undefined, // MOVED TO INNER LAYERS
                // backgroundSize: 'cover',
                // backgroundPosition: 'center',
            }}
        >
            {/* 1. ATMOSPHERIC BACKGROUND (Blurred Fill) */}
            {hasCover && (
                <div
                    className="absolute inset-0 z-0 blur-xl opacity-50 scale-110 pointer-events-none transition-all duration-1000"
                    style={{
                        backgroundImage: `url(${book.cover_image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            )}

            {/* 2. THE ACTUAL COVER ART (Fully Visible) */}
            {hasCover && (
                <div className="absolute inset-0 z-0 flex items-center justify-center p-4 md:p-12 pointer-events-none">
                    <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        src={book.cover_image!}
                        className="w-full h-full object-contain drop-shadow-2xl rounded-lg shadow-black/50"
                        alt="Cover Art"
                    />
                </div>
            )}
            {/* Dark Overlay removed per user request for clear image */}

            {/* Thematic Background (Replaces Stardust) */}
            {!hasCover && (
                <BackgroundOrchestrator className="absolute inset-0 z-0" />
            )}

            {/* Background Texture (The Dreamer) - Removed or kept as overlay? User wants themes. Orchestrator provides themes. */}
            {/* Keeping subtle texture if needed, but Orchestrator is rich. Let's comment out or remove old texture. */}

            {/* Main Content Column */}
            <div className="relative z-10 flex flex-col items-center justify-between w-full h-full text-center py-6 pointer-events-none">

                {/* Header: Title & Author */}
                <div className="flex flex-col gap-2 px-4 w-full max-w-4xl shrink-0 mt-4 pointer-events-auto">
                    <h1
                        className={`font-title font-bold text-2xl md:text-4xl leading-tight tracking-wide py-2 transition-colors duration-500 ${hasCover ? 'text-white drop-shadow-xl text-shadow' : 'text-indigo-100 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]'
                            }`}
                        style={hasCover ? { textShadow: '0 2px 10px rgba(0,0,0,0.5)' } : {}}
                    >
                        {book.title}
                    </h1>
                    <p
                        className={`font-serif italic text-lg md:text-xl transition-colors duration-500 ${hasCover ? 'text-white/90 drop-shadow-md' : 'text-indigo-300/80'
                            }`}
                    >
                        by {book.author}
                    </p>
                </div>

                {/* Regenerate Button (Hero Mode) */}
                {hasCover && (
                    <div className="mb-auto opacity-0 hover:opacity-100 transition-opacity pointer-events-auto">
                        <button
                            onClick={() => onUpdateCover(null)}
                            className="bg-black/60 hover:bg-black/90 text-white backdrop-blur-md px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transform hover:scale-105 transition-all text-xs border border-white/10"
                        >
                            <RefreshCw size={12} /> Change Cover
                        </button>
                    </div>
                )}

                {/* FULL SCREEN GENERATOR (If no cover) */}
                {!hasCover && (
                    <div className="absolute inset-0 z-0 pointer-events-auto flex items-center justify-center">
                        <ImageGenerator
                            basePrompt={activePrompt}
                            onImageGenerated={handleCoverGenerated}
                            style={book.visual_style}
                            characterDescription={book.main_character}
                            visualDna={book.visual_dna}
                            isCover={true}
                            tier={isPhaseOne ? 'basic' : tier}
                            className="w-full h-full"
                            characterSeed={book.character_seed}
                            pageNumber={0}
                            referenceImageUrl={referenceImageUrl} // Flux 2.0: Character Sheet
                            statusMessage={statusMessage} // Pass status to display
                            aspectRatio={activeAspect} // Pass aspect
                        />
                    </div>
                )}

                {/* Footer: Minimal Circular Open Button */}
                <motion.button
                    onClick={onOpen}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`shrink-0 group w-20 h-20 rounded-full shadow-[0_0_30px_rgba(124,58,237,0.4)] flex items-center justify-center transition-all mb-8 pointer-events-auto ${hasCover
                        ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white'
                        : 'bg-[#1e1b4b] text-purple-200 hover:bg-[#2e1065] border border-purple-500/30'
                        }`}
                    title="Otevřít knihu"
                >
                    <BookOpen size={32} className={hasCover ? 'text-white' : 'text-purple-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'} />
                </motion.button>
            </div>
        </div>
    );
};
