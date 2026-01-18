export interface ThemePalette {
    id: string;
    label: string;
    bgGradient: string; // Tailwind classes for gradient
    accentColor: string; // Hex for UI elements
    glowColor: string; // Hex for Magic Glow
    nebulaColors: {
        aurora1: string; // Tailwind class
        aurora2: string; // Tailwind class
        dust: string; // Tailwind class
    };
    variant: 'nebula' | 'aurora' | 'clean' | 'digital';
}

export const THEMES: Record<string, ThemePalette> = {
    'Fantasy': {
        id: 'Fantasy',
        label: 'Mystic Fantasy',
        bgGradient: 'bg-gradient-to-b from-indigo-950 via-purple-950 to-[#020617]', // Deep Space
        accentColor: '#a855f7', // Purple-500
        glowColor: '#d8b4fe', // Purple-300
        nebulaColors: {
            aurora1: 'bg-purple-500/20',
            aurora2: 'bg-indigo-500/10',
            dust: 'bg-indigo-200'
        },
        variant: 'nebula'
    },
    'Adventure': {
        id: 'Adventure',
        label: 'Epic Adventure',
        bgGradient: 'bg-gradient-to-b from-slate-900 via-teal-900 to-[#020617]', // Deep Ocean/Jungle
        accentColor: '#14b8a6', // Teal-500
        glowColor: '#5eead4', // Teal-300
        nebulaColors: {
            aurora1: 'bg-teal-500/20',
            aurora2: 'bg-emerald-500/10',
            dust: 'bg-cyan-200'
        },
        variant: 'aurora' // Specific flow
    },
    'Bedtime': {
        id: 'Bedtime',
        label: 'Cozy Bedtime',
        bgGradient: 'bg-gradient-to-b from-blue-950 via-slate-900 to-[#020617]', // Deep Night
        accentColor: '#60a5fa', // Blue-400
        glowColor: '#93c5fd', // Blue-300
        nebulaColors: {
            aurora1: 'bg-blue-600/20',
            aurora2: 'bg-slate-500/10',
            dust: 'bg-blue-100'
        },
        variant: 'nebula'
    },
    'Sci-Fi': {
        id: 'Sci-Fi',
        label: 'Futuristic Sci-Fi',
        bgGradient: 'bg-gradient-to-b from-slate-950 via-cyan-950 to-[#020617]', // Cyberpunk
        accentColor: '#06b6d4', // Cyan-500
        glowColor: '#22d3ee', // Cyan-400
        nebulaColors: {
            aurora1: 'bg-cyan-500/20',
            aurora2: 'bg-fuchsia-500/20', // Pink contrast
            dust: 'bg-cyan-200'
        },
        variant: 'digital'
    },
    'Watercolor': { // Legacy/Art Style Mapping
        id: 'Watercolor',
        label: 'Dreamy Watercolor',
        bgGradient: 'bg-gradient-to-b from-rose-950 via-fuchsia-950 to-[#020617]',
        accentColor: '#f472b6',
        glowColor: '#fbcfe8',
        nebulaColors: {
            aurora1: 'bg-rose-500/20',
            aurora2: 'bg-amber-500/10',
            dust: 'bg-rose-200'
        },
        variant: 'nebula'
    },
    'Pixar 3D': { // Legacy Mapping
        id: 'Pixar 3D',
        label: 'Vibrant 3D',
        bgGradient: 'bg-gradient-to-b from-violet-950 via-fuchsia-900 to-[#020617]',
        accentColor: '#e879f9',
        glowColor: '#f0abfc',
        nebulaColors: {
            aurora1: 'bg-fuchsia-500/20',
            aurora2: 'bg-violet-500/10',
            dust: 'bg-white/80' // No pure white
        },
        variant: 'nebula'
    },
    'Futuristic': { // Alias for Sci-Fi
        id: 'Futuristic',
        label: 'Futuristic Sci-Fi',
        bgGradient: 'bg-gradient-to-b from-slate-950 via-cyan-950 to-[#020617]', // Cyberpunk
        accentColor: '#06b6d4', // Cyan-500
        glowColor: '#22d3ee', // Cyan-400
        nebulaColors: {
            aurora1: 'bg-cyan-500/20',
            aurora2: 'bg-fuchsia-500/20', 
            dust: 'bg-cyan-200'
        },
        variant: 'digital'
    },
    'Sketch': { // Monochrome / Paper
        id: 'Sketch',
        label: 'Hand Drawn',
        bgGradient: 'bg-gradient-to-b from-stone-900 via-zinc-900 to-[#020617]', // Dark Paper
        accentColor: '#d6d3d1', // Stone-300
        glowColor: '#e7e5e4', // Stone-200
        nebulaColors: {
            aurora1: 'bg-stone-500/10',
            aurora2: 'bg-zinc-500/10',
            dust: 'bg-stone-400'
        },
        variant: 'clean'
    }
};

export const DEFAULT_THEME = THEMES['Fantasy'];

export const getTheme = (styleName?: string): ThemePalette => {
    if (!styleName) return DEFAULT_THEME;
    // Fuzzy match or exact match
    const normalized = styleName.trim();
    return THEMES[normalized] || THEMES['Fantasy'];
};
