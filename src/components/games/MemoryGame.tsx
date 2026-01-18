import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, X, Sparkles, Brain } from 'lucide-react';

interface MemoryGameProps {
    images: string[];
    onClose: () => void;
}

interface Card {
    id: number;
    image: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export const MemoryGame = ({ images, onClose }: MemoryGameProps) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matches, setMatches] = useState(0);
    const [moves, setMoves] = useState(0);
    const [isWon, setIsWon] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Initialize Game
    useEffect(() => {
        initializeGame();
    }, [images]);

    const initializeGame = () => {
        // 1. Take first 8 images (or fewer if not enough)
        const selectedImages = images.slice(0, 8);

        // 2. Duplicate to create pairs
        const pairs = [...selectedImages, ...selectedImages];

        // 3. Shuffle
        const shuffled = pairs
            .map(image => ({ image, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map((item, index) => ({
                id: index,
                image: item.image,
                isFlipped: false,
                isMatched: false
            }));

        setCards(shuffled);
        setFlippedIndices([]);
        setMatches(0);
        setMoves(0);
        setIsWon(false);
        setIsProcessing(false);
    };

    const handleCardClick = (index: number) => {
        // Block if:
        // 1. Game is processing a mismatch (waiting)
        // 2. Card is already flipped
        // 3. Card is already matched
        if (isProcessing || cards[index].isFlipped || cards[index].isMatched) return;

        // Flip the card
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        // Check Logic if 2 cards are flipped
        if (newFlipped.length === 2) {
            setIsProcessing(true);
            setMoves(prev => prev + 1);

            const [firstIndex, secondIndex] = newFlipped;
            const firstCard = newCards[firstIndex];
            const secondCard = newCards[secondIndex];

            if (firstCard.image === secondCard.image) {
                // MATCH!
                setTimeout(() => {
                    setCards(prev => prev.map((c, i) =>
                        i === firstIndex || i === secondIndex
                            ? { ...c, isMatched: true, isFlipped: true }
                            : c
                    ));
                    setFlippedIndices([]);
                    setIsProcessing(false);
                    setMatches(prev => {
                        const newMatches = prev + 1;
                        if (newMatches === images.slice(0, 8).length) {
                            setIsWon(true);
                            triggerConfetti();
                        }
                        return newMatches;
                    });
                }, 500);
            } else {
                // NO MATCH
                setTimeout(() => {
                    setCards(prev => prev.map((c, i) =>
                        i === firstIndex || i === secondIndex
                            ? { ...c, isFlipped: false }
                            : c
                    ));
                    setFlippedIndices([]);
                    setIsProcessing(false);
                }, 1500); // 1.5s delay to see the cards
            }
        }
    };

    const triggerConfetti = () => {
        import('canvas-confetti').then((confetti) => {
            confetti.default({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FF69B4', '#00FFFF']
            });
        });
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full max-h-[85vh]">

            {/* Header / Stats */}
            <div className="flex items-center justify-between w-full max-w-4xl mb-6 px-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur border border-white/10 text-white font-mono font-bold">
                        Tahy: {moves}
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur border border-white/10 text-cyan-300 font-mono font-bold">
                        Páry: {matches}/8
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 drop-shadow-lg hidden md:block">
                    Zrcadla Paměti
                </h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={initializeGame}
                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Restartovat"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl aspect-square md:aspect-video mx-auto p-2 perspective-1000">
                <AnimatePresence>
                    {cards.map((card) => (
                        <CardItem
                            key={card.id}
                            card={card}
                            onClick={() => handleCardClick(card.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Win Overlay */}
            <AnimatePresence>
                {isWon && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl"
                    >
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1 rounded-[32px] shadow-2xl">
                            <div className="bg-slate-900 rounded-[30px] p-8 md:p-12 text-center flex flex-col items-center gap-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    <Trophy size={48} className="text-white drop-shadow-md" />
                                </div>

                                <div>
                                    <h3 className="text-4xl font-black text-white mb-2">Skvělá práce!</h3>
                                    <p className="text-cyan-200 text-lg">Našel jsi všechny páry na {moves} tahů.</p>
                                </div>

                                <div className="flex gap-4 mt-2">
                                    <button
                                        onClick={initializeGame}
                                        className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2"
                                    >
                                        <RefreshCw size={18} /> Hrát znovu
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="bg-white/10 text-white px-8 py-3 rounded-full font-bold hover:bg-white/20 transition-colors"
                                    >
                                        Zpět do herny
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Subcomponent for 3D Card
const CardItem = ({ card, onClick }: { card: Card, onClick: () => void }) => {
    return (
        <motion.div
            className="relative w-full h-full cursor-pointer group perspective-1000"
            onClick={onClick}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: card.id * 0.05 }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
        >
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-500"
                animate={{ rotateY: card.isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* BACK (Logo/Pattern) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 border-2 border-white/10 shadow-xl flex items-center justify-center">
                    <div className="bg-white/10 p-4 rounded-full">
                        <Brain className="text-white/50" size={32} />
                    </div>
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay pointer-events-none" />
                </div>

                {/* FRONT (Image) */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden rounded-xl overflow-hidden border-2 border-cyan-400/50 shadow-cyan-500/20 shadow-xl bg-slate-800"
                    style={{ transform: 'rotateY(180deg)' }}
                >
                    <img
                        src={card.image}
                        alt="memory card"
                        className={`w-full h-full object-cover transition-all duration-500 ${card.isMatched ? 'grayscale-0 brightness-110' : ''}`}
                    />
                    {card.isMatched && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-[2px]">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-white rounded-full p-2 shadow-lg"
                            >
                                <Sparkles className="text-green-500" size={20} />
                            </motion.div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
