import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, User } from 'lucide-react';

interface ElevenLabsProfileProps {
    user: any;
    profile: any;
    onOpenProfile: () => void;
    onOpenStore: () => void;
    className?: string;
}

export const ElevenLabsProfile: React.FC<ElevenLabsProfileProps> = ({ user, profile, onOpenProfile, onOpenStore, className }) => {
    if (!user || !profile) return null;

    const balance = profile.energy_balance || 0;

    // Track peak energy balance (highest value ever achieved) in localStorage
    const [peakEnergy, setPeakEnergy] = useState(() => {
        const storageKey = `peak_energy_${user.id}`;
        const stored = localStorage.getItem(storageKey);
        return stored ? Math.max(parseInt(stored), balance) : balance;
    });

    // Update peak when balance increases
    useEffect(() => {
        if (balance > peakEnergy) {
            const storageKey = `peak_energy_${user.id}`;
            localStorage.setItem(storageKey, balance.toString());
            setPeakEnergy(balance);
        }
    }, [balance, peakEnergy, user.id]);

    // Calculate ring percentage based on peak
    const maxEnergyVisual = Math.max(peakEnergy, 100); // Minimum 100 to avoid division by zero
    const percentage = Math.min(100, (balance / maxEnergyVisual) * 100);
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    console.log('ElevenLabsProfile:', { balance, peakEnergy, percentage, strokeDashoffset });

    return (
        <div className={`fixed right-6 z-50 flex items-center gap-4 ${className || 'top-6'}`}>

            {/* Energy Tooltip (Visible on Hover or always?) - Let's make it appear to the left */}
            <div className="group relative">
                <button
                    onClick={onOpenProfile}
                    className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/20"
                >
                    {/* SVG Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 52 52">
                        {/* Track - Light Gray for contrast on white */}
                        <circle
                            cx="26"
                            cy="26"
                            r={radius}
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                        />
                        {/* Progress - Yellow */}
                        <circle
                            cx="26"
                            cy="26"
                            r={radius}
                            fill="none"
                            stroke="#fbbf24" // Amber-400/Yellow-400 equivalent hex for consistency
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out drop-shadow-sm"
                        />
                    </svg>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center">
                        <span className="text-2xl">
                            {profile.avatar_emoji || '👤'}
                        </span>
                    </div>
                </button>

                {/* Hover Tooltip - Přezdívka a Energie */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl shadow-xl whitespace-nowrap">
                        <div className="text-xs font-bold text-white mb-1">
                            {profile.nickname || profile.username || user?.email?.split('@')[0]}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold text-yellow-400 font-mono">{balance} ⚡</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
