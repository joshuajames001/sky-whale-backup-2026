import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface MiniPlayerProps {
    audioUrl: string;
}

export const MiniPlayer = ({ audioUrl }: MiniPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Initial loading when play is clicked
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(audioUrl);
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('playing', () => setIsLoading(false));
        audio.addEventListener('waiting', () => setIsLoading(true)); // Buffering

        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.remove();
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            setIsLoading(true);
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Audio play error:", err);
                    setIsPlaying(false);
                    setIsLoading(false);
                });
        }
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                togglePlay();
            }}
            className={`
                relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                ${isPlaying
                    ? 'bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-110'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}
            `}
            title="Přehrát audioknihu"
        >
            {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
            ) : isPlaying ? (
                <>
                    <Pause size={16} className="fill-current" />
                    {/* Ripple animation when playing */}
                    <span className="absolute inset-0 rounded-full border-2 border-amber-400/50 animate-ping" />
                </>
            ) : (
                <Play size={16} className="ml-1 fill-current" />
            )}
        </button>
    );
};
