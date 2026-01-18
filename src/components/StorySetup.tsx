import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, User, MapPin, Palette, ArrowRight, Sparkles, Wand2, PenTool } from 'lucide-react';
import { generateStoryStructure, generateStoryIdea } from '../lib/storyteller';
import { supabase } from '../lib/supabase';
import { StoryBook } from '../types';
import { MagicLoading } from './MagicLoading';
import { AnimatedInput } from './story/AnimatedInput';
import { AgeSelector } from './story/AgeSelector';
import { StyleSelector } from './story/StyleSelector';
import { VOICE_OPTIONS, DEFAULT_VOICE_ID } from '../lib/audio-constants';
import { Mic } from 'lucide-react';
import { VoicePreviewButton } from './audio/VoicePreviewButton';

interface StorySetupProps {
    onComplete: (story: StoryBook) => Promise<void>;
    onOpenStore?: () => void;
}

import { useGuide } from '../hooks/useGuide';

export const StorySetup: React.FC<StorySetupProps> = ({ onComplete, onOpenStore }) => {
    const [mode, setMode] = useState<'select' | 'custom' | 'auto'>('select');
    const [step, setStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [creationStatus, setCreationStatus] = useState<string | null>(null);

    // Guide Hook
    const { startGuide, hasSeenGroups } = useGuide();

    // Trigger Guide
    useEffect(() => {
        if (!hasSeenGroups['story_studio_welcome']) {
            startGuide('story_studio_welcome');
        }
    }, [hasSeenGroups, startGuide]);

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        main_character: '',
        visual_dna: '',
        setting: '',
        target_audience: '4-7', // Default
        visual_style: 'Watercolor',
        length: 25, // Default 25 pages (Spisovatel)
        voice_id: DEFAULT_VOICE_ID,
        hero_image_url: '' as string // For Hero Mode
    });

    // Upload State
    const [isUploadingHero, setIsUploadingHero] = useState(false);
    const fileInputRef = useState<any>(null); // We'll user useRef properly in render or just use ID


    const [userBalance, setUserBalance] = useState<number | null>(null);



    // Fetch Energy Balance
    useEffect(() => {
        const fetchBalance = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('energy_balance').eq('id', user.id).single();
                if (data) setUserBalance(data.energy_balance);
            }
        };
        fetchBalance();
    }, []);

    const STORY_COSTS = {
        10: 550,  // (10 pages + 1 cover) * 50 energy (Flux Pro)
        15: 800,  // (15 pages + 1 cover) * 50 energy
        25: 1300  // (25 pages + 1 cover) * 50 energy
    };

    const requiredEnergy = (STORY_COSTS[formData.length as keyof typeof STORY_COSTS] || 1250) + (formData.voice_id ? formData.length * 20 : 0);
    const hasEnoughEnergy = userBalance !== null && userBalance >= requiredEnergy;

    // Auto-fill author name if logged in
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) {
                const name = data.user.email.split('@')[0];
                setFormData(prev => ({ ...prev, author: name.charAt(0).toUpperCase() + name.slice(1) }));
            }
        });
    }, []);

    const handleMagicLink = async () => {
        setMode('auto');
        setIsGenerating(true);
        setCreationStatus("Vyvolávám Múzy...");

        try {
            const idea = await generateStoryIdea();
            setFormData(prev => ({
                ...prev,
                title: idea.title,
                main_character: idea.main_character,
                visual_dna: idea.visual_dna || '',
                setting: idea.setting,
                target_audience: idea.target_audience || '4-7',
                visual_style: idea.visual_style || 'Watercolor'
            }));
            setIsGenerating(false);
            setCreationStatus(null);
            setMode('custom');
            setStep(0);
        } catch (error) {
            console.error("Magic Gen Failed", error);
            setCreationStatus(`Múza mlčí: ${(error as Error).message}`);
            setTimeout(() => {
                setIsGenerating(false);
                setCreationStatus(null);
                setMode('select');
            }, 6000);
        }
    };

    const handleSubmit = async () => {
        setIsGenerating(true);
        setCreationStatus("Sním o novém světě...");

        try {


            setCreationStatus("Vazba struktury příběhu...");
            const { pages, coverPrompt, identityPrompt, visualDna } = await generateStoryStructure({
                title: formData.title,
                author: formData.author,
                main_character: formData.main_character,
                visual_dna: formData.visual_dna,
                setting: formData.setting,
                target_audience: formData.target_audience,
                visual_style: formData.visual_style,
                user_identity_image: formData.hero_image_url || undefined // HERO MODE
            });

            setCreationStatus("Připravuji plátno...");
            const bookId = crypto.randomUUID();

            setCreationStatus("Eufórie...");

            const newStory: StoryBook = {
                book_id: bookId,
                title: formData.title || 'Untitled Story',
                author: formData.author || 'Anonymous',
                theme_style: formData.visual_style,
                cover_image: null,
                cover_prompt: coverPrompt,
                identity_prompt: identityPrompt, // Flux 2.0: Technical Sheet Prompt
                visual_dna: visualDna,
                main_character: formData.main_character,
                setting: formData.setting,
                target_audience: formData.target_audience,
                visual_style: formData.visual_style,
                pages: pages,
                tier: 'premium', // Vždy používáme Flux 2 Pro pro generování příběhů
                length: formData.length
            };

            await onComplete(newStory);

        } catch (error) {
            console.error("Story Creation Failed:", error);
            setCreationStatus("Nepodařilo se vytvořit příběh.");
            setTimeout(() => {
                setIsGenerating(false);
                setCreationStatus(null);
            }, 3000);
        }
    };

    // --- RENDER ---

    if (isGenerating) {
        return <MagicLoading status={creationStatus} style={formData.visual_style} />;
    }

    if (mode === 'select') {
        return (
            <div className="flex flex-col items-center gap-12 w-full max-w-6xl px-4 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 text-white drop-shadow-lg text-center" style={{ fontFamily: 'Fredoka' }}>
                        Jak začne tvé dobrodružství?
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl text-center max-w-lg" style={{ fontFamily: 'Quicksand' }}>
                        Každá cesta začíná prvním krokem. Vyber si tu svou.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 w-full">
                    {/* OPTION 1: CUSTOM EDITOR */}
                    <motion.button
                        id="custom-story-btn"
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('custom')}
                        className="group relative h-[400px] overflow-hidden rounded-[40px] bg-white/5 backdrop-blur-md border-2 border-white/10 hover:border-white/30 transition-all text-left flex flex-col justify-end p-10 shadow-2xl hover:shadow-indigo-500/10"
                    >
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 p-8 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
                            <PenTool size={120} className="text-white/5 group-hover:text-white/10" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 space-y-4">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-white group-hover:text-indigo-900 transition-colors duration-300">
                                <PenTool size={32} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">Vlastní příběh</h3>
                                <p className="text-indigo-200/60 group-hover:text-indigo-100/80 leading-relaxed text-lg">
                                    Máš jasnou vizi? Staň se architektem a vybuduj svůj svět detail po detailu.
                                </p>
                            </div>
                        </div>
                    </motion.button>

                    {/* OPTION 2: MAGIC GENERATOR */}
                    <motion.button
                        id="magic-generator-btn"
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleMagicLink}
                        className="group relative h-[400px] overflow-hidden rounded-[40px] bg-indigo-950 border-2 border-indigo-500/30 hover:border-indigo-400/50 transition-all text-left flex flex-col justify-end p-10 shadow-2xl shadow-indigo-900/40 hover:shadow-indigo-500/40"
                    >
                        {/* Badge */}
                        <div className="absolute top-6 right-6 z-20">
                            <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-lg shadow-pink-500/40 animate-pulse">
                                Novinka
                            </div>
                        </div>

                        {/* Cosmic Background */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Animated Glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-500/30 rounded-full blur-[100px] group-hover:bg-fuchsia-500/40 transition-colors duration-500" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]" />

                        {/* Floating Icon */}
                        <div className="absolute top-12 right-12 opacity-50 group-hover:opacity-100 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
                            <Wand2 size={100} className="text-white/10 group-hover:text-white/20" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 space-y-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Sparkles size={32} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-white mb-2">Magický Generátor</h3>
                                <p className="text-indigo-200 group-hover:text-white leading-relaxed text-lg">
                                    Nech se překvapit Múzou. Namícháme ti unikátní koktejl fantazie pouhým kliknutím.
                                </p>
                            </div>
                        </div>
                    </motion.button>

                    {/* OPTION 3: HERO STORY (Příběh hrdiny) */}
                    <motion.button
                        id="hero-story-btn"
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setMode('custom');
                            setFormData({ ...formData, hero_image_url: 'pending' }); // Mark as hero mode
                        }}
                        className="group relative h-[400px] overflow-hidden rounded-[40px] bg-gradient-to-br from-emerald-900 to-teal-900 border-2 border-emerald-500/30 hover:border-emerald-400/50 transition-all text-left flex flex-col justify-end p-10 shadow-2xl shadow-emerald-900/40"
                    >
                        {/* Badge */}
                        <div className="absolute top-6 right-6 z-20">
                            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/40">
                                Hero Mode
                            </div>
                        </div>

                        {/* Background */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                        {/* Icon */}
                        <div className="absolute top-12 right-12 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700">
                            <User size={100} className="text-white/10 group-hover:text-emerald-200/20" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 space-y-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Sparkles size={32} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors">Příběh Hrdiny</h3>
                                <p className="text-emerald-200/60 group-hover:text-emerald-100/80 leading-relaxed text-lg">
                                    Nahraj fotku a staň se hlavním hrdinou svého vlastního dobrodružství.
                                </p>
                            </div>
                        </div>
                    </motion.button>
                </div>
            </div >
        );
    }

    return (
        <div className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-2xl p-6 md:p-10 sm:rounded-[40px] shadow-2xl relative md:max-h-[90vh] md:overflow-y-auto no-scrollbar flex flex-col border-y sm:border border-white/10 min-h-screen sm:min-h-0">

            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <button
                    onClick={() => setMode('select')}
                    className="text-slate-400 hover:text-slate-600 font-bold uppercase text-xs tracking-widest transition-colors flex items-center gap-2"
                >
                    <ArrowRight className="rotate-180" size={14} /> Zpět na výběr
                </button>
                <div className="flex gap-2">
                    {[0, 1].map(i => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-violet-600' : 'w-2 bg-slate-200'}`} />
                    ))}
                </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-title font-bold text-white mb-1 flex items-center gap-3">
                {formData.title || 'Nový Příběh'} <Sparkles className="text-amber-400 animate-pulse" size={20} />
            </h2>
            <p className="text-indigo-200/50 mb-6 md:mb-8 font-medium italic text-sm">Bude to legenda...</p>

            <AnimatePresence mode='wait'>
                {step === 0 ? (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* LEFT COLUMN: Main Inputs */}
                            <div className="space-y-12">

                                {/* HERO MODE UPLOAD STEP */}
                                {formData.hero_image_url && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-left duration-500">
                                        <label className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
                                            <Sparkles size={14} /> Kdo je hrdina? (Nahraj fotku)
                                        </label>

                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setIsUploadingHero(true);
                                                    try {
                                                        const fileExt = file.name.split('.').pop();
                                                        const fileName = `hero_${crypto.randomUUID()}.${fileExt}`;
                                                        const filePath = `temp/${fileName}`;
                                                        const { error: uploadError } = await supabase.storage.from('story-assets').upload(filePath, file);
                                                        if (uploadError) throw uploadError;
                                                        const { data: { publicUrl } } = supabase.storage.from('story-assets').getPublicUrl(filePath);
                                                        setFormData({ ...formData, hero_image_url: publicUrl });
                                                    } catch (err) {
                                                        alert("Chyba při nahrávání.");
                                                    } finally {
                                                        setIsUploadingHero(false);
                                                    }
                                                }}
                                                className="hidden"
                                                id="hero-upload"
                                            />
                                            <label
                                                htmlFor="hero-upload"
                                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${formData.hero_image_url && formData.hero_image_url !== 'pending' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800'}`}
                                            >
                                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${formData.hero_image_url && formData.hero_image_url !== 'pending' ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                                                    {isUploadingHero ? (
                                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                                                    ) : formData.hero_image_url && formData.hero_image_url !== 'pending' ? (
                                                        <img src={formData.hero_image_url} className="w-full h-full object-cover rounded-xl" />
                                                    ) : (
                                                        <User size={24} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white">
                                                        {formData.hero_image_url && formData.hero_image_url !== 'pending' ? 'Fotka nahrána!' : 'Vybrat fotku'}
                                                    </h4>
                                                    <p className="text-xs text-slate-400">
                                                        {formData.hero_image_url && formData.hero_image_url !== 'pending' ? 'Můžeme pokračovat.' : 'Klikni pro nahrání selfie'}
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <AnimatedInput
                                    label="Název příběhu"
                                    icon={Book}
                                    value={formData.title}
                                    onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="např. Tajemství Starého Dubu"
                                />
                                <AnimatedInput
                                    label="Hrdina (Hlavní postava)"
                                    icon={User}
                                    value={formData.main_character}
                                    onChange={(e: any) => setFormData({ ...formData, main_character: e.target.value })}
                                    placeholder="např. Eliška, statečná veverka"
                                />
                                <AnimatedInput
                                    label="Svět (Prostředí)"
                                    icon={MapPin}
                                    value={formData.setting}
                                    onChange={(e: any) => setFormData({ ...formData, setting: e.target.value })}
                                    placeholder="např. Kouzelný les plný světlušek"
                                />
                            </div>

                            {/* RIGHT COLUMN: Visual DNA Assistant */}
                            <div className="relative hidden md:block">
                                <div className="absolute inset-0 bg-white/5 rounded-[32px] -z-10 opacity-50" />
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                                    <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full shadow-xl flex items-center justify-center text-indigo-200 relative">
                                        {formData.main_character ? (
                                            <div className="text-4xl">🤠</div> // Placeholder for generated avatar
                                        ) : (
                                            <User size={40} />
                                        )}
                                        {formData.main_character && (
                                            <motion.div
                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Tvůj Hrdina</h4>
                                        <p className="text-sm text-indigo-200/50 mt-2">
                                            {formData.main_character ?
                                                `"${formData.main_character}" zní skvěle! Už si ho představuji.` :
                                                "Napiš jméno hrdiny a sleduj, jak ožívá..."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex justify-end">
                            <button
                                onClick={() => setStep(1)}
                                disabled={!formData.title}
                                className="bg-slate-900 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-violet-600 transition-colors shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                            >
                                Pokračovat <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 space-y-6 md:space-y-8"
                    >
                        {/* Stardust Divider */}
                        <div className="flex items-center gap-4 text-white/10">
                            <div className="h-px bg-white/10 flex-1" />
                            <Sparkles size={16} />
                            <div className="h-px bg-white/10 flex-1" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                            <div className="space-y-6">
                                <label className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                    <User size={14} /> Pro koho to bude?
                                </label>
                                <AgeSelector
                                    selected={formData.target_audience}
                                    onSelect={(val: string) => setFormData({ ...formData, target_audience: val })}
                                />
                                {/* Voice Selector */}
                                <label className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs mt-6">
                                    <Mic size={14} /> Hlas vypravěče
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {VOICE_OPTIONS.map((voice) => (
                                        <button
                                            key={voice.id}
                                            onClick={() => setFormData({ ...formData, voice_id: formData.voice_id === voice.id ? '' : voice.id })}
                                            className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${formData.voice_id === voice.id ? 'border-violet-500 bg-violet-500/10 text-white' : 'border-white/10 bg-white/5 hover:border-white/30 text-slate-300'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{voice.emoji}</span>
                                                <div className="text-left">
                                                    <div className="text-xs font-bold">{voice.name}</div>
                                                </div>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <VoicePreviewButton previewUrl={voice.previewUrl || ''} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                    <Palette size={14} /> Jak to má vypadat?
                                </label>
                                <StyleSelector
                                    selected={formData.visual_style}
                                    onSelect={(val: string) => setFormData({ ...formData, visual_style: val })}
                                />
                            </div>
                        </div>

                        {/* Story Length Selector */}
                        <div className="space-y-6">
                            <label className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                <Book size={14} /> Délka příběhu
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {[10, 15, 25].map((len) => {
                                    // Use the 10x Economy CONSTANTS
                                    const baseCost = STORY_COSTS[len as keyof typeof STORY_COSTS] || len * 50;
                                    const audioCost = formData.voice_id ? len * 20 : 0;
                                    const cost = baseCost + audioCost;

                                    const isAffordable = userBalance !== null && userBalance >= cost;
                                    const isSelected = formData.length === len;

                                    return (
                                        <button
                                            key={len}
                                            onClick={() => setFormData({ ...formData, length: len })}
                                            className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${isSelected ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                                        >
                                            <div className="text-2xl font-bold text-white mb-1">{len} stran</div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-indigo-200">{cost} ⚡</div>
                                            {!isAffordable && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-red-300 uppercase bg-red-900/80 px-2 py-1 rounded">Nedostatek ⚡</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Balance Warning */}
                        {!hasEnoughEnergy && (
                            <div className="bg-amber-900/30 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
                                <div className="text-amber-200 text-sm">
                                    <span className="font-bold block">Nedostatek Magické Energie</span>
                                    Potřebuješ {requiredEnergy} ⚡, ale máš jen {userBalance} ⚡.
                                </div>
                                <button onClick={onOpenStore} className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-amber-400 transition-colors">
                                    Dobít Energii
                                </button>
                            </div>
                        )}

                        <div className="mt-8 flex justify-between items-center bg-slate-900/60 backdrop-blur sticky bottom-0 py-4 border-t border-white/5">
                            <button
                                onClick={() => setStep(0)}
                                className="text-slate-400 font-bold hover:text-slate-600 px-6 py-4"
                            >
                                Zpět
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!hasEnoughEnergy}
                                className={`bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-12 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-fuchsia-500/30 transition-all transform hover:scale-105 flex items-center gap-3 ${!hasEnoughEnergy ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                Vyčarovat Knihu <Wand2 size={24} />
                            </button>
                            {/* Disabled Overlay Tooltip */}
                            {!hasEnoughEnergy && (
                                <div className="text-xs text-center text-red-400 font-bold uppercase mt-2 w-full absolute -bottom-8">
                                    Musíš dobít energii
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
