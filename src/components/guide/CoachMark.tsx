import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CoachMarkProps {
    text: string;
    arrow?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'bottom' | 'none';
    order?: number;
    className?: string;
    targetRect?: DOMRect;
}

const ArrowPath = ({ type }: { type: string }) => {
    // Hand-drawn SVG paths for different directions
    const paths: Record<string, string> = {
        'top-left': "M40,40 C20,30 10,20 5,5 m0,0 l5,10 m-5,-10 l10,5", // Curved to top-left
        'top-right': "M5,40 C25,30 35,20 40,5 m0,0 l-5,10 m5,-10 l-10,5",
        'bottom-left': "M40,5 C20,15 10,25 5,40 m0,0 l5,-10 m-5,10 l10,-5",
        'bottom-right': "M5,5 C25,15 35,25 40,40 m0,0 l-5,-10 m5,10 l-10,-5",
        'left': "M50,25 C30,25 20,25 5,25 m0,0 l10,-5 m-10,5 l10,5",
        'right': "M5,25 C25,25 35,25 50,25 m0,0 l-10,-5 m10,5 l-10,5",
        'top': "M25,50 C25,30 25,20 25,5 m0,0 l-5,10 m5,-10 l5,10",
        'bottom': "M25,5 C25,25 25,35 25,50 m0,0 l-5,-10 m5,10 l5,-10"
    };

    return (
        <svg width="50" height="50" viewBox="0 0 50 50" className="opacity-80 drop-shadow-lg" style={{ filter: 'drop-shadow(0px 0px 5px rgba(255,165,0,0.5))' }}>
            <path
                d={paths[type] || paths['top']}
                fill="none"
                stroke="#fbbf24" // Amber-400
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    strokeDasharray: 100,
                    strokeDashoffset: 0,
                    animation: 'dash 1.5s ease-out forwards'
                }}
            />
            {/* Add style tag for animation directly in component for simplicity */}
            <style>{`
                @keyframes dash {
                    from { stroke-dashoffset: 100; }
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </svg>
    );
};

export const CoachMark: React.FC<CoachMarkProps> = ({ text, arrow = 'none', className = '' }) => {
    // Determine positioning based on arrow direction
    const getLayout = () => {
        switch (arrow) {
            case 'top-left': return 'flex-col items-start text-left';
            case 'top-right': return 'flex-col items-end text-right';
            case 'bottom-left': return 'flex-col-reverse items-start text-left';
            case 'bottom-right': return 'flex-col-reverse items-end text-right';
            case 'left': return 'flex-row items-center text-left';
            case 'right': return 'flex-row-reverse items-center text-right';
            case 'top': return 'flex-col items-center text-center';
            case 'bottom': return 'flex-col-reverse items-center text-center';
            default: return 'flex-col items-center text-center';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className={`fixed z-[10000] pointer-events-none flex gap-2 ${getLayout()} ${className}`}
        >
            {arrow !== 'none' && (
                <div className={`
                    ${arrow.includes('bottom') ? 'mb-2' : ''}
                    ${arrow.includes('top') ? 'mt-2' : ''}
                    ${arrow.includes('left') ? 'mr-2' : ''}
                    ${arrow.includes('right') ? 'ml-2' : ''}
                `}>
                    <ArrowPath type={arrow} />
                </div>
            )}

            <div className="max-w-[250px] relative group pointer-events-auto">
                <p className="font-['Caveat'] text-2xl md:text-3xl text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight tracking-wide">
                    {text}
                </p>
                {/* Optional "glow" backing for readability */}
                <div className="absolute inset-0 bg-black/40 blur-xl -z-10 rounded-full opacity-60 mix-blend-multiply" />
            </div>
        </motion.div>
    );
};
