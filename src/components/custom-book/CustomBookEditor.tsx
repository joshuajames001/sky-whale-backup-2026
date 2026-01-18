import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Sparkles, Wand2, Loader2, ChevronLeft, ChevronRight, Save, RefreshCw, Smartphone, Camera, Mic, Zap, Play, Square, Download, Cloud, Feather, X, Star, ImageIcon, Rocket, Paperclip, Book, GraduationCap, Search, Languages, Palette } from 'lucide-react';
import { useStory } from '../../hooks/useStory';
import { useGuide } from '../../hooks/useGuide';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useGemini } from '../../hooks/useGemini';
import { generateImage, STYLE_PROMPTS } from '../../lib/ai';
import { StoryBook, StoryPage } from '../../types';
import { supabase } from '../../lib/supabase';
import { PublishDialog } from '../PublishDialog';
import { AchievementToast } from '../profile/AchievementToast';
import { VOICE_OPTIONS, DEFAULT_VOICE_ID } from '../../lib/audio-constants';
import { VoicePreviewButton } from '../audio/VoicePreviewButton';

interface BookPage {
    id: string;
    text: string;
    imageUrl?: string;
    prompt?: string;
    isCover?: boolean;
    isBackCover?: boolean;
}

interface CustomBookEditorProps {
    onBack: () => void;
    onOpenStore?: () => void;
}

const CustomBookEditor: React.FC<CustomBookEditorProps> = ({ onBack, onOpenStore }) => {
    const [bookId, setBookId] = useState<string>(crypto.randomUUID());

    // PERSISTENCE: Use local storage for drafts
    const [bookTitle, setBookTitle] = useLocalStorage('skywhale_draft_book_title', 'Nová Kniha');

    const createInitialPages = (count: number): BookPage[] => [
        { id: 'cover', text: '', isCover: true },
        ...Array.from({ length: count }, (_, i) => ({ id: crypto.randomUUID(), text: '' }))
    ];

    const [pages, setPages] = useLocalStorage<BookPage[]>('skywhale_draft_book_pages', createInitialPages(10));

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [magicMirrorUrl, setMagicMirrorUrl] = useLocalStorage<string | null>('skywhale_draft_mirror_url', null);
    const [showPublishDialog, setShowPublishDialog] = useState(false);
    const [publishBookId, setPublishBookId] = useState<string | null>(null);
    const [currentAchievement, setCurrentAchievement] = useState<any>(null);
    const [isUploadingMirror, setIsUploadingMirror] = useState(false);
    const [maxPages, setMaxPages] = useState(10);
    const [userBalance, setUserBalance] = useState<number | null>(null);
    const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_ID);
    const [selectedStyle, setSelectedStyle] = useState('Pixar 3D'); // Default to Pixar 3D as requested

    // EXPERT MODE & DICTIONARY STATE
    const [isExpertMode, setIsExpertMode] = useState(false);
    const [showDictionary, setShowDictionary] = useState(false);
    const [dictionaryQuery, setDictionaryQuery] = useState('');
    const [dictionaryResult, setDictionaryResult] = useState<any>(null);
    const [isSearchingDict, setIsSearchingDict] = useState(false);

    // Dynamic cost: 50 Energy for Mirror (Pro), 30 Energy for Standard (Dev)
    const costPerImage = magicMirrorUrl ? 50 : 30;
    const hasEnoughEnergy = userBalance !== null && userBalance >= costPerImage;

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const magicMirrorInputRef = React.useRef<HTMLInputElement>(null);

    // NEW HOOK FUNCTIONS
    const { generateSuggestion, generateImagePrompt, generateInitialIdeas, searchDictionary, loading: geminiLoading } = useGemini();
    const { saveStory, saving } = useStory();
    const { startGuide, hasSeenGroups } = useGuide();

    // Trigger Guide
    useEffect(() => {
        // Delay to allow enter animation
        const t = setTimeout(() => {
            if (!hasSeenGroups['custom_book_editor_welcome']) {
                startGuide('custom_book_editor_welcome');
            }
        }, 800);
        return () => clearTimeout(t);
    }, [hasSeenGroups, startGuide]);

    React.useEffect(() => {
        const fetchBalance = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('energy_balance').eq('id', user.id).single();
                if (data) setUserBalance(data.energy_balance);
            }
        };
        fetchBalance();

        const fetchInitialIdeas = async () => {
            if (currentPageIndex === 1 && pages[1]?.text === '' && !suggestion) {
                const ideas = await generateInitialIdeas();
                if (ideas && ideas.length > 0) {
                    setSuggestion(ideas[Math.floor(Math.random() * ideas.length)]);
                }
            }
        };
        fetchInitialIdeas();
    }, [currentPageIndex]);

    React.useEffect(() => {
        const currentContentCount = pages.filter(p => !p.isCover).length;
        if (currentContentCount === maxPages) return;

        const isSignificantlyModified = pages.some(p => (p.text.length > 20) || !!p.imageUrl);

        if (!isSignificantlyModified) {
            setPages(createInitialPages(maxPages));
            setCurrentPageIndex(0);
        } else {
            const newPages = [...pages];

            if (currentContentCount < maxPages) {
                const diff = maxPages - currentContentCount;
                const extra = Array.from({ length: diff }, () => ({ id: crypto.randomUUID(), text: '' }));
                newPages.push(...extra);
                setPages(newPages);
            } else {
                setPages(newPages.filter((p, i) => {
                    if (p.isCover) return true;
                    const contentIdx = newPages.filter((_, j) => j < i && !_.isCover).length;
                    return contentIdx < maxPages;
                }));
            }
        }
    }, [maxPages]);

    const currentPage = pages[currentPageIndex];

    const handleTextChange = (text: string) => {
        const newPages = [...pages];
        newPages[currentPageIndex] = { ...newPages[currentPageIndex], text };
        setPages(newPages);

        if (currentPageIndex === 0) {
            const title = text.split('\n')[0].trim();
            if (title) setBookTitle(title);
        }
    };

    const handleNewBook = () => {
        if (window.confirm('Opravdu chceš začít úplně nový příběh? Současný rozepsaný koncept bude nenávratně smazán.')) {
            setBookTitle('Nová Kniha');
            setPages(createInitialPages(maxPages));
            setMagicMirrorUrl(null);
            setCurrentPageIndex(0);
        }
    };

    const addNewPage = () => {
        const newPage: BookPage = { id: Date.now().toString(), text: '' };
        setPages([...pages, newPage]);
        setCurrentPageIndex(pages.length);
    };

    const handleSave = async (isPublic: boolean = false) => {
        let contentPagesData = pages.slice(1);
        const storyPages: StoryPage[] = contentPagesData.map((p, idx) => ({
            page_number: idx + 1,
            text: p.text,
            image_url: p.imageUrl || null,
            art_prompt: p.prompt || '', // Using standardized art_prompt
            is_generated: !!p.imageUrl,
            layout_type: 'standard'
        }));

        const story: StoryBook = {
            book_id: bookId,
            title: bookTitle,
            author: 'Já',
            theme_style: 'Watercolor',
            visual_style: 'watercolor',
            cover_image: pages[0]?.imageUrl || null,
            pages: storyPages,
            is_public: isPublic,
            magic_mirror_url: magicMirrorUrl || undefined,
            tier: magicMirrorUrl ? 'premium' : 'basic',
            voice_id: selectedVoice,
        };

        const result = await saveStory(story);
        if (result) {
            const { bookId: resultId, achievements } = result;
            setBookId(resultId);

            // Show achievement toasts
            if (achievements && achievements.length > 0) {
                setCurrentAchievement(achievements[0]);
                // Queue additional achievements
                achievements.slice(1).forEach((ach, index) => {
                    setTimeout(() => setCurrentAchievement(ach), (index + 1) * 6000);
                });
            }

            // Show publish dialog
            setPublishBookId(resultId);
            setShowPublishDialog(true);
        }
    };

    const handleGeminiAssist = async () => {
        // Collect context from previous pages
        const previousPages = pages.slice(0, currentPageIndex);
        const storySoFar = previousPages.map((p: BookPage) => p.text).join("\n");

        if (!currentPage.text.trim() && !storySoFar.trim()) return;

        setSuggestion(null);
        const result = await generateSuggestion(storySoFar, currentPage.text, currentPageIndex, maxPages);
        if (result) {
            setSuggestion(result);
        }
    };

    const acceptSuggestion = () => {
        if (suggestion) {
            handleTextChange(currentPage.text + " " + suggestion);
            setSuggestion(null);
        }
    };

    const dismissSuggestion = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSuggestion(null);
    }

    const handleGenerateScene = async (isMagicMirror: boolean = false) => {
        if (!currentPage.text.trim() && !currentPage.prompt?.trim()) return; // Allow generation if manual prompt exists

        setIsGeneratingImage(true);

        try {
            let prompt = currentPage.prompt;

            // STEP 1: Generate Prompt from Text (if missing or if user wants to refresh)
            // In EXPERT MODE, if we already have a prompt, we DON'T regenerate automatically unless empty.
            if (!prompt || !isExpertMode) {
                const generated = await generateImagePrompt(currentPage.text);
                if (generated) prompt = generated;
            }

            if (!prompt) throw new Error("Failed to create prompt");

            // Save the prompt immediately
            const newPagesWithPrompt = [...pages];
            newPagesWithPrompt[currentPageIndex] = {
                ...newPagesWithPrompt[currentPageIndex],
                prompt: prompt
            };
            setPages(newPagesWithPrompt);

            // STEP 2: IF EXPERT MODE -> STOP HERE (Let user edit)
            if (isExpertMode && !currentPage.prompt) { // Only stop if it was just generated
                setIsGeneratingImage(false);
                return;
            }

            // Optimized prompts for covers
            let finalPrompt = prompt;
            if (currentPage.isCover) {
                finalPrompt = `WIDE CINEMATIC BOOK COVER, centered composition, epic lighting, masterwork: ${prompt} `;
            }

            // Debug: Log Magic Mirror status
            console.log("🪞 Magic Mirror Debug:", {
                hasMagicMirror: !!magicMirrorUrl,
                mirrorUrl: magicMirrorUrl,
                tier: magicMirrorUrl ? 'premium (50⚡)' : 'basic (30⚡)',
                willUseReference: !!magicMirrorUrl
            });

            const result = await generateImage({
                prompt: finalPrompt,
                style: selectedStyle, // Use user selected style
                tier: magicMirrorUrl ? 'premium' : 'basic', // Use premium if hero image exists
                characterReference: magicMirrorUrl || undefined, // Use hero image if uploaded
                characterDescription: magicMirrorUrl ? "Portrét osoby z referenčního obrázku, hlavní hrdina příběhu" : undefined
            });

            if (result.url) {
                const newPages = [...pages];
                newPages[currentPageIndex] = {
                    ...newPages[currentPageIndex],
                    imageUrl: result.url,
                    prompt: prompt
                };
                setPages(newPages);
            }
        } catch (err: any) {
            console.error("Scene Gen Failed", err);
            if (err.message && (err.message.includes("Insufficient Energy") || err.message.includes("INSUFFICIENT_ENERGY"))) {
                const requiredEnergy = magicMirrorUrl ? 50 : 30;
                alert(`⚠️ Nedostatek energie!\n\nPotřebuješ ${requiredEnergy} ⚡ pro ${magicMirrorUrl ? 'Premium generování s Magic Mirror' : 'základní generování'}.\n\nOtevřu obchod...`);
                onOpenStore?.();
            } else {
                alert(`❌ Generování selhalo: ${err.message || 'Neznámá chyba'}`);
            }
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleMagicMirrorUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('📸 Magic Mirror Upload Started:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });

        setIsUploadingMirror(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `mirror_${crypto.randomUUID()}.${fileExt}`; // FIXED: Removed trailing space
            const filePath = `${bookId}/${fileName}`;

            console.log('📤 Uploading to:', filePath);

            const { error: uploadError } = await supabase.storage
                .from('story-assets')
                .upload(filePath, file);

            if (uploadError) {
                console.error('❌ Upload Error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('story-assets')
                .getPublicUrl(filePath);

            console.log('✅ Magic Mirror URL:', publicUrl);
            setMagicMirrorUrl(publicUrl);
        } catch (err) {
            console.error("❌ Kouzelné zrcadlo: Nahrávání selhalo", err);
            alert('Nahrávání fotky selhalo. Zkus to prosím znovu.');
        } finally {
            setIsUploadingMirror(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input immediately so same file can be selected again if needed
        e.target.value = '';

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${bookId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('story-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('story-assets')
                .getPublicUrl(filePath);

            const newPages = [...pages];
            newPages[currentPageIndex] = {
                ...newPages[currentPageIndex],
                imageUrl: publicUrl
            };
            setPages(newPages);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Nepodařilo se nahrát obrázek. Zkuste to prosím znovu.");
        } finally {
            setIsUploading(false);
        }
    };

    // PDF Export Handler
    const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);

    const handleExportPdf = async () => {
        if (!pages || pages.length === 0) return;

        setIsUploading(true); // Re-use loading state
        setPdfProgress({ current: 0, total: pages.length });

        try {
            const pageIds = pages.map((_, i) => `book-page-${i}`);

            // Wait a sec for any images to load if needed
            await new Promise(r => setTimeout(r, 500));

            const success = await import('../../utils/pdfGenerator').then(m =>
                m.generatePdf(pageIds, `${bookTitle || 'custom-book'}.pdf`, (current, total) => {
                    setPdfProgress({ current, total });
                })
            );

            if (success) alert("PDF staženo! 📄");
            else throw new Error("PDF generation failed");

        } catch (e) {
            console.error("PDF Error:", e);
            alert("Nepodařilo se vytvořit PDF. Zkuste to prosím znovu.");
        } finally {
            setIsUploading(false);
            setPdfProgress(null);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 text-stone-100 font-sans selection:bg-purple-500/30 flex flex-col overflow-hidden z-40">
            {/* Top Bar */}
            <header className="h-auto md:h-16 flex flex-col md:flex-row items-center justify-between px-4 py-2 md:py-0 bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shrink-0 shadow-sm relative gap-2">
                {/* Left: Back & Title */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                    <button
                        onClick={onBack}
                        className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all text-white shadow-sm hover:scale-105"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col flex-1 mx-2">
                        <div className="flex items-center gap-2">
                            <input
                                id="editor-title-input"
                                type="text"
                                value={bookTitle}
                                onChange={(e) => setBookTitle(e.target.value)}
                                className="bg-transparent text-base md:text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-2 -ml-2 transition-all w-full md:w-64 placeholder-white/70 drop-shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/80 uppercase tracking-widest font-bold ml-1 hidden sm:inline">Vlastní příběh</span>

                            {/* Voice Selector */}
                            <div className="relative group">
                                <Mic size={14} className={`absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${selectedVoice ? 'text-white/70' : 'text-white/30'}`} />
                                <select
                                    value={selectedVoice}
                                    onChange={(e) => setSelectedVoice(e.target.value)}
                                    className={`bg-white/10 text-white text-xs rounded pl-7 pr-2 py-1 outline-none border border-white/10 cursor-pointer hover:bg-white/20 transition-colors appearance-none ${!selectedVoice && 'text-white/50 italic'}`}
                                >
                                    <option value="" className="text-stone-500 bg-white italic">Bez vypravěče</option>
                                    {VOICE_OPTIONS.map(v => (
                                        <option key={v.id} value={v.id} className="text-stone-900 bg-white">
                                            {v.emoji} {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selected Voice Preview */}
                            {selectedVoice && (
                                <VoicePreviewButton
                                    previewUrl={VOICE_OPTIONS.find(v => v.id === selectedVoice)?.previewUrl || ''}
                                    isActive={true}
                                />
                            )}

                            {/* Style Selector */}
                            <div className="relative group">
                                <Palette size={14} className={`absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/70`} />
                                <select
                                    value={selectedStyle}
                                    onChange={(e) => setSelectedStyle(e.target.value)}
                                    className="bg-white/10 text-white text-xs rounded pl-7 pr-2 py-1 outline-none border border-white/10 cursor-pointer hover:bg-white/20 transition-colors appearance-none max-w-[100px] md:max-w-none"
                                >
                                    {/* Priority Styles first */}
                                    <option value="Pixar 3D" className="text-stone-900 bg-white">📽️ Pixar 3D</option>
                                    <option value="watercolor" className="text-stone-900 bg-white">🎨 Watercolor</option>
                                    <option value="ghibli_anime" className="text-stone-900 bg-white">🍃 Ghibli Anime</option>
                                    <option value="illustration" className="text-stone-900 bg-white">✏️ Illustration</option>

                                    {/* Other Styles from constant (filtering out duplicates/priority ones) */}
                                    {Object.keys(STYLE_PROMPTS)
                                        .filter(k => !['Pixar 3D', 'watercolor', 'Watercolor', 'ghibli_anime', 'illustration'].includes(k))
                                        .map(styleKey => (
                                            <option key={styleKey} value={styleKey} className="text-stone-900 bg-white">
                                                🖌️ {styleKey.replace(/_/g, ' ')}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <select
                                value={maxPages}
                                onChange={(e) => setMaxPages(Number(e.target.value))}
                                className="bg-white/10 text-white text-xs rounded px-2 py-1 outline-none border border-white/10 cursor-pointer hover:bg-white/20 transition-colors"
                            >
                                <option value={10} className="text-stone-900 bg-white">10 stran</option>
                                <option value={15} className="text-stone-900 bg-white">15 stran</option>
                                <option value={25} className="text-stone-900 bg-white">25 stran</option>
                            </select>
                            <div title="Cena audia: 1 ⚡ / 20 znaků (zde odhad)" className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border shadow-[0_0_10px_rgba(245,158,11,0.2)] ${magicMirrorUrl ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                                <Zap size={10} fill="currentColor" />
                                {(maxPages + 1) * costPerImage + (selectedVoice ? maxPages * 20 : 0)} ⚡
                            </div>
                        </div>
                    </div>
                    {/* Mobile Only: Save Icon */}
                    <div className="flex items-center gap-2 md:hidden">
                        {/* Export PDF Button Mobile */}
                        <button
                            onClick={handleExportPdf}
                            disabled={isUploading}
                            title="Stáhnout PDF"
                            className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 border border-white/20 shadow-lg hover:bg-white/20 transition-all active:scale-95"
                        >
                            {isUploading && pdfProgress ? (
                                <div className="flex items-center justify-center w-6 h-6 relative">
                                    <Loader2 size={16} className="animate-spin absolute" />
                                    <span className="text-[8px] font-bold z-10 pt-4">{Math.round((pdfProgress.current / pdfProgress.total) * 100)}%</span>
                                </div>
                            ) : (
                                <Download size={18} />
                            )}
                        </button>

                        <button
                            onClick={() => startGuide('custom_book_editor_welcome')}
                            className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/50 border border-white/20 shadow-lg hover:bg-white/20 hover:text-white transition-all active:scale-95"
                            title="Nápověda"
                        >
                            <span className="font-bold text-lg">?</span>
                        </button>

                        <button
                            onClick={() => handleSave(false)}
                            title="Uložit"
                            className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 border border-white/20 shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 hover:bg-white/20"
                            disabled={saving}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        </button>
                    </div>
                </div>

                {/* Action Buttons (Desktop: Right, Mobile: Bottom/Flex) */}
                <div className="w-full md:w-auto pointer-events-auto flex items-center justify-between md:justify-end gap-2 md:gap-4 mt-1 md:mt-0 relative z-50">

                    {/* Magic Mirror Toggle / Upload */}
                    {/* Magic Mirror Toggle / Upload */}
                    <div className="relative group">
                        <input
                            type="file"
                            ref={magicMirrorInputRef}
                            onChange={handleMagicMirrorUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => magicMirrorInputRef.current?.click()}
                            className="hidden md:flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-md rounded-full text-white/50 border border-white/20 transition-all hover:scale-110 active:scale-95 hover:bg-white/20 hover:text-white shadow-lg relative overflow-hidden"
                            title={magicMirrorUrl ? "Změnit fotku" : "Kouzelné zrcadlo (Nahrát fotku)"}
                        >
                            {isUploadingMirror ? (
                                <Loader2 size={16} className="animate-spin text-white" />
                            ) : magicMirrorUrl ? (
                                <img src={magicMirrorUrl} alt="Me" className="w-full h-full object-cover" />
                            ) : (
                                <Camera size={18} />
                            )}
                        </button>
                        {magicMirrorUrl && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMagicMirrorUrl(null);
                                }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm z-10 hidden md:flex"
                                title="Odebrat fotku"
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>

                    <div className="hidden md:block h-8 w-px bg-white/10" />

                    <button
                        onClick={() => startGuide('custom_book_editor_welcome')}
                        className="hidden md:flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-md rounded-full text-white/50 border border-white/20 transition-all hover:scale-110 active:scale-95 hover:bg-white/20 hover:text-white shadow-lg"
                        title="Nápověda"
                    >
                        <span className="font-bold text-lg">?</span>
                    </button>

                    <button
                        onClick={handleNewBook}
                        className="hidden md:flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-md rounded-full text-red-400 border border-white/20 transition-all hover:scale-110 active:scale-95 hover:bg-white/20 hover:text-red-500 shadow-lg group"
                        title="Nový příběh (Smazat koncept)"
                    >
                        <Plus size={20} className="rotate-45 group-hover:text-red-500 transition-colors" strokeWidth={3} />
                    </button>

                    <button
                        onClick={handleExportPdf}
                        disabled={isUploading}
                        title="Stáhnout PDF"
                        className="hidden md:flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 border border-white/20 transition-all hover:scale-110 active:scale-95 hover:bg-white/20 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isUploading && pdfProgress ? (
                            <div className="flex items-center justify-center w-6 h-6 relative">
                                <Loader2 size={16} className="animate-spin absolute" />
                                <span className="text-[8px] font-bold z-10 pt-4">{Math.round((pdfProgress.current / pdfProgress.total) * 100)}%</span>
                            </div>
                        ) : (
                            <Download size={18} />
                        )}
                    </button>

                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving || isGeneratingImage || isUploading || isUploadingMirror || geminiLoading}
                        title="Uložit"
                        className="hidden md:flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 border border-white/20 transition-all hover:scale-110 active:scale-95 hover:bg-white/20 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving || isGeneratingImage || isUploading || isUploadingMirror || geminiLoading}
                        title="Vydat"
                        className="hidden md:flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 border border-white/20 transition-all hover:scale-110 active:scale-95 hover:bg-white/20 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />}
                    </button>
                </div>
            </header>

            {/* Main Workspace - Floating Book */}
            <main className="flex-1 flex md:overflow-hidden overflow-y-auto relative p-2 md:p-8 items-stretch md:items-center justify-center">

                {/* Book Container */}
                <div className="w-full max-w-7xl h-full bg-[#fdfbf7] md:rounded-[3rem] rounded-xl shadow-2xl shadow-purple-900/30 flex flex-col md:flex-row overflow-hidden relative border-4 md:border-[12px] border-white/40 ring-1 ring-black/5">
                    {/* TOP/LEFT PANEL: The Writer */}
                    <div className="flex-1 bg-[#fdfbf7] text-stone-900 relative flex flex-col border-b md:border-b-0 md:border-r border-stone-200/50 h-1/2 md:h-full">
                        {/* Background Decorations (Left) */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
                            <Cloud className="absolute top-8 left-8 text-indigo-50/80 w-32 h-32 fill-indigo-50/50 opacity-50 md:opacity-100" />
                        </div>

                        {/* Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar z-10 relative">
                            <div className="w-full h-full min-h-[200px] md:min-h-[500px] flex flex-col relative">
                                <div className="flex items-center justify-between mb-4 md:mb-8 shrink-0">
                                    <span className="text-[10px] md:text-xs font-bold tracking-widest text-stone-300 uppercase select-none">
                                        {currentPage.isCover ? 'Titulní strana' : `Strana ${currentPageIndex}`}
                                    </span>
                                    <button
                                        id="gemini-assist-btn"
                                        onClick={handleGeminiAssist}
                                        disabled={geminiLoading}
                                        className={`p-2 md:p-3 rounded-full transition-all group shadow-sm ${geminiLoading ? 'bg-purple-100 text-purple-400' : 'bg-white hover:bg-purple-50 text-stone-400 hover:text-purple-600 border border-stone-100 hover:border-purple-200 hover:shadow-md'}`}
                                        title="Gemini Asistent"
                                    >
                                        {geminiLoading ? <Loader2 size={16} className="animate-spin" /> : <Feather size={16} className="group-hover:animate-pulse" />}
                                    </button>

                                    {/* DICTIONARY TOGGLE */}
                                    <div className="h-4 w-px bg-stone-200 mx-2" />
                                    <button
                                        onClick={() => setShowDictionary(!showDictionary)}
                                        className={`p-2 md:p-3 rounded-full transition-all group shadow-sm ${showDictionary ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' : 'bg-white hover:bg-amber-50 text-stone-400 hover:text-amber-500 border border-stone-100'}`}
                                        title="Magičtinář (Slovník)"
                                    >
                                        <Book size={16} />
                                    </button>

                                    {/* EXPERT MODE TOGGLE */}
                                    <button
                                        onClick={() => setIsExpertMode(!isExpertMode)}
                                        className={`ml-2 p-2 md:p-3 rounded-full transition-all group shadow-sm ${isExpertMode ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-200' : 'bg-white hover:bg-indigo-50 text-stone-400 hover:text-indigo-500 border border-stone-100'}`}
                                        title="Expert Mode (Editace promptu)"
                                    >
                                        <GraduationCap size={16} />
                                    </button>
                                </div>

                                <textarea
                                    id="story-textarea"
                                    value={currentPage.text}
                                    onChange={(e) => handleTextChange(e.target.value)}
                                    placeholder={currentPage.isCover ? "Zadej název své knihy..." : "Byl jednou jeden..."}
                                    className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-xl md:text-4xl leading-relaxed text-stone-800 placeholder:text-stone-200/50 font-serif focus:outline-none selection:bg-purple-200"
                                    spellCheck={false}
                                />

                                {/* EXPERT MODE PROMPT EDITOR */}
                                <AnimatePresence>
                                    {isExpertMode && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 border-t-2 border-dashed border-indigo-100 pt-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                                    <Sparkles size={10} /> Magická Formule (English)
                                                </span>
                                                <button
                                                    onClick={async () => {
                                                        const p = await generateImagePrompt(currentPage.text);
                                                        if (p) {
                                                            const newPages = [...pages];
                                                            newPages[currentPageIndex].prompt = p;
                                                            setPages(newPages);
                                                        }
                                                    }}
                                                    className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 font-bold"
                                                >
                                                    {currentPage.prompt ? 'Přegenerovat' : 'Přeložit automaticky'}
                                                </button>
                                            </div>
                                            <textarea
                                                className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-sm font-mono text-indigo-800 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                                                rows={4}
                                                placeholder="Zde se objeví anglický popis pro malíře..."
                                                value={currentPage.prompt || ''}
                                                onChange={(e) => {
                                                    const newPages = [...pages];
                                                    newPages[currentPageIndex].prompt = e.target.value;
                                                    setPages(newPages);
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="h-12 md:h-32 shrink-0"></div>
                            </div>
                        </div>

                        {/* Gemini Suggestion Bubble (Mobile optimized) */}
                        <AnimatePresence>
                            {suggestion && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-4 right-4 left-4 md:left-auto md:bottom-8 md:right-8 z-30 bg-white shadow-xl shadow-purple-500/10 rounded-2xl md:rounded-3xl p-4 md:p-6 md:w-96 border-2 border-purple-50 cursor-pointer hover:border-purple-200 transition-all"
                                    onClick={acceptSuggestion}
                                >
                                    <button
                                        onClick={dismissSuggestion}
                                        className="absolute top-2 right-2 md:top-3 md:right-3 p-1 text-stone-300 hover:text-stone-500 rounded-full hover:bg-stone-50"
                                    >
                                        <X size={14} />
                                    </button>
                                    <div className="flex gap-3 md:gap-4">
                                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                                            <Feather size={16} className="text-purple-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[8px] md:text-[10px] font-black text-purple-400 mb-1 uppercase tracking-widest">Inspirace</p>
                                            <p className="text-sm md:text-lg text-stone-700 leading-snug font-serif italic line-clamp-3">"{suggestion}"</p>
                                            <div className="flex items-center gap-2 mt-2 md:mt-3">
                                                <span className="text-[8px] md:text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">Tip</span>
                                                <span className="text-[8px] md:text-[10px] text-stone-400 font-medium">Vložit</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* CENTRAL SPINE (Hidden on mobile) */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-24 -ml-12 bg-gradient-to-r from-stone-500/10 via-stone-900/5 to-stone-500/10 pointer-events-none z-10 mix-blend-multiply blur-sm" />
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-stone-300/30 z-20" />

                    {/* BOTTOM/RIGHT PANEL: The Illustrator */}
                    <div className="flex-1 bg-[#fdfbf7] relative flex flex-col items-center justify-center p-2 md:p-8 overflow-hidden h-1/2 md:h-full">
                        {/* Canvas Container */}
                        <div className="w-full h-full bg-white rounded-xl md:rounded-3xl border-2 border-stone-100 relative overflow-hidden group flex flex-col shadow-inner items-center justify-center z-10">
                            {/* Image Area */}
                            <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center bg-stone-50/30">
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 text-center bg-stone-50/50">
                                    {/* Cover Badge */}
                                    {currentPage.isCover && (
                                        <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-stone-900 text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg z-20 flex items-center gap-2">
                                            <Star size={8} className="text-yellow-400 fill-yellow-400" />
                                            Obálka
                                        </div>
                                    )}

                                    {currentPage.imageUrl ? (
                                        <motion.img
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            src={currentPage.imageUrl}
                                            alt="Scene"
                                            className="max-w-full max-h-full object-contain shadow-lg"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-stone-300 p-4 md:p-8 text-center select-none">
                                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-stone-50 flex items-center justify-center mb-4 md:mb-6">
                                                <ImageIcon size={24} className="opacity-30" />
                                            </div>
                                            <p className="text-sm md:text-xl font-bold opacity-40 font-title">Zatím prázdné plátno</p>
                                        </div>
                                    )}

                                    {/* Magic Button Overlay */}
                                    <div className={`absolute inset-0 bg-white/80 transition-all duration-500 flex flex-col items-center justify-center gap-4 md:gap-6 backdrop-blur-sm ${!currentPage.imageUrl || isGeneratingImage || isUploading ? 'opacity-100' : 'opacity-0 md:hover:opacity-100'}`}>
                                        {/* Mobile: Tapping image toggles overlay, but here we keep it simple - empty = show */}

                                        {/* AI Magic Button */}
                                        {!isGeneratingImage && !isUploading && (
                                            <div className="flex flex-col gap-2 md:gap-3 items-center scale-90 md:scale-100">
                                                <button
                                                    id="generate-image-btn"
                                                    onClick={() => handleGenerateScene(false)}
                                                    disabled={!currentPage.text.trim()}
                                                    className="group relative px-6 py-3 md:px-8 md:py-4 bg-stone-900 hover:bg-purple-600 disabled:bg-stone-100 disabled:text-stone-300 text-white rounded-xl md:rounded-2xl font-black shadow-2xl transform active:scale-95 transition-all flex items-center gap-2 md:gap-4 overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                                    <span className="text-xl md:text-2xl">✨</span>
                                                    <span className="text-sm md:text-lg tracking-wide">{currentPage.isCover ? 'Vykouzlit' : (currentPage.imageUrl ? 'Překouzlit' : 'Vykouzlit')}</span>
                                                    {!hasEnoughEnergy && (
                                                        <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center text-[10px] uppercase font-bold text-red-400">
                                                            <span>Nedostatek</span>
                                                            <span>{costPerImage} ⚡</span>
                                                        </div>
                                                    )}
                                                </button>
                                                {!hasEnoughEnergy && (
                                                    <button onClick={onOpenStore} className="text-[10px] underline text-stone-500 hover:text-stone-700">
                                                        Dobít energii
                                                    </button>
                                                )}

                                                {magicMirrorUrl && (
                                                    <button
                                                        onClick={() => handleGenerateScene(true)}
                                                        disabled={!currentPage.text.trim()}
                                                        className="group relative px-6 py-3 md:px-8 md:py-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-xl md:rounded-2xl font-black shadow-[0_10px_30px_rgba(79,70,229,0.3)] transform active:scale-95 transition-all flex items-center gap-2 md:gap-4 border-2 border-white/20 overflow-hidden"
                                                    >
                                                        <span className="text-xl md:text-2xl drop-shadow-md">✨👤</span>
                                                        <span className="text-sm md:text-lg tracking-wide">Vykouzlit MĚ</span>
                                                        {!hasEnoughEnergy && (
                                                            <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center text-[10px] uppercase font-bold text-red-400">
                                                                <span>Nedostatek</span>
                                                                <span>{costPerImage} ⚡</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Manual Upload */}
                                        {!isGeneratingImage && !isUploading && (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mt-2 md:mt-6 flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors text-xs md:text-sm font-medium"
                                            >
                                                <Camera size={14} />
                                                <span>{currentPage.imageUrl ? 'Změnit fotku' : 'Vložit vlastní'}</span>
                                            </button>
                                        )}

                                        {/* Loading State */}
                                        {(isGeneratingImage || isUploading) && (
                                            <div className="flex flex-col items-center gap-2 md:gap-4">
                                                <Loader2 size={32} className="text-purple-500 animate-spin" />
                                                <p className="font-title font-bold text-stone-400 text-sm md:text-base">
                                                    {isGeneratingImage ? 'Múzy pracují...' : 'Nahrávám...'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* DICTIONARY SIDEBAR */}
                <AnimatePresence>
                    {showDictionary && (
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-2xl z-50 border-l border-stone-100 flex flex-col"
                        >
                            <div className="p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <Book size={24} />
                                    <div>
                                        <h3 className="font-title font-bold text-xl">Magičtinář</h3>
                                        <p className="text-xs text-orange-100 opacity-80">Slovník pro malé spisovatele</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowDictionary(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto bg-stone-50">
                                <div className="relative mb-6">
                                    <input
                                        type="text"
                                        placeholder="Co chceš přeložit? (např. Les)"
                                        value={dictionaryQuery}
                                        onChange={(e) => setDictionaryQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && dictionaryQuery) {
                                                setIsSearchingDict(true);
                                                searchDictionary(dictionaryQuery).then(res => {
                                                    setDictionaryResult(res);
                                                    setIsSearchingDict(false);
                                                });
                                            }
                                        }}
                                        className="w-full p-4 pl-12 rounded-xl border border-stone-200 shadow-sm focus:ring-2 focus:ring-orange-300 focus:outline-none text-stone-900 placeholder:text-stone-400"
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                                </div>

                                {isSearchingDict ? (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-4 text-stone-400">
                                        <Loader2 size={32} className="animate-spin text-orange-400" />
                                        <p>Listuji ve starých knihách...</p>
                                    </div>
                                ) : dictionaryResult ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-orange-400" />
                                            <div className="text-6xl mb-4">{dictionaryResult.emoji}</div>
                                            <h3 className="text-3xl font-bold text-stone-800 mb-1">{dictionaryResult.primary_en}</h3>
                                            <p className="text-stone-400 italic font-serif">"{dictionaryQuery}"</p>
                                        </div>

                                        {dictionaryResult.synonyms?.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                                                    <Sparkles size={12} /> Synonyma (Lepší slova)
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {dictionaryResult.synonyms.map((syn: string) => (
                                                        <button
                                                            key={syn}
                                                            onClick={() => {
                                                                // Insert into prompt if in expert mode
                                                                if (isExpertMode) {
                                                                    const newPrompt = (currentPage.prompt || '') + " " + syn;
                                                                    const newPages = [...pages];
                                                                    newPages[currentPageIndex].prompt = newPrompt;
                                                                    setPages(newPages);
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 hover:border-orange-400 hover:text-orange-500 transition-colors shadow-sm"
                                                        >
                                                            {syn}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {dictionaryResult.related_adjectives?.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                                                    <Star size={12} /> Kouzelné vlastnosti
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {dictionaryResult.related_adjectives.map((adj: string) => (
                                                        <span key={adj} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100">
                                                            {adj}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-stone-400 py-10">
                                        <Languages size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>Zadej slovo a nauč se magičtinu.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Timeline */}
            <footer className="h-20 md:h-24 bg-white/10 backdrop-blur-md border-t border-white/20 flex items-center px-4 md:px-6 gap-3 md:gap-4 overflow-x-auto shrink-0 z-50 relative custom-scrollbar">
                {pages.map((page: BookPage, index: number) => (
                    <button
                        key={page.id}
                        onClick={() => setCurrentPageIndex(index)}
                        className={`relative group shrink-0 w-16 h-20 rounded border transition-all overflow-hidden ${index === currentPageIndex
                            ? 'border-purple-500 ring-2 ring-purple-500/20 bg-stone-800'
                            : 'border-white/10 hover:border-white/30 bg-stone-800/50'
                            }`}
                    >
                        <span className="absolute top-1 left-2 text-[10px] font-bold text-stone-500 group-hover:text-stone-300 z-10">
                            {page.isCover ? 'T' : index}
                        </span>
                        {page.isCover && (
                            <div className="absolute top-0 right-0 bg-yellow-400 text-stone-900 text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg z-10">
                                Obálka
                            </div>
                        )}
                        {page.imageUrl ? (
                            <img src={page.imageUrl} alt={`Page ${index + 1}`} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                        ) : (
                            <div className="absolute inset-0 bg-white/5" />
                        )}
                    </button>
                ))}

                <button
                    onClick={addNewPage}
                    className="shrink-0 w-16 h-20 rounded border border-white/5 border-dashed hover:border-purple-500/50 hover:bg-purple-500/10 flex items-center justify-center text-stone-500 hover:text-purple-400 transition-all"
                >
                    <Plus size={24} />
                </button>
            </footer>

            {/* Publish Dialog */}
            {showPublishDialog && publishBookId && (
                <PublishDialog
                    bookId={publishBookId}
                    onPublish={async (isPublic) => {
                        await supabase
                            .from('books')
                            .update({ is_public: isPublic })
                            .eq('id', publishBookId);

                        console.log(`📚 Custom book ${publishBookId} ${isPublic ? 'published' : 'kept private'}`);
                        onBack(); // Go back after choosing
                    }}
                    onClose={() => {
                        setShowPublishDialog(false);
                        setPublishBookId(null);
                        onBack(); // Go back even if closed without choosing
                    }}
                />
            )}

            {/* Achievement Toast */}
            <AchievementToast
                achievement={currentAchievement}
                onDismiss={() => setCurrentAchievement(null)}
            />
        </div>
    );
};

export default CustomBookEditor;
