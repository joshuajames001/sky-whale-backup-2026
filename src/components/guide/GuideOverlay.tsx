import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuide } from '../../hooks/useGuide';
import { CoachMark } from './CoachMark';

// GUIDE DEFINITIONS
const GUIDES = {
    library_welcome: [
        {
            targetId: 'create-btn',
            text: "Tady začíná tvé dobrodružství... vytvoř svou první knihu.",
            arrow: 'top-right' as const
        },
        {
            targetId: 'energy-balance',
            text: "Energie ti vdechne život do příběhů.",
            arrow: 'top-right' as const
        },
        {
            targetId: 'library-tabs',
            text: "Zde najdeš svá rozepsaná díla.",
            arrow: 'left' as const
        }
    ],
    story_studio_welcome: [
        {
            targetId: 'custom-story-btn',
            text: "Máš svou vlastní vizi? Postav si příběh od základů.",
            arrow: 'right' as const
        },
        {
            targetId: 'magic-generator-btn',
            text: "Nebo nech Múzu, ať tě překvapí...",
            arrow: 'left' as const
        }
    ],
    energy_store_welcome: [
        {
            targetId: 'packages-tab-btn',
            text: "Doplň energii jednorázově, když ji potřebuješ.",
            arrow: 'bottom' as const
        },
        {
            targetId: 'subscriptions-tab-btn',
            text: "Výhodnější pro pravidelné psaní.",
            arrow: 'bottom' as const
        },
        {
            targetId: 'support-tab-btn',
            text: "Líbí se ti Skywhale? Podpoř nás ❤️",
            arrow: 'bottom' as const
        }
    ],
    custom_book_editor_welcome: [
        {
            targetId: 'editor-title-input',
            text: "Pojmenuj svůj příběh...",
            arrow: 'top-left' as const
        },
        {
            targetId: 'story-textarea',
            text: "Zde napiš děj. Neboj se pustit uzdu fantazii!",
            arrow: 'top-left' as const
        },
        {
            targetId: 'gemini-assist-btn',
            text: "Když ti dojdou slova, Múza ti napoví.",
            arrow: 'top-right' as const
        },
        {
            targetId: 'generate-image-btn',
            text: "A nakonec... vdechneš příběhu život obrazem.",
            arrow: 'right' as const
        }
    ]
};

export const GuideOverlay: React.FC = () => {
    const { activeGuide, step, nextStep, closeGuide } = useGuide();
    const [coords, setCoords] = useState<{ x: number, y: number } | null>(null);

    const currentGuide = activeGuide ? (GUIDES as any)[activeGuide] : null;
    const currentStep = currentGuide ? currentGuide[step] : null;

    useEffect(() => {
        if (currentStep?.targetId) {
            const updatePosition = () => {
                const el = document.getElementById(currentStep.targetId);
                if (el) {
                    const rect = el.getBoundingClientRect();

                    // Simple logic to position near element based on arrow
                    let x = rect.left + rect.width / 2;
                    let y = rect.top + rect.height / 2;

                    // Offset based on arrow direction (approximate)
                    if (currentStep.arrow.includes('top')) y += 75;
                    if (currentStep.arrow.includes('bottom')) y -= 75;
                    if (currentStep.arrow.includes('left')) x += 75;
                    if (currentStep.arrow.includes('right')) x -= 75;

                    setCoords({ x, y });
                } else {
                    // Fallback center if element missing
                    setCoords({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                }
            };

            updatePosition();
            window.addEventListener('resize', updatePosition);
            // Small delay to allow layout to settle
            setTimeout(updatePosition, 500);

            return () => window.removeEventListener('resize', updatePosition);
        }
    }, [currentStep]);

    if (!activeGuide || !currentStep) return null;

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (step < currentGuide.length - 1) {
            nextStep();
        } else {
            closeGuide();
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm cursor-pointer"
                onClick={handleNext} // Click anywhere to advance
            >
                {coords && (
                    <div
                        style={{ position: 'absolute', top: coords.y, left: coords.x, transform: 'translate(-50%, -50%)' }}
                    >
                        <CoachMark
                            text={currentStep.text}
                            arrow={currentStep.arrow}
                        />
                    </div>
                )}

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40 text-sm font-['Caveat'] text-xl animate-pulse">
                    Klikni kamkoliv pro pokračování... ({step + 1}/{currentGuide.length})
                </div>

                {/* Close Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); closeGuide(); }}
                    className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                >
                    Zavřít průvodce
                </button>
            </motion.div>
        </AnimatePresence>
    );
};
