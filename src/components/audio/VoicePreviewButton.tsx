import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';

interface VoicePreviewButtonProps {
    previewUrl: string;
    isActive?: boolean;
}

export const VoicePreviewButton: React.FC<VoicePreviewButtonProps> = ({ previewUrl, isActive }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Stop playing if another voice becomes active or component unmounts
    useEffect(() => {
        if (!isActive && isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering parent selection logic

        if (!audioRef.current) {
            audioRef.current = new Audio(previewUrl);
            audioRef.current.onended = () => setIsPlaying(false);
            audioRef.current.onwaiting = () => setIsLoading(true);
            audioRef.current.onplaying = () => setIsLoading(false);
            audioRef.current.onerror = (e) => {
                console.error("Audio playback error", e);
                setIsLoading(false);
                setIsPlaying(false);
            };
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // Stop all other audios? Handled by parent re-render usually, but here we invoke singular logic
            // Ideally we should have a global audio context, but for simple previews this is fine.
            // Actually, we can pause all other audio elements on the page blindly:
            document.querySelectorAll('audio').forEach(el => el.pause());

            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.error("Play failed", err));
            setIsPlaying(true);
        }
    };

    return (
        <button
            onClick={togglePlay}
            className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-indigo-500 text-white shadow-lg scale-110' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
            title={isPlaying ? "Zastavit ukázku" : "Přehrát ukázku"}
        >
            {isLoading ? (
                <Loader2 size={12} className="animate-spin" />
            ) : isPlaying ? (
                <Square size={12} fill="currentColor" />
            ) : (
                <Play size={12} fill="currentColor" />
            )}
        </button>
    );
};
