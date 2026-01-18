import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export const StarryBackground = () => {
    // Parallax Logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Simple check for mobile/touch or small screen
        const checkMobile = () => {
            // 768px is a common breakpoint, but let's check for hover capability too
            const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
            const isSmall = window.innerWidth < 768;
            setIsMobile(isTouch || isSmall);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        const handleMouseMove = (e: MouseEvent) => {
            if (isMobile) return;
            const { innerWidth, innerHeight } = window;
            const x = e.clientX / innerWidth - 0.5;
            const y = e.clientY / innerHeight - 0.5;
            mouseX.set(x);
            mouseY.set(y);
        };

        if (!isMobile) {
            window.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', checkMobile);
        }
    }, [isMobile, mouseX, mouseY]);

    const xSpring = useSpring(mouseX, { stiffness: 100, damping: 30 });
    const ySpring = useSpring(mouseY, { stiffness: 100, damping: 30 });

    const bgX = useTransform(xSpring, [-0.5, 0.5], ['-5%', '5%']);
    const bgY = useTransform(ySpring, [-0.5, 0.5], ['-5%', '5%']);

    // On mobile, just use static 0
    const finalX = isMobile ? 0 : bgX;
    const finalY = isMobile ? 0 : bgY;

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* 1. LAYER: Deep Space Gradient (Fixed) */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a15] via-[#101025] to-[#251545]" />

            {/* 2. LAYER: Stardust Pattern (Parallax) */}
            <motion.div
                className="absolute inset-[-10%] w-[120%] h-[120%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"
                style={{ x: finalX, y: finalY }}
            />

            {/* 3. LAYER: Glowing Orb (Sun/Moon) */}
            <motion.div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[40vw] h-[40vw] rounded-full bg-purple-600/20 blur-[120px]"
                style={{ x: finalX, y: finalY }}
            />

            {/* 4. LAYER: Particles - REDUCED COUNT ON MOBILE */}
            <div className="absolute inset-0">
                {[...Array(isMobile ? 8 : 20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full shadow-[0_0_10px_white]"
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                            opacity: Math.random() * 0.5 + 0.2
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            opacity: [0.8, 0],
                        }}
                        transition={{
                            duration: Math.random() * 5 + 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                        style={{
                            width: Math.random() * 3 + 1 + 'px',
                            height: Math.random() * 3 + 1 + 'px',
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
