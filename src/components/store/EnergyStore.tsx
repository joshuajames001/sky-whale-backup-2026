import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Star, Gift, Crown, ShoppingBag, X, Check, Shield, Heart } from 'lucide-react';
import { useEnergy } from '../../hooks/useEnergy';
import { SubscriptionCard } from './SubscriptionCard';
import { useGuide } from '../../hooks/useGuide';

interface EnergyStoreProps {
    onClose: () => void;
}

const PACKAGES = [
    {
        id: 'starter',
        name: 'Zvědavec',
        energy: 1000,
        price: '199 Kč',
        icon: Gift,
        color: 'from-amber-400 to-orange-500',
        features: ['Ochutnávka magie', 'Stačí na 1 celou knihu', '+ Odemčení Zrcadla']
    },
    {
        id: 'writer',
        name: 'Spisovatel',
        energy: 3000,
        price: '499 Kč',
        icon: ShoppingBag,
        color: 'from-blue-400 to-indigo-500',
        popular: true,
        features: ['Až 4 knihy (100 stran)', '+ 50 pokusů na opravu', 'Nejoblíbenější volba']
    },
    {
        id: 'master_wordsmith',
        name: 'Mistr Slova',
        energy: 7500,
        price: '1 099 Kč',
        icon: Star,
        color: 'from-amber-300 to-yellow-600',
        bestValue: true,
        features: ['Obrovská porce moci', 'Až na 10 knih', 'Nejlepší jednorázová cena']
    }
];

const SUBSCRIPTION_TIERS = [
    {
        id: 'sub_start',
        name: 'Start',
        icon: Star,
        color: 'from-cyan-400 to-blue-500',
        monthly: {
            price: 259,
            energy: 1600,
            id: 'sub_monthly_start'
        },
        yearly: {
            price: 3108,
            energy: 19200,
            id: 'sub_yearly_start',
            savings: ''
        },
        features: ['Ideální pro začátečníky', 'Energie na 2 knihy měsíčně', 'Zrušení kdykoliv']
    },
    {
        id: 'sub_advanced',
        name: 'Pokročilý',
        icon: Zap,
        color: 'from-blue-500 to-indigo-600',
        monthly: {
            price: 599,
            energy: 4000,
            id: 'sub_monthly_advanced'
        },
        yearly: {
            price: 7188,
            energy: 48000,
            id: 'sub_yearly_advanced',
            savings: ''
        },
        features: ['Pro časté tvůrce', 'Energie na 5 knih měsíčně', 'Prioritní podpora']
    },
    {
        id: 'sub_expert',
        name: 'Expert',
        icon: Crown,
        color: 'from-purple-500 to-pink-600',
        popular: true,
        monthly: {
            price: 1199,
            energy: 9000,
            id: 'sub_monthly_expert'
        },
        yearly: {
            price: 13189,
            energy: 108000,
            id: 'sub_yearly_expert',
            savings: '1 měsíc zdarma'
        },
        features: ['Pro autory sérií', 'Energie na 12 knih měsíčně', 'Early access k funkcím']
    },
    {
        id: 'sub_master',
        name: 'Mistr',
        icon: Shield,
        color: 'from-amber-400 to-orange-600',
        bestValue: true,
        monthly: {
            price: 2499,
            energy: 21000,
            id: 'sub_monthly_master'
        },
        yearly: {
            price: 24990,
            energy: 252000,
            id: 'sub_yearly_master',
            savings: '2 měsíce zdarma'
        },
        features: ['Pro školy a kroužky', 'Maximální hodnota', 'VIP status']
    }
];

const DONATION_OPTIONS = [
    {
        id: 'donate_coffee',
        name: 'Pozvi nás na kávu',
        price: '79 Kč',
        icon: Gift,
        color: 'from-orange-400 to-amber-600',
        description: 'Malé gesto, které nám dodá energii do další práce.',
        energyBonus: 100 // Symbolic energy
    },
    {
        id: 'donate_lunch',
        name: 'Koupit tvůrcům oběd',
        price: '199 Kč',
        icon: Heart,
        color: 'from-pink-500 to-rose-600',
        description: 'Abychom u psaní kódu hlady nešilhali!',
        energyBonus: 250
    },
    {
        id: 'donate_treasure',
        name: 'Hvězdný poklad',
        price: '499 Kč',
        icon: Star,
        color: 'from-purple-500 to-indigo-600',
        description: 'Významná podpora pro rozvoj nových magických funkcí.',
        energyBonus: 600,
        popular: true
    }
];



export const EnergyStore: React.FC<EnergyStoreProps> = ({ onClose }) => {
    const { balance, buyPackage, loading } = useEnergy();
    const { startGuide, hasSeenGroups } = useGuide();
    const [activeTab, setActiveTab] = useState<'packages' | 'subscriptions' | 'support'>('packages'); // Added support
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');



    return (
        <div className="fixed inset-0 z-[150] bg-slate-950 font-sans text-slate-100 overflow-y-auto pb-40">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-6xl p-6 md:p-8 shadow-2xl overflow-hidden min-h-[80vh] mx-auto mt-10 mb-10"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white z-50">
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 mb-4 font-serif">
                        Obchod s Energií
                    </h2>
                    <p className="text-xl text-white/60 mb-8 font-light">
                        {activeTab === 'packages' && 'Doplňte energii jednorázově a pokračujte v psaní.'}
                        {activeTab === 'subscriptions' && 'Staňte se členem a získejte pravidelný přísun magie.'}
                        {activeTab === 'support' && 'Podpořte vývoj Skywhale a staňte se patrony magie.'}
                    </p>

                    {/* MAIN TABS */}
                    <div className="flex justify-center mb-8 overflow-x-auto">
                        <div className="inline-flex bg-white/5 p-1.5 rounded-full border border-white/10 relative min-w-max">
                            {/* Animated Background Indicator */}
                            <div
                                className={`absolute inset-y-1.5 rounded-full bg-white/10 transition-all duration-300 ease-out w-[140px] md:w-[160px]
                                ${activeTab === 'packages' ? 'left-1.5' : activeTab === 'subscriptions' ? 'left-[150px] md:left-[170px]' : 'left-[298px] md:left-[338px]'}
                                `}
                            />

                            <button
                                id="packages-tab-btn"
                                onClick={() => setActiveTab('packages')}
                                className={`px-4 md:px-8 py-3 rounded-full text-sm md:text-base font-bold transition-colors relative z-10 w-[140px] md:w-[160px] ${activeTab === 'packages' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
                            >
                                Jednorázově
                            </button>
                            <button
                                id="subscriptions-tab-btn"
                                onClick={() => setActiveTab('subscriptions')}
                                className={`px-4 md:px-8 py-3 rounded-full text-sm md:text-base font-bold transition-colors relative z-10 w-[140px] md:w-[160px] ${activeTab === 'subscriptions' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
                            >
                                Předplatné
                            </button>
                            <button
                                id="support-tab-btn"
                                onClick={() => setActiveTab('support')}
                                className={`px-4 md:px-8 py-3 rounded-full text-sm md:text-base font-bold transition-colors relative z-10 w-[140px] md:w-[160px] ${activeTab === 'support' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
                            >
                                Podpořit ❤️
                            </button>
                        </div>
                    </div>

                    {/* BILLING TOGGLE (Only for Subscriptions) */}
                    {activeTab === 'subscriptions' && (
                        <div className="flex justify-center mb-8 animate-fade-in-up">
                            <div className="flex items-center gap-4 bg-black/30 px-6 py-2 rounded-full border border-white/5">
                                <span className={`text-sm font-bold transition-colors ${billingPeriod === 'monthly' ? 'text-white' : 'text-white/40'}`}>Měsíčně</span>
                                <button
                                    onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${billingPeriod === 'yearly' ? 'bg-amber-500' : 'bg-white/20'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                                <span className={`text-sm font-bold transition-colors ${billingPeriod === 'yearly' ? 'text-white' : 'text-white/40'}`}>
                                    Ročně <span className="text-amber-400 text-xs">(až 2 měsíce zdarma)</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {balance !== null && (
                        <div className="inline-flex items-center gap-3 bg-zinc-800/80 backdrop-blur px-6 py-2 rounded-full border border-amber-500/30 shadow-lg shadow-amber-900/10">
                            <span className="text-white/60 text-sm font-medium uppercase tracking-wider">Váš zůstatek:</span>
                            <span className="text-amber-400 font-black text-xl flex items-center gap-1">
                                <Zap size={18} fill="currentColor" /> {balance}
                            </span>
                        </div>
                    )}
                </div>

                {/* CONTENT GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
                    {activeTab === 'packages' && (
                        /* ONE TIME PACKAGES */
                        PACKAGES.map((pkg: any) => (
                            <div key={pkg.id} className={`relative group p-6 rounded-3xl border transition-all hover:scale-[1.02] bg-zinc-900/50 flex flex-col ${pkg.bestValue ? 'border-yellow-500/50 shadow-xl shadow-yellow-500/10' : 'border-white/10 hover:border-white/20'}`}>
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                                        Doporučujeme
                                    </div>
                                )}
                                {pkg.bestValue && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                                        Nejvýhodnější
                                    </div>
                                )}

                                <div className="flex-1">
                                    <div className={`w-14 h-14 rounded-2xl mb-6 bg-gradient-to-br ${pkg.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                        <pkg.icon size={28} className="text-white drop-shadow-md" />
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-3xl font-black text-amber-400">{pkg.energy}</span>
                                        <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Energie</span>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {pkg.features.map((feat: string, i: number) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-white/70">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => buyPackage(pkg.id)}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 mt-auto
                                        ${pkg.id === 'starter' || pkg.popular || pkg.bestValue ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-white/10 hover:bg-white/20 text-white'}
                                    `}
                                >
                                    {loading ? <div className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full" /> : `Koupit za ${pkg.price}`}
                                </button>
                            </div>
                        ))
                    )}

                    {activeTab === 'subscriptions' && (
                        /* SUBSCRIPTIONS */
                        SUBSCRIPTION_TIERS.map((tier) => {
                            const data = billingPeriod === 'monthly' ? tier.monthly : tier.yearly;
                            return (
                                <SubscriptionCard
                                    key={tier.id}
                                    id={tier.id} // This ID is mostly internal, the real one is data.id passed to create-checkout
                                    name={tier.name}
                                    price={data.price}
                                    energy={data.energy}
                                    billingPeriod={billingPeriod}
                                    features={tier.features}
                                    popular={tier.popular}
                                    bestValue={tier.bestValue}
                                    color={tier.color}
                                    icon={tier.icon}
                                    savings={(data as any).savings}
                                    loading={loading}
                                    onBuy={() => buyPackage(data.id)} // Pass the specific variant ID (e.g. sub_monthly_start)
                                />
                            );
                        })
                    )}

                    {activeTab === 'support' && (
                        /* DONATION / SUPPORT */
                        DONATION_OPTIONS.map((opt) => (
                            <div key={opt.id} className={`relative group p-6 rounded-3xl border transition-all hover:scale-[1.02] bg-zinc-900/50 flex flex-col items-center text-center ${opt.popular ? 'border-pink-500/50 shadow-xl shadow-pink-500/10' : 'border-white/10 hover:border-pink-500/30'}`}>
                                {opt.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                                        Patron Magie
                                    </div>
                                )}

                                <div className={`w-20 h-20 rounded-full mb-6 bg-gradient-to-br ${opt.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform animate-float`}>
                                    <opt.icon size={32} className="text-white drop-shadow-md" />
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2">{opt.name}</h3>
                                <p className="text-white/60 text-sm mb-6 leading-relaxed min-h-[40px]">{opt.description}</p>

                                <div className="mt-auto w-full">
                                    <div className="flex items-center justify-center gap-2 mb-4 text-xs font-bold text-amber-400 uppercase tracking-widest">
                                        <Zap size={12} fill="currentColor" />
                                        <span>Odhalí tajemství +{opt.energyBonus}</span>
                                    </div>

                                    <button
                                        onClick={() => buyPackage(opt.id)}
                                        disabled={loading}
                                        className={`w-full py-4 rounded-xl font-bold text-base transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2
                                            bg-gradient-to-r ${opt.color} text-white shadow-lg
                                        `}
                                    >
                                        {loading ? <div className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full" /> : `Přispět ${opt.price}`}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                    {activeTab === 'support' && (
                        /* CUSTOM DONATION CARD */
                        <div className="relative group p-6 rounded-3xl border border-white/10 hover:border-emerald-500/30 transition-all hover:scale-[1.02] bg-zinc-900/50 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full mb-6 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Gift size={32} className="text-white drop-shadow-md" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">Vlastní částka</h3>
                            <p className="text-white/60 text-sm mb-6 leading-relaxed">
                                Vyber si, kolik chceš přispět. Každá koruna se počítá!
                            </p>

                            <div className="mt-auto w-full">
                                <div className="relative mb-4">
                                    <input
                                        type="number"
                                        min="20"
                                        placeholder="např. 100"
                                        id="custom-donation-input"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            const energyDisplay = document.getElementById('custom-energy-display');
                                            if (energyDisplay) energyDisplay.innerText = `Odhalí tajemství +${val * 5}`;
                                        }}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">Kč</span>
                                </div>

                                <div className="flex items-center justify-center gap-2 mb-4 text-xs font-bold text-amber-400 uppercase tracking-widest">
                                    <Zap size={12} fill="currentColor" />
                                    <span id="custom-energy-display">Odhalí tajemství +0</span>
                                </div>

                                <button
                                    onClick={() => {
                                        const input = document.getElementById('custom-donation-input') as HTMLInputElement;
                                        const val = parseInt(input.value);
                                        if (val >= 20) {
                                            buyPackage('donate_custom', val);
                                        } else {
                                            alert("Minimální příspěvek je 20 Kč");
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full py-4 rounded-xl font-bold text-base transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                                >
                                    {loading ? <div className="animate-spin w-4 h-4 border-2 border-white/50 border-t-white rounded-full" /> : `Přispět`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
