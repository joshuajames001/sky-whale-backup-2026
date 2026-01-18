import { useState, useEffect } from 'react';
import { generateImage } from '../lib/ai';
import { Sparkles, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { MagicLoading } from './MagicLoading';

interface ImageGeneratorProps {
    basePrompt: string;
    onImageGenerated: (url: string, seed?: number) => void;
    className?: string;
    style?: string;
    characterDescription?: string;
    setting?: string;
    autoStart?: boolean;
    visualDna?: string;
    isCover?: boolean;
    artPrompt?: string;
    tier?: 'basic' | 'premium';
    referenceImageUrl?: string | null;
    characterSeed?: number | null,
    pageNumber?: number; // Flux 2.0: Kinetic Seeding Index
    styleReferenceImageUrl?: string | null; // Flux 2.0 Style Anchor
    characterReferences?: string[]; // MULTI-REFERENCE
    styleReferences?: string[]; // MULTI-REFERENCE
    statusMessage?: string; // Orchestrator Status Overlay
    aspectRatio?: string;
}

export const ImageGenerator = ({
    basePrompt,
    onImageGenerated,
    className,
    style,
    characterDescription,
    setting,
    autoStart = false,
    // visualDna, // Deprecated in Flux 2.0 -> REACTIVATED FOR ENGLISH PROMPT ENFORCEMENT
    visualDna,
    isCover = false,
    artPrompt,
    tier = 'basic',
    referenceImageUrl,
    styleReferenceImageUrl, // Flux 2.0 Prop
    characterReferences,
    styleReferences,
    characterSeed,
    pageNumber,
    statusMessage,
    aspectRatio
}: ImageGeneratorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasAutoStarted, setHasAutoStarted] = useState(false);
    const [showFlash, setShowFlash] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);

        // Flux 2.0: Cover Style Injection (First Visual Truth)
        const safeBasePrompt = basePrompt || "";
        let effectivePrompt = safeBasePrompt;
        if (isCover && style) {
            effectivePrompt = `[Style: ${style}] - ${safeBasePrompt}`;
        }

        if (safeBasePrompt.toLowerCase().includes("nsfw")) {
            setError("Safety Policy: Content descriptor flagged.");
            setIsLoading(false);
            return;
        }

        // FIX: Always prefer English Visual DNA over Czech Description for the Prompt
        const englishIdentity = visualDna || characterDescription;

        const result = await generateImage({
            prompt: effectivePrompt,
            style,
            characterDescription: englishIdentity, // <--- NOW ENGLISH!
            setting,
            characterReference: referenceImageUrl, // Explicit Flux 2.0 mapping
            characterReferences, // MULTI
            styleReference: styleReferenceImageUrl, // Explicit Flux 2.0 mapping
            styleReferences, // MULTI
            identityImageId: referenceImageUrl, // Backwards compat
            isCover,
            artPrompt,
            tier,
            seed: characterSeed,
            baseSeed: characterSeed ?? undefined,
            pageIndex: pageNumber
        });

        if (result.url) {
            // TRIGGER MAGIC REVEAL
            setIsLoading(false);
            setShowFlash(true); // Flash Effect
            setTimeout(() => setShowFlash(false), 500); // Hide flash after 0.5s

            // Notify Parent
            onImageGenerated(result.url, result.seed);
        } else {
            setError(result.error || "Generation failed.");
        }

        setIsLoading(false);
    };

    useEffect(() => {
        if (autoStart && !hasAutoStarted && !isLoading) {
            if (tier === 'premium' && !isCover && !referenceImageUrl) {
                console.log("Waiting for reference image (IP-Adapter)...");
                return;
            }

            setHasAutoStarted(true);
            handleGenerate();
        }
    }, [autoStart, hasAutoStarted, referenceImageUrl, tier]);

    return (
        <div className={clsx(
            "relative w-full h-full flex flex-col items-center justify-center transition-all duration-700",
            // MAGIC CANVAS STYLING
            "rounded-[2.5rem] overflow-hidden",
            "shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]", // Inner depth
            "shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)]", // Outer glow
            "aspect-[3/4]", // Portrait Ratio
            isLoading ? "bg-black/20 backdrop-blur-md" : "bg-transparent",
            className
        )}
            style={{
                // VIGNETTE MASK
                maskImage: "radial-gradient(circle at center, black 60%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(circle at center, black 60%, transparent 100%)"
            }}
        >




            <div className={clsx("relative z-10 transition-opacity duration-700 w-full h-full flex items-center justify-center", isLoading ? "opacity-0 pointer-events-none scale-90 blur-sm" : "opacity-100")}>

                {error && (
                    <div className="absolute top-12 w-full max-w-xs px-4 text-xs text-red-300 flex items-center justify-center gap-1 bg-red-950/90 backdrop-blur p-3 rounded-lg border border-red-500/20 z-50">
                        <AlertCircle size={12} />
                        {error}
                    </div>
                )}

                {/* THE DREAMER TRIGGER (Moon/Star Button) */}
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="
                        group relative w-20 h-20 rounded-full 
                        bg-gradient-to-br from-[#1e1b4b] to-[#312e81]
                        shadow-[0_0_40px_rgba(76,29,149,0.4)]
                        hover:shadow-[0_0_60px_rgba(124,58,237,0.6)]
                        hover:scale-110 active:scale-95 
                        transition-all duration-500 ease-out flex items-center justify-center
                        border border-white/10
                    "
                    title="Vysnít scénu"
                >
                    <Sparkles size={36} className="text-purple-200 group-hover:text-white group-hover:rotate-12 transition-all duration-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />

                    {/* Orbital Ring */}
                    <div className="absolute inset-[-4px] rounded-full border border-white/5 group-hover:border-purple-500/30 transition-colors duration-500 scale-110" />
                </button>
            </div>

            {/* LOADING TEXT (Magic Pearls) */}
            {isLoading && (
                <MagicLoading
                    style={style}
                    isCover={isCover}
                    customMessage={statusMessage} // Pass status message to MagicLoading
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-[2.5rem]"
                />
            )}

            {/* MAGIC REVEAL FLASH OVERLAY */}
            <AnimatePresence>
                {showFlash && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-white pointer-events-none mix-blend-overlay"
                        transition={{ duration: 0.2 }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};