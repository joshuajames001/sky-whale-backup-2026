import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Check, Star } from 'lucide-react';
import { useEnergy } from '../../hooks/useEnergy';

interface SubscriptionCardProps {
    id: string;
    name: string;
    price: number;
    energy: number;
    billingPeriod: 'monthly' | 'yearly';
    features: string[];
    popular?: boolean;
    bestValue?: boolean;
    color: string;
    icon: any;
    savings?: string; // e.g. "Ušetříte 990 Kč"
    loading?: boolean;
    onBuy: (id: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
    id,
    name,
    price,
    energy,
    billingPeriod,
    features,
    popular,
    bestValue,
    color,
    icon: Icon,
    savings,
    loading,
    onBuy
}) => {
    const formattedPrice = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(price);

    return (
        <div className={`relative flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] bg-zinc-900/80 backdrop-blur-sm
            ${bestValue ? 'border-yellow-500/50 shadow-lg shadow-yellow-900/20' : 'border-white/5 hover:border-white/20'}
            ${popular ? 'border-purple-500/50 shadow-lg shadow-purple-900/20' : ''}
        `}>
            {/* Badges */}
            {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-10">
                    Nejoblíbenější
                </div>
            )}
            {bestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap z-10">
                    Nejvýhodnější
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{name}</h3>
                    <div className="flex items-center gap-1 text-white/50 text-xs font-medium uppercase trackind-wider">
                        {billingPeriod === 'monthly' ? 'Měsíčně' : 'Ročně'}
                    </div>
                </div>
            </div>

            {/* Energy Amount */}
            <div className="mb-6 bg-white/5 rounded-2xl p-4 border border-white/5 text-center relative overflow-hidden">
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${color}`} />
                <div className="relative z-10 flex flex-col items-center">
                    <span className="text-3xl font-black text-white">{energy}</span>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                        <Zap size={10} fill="currentColor" /> Energie / {billingPeriod === 'monthly' ? 'měs.' : 'rok'}
                    </span>
                </div>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
                {savings && (
                    <div className="inline-block bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                        {savings}
                    </div>
                )}
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-white">{formattedPrice}</span>
                    <span className="text-white/40 text-sm">/ {billingPeriod === 'monthly' ? 'měs.' : 'rok'}</span>
                </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <div className={`mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                            <Check size={10} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="leading-snug">{feature}</span>
                    </li>
                ))}
            </ul>

            {/* Action Button */}
            <button
                onClick={() => onBuy(id)}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95 shadow-lg
                    ${bestValue || popular
                        ? `bg-gradient-to-r ${color} text-white`
                        : 'bg-white text-zinc-900 hover:bg-zinc-100'}
                `}
            >
                {loading ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mx-auto" /> : 'Vybrat Plán'}
            </button>
        </div>
    );
};
