import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface ScrollableRowProps {
    children: React.ReactNode;
    className?: string;
    itemClassName?: string;
}

export const ScrollableRow: React.FC<ScrollableRowProps> = ({ children, className = "", itemClassName = "" }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            // Use a small threshold (e.g. 1px) to avoid precision errors
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);

        // Optional: heavy-handed check interval if children change layout
        const interval = setInterval(checkScroll, 1000);

        return () => {
            window.removeEventListener('resize', checkScroll);
            clearInterval(interval);
        };
    }, []); // Removed children dependency to prevent loops

    return (
        <div className={`relative group ${className}`}>
            {/* Left Fade/Arrow */}
            <div className={`absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-black/90 to-transparent z-10 flex items-center justify-start pl-1 transition-opacity duration-300 pointer-events-none ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronLeft size={16} className="text-white/50" />
            </div>

            {/* Right Fade/Arrow */}
            <div className={`absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-black/90 to-transparent z-10 flex items-center justify-end pr-1 transition-opacity duration-300 pointer-events-none ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronRight size={16} className="text-white/50 animate-pulse" />
            </div>

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className={`flex items-center overflow-x-auto no-scrollbar ${itemClassName}`}
            >
                {children}
            </div>
        </div>
    );
};
