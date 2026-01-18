import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, AlertCircle, Terminal, Code2 } from 'lucide-react';
import { invokeEdgeFunction } from '../../lib/edge-functions';

interface StoryChatProps {
    onComplete: (data: any) => void;
    onCancel: () => void;
    mode?: 'muse' | 'architect'; // New Prop
}

interface Message {
    id: string;
    role: 'assistant' | 'user';
    content: string;
    isError?: boolean;
}

export const StoryChat: React.FC<StoryChatProps> = ({ onComplete, onCancel, mode = 'muse' }) => {
    const isArchitect = mode === 'architect';

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'assistant',
            content: isArchitect
                ? "Zdravím. Jsem Architekt projektu Skywhale. 🏗️\nZeptej se mě na cokoliv ohledně protokolů, databáze nebo pravidel světa."
                : "Ahoj! Jsem tvá Múza. ✨\n\nPojďme spolu vymyslet úžasný příběh. O čem by měl být? (Můžeš napsat třeba 'O modrém drakovi, který ztratil oheň' nebo cokoliv tě napadne!)"
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [currentParams, setCurrentParams] = useState({
        title: '',
        main_character: '',
        setting: '',
        target_audience: '5-8', // default
        visual_style: '3D Pixar' // default
    });
    const [isReady, setIsReady] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: inputValue.trim()
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputValue('');
        setIsTyping(true);

        try {
            let aiReply = '';

            if (isArchitect) {
                // ARCHITECT MODE
                const { data, error } = await invokeEdgeFunction('generate-story-content', {
                    action: 'ask-architect',
                    payload: { question: userMsg.content }
                });

                if (error) throw new Error(error.message);
                aiReply = data; // Direct string or wrapped? Edge function returns: {choices:[{message:{content}}]} OR just string depending on my impl.
                // Wait, my impl of ask-architect returns { choices: [{ message: { content: answer } }] }
                // invokeEdgeFunction usually returns the `data` part.
                // Let's check `invokeEdgeFunction`.
                // If it returns `data` which is the RESPONSE JSON...
                // Then `data.choices[0].message.content` is the text.
                // My `StoryChat` code below assumes `const { reply, ... } = data`.

                // Let's standardise extraction:
                if (data?.choices?.[0]?.message?.content) {
                    aiReply = data.choices[0].message.content;
                } else if (typeof data === 'string') {
                    aiReply = data;
                } else {
                    aiReply = JSON.stringify(data);
                }

            } else {
                // MUSE MODE
                const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
                const { data, error } = await invokeEdgeFunction('generate-story-content', {
                    action: 'chat-turn',
                    payload: {
                        messages: apiMessages,
                        currentParams: currentParams
                    }
                });

                if (error) throw new Error(error.message);

                // Muse returns structured JSON string inside content OR structured object?
                // `chat-turn` usually returns { choices: [{ message: { content: JSON_STRING } }] }
                // So parsing is needed.
                try {
                    const jsonContent = JSON.parse(data.choices[0].message.content);
                    aiReply = jsonContent.reply;
                    if (jsonContent.extracted_params) setCurrentParams(prev => ({ ...prev, ...jsonContent.extracted_params }));
                    if (jsonContent.is_ready) setIsReady(true);
                } catch (e) {
                    // Fallback for legacy format or direct string
                    aiReply = data.choices?.[0]?.message?.content || "Nerozumím datech.";
                }
            }

            const botMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: aiReply
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Spojení přerušeno. Zkus to prosím znovu.",
                isError: true
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // --- THEME ---
    const theme = isArchitect ? {
        bg: 'bg-slate-950',
        header: 'from-slate-800 to-slate-900 border-slate-700',
        userBubble: 'bg-emerald-700 text-emerald-100',
        botBubble: 'bg-slate-900 text-slate-300 border-slate-700 font-mono text-xs md:text-sm',
        accent: 'text-emerald-500',
        button: 'bg-emerald-600 hover:bg-emerald-500',
        icon: <Terminal className="text-emerald-400" size={20} />
    } : {
        bg: 'bg-slate-900/80',
        header: 'from-cyan-500 to-blue-600 border-light-white/10',
        userBubble: 'bg-indigo-600 text-white',
        botBubble: 'bg-slate-800 text-slate-200 border-slate-700',
        accent: 'text-cyan-200',
        button: 'bg-cyan-600 hover:bg-cyan-500',
        icon: <Bot className="text-white" size={20} />
    };

    return (
        <div className={`flex flex-col h-full relative ${theme.bg}`}>
            {/* Header */}
            <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-r ${theme.header} backdrop-blur-md border-b z-10 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isArchitect ? 'bg-slate-950 border border-emerald-500/30' : 'bg-white/10'}`}>
                        {theme.icon}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">{isArchitect ? 'Architekt' : 'Múza'}</h3>
                        <p className={`${theme.accent} opacity-60 text-xs`}>{isArchitect ? 'System Guide v1.0' : 'AI Spoluautor'}</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 pt-20 pb-24 space-y-6 scroll-smooth">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${msg.role === 'user'
                            ? `${theme.userBubble} rounded-tr-sm`
                            : msg.isError
                                ? 'bg-red-900/50 border border-red-500/30 text-red-200'
                                : `${theme.botBubble} rounded-tl-sm border`
                            }`}>
                            {msg.content.split('\n').map((line, i) => (
                                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                                    {isArchitect && msg.role === 'assistant' ? (
                                        // Markdown-ish highlight for codes
                                        <span dangerouslySetInnerHTML={{ __html: line.replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1 rounded text-emerald-300 font-mono">$1</code>') }} />
                                    ) : line}
                                </p>
                            ))}
                        </div>
                    </motion.div>
                ))}
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className={`${theme.botBubble} px-4 py-3 rounded-2xl rounded-tl-sm border flex gap-1 items-center`}>
                            <span className="w-2 h-2 bg-current opacity-50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-current opacity-50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-current opacity-50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isArchitect ? "Zadejte dotaz na systém..." : "Napiš svou myšlenku..."}
                        className={`w-full bg-black/30 border border-white/10 rounded-full py-4 pl-6 pr-14 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 transition-all ${isArchitect ? 'focus:border-emerald-500/50 focus:ring-emerald-500/50 font-mono text-sm' : 'focus:border-cyan-500/50 focus:ring-cyan-500/50'}`}
                        disabled={isTyping}
                        autoFocus
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className={`absolute right-2 p-2 rounded-full transition-colors text-white disabled:bg-slate-700 ${theme.button}`}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="text-center mt-2 flex justify-center gap-4">
                    <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-300 uppercase tracking-widest font-bold">
                        Zrušit
                    </button>
                    {!isArchitect && isReady && (
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={() => onComplete(currentParams)}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full text-white font-bold shadow-lg hover:scale-105 transition-transform"
                        >
                            <Sparkles size={16} />
                            Vytvořit příběh
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
};

