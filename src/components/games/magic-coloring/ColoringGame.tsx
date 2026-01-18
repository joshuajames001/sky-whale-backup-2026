import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ColoringCanvas } from './ColoringCanvas';
import { ColoringToolbar } from './ColoringToolbar';
import { useImageSegmentation } from './useImageSegmentation';
import { Loader2 } from 'lucide-react';

interface ColoringGameProps {
    imageUrl: string;
    onClose: () => void;
}

export const ColoringGame: React.FC<ColoringGameProps> = ({ imageUrl, onClose }) => {
    // New Segmentation Hook
    const { processImage, isProcessing } = useImageSegmentation();

    // Game State
    const [segmentationData, setSegmentationData] = useState<any>(null); // Type this properly if imported
    const [activeColorIndex, setActiveColorIndex] = useState<number | null>(0);
    const [resetKey, setResetKey] = useState(0);

    const stageRef = useRef<any>(null);

    // Initial Process
    useEffect(() => {
        const load = async () => {
            try {
                const result = await processImage(imageUrl);
                setSegmentationData(result);
                if (result.palette.length > 0) setActiveColorIndex(0);
            } catch (e) {
                console.error("Failed to process image", e);
            }
        };
        load();
    }, [imageUrl, processImage]);

    const handleDownload = () => {
        if (!stageRef.current) return;
        const uri = stageRef.current.toDataURL();
        const link = document.createElement('a');
        link.download = 'moje-omalovanka.png';
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        if (window.confirm('Opravdu chceš smazat vše?')) {
            setResetKey(prev => prev + 1);
        }
    };

    if (isProcessing || !segmentationData) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl text-white">
                <Loader2 size={48} className="animate-spin text-fuchsia-400 mb-4" />
                <h3 className="text-xl font-bold">Připravuji omalovánku podle čísel...</h3>
                <p className="text-white/50">Počítám políčka a míchám barvy (to chvilku trvá!)</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex overflow-hidden rounded-3xl bg-slate-900 border border-white/10 shadow-2xl relative"
        >
            {/* Left: Toolbar */}
            <div className="shrink-0 z-20">
                <ColoringToolbar
                    palette={segmentationData.palette}
                    activeColorIndex={activeColorIndex}
                    setActiveColorIndex={setActiveColorIndex}
                    onDownload={handleDownload}
                    onBack={onClose}
                    onReset={handleReset}
                />
            </div>

            {/* Right: Canvas Area */}
            <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-slate-800 p-8 flex items-center justify-center relative">
                {/* Background Pattern for 'Desk' feel */}
                <div className="w-full h-full max-w-5xl max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden ring-8 ring-white/5">
                    <ColoringCanvas
                        segmentationData={segmentationData}
                        activeColorIndex={activeColorIndex}
                        stageRef={stageRef}
                        resetKey={resetKey}
                    />
                </div>
            </div>
        </motion.div>
    );
};
