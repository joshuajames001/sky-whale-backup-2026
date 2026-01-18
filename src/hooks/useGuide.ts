import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuideStep {
    targetId: string;
    title: string;
    text: string;
    arrow: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'bottom' | 'none';
}

interface GuideState {
    activeGuide: string | null;
    step: number;
    hasSeenGroups: Record<string, boolean>;
    
    startGuide: (guideId: string) => void;
    nextStep: () => void;
    closeGuide: () => void;
    markAsSeen: (guideId: string) => void;
    resetGuides: () => void;
}

export const useGuide = create<GuideState>()(
    persist(
        (set, get) => ({
            activeGuide: null,
            step: 0,
            hasSeenGroups: {},

            startGuide: (guideId: string) => {
                // Determine if already seen logic should be here or component level?
                // For manual trigger (Help button), we ignore seen state.
                // For auto trigger, component checks hasSeen.
                set({ activeGuide: guideId, step: 0 });
            },

            nextStep: () => {
                set((state) => ({ step: state.step + 1 }));
            },

            closeGuide: () => {
                const { activeGuide } = get();
                if (activeGuide) {
                     set((state) => ({
                        activeGuide: null,
                        step: 0,
                        hasSeenGroups: { ...state.hasSeenGroups, [activeGuide]: true }
                    }));
                } else {
                    set({ activeGuide: null, step: 0 });
                }
            },

            markAsSeen: (guideId: string) => {
                set((state) => ({
                    hasSeenGroups: { ...state.hasSeenGroups, [guideId]: true }
                }));
            },

            resetGuides: () => {
                set({ hasSeenGroups: {} });
            }
        }),
        {
            name: 'skywhale-guide-storage',
            partialize: (state) => ({ hasSeenGroups: state.hasSeenGroups }), // Only persist seen history
        }
    )
);
