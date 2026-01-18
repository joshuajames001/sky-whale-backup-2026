import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, Lock, Gift, Star, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { confetti } from '../../utils/confetti';

interface DailyRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    streak: number;
    onClaim: () => void;
}

const REWARDS = [10, 10, 10, 10, 10, 10, 30]; // 7 Day streak, last is 30

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClose, streak, onClaim }) => {
    const [claiming, setClaiming] = useState(false);
    const dayIndex = streak % 7; // 0-6

    const handleClaim = async () => {
        setClaiming(true);
        // Play sound if we had one
        // Trigger confetti
        confetti(0.5, 0.5);

        await onClaim();

        setTimeout(() => {
            setClaiming(false);
            onClose();
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative border-4 border-yellow-400/30"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                            <h2 className="text-3xl font-black uppercase tracking-widest drop-shadow-md mb-2">Denní Odměna</h2>
                            <p className="font-bold opacity-90">Vítej zpátky, tvůrce! Zde je tvá dávka inspirace.</p>

                            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 bg-stone-50">
                            {/* Streak Track */}
                            <div className="flex justify-between items-center mb-10 relative">
                                {/* Connection Line */}
                                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-2 bg-stone-200 rounded-full -z-0" />
                                <div
                                    className="absolute left-4 top-1/2 -translate-y-1/2 h-2 bg-yellow-400 rounded-full -z-0 transition-all duration-1000"
                                    style={{ width: `${(dayIndex / 6) * 100}%` }}
                                />

                                {REWARDS.map((amount, idx) => {
                                    const isCompleted = idx < dayIndex;
                                    const isCurrent = idx === dayIndex;
                                    const isLast = idx === 6;

                                    return (
                                        <div key={idx} className="relative z-10 flex flex-col items-center gap-2 group">
                                            <div
                                                className={`
                                                    rounded-full flex items-center justify-center transition-all duration-500 border-4
                                                    ${isLast ? 'w-16 h-16' : 'w-10 h-10'}
                                                    ${isCompleted
                                                        ? 'bg-yellow-400 border-yellow-400 text-white'
                                                        : isCurrent
                                                            ? 'bg-white border-yellow-400 text-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.6)] scale-110'
                                                            : 'bg-stone-200 border-stone-100 text-stone-400'
                                                    }
                                                `}
                                            >
                                                {isCompleted ? (
                                                    <Check size={isLast ? 24 : 16} strokeWidth={4} />
                                                ) : isLast ? (
                                                    <Gift size={28} className={isCurrent ? 'animate-bounce' : ''} />
                                                ) : (
                                                    <Zap size={16} fill="currentColor" />
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-bold ${isCurrent ? 'text-yellow-600' : 'text-stone-400'}`}>
                                                Den {idx + 1}
                                            </span>

                                            {/* Amount Badge */}
                                            {isCurrent && (
                                                <div className="absolute -top-8 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                                                    +{amount}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Claim Button */}
                            <button
                                onClick={handleClaim}
                                disabled={claiming}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-white text-xl font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/30 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                {claiming ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Star className="animate-spin" /> Připisuji...
                                    </span>
                                ) : (
                                    <span>Vybrat denní odměnu</span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
