import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';

export const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center pointer-events-none"
                >
                    <div className="bg-stone-900/95 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl max-w-2xl w-full border border-white/10 flex flex-col md:flex-row items-center gap-6 pointer-events-auto">
                        <div className="p-3 bg-stone-800 rounded-full shrink-0">
                            <Cookie className="text-amber-400" size={24} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="font-bold mb-1">Máte rádi sušenky? 🍪</h4>
                            <p className="text-sm text-stone-400 leading-relaxed">
                                Používáme nezbytné soubory cookie, aby naše aplikace fungovala správně a bezpečně.
                            </p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <button
                                onClick={handleAccept}
                                className="bg-white text-stone-900 px-6 py-2 rounded-full font-bold hover:bg-stone-200 transition-colors"
                            >
                                Rozumím
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
