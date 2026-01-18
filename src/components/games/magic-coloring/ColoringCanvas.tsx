

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from 'react-konva';
import { SegmentedRegion, SegmentationResult } from './useImageSegmentation';

interface ColoringCanvasProps {
    segmentationData: SegmentationResult;
    activeColorIndex: number | null;
    stageRef: any;
    resetKey?: number;
}

export const ColoringCanvas: React.FC<ColoringCanvasProps> = ({
    segmentationData, activeColorIndex, stageRef, resetKey
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 800, height: 600 });

    // Canvas State
    const [filledRegions, setFilledRegions] = useState<Set<number>>(new Set());
    const [canvasImage, setCanvasImage] = useState<HTMLCanvasElement | undefined>(undefined);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Helpers
    // Compute scale and position to center the image
    const fit = React.useMemo(() => {
        if (!segmentationData) return { x: 0, y: 0, scale: 1, width: 0, height: 0 };
        const scale = Math.min(
            size.width / segmentationData.width,
            size.height / segmentationData.height
        ) * 0.9;
        const width = segmentationData.width * scale;
        const height = segmentationData.height * scale;
        const x = (size.width - width) / 2;
        const y = (size.height - height) / 2;
        return { x, y, scale, width, height };
    }, [segmentationData, size]);

    // INIT PAINTING CANVAS
    useEffect(() => {
        if (!segmentationData) return;

        const c = document.createElement('canvas');
        c.width = segmentationData.width;
        c.height = segmentationData.height;
        canvasRef.current = c;
        setCanvasImage(c);

        // Pre-render outlines on a separate canvas for overlay?
        // Actually, we can just draw them on top layer using Konva or another canvas.
        // Let's use the painting canvas to hold COLORS.
        // And a separate canvas for OUTLINES to display on top.

    }, [segmentationData]);

    // RESET
    useEffect(() => {
        setFilledRegions(new Set());
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // Force refresh
            const layer = stageRef.current?.findOne('.paintingLayer');
            if (layer) layer.batchDraw();
        }
    }, [resetKey, segmentationData]);

    // RESIZE
    useEffect(() => {
        const resize = () => {
            if (containerRef.current) {
                setSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);


    // CLICK HANDLER
    const handleStageClick = (e: any) => {
        if (!segmentationData || activeColorIndex === null || !canvasRef.current) return;

        const stage = e.target.getStage();
        const ptr = stage.getPointerPosition();
        if (!ptr) return;

        // Convert Pointer to Image Coordinates
        const ix = Math.floor((ptr.x - fit.x) / fit.scale);
        const iy = Math.floor((ptr.y - fit.y) / fit.scale);

        if (ix < 0 || iy < 0 || ix >= segmentationData.width || iy >= segmentationData.height) return;

        // Hit Test Region
        const pixelIdx = iy * segmentationData.width + ix;
        const regionId = segmentationData.regionMap[pixelIdx];

        if (regionId === -1) return; // Edge or background?

        const region = segmentationData.regions.find(r => r.id === regionId);
        if (!region) return;

        // Check Logic
        // region.label is 1-based index (e.g. 1, 2, 3)
        // activeColorIndex is 0-based index from palette (0, 1, 2)
        // Does it match?
        if (region.label === activeColorIndex + 1) { // Match!
            // Fill Region
            if (filledRegions.has(regionId)) return; // Already filled

            setFilledRegions(prev => {
                const next = new Set(prev);
                next.add(regionId);
                return next;
            });

            // Draw pixels to canvas
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                const imgData = ctx.getImageData(0, 0, segmentationData.width, segmentationData.height);
                const data = imgData.data;

                // Get color RGB
                const hex = segmentationData.palette[activeColorIndex];
                // Hex to RGB
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);

                // Iterate region pixels
                for (const pIdx of region.pixelIndices) {
                    const i = pIdx * 4;
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                    data[i + 3] = 255;
                }

                ctx.putImageData(imgData, 0, 0);

                // Refresh Layer
                const layer = stageRef.current.findOne('.paintingLayer');
                if (layer) layer.batchDraw();
            }
        } else {
            // Mismatch Visual Feedback?
            // Maybe shake animation later.
            // For now, console log or ignore.
            console.log("Wrong Color! Needed:", region.label, "Got:", activeColorIndex + 1);
        }
    };

    // Prepare Outlines Canvas (Memoized)
    const outlinesImage = React.useMemo(() => {
        if (!segmentationData) return undefined;
        const c = document.createElement('canvas');
        c.width = segmentationData.width;
        c.height = segmentationData.height;
        const ctx = c.getContext('2d');
        if (!ctx) return undefined;

        const imgData = ctx.createImageData(c.width, c.height);
        const data = imgData.data;
        const outlineMap = segmentationData.outlineMap;

        for (let i = 0; i < outlineMap.length; i++) {
            if (outlineMap[i] === 1) {
                // Gray/Black line
                const j = i * 4;
                data[j] = 200; // Light Gray
                data[j + 1] = 200;
                data[j + 2] = 200;
                data[j + 3] = 255; // Opaque
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return c;
    }, [segmentationData]);


    return (
        <div ref={containerRef} className="w-full h-full bg-slate-100 rounded-3xl overflow-hidden shadow-inner relative cursor-crosshair">
            <Stage
                width={size.width}
                height={size.height}
                onMouseDown={handleStageClick}
                onTouchStart={handleStageClick}
                ref={stageRef}
            >
                {/* 1. White Paper Background */}
                <Layer>
                    <Rect width={size.width} height={size.height} fill="white" />
                </Layer>

                {/* 2. Painted Content */}
                <Layer name="paintingLayer">
                    {canvasImage && (
                        <KonvaImage
                            image={canvasImage}
                            x={fit.x}
                            y={fit.y}
                            width={fit.width}
                            height={fit.height}
                            listening={false} // Clicks go to stage
                        />
                    )}
                </Layer>

                {/* 3. Outlines Overlay */}
                <Layer listening={false}>
                    {outlinesImage && (
                        <KonvaImage
                            image={outlinesImage}
                            x={fit.x}
                            y={fit.y}
                            width={fit.width}
                            height={fit.height}
                            opacity={0.5}
                        />
                    )}
                </Layer>

                {/* 4. Numbers Overlay */}
                <Layer listening={false}>
                    {segmentationData && segmentationData.regions.map(region => {
                        if (filledRegions.has(region.id)) return null; // Hide number if filled

                        // Don't show if tiny?
                        if (region.pixelIndices.length < 200) return null;

                        return (
                            <Text
                                key={region.id}
                                x={fit.x + region.centroid.x * fit.scale - 5}
                                y={fit.y + region.centroid.y * fit.scale - 5}
                                text={region.label.toString()}
                                fontSize={10 / fit.scale < 10 ? 10 : 12} // Scale font? Or standard size
                                fontStyle="bold"
                                fill="#94a3b8" // Slate 400
                            />
                        );
                    })}
                </Layer>

            </Stage>
        </div>
    );
};
