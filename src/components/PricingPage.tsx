import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Image as ImageIcon, Mic, BookOpen, PenTool, Sparkles, ChevronLeft } from 'lucide-react';

interface PricingPageProps {
    onBack: () => void;
    onOpenStore: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBack, onOpenStore }) => {
    return (
        <div className="w-full max-w-4xl bg-slate-900/90 backdrop-blur-2xl p-6 md:p-10 sm:rounded-[40px] shadow-2xl relative min-h-screen sm:min-h-0 text-white border border-white/10 overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={20} /> Zpět
                </button>
                <div className="flex items-center gap-2 text-amber-400 font-bold bg-amber-400/10 px-4 py-2 rounded-full border border-amber-400/20">
                    <Zap size={18} className="fill-current" />
                    <span>Oficiální Ceník</span>
                </div>
            </div>

            <div className="space-y-12 relative z-10">
                {/* Intro */}
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-title font-bold mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">Jak funguje Energie?</h1>
                    <p className="text-lg text-slate-300">
                        V Skywhale.art platíš jen za to, co skutečně spotřebuješ.
                        Naše měna "Energie" je transparentně svázaná s náklady na umělou inteligenci.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="text-right border-r border-white/10 pr-4">
                            <span className="block text-2xl font-bold text-white">1000</span>
                            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 justify-end">
                                <Zap size={10} className="fill-current" /> Energie
                            </span>
                        </div>
                        <div className="text-left pl-2">
                            <span className="block text-xl font-medium text-slate-300">≈ 200 Kč</span>
                            <span className="text-xs text-slate-500">základní balíček</span>
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Story Generation */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen size={80} />
                        </div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="p-2 bg-violet-500/20 rounded-lg text-violet-300"><Sparkles size={20} /></span>
                            Tvorba Příběhu
                        </h3>

                        <ul className="space-y-4">
                            <li className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-300 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Text a Struktura</span>
                                <span className="font-bold text-green-400">ZDARMA</span>
                            </li>
                            <li className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-300 flex items-center gap-2"><ImageIcon size={14} className="text-slate-500" /> Obrázek (Flux 2.0 Pro)</span>
                                <span className="font-bold text-white">50 <span className="text-xs text-slate-500 font-normal">Energie / ks</span></span>
                            </li>
                            <li className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-300 flex items-center gap-2"><ImageIcon size={14} className="text-slate-500" /> Obrázek (Standard)</span>
                                <span className="font-bold text-white">30 <span className="text-xs text-slate-500 font-normal">Energie / ks</span></span>
                            </li>
                            <li className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-300 flex items-center gap-2"><Mic size={14} className="text-slate-500" /> Audiokniha (Dabing)</span>
                                <span className="font-bold text-white">20 <span className="text-xs text-slate-500 font-normal">Energie / str</span></span>
                            </li>
                        </ul>

                        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-white/5">
                            <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-widest">Příklad ceny knihy (10 stran)</p>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-slate-300">11x Pro Obrázek + Audio</span>
                                <span className="text-lg font-bold text-amber-400">~750 Energie</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Creative Tools */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <PenTool size={80} />
                        </div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <span className="p-2 bg-pink-500/20 rounded-lg text-pink-300"><PenTool size={20} /></span>
                            Kreativní Nástroje
                        </h3>

                        <ul className="space-y-4">
                            <li className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-300 flex items-center gap-2"><ImageIcon size={14} className="text-slate-500" /> Vlastní Samolepka (AI)</span>
                                <span className="font-bold text-white">10 <span className="text-xs text-slate-500 font-normal">Energie / ks</span></span>
                            </li>
                            <li className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-300 flex items-center gap-2"><ImageIcon size={14} className="text-slate-500" /> Odstranění pozadí</span>
                                <span className="font-bold text-white">5 <span className="text-xs text-slate-500 font-normal">Energie / ks</span></span>
                            </li>
                            <li className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-300 flex items-center gap-2"><BookOpen size={14} className="text-slate-500" /> Export PDF</span>
                                <span className="font-bold text-green-400">ZDARMA</span>
                            </li>
                            <li className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-300 flex items-center gap-2"><BookOpen size={14} className="text-slate-500" /> Export Video</span>
                                <span className="font-bold text-white">100 <span className="text-xs text-slate-500 font-normal">Energie / min</span></span>
                            </li>
                        </ul>

                        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-white/5">
                            <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-widest">Tip</p>
                            <p className="text-sm text-slate-300">
                                Předplatitelé mají 20% slevu na všechny AI generace.
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="text-center pt-8">
                    <button
                        onClick={onOpenStore}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-amber-400/20"
                    >
                        Dobít Energii
                    </button>
                </div>
            </div>
        </div>
    );
};
