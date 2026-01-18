import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mic, X, Loader2 } from 'lucide-react';

interface AudioConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (voiceId?: string) => void;
    bookTitle: string;
    charCount: number;
    cost: number;
    currentEnergy: number;
    loading: boolean;
}

export const AudioConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    bookTitle,
    charCount,
    cost,
    currentEnergy,
    loading
}: AudioConfirmDialogProps) => {
    // Voice Options Configuration
    const voices = [
        { id: '21m00Tcm4TlvDq8ikWAM', name: 'Laskavá teta (Výchozí)', type: 'female', desc: 'Jemný, uklidňující hlas' },
        { id: 'ErXwobaYiN019PkySvjV', name: 'Klidný táta', type: 'male', desc: 'Hluboký a stabilní' },
        { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Pohádková babička', type: 'female', desc: 'Pomalejší, vypravěčský styl' },
        { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Kamarád', type: 'child', desc: 'Hravý a veselý' } // Josh (placeholder)
    ];

    const [selectedVoice, setSelectedVoice] = React.useState(voices[0].id);

    if (!isOpen) return null;

    const canAfford = currentEnergy >= cost;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-slate-900 border border-violet-500/30 rounded-2xl p-6 shadow-2xl shadow-violet-500/20 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative">
                        <button
                            onClick={onClose}
                            className="absolute top-0 right-0 p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-violet-500/20 rounded-xl border border-violet-500/30 text-violet-300">
                                <Mic size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Vytvořit Audioknihu</h3>
                                <p className="text-sm text-slate-400 truncate max-w-[200px]">{bookTitle}</p>
                            </div>
                        </div>

                        <div className="space-y-6 mb-8">
                            {/* VOICE SELECTOR */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <Mic size={14} />
                                    Vyber si hlas vypravěče
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {voices.map(voice => (
                                        <button
                                            key={voice.id}
                                            onClick={() => setSelectedVoice(voice.id)}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                                                ${selectedVoice === voice.id
                                                    ? 'bg-violet-600/20 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                                                    : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner
                                                ${selectedVoice === voice.id ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-400'}
                                            `}>
                                                {voice.type === 'female' ? '👩' : voice.type === 'male' ? '👨' : '👦'}
                                            </div>
                                            <div>
                                                <div className={`font-bold ${selectedVoice === voice.id ? 'text-white' : 'text-slate-300'}`}>
                                                    {voice.name}
                                                </div>
                                                <div className="text-xs text-slate-400">{voice.desc}</div>
                                            </div>
                                            {selectedVoice === voice.id && (
                                                <div className="ml-auto text-violet-400">
                                                    <Zap size={16} className="fill-current" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* STATS */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                                    <span className="text-slate-400">Délka textu</span>
                                    <span className="font-mono text-white">{charCount} znaků</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-amber-500/20">
                                    <span className="text-slate-400">Cena</span>
                                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                                        <Zap size={16} className="fill-amber-400" />
                                        <span>{cost} Energie</span>
                                    </div>
                                </div>
                            </div>

                            {!canAfford && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center gap-2">
                                    <Zap size={16} />
                                    <span>Nemáš dostatek energie ({currentEnergy})</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                            >
                                Zrušit
                            </button>
                            <button
                                onClick={() => {
                                    // Pass selected voice ID to confirm handler
                                    // We need to update the prop signature or handle it here
                                    // For now, we assume parent will read check or we modify types.
                                    // Actually, better to pass it back.
                                    // Modifying onConfirm to accept string
                                    (onConfirm as any)(selectedVoice);
                                }}
                                disabled={loading || !canAfford}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${canAfford
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Generuji...
                                    </>
                                ) : (
                                    <>
                                        <Mic size={20} />
                                        Vytvořit Audio
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
