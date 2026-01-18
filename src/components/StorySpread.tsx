import { motion } from 'framer-motion';
import { StoryPage } from '../types';
import { ImageGenerator } from './ImageGenerator';
import { RefreshCw } from 'lucide-react';


interface StorySpreadProps {
    page: StoryPage;
    bookId: string; // Needed for upload path
    onUpdatePage: (pageIndex: number, updates: Partial<StoryPage>) => void;
    onUploadImage: (bookId: string, pageNumber: number, url: string) => Promise<string | null>;
    visualStyle?: string;
    setting?: string;
    visualDna?: string;
    mainCharacter?: string;

    // Premium Props (Flux 2.0 Multi-Reference)
    characterReferences?: string[];
    styleReferences?: string[];

    // Legacy / Single Props
    referenceImageUrl?: string | null;
    styleReferenceImageUrl?: string | null;
    tier?: 'basic' | 'premium';
    characterSeed?: number | null;
}

export const StorySpread = ({
    page,
    bookId,
    onUpdatePage,
    onUploadImage,
    visualStyle,
    mainCharacter,
    setting,
    visualDna,
    tier,
    referenceImageUrl,
    styleReferenceImageUrl,
    characterReferences,
    styleReferences,
    characterSeed
}: StorySpreadProps) => {

    const isEvenPage = page.page_number % 2 === 0;
    const hasImage = !!page.image_url;

    const handleImageGenerated = async (url: string) => {
        if (onUploadImage) {
            try {
                const publicUrl = await onUploadImage(bookId, page.page_number, url);
                if (publicUrl) {
                    onUpdatePage(page.page_number, { image_url: publicUrl });
                }
            } catch (error) {
                console.error("Failed to upload image:", error);
                // Fallback to local URL if upload fails, or handle error
                onUpdatePage(page.page_number, { image_url: url });
            }
        } else {
            onUpdatePage(page.page_number, { image_url: url });
        }
    };

    return (
        <div className={`w-full h-full flex flex-col md:flex-row shadow-2xl overflow-hidden ${isEvenPage ? 'md:flex-row-reverse' : ''}`}>

            {/* Illustration Area */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-gray-900 group overflow-hidden">
                {/* Image or Placeholder */}
                {page.image_url ? (
                    <motion.img
                        key={page.image_url}
                        src={page.image_url}
                        alt={`Page ${page.page_number} illustration`}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5 }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                        <span className="text-white/20 font-serif italic">Waiting for imagination...</span>
                    </div>
                )}

                {/* Generator Overlay */}
                {!hasImage && (
                    <div className="absolute inset-0 w-full h-full z-20">
                        <ImageGenerator
                            basePrompt={page.art_prompt}
                            onImageGenerated={handleImageGenerated}
                            style={visualStyle}
                            characterDescription={mainCharacter}
                            setting={setting}
                            visualDna={visualDna}
                            artPrompt={page.art_prompt}
                            tier={tier}
                            referenceImageUrl={referenceImageUrl}
                            characterReferences={characterReferences}
                            styleReferenceImageUrl={styleReferenceImageUrl}
                            styleReferences={styleReferences}
                            // characterSeed={characterSeed} // DISABLED: With Flux References, random seed allows better dynamic poses
                            pageNumber={page.page_number}
                            className="w-full h-full"
                        />
                    </div>
                )}

                {/* Regenerate Button */}
                {hasImage && (
                    <div className={`absolute bottom-8 ${isEvenPage ? 'right-8' : 'left-8'} opacity-0 group-hover:opacity-100 transition-opacity z-30`}>
                        <button
                            onClick={() => onUpdatePage(page.page_number, { image_url: null })}
                            className="bg-black/60 hover:bg-indigo-900/80 backdrop-blur-md text-purple-100 px-3 py-1.5 rounded-full font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center gap-2 transition-all text-xs border border-white/10"
                        >
                            <RefreshCw size={12} /> Regenerate
                        </button>
                    </div>
                )}

                {/* Page number hint */}
                <span className={`absolute bottom-6 font-serif text-sm transition-colors duration-500 ${hasImage ? 'text-white/80 drop-shadow-md' : 'text-indigo-200/30'}`}>
                    {page.page_number}
                </span>
            </div>

            {/* Text Area (Night Sky Mode) */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full relative p-6 md:p-12 lg:p-16 flex flex-col justify-start bg-gradient-to-b from-black/10 to-black/30 md:bg-black/20 overflow-y-auto custom-scrollbar">
                {/* Night Sky Texture */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')",
                        backgroundRepeat: 'repeat'
                    }}
                />

                <motion.div
                    className="relative z-10 py-4"
                    initial={{ opacity: 0, x: isEvenPage ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <div className="first-letter:text-6xl first-letter:font-serif first-letter:text-purple-300 first-letter:float-left first-letter:mr-3 first-letter:mt-1 font-serif text-lg md:text-xl lg:text-2xl leading-[1.8] md:leading-loose text-indigo-50/90 text-justify tracking-wide selection:bg-purple-900/50 pb-20 md:pb-0">
                        {page.text}
                    </div>
                </motion.div>

                <span className={`absolute bottom-10 ${isEvenPage ? 'left-12' : 'right-12'} font-serif text-indigo-300/20 text-lg z-10 animate-pulse hidden md:block`}>
                    ✦
                </span>
            </div>
        </div>
    );
};
