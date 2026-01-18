import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, PartyPopper, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PuzzleGameProps {
    imageUrl: string;
    difficulty: 3 | 4 | 5; // Grid size (3x3, 4x4, 5x5)
    onClose: () => void;
}

export const PuzzleGame = ({ imageUrl, difficulty, onClose }: PuzzleGameProps) => {
    const [tiles, setTiles] = useState<number[]>([]);
    const [isSolved, setIsSolved] = useState(false);
    const [moves, setMoves] = useState(0);

    // Initialize Game
    useEffect(() => {
        initializeGame();
    }, [difficulty, imageUrl]);

    const initializeGame = () => {
        const totalTiles = difficulty * difficulty;
        // Create array [0, 1, 2, ... N-1]
        const newTiles = Array.from({ length: totalTiles }, (_, i) => i);

        // Shuffle (Fisher-Yates) - simple random swap for drag puzzle
        const shuffled = [...newTiles].sort(() => Math.random() - 0.5);

        // Ensure it's not solved by accident (rare but possible)
        const isAlreadySolved = shuffled.every((t, i) => t === i);
        if (isAlreadySolved) {
            // Swap first two if accidentally solved
            [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
        }

        setTiles(shuffled);
        setIsSolved(false);
        setMoves(0);
    };

    // Check Win Condition
    useEffect(() => {
        if (tiles.length === 0) return;

        const solved = tiles.every((tile, index) => tile === index);

        if (solved && !isSolved && moves > 0) {
            setIsSolved(true);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 100 // Ensure confetti is above modal
            });
        }
    }, [tiles, moves]);

    // Handle Drag Swap
    const handleSwap = (draggedIndex: number, targetIndex: number) => {
        if (isSolved) return;
        if (draggedIndex === targetIndex) return;

        const newTiles = [...tiles];
        // Swap values at the indices
        [newTiles[draggedIndex], newTiles[targetIndex]] = [newTiles[targetIndex], newTiles[draggedIndex]];

        setTiles(newTiles);
        setMoves(m => m + 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center w-full h-full relative"
        >

            {/* Header / Stats */}
            <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 md:p-6 z-20">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white font-bold font-title shadow-lg flex items-center gap-2">
                    <span className="text-indigo-200 uppercase text-xs tracking-wider">Tahů</span>
                    <span className="text-amber-400 text-xl">{moves}</span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={initializeGame}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur transition-colors border border-white/10 active:scale-95"
                        title="Zamíchat"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/10 hover:bg-rose-500/20 hover:text-rose-200 rounded-full text-white backdrop-blur transition-colors border border-white/10 active:scale-95"
                        title="Zavřít"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Victory Overlay */}
            <AnimatePresence>
                {isSolved && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl"
                    >
                        <div className="bg-slate-900 border border-amber-500/30 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm mx-4">
                            <PartyPopper size={64} className="text-amber-400 mb-4 animate-bounce" />
                            <h2 className="text-4xl font-title font-bold text-white mb-2">Skvělá práce!</h2>
                            <p className="text-indigo-200 mb-6">Složil jsi obrázek na {moves} tahů.</p>
                            <button
                                onClick={initializeGame}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95"
                            >
                                Hrát znovu
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Puzzle Grid */}
            <div
                className="relative bg-white/5 border-4 border-white/10 rounded-2xl shadow-2xl overflow-hidden select-none"
                style={{
                    width: 'min(85vw, 500px)',
                    height: 'min(85vw, 500px)',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${difficulty}, 1fr)`,
                    gridTemplateRows: `repeat(${difficulty}, 1fr)`,
                    gap: '2px',
                    padding: '2px',
                    touchAction: 'none' // Prevent scroll on mobile while playing
                }}
            >
                {tiles.map((tileId, currentIndex) => {
                    // Calculate visual position for the tile content
                    const row = Math.floor(tileId / difficulty); // ORIGINAL row
                    const col = tileId % difficulty; // ORIGINAL col

                    // Background size: grid is DxD, so image must be D*100 percent
                    const bgSize = `${difficulty * 100}%`;

                    // Background position: 
                    // 0% is left, 100% is right.
                    // For 3x3: 0%, 50%, 100%
                    // Formula: (index / (total - 1)) * 100
                    const xPos = col === 0 ? 0 : (col / (difficulty - 1)) * 100;
                    const yPos = row === 0 ? 0 : (row / (difficulty - 1)) * 100;

                    return (
                        <PuzzlePiece
                            key={`index-${currentIndex}`} // Index key because positions are static, content moves
                            index={currentIndex}
                            imageUrl={imageUrl}
                            bgPosition={`${xPos}% ${yPos}%`}
                            bgSize={bgSize}
                            onDrop={(targetIndex) => handleSwap(currentIndex, targetIndex)}
                            isCorrect={tileId === currentIndex}
                            isSolved={isSolved}
                        />
                    );
                })}
            </div>

            {/* Reference Image (Small preview) */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:bottom-8 md:left-8 md:translate-x-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg opacity-60 hover:opacity-100 transition-opacity">
                <img src={imageUrl} className="w-full h-full object-cover" alt="Nápověda" />
            </div>
        </motion.div>
    );
};

// Subcomponent for individual draggable pieces
interface PuzzlePieceProps {
    index: number;
    imageUrl: string;
    bgPosition: string;
    bgSize: string;
    onDrop: (targetIndex: number) => void;
    isCorrect: boolean;
    isSolved: boolean;
}

const PuzzlePiece = ({ index, imageUrl, bgPosition, bgSize, onDrop, isCorrect, isSolved }: PuzzlePieceProps) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Essential for drop
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedIndexStr = e.dataTransfer.getData('text/plain');
        if (draggedIndexStr) {
            const draggedIndex = parseInt(draggedIndexStr);
            if (draggedIndex !== index) {
                onDrop(draggedIndex);
            }
        }
    };

    return (
        <motion.div
            layout
            draggable={!isSolved}
            onDragStart={!isSolved ? (_e, _info) => handleDragStart(_e as any) : undefined}
            onDragOver={!isSolved ? handleDragOver : undefined}
            onDrop={!isSolved ? handleDrop : undefined}
            whileHover={!isSolved ? { scale: 0.98, filter: 'brightness(1.1)', zIndex: 10 } : {}}
            whileTap={!isSolved ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`w-full h-full rounded-sm relative shadow-inner overflow-hidden cursor-grab active:cursor-grabbing ${isCorrect && !isSolved ? 'ring-1 ring-white/20' : ''}`}
        >
            <div
                className="w-full h-full transition-all duration-300"
                style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: bgSize,
                    backgroundPosition: bgPosition,
                    filter: isSolved ? 'none' : 'contrast(1.1)'
                }}
            />
            {/* Highlight correct placement subtly */}
            {isCorrect && !isSolved && (
                <div className="absolute inset-0 border border-green-400/30 opacity-50 pointer-events-none" />
            )}
        </motion.div>
    )
}
