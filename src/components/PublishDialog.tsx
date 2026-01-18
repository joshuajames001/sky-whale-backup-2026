import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface PublishDialogProps {
    bookId: string;
    onPublish: (isPublic: boolean) => void;
    onClose: () => void;
}

export const PublishDialog = ({ bookId, onPublish, onClose }: PublishDialogProps) => {
    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublish = async (makePublic: boolean) => {
        setIsPublishing(true);
        await onPublish(makePublic);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl border-2 border-purple-200 shadow-2xl max-w-md w-full overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Confetti Background */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-10 left-10 text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🎉</div>
                        <div className="absolute top-20 right-20 text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
                        <div className="absolute bottom-20 left-20 text-3xl animate-bounce" style={{ animationDelay: '0.4s' }}>🌟</div>
                        <div className="absolute bottom-10 right-10 text-4xl animate-bounce" style={{ animationDelay: '0.6s' }}>🎊</div>
                    </div>

                    {/* Content */}
                    <div className="relative p-8 text-center">
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg"
                        >
                            <Sparkles size={40} className="text-white" />
                        </motion.div>

                        {/* Title */}
                        <h2 className="text-3xl font-black text-slate-800 mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                            Tvůj příběh je hotový!
                        </h2>

                        {/* Description */}
                        <p className="text-lg text-slate-600 mb-8 font-semibold">
                            Chceš ho sdílet s ostatními v galerii?
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePublish(true)}
                                disabled={isPublishing}
                                className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black py-4 px-6 rounded-2xl shadow-lg transition-all disabled:opacity-50"
                            >
                                <Globe size={24} />
                                <span>🌍 Zveřejnit v galerii</span>
                            </motion.button>

                            {/* Share Link Button (NEW) */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    const link = `${window.location.origin}/?view=book&id=${bookId}`;
                                    navigator.clipboard.writeText(link);
                                    alert("Odkaz na knihu zkopírován! 📖");
                                }}
                                className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-indigo-600 font-bold py-3 px-6 rounded-2xl border-2 border-indigo-100 hover:border-indigo-300 transition-all"
                            >
                                <Sparkles size={20} />
                                <span>Sdílet odkaz s přáteli</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePublish(false)}
                                disabled={isPublishing}
                                className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all disabled:opacity-50"
                            >
                                <Lock size={24} />
                                <span>🔒 Jen pro mě</span>
                            </motion.button>
                        </div>

                        {/* Hint */}
                        <p className="text-xs text-slate-500 mt-4">
                            Můžeš to změnit kdykoliv v knihovně
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
