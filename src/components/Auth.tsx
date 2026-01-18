import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Sparkles, ArrowRight, X, CheckCircle } from 'lucide-react';

export const Auth = ({ onLogin }: { onLogin: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: window.location.origin,
                data: {
                    referral_code: localStorage.getItem('referral_code')
                }
            },
        });

        if (error) {
            alert(error.message);
        } else {
            setIsSent(true);
            onLogin();
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onLogin} // Close on backdrop click (optional, repurposing onLogin as close)
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-zinc-900/80 border border-white/10 p-1 rounded-2xl shadow-2xl max-w-sm w-full backdrop-blur-xl overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />

                <div className="bg-black/40 rounded-xl p-8 relative z-10">
                    <button onClick={onLogin} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                            <Sparkles className="text-white fill-white/20" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Vstup do světa příběhů</h2>
                        <p className="text-white/50 text-sm">Přihlas se a ukládej své knihy do cloudu.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {isSent ? (
                            <motion.div
                                key="sent"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-center py-4"
                            >
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-green-400" size={32} />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">Kouzlo je na cestě! 📨</h3>
                                <p className="text-white/60 text-sm mb-6">Zkontroluj svou e-mailovou schránku a potvrď přihlášení.</p>
                                <button onClick={() => setIsSent(false)} className="text-purple-400 hover:text-purple-300 text-sm font-bold transition-colors">
                                    Zkusit jiný e-mail
                                </button>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleLogin}
                                className="space-y-4"
                            >
                                {/* Google Login */}
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            const { error } = await supabase.auth.signInWithOAuth({
                                                provider: 'google',
                                                options: {
                                                    redirectTo: window.location.origin,
                                                    queryParams: {
                                                        referral_code: localStorage.getItem('referral_code') || ''
                                                    }
                                                }
                                            });
                                            if (error) throw error;
                                        } catch (error: any) {
                                            alert(error.message);
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full py-4 bg-white text-stone-900 rounded-xl font-bold shadow-lg hover:bg-stone-100 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Pokračovat s Googlem
                                </button>

                                <div className="flex items-center gap-4 text-white/30 text-xs font-bold uppercase tracking-widest">
                                    <div className="h-px bg-white/10 flex-1" />
                                    nebo
                                    <div className="h-px bg-white/10 flex-1" />
                                </div>

                                <div className="space-y-1 text-left">
                                    <label className="text-xs font-bold text-white/40 ml-1 uppercase tracking-wider">Tvůj E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-medium"
                                            placeholder="spisovatel@pribeh.cz"
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                                    {loading ? (
                                        <span className="opacity-80">Odesílám kouzlo...</span>
                                    ) : (
                                        <>
                                            Poslat magický odkaz <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
