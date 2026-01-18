import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';

export const LegalAgreements = ({ onBack, defaultTab = 'terms' }: { onBack: () => void; defaultTab?: 'terms' | 'privacy' }) => {
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(defaultTab);

    return (
        <div className="fixed inset-0 z-[60] bg-stone-50 text-stone-800 flex flex-col h-[100dvh] overflow-hidden">
            {/* Minimal Header */}
            <div className="shrink-0 bg-stone-50/80 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex items-center justify-center relative z-10">
                <div className="flex bg-stone-200/50 p-1 rounded-xl shadow-inner">
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'terms' ? 'bg-white text-stone-900 shadow-sm scale-105' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        <FileText size={16} /> <span className="hidden xs:inline">Podmínky</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'privacy' ? 'bg-white text-stone-900 shadow-sm scale-105' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        <Shield size={16} /> <span className="hidden xs:inline">Soukromí</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overscroll-y-contain w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="max-w-4xl mx-auto py-8 px-4 md:px-6 pb-24">
                    {activeTab === 'terms' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <TermsOfService onBack={onBack} />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <PrivacyPolicy onBack={onBack} />
                        </div>
                    )}
                </div>
            </div>

            {/* Simple Footer inside legal */}
            <footer className="py-8 border-t border-stone-200 text-center text-stone-400 text-xs uppercase tracking-widest bg-stone-100">
                &copy; {new Date().getFullYear()} Skywhale &bull; Všechna práva vyhrazena
            </footer>

            <style>{`
                /* Hide the internal back buttons of individual components when hosted here */
                .prose + button, button:has(svg.lucide-arrow-left) {
                    display: none;
                }
                /* But our main header back button should stay visible - handled by scope */
                header button { display: flex !important; }
            `}</style>
        </div>
    );
};
