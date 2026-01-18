import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Text } from 'react-konva';
import useImage from 'use-image';
import { CardItem } from './types';
import Konva from 'konva';

// Custom Filter to make white pixels transparent
const RemoveWhite = (imageData: any) => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If pixel is very light (near white), make it transparent
        if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
        }
    }
};

// --- HELPER COMPONENT: URLImage ---
// Handles loading images from URL
const URLImage = React.forwardRef<any, any>(({ src, removeBackground, ...props }, ref) => {
    const [image, status] = useImage(src, 'anonymous');
    const imageNodeRef = useRef<Konva.Image>(null);

    // Combine forwarded ref and local ref
    React.useImperativeHandle(ref, () => imageNodeRef.current);

    useEffect(() => {
        if (status === 'loaded' && imageNodeRef.current && removeBackground) {
            try {
                imageNodeRef.current.cache();
            } catch (e) {
                console.warn("Could not cache image for filter", e);
            }
        }
    }, [image, status, removeBackground]);

    return (
        <KonvaImage
            ref={imageNodeRef}
            image={image}
            filters={removeBackground ? [RemoveWhite] : []}
            {...props}
        />
    );
});
// Re-export or keep local? It's local.

// --- HELPER COMPONENT: CanvasItem ---
// Renders individual items (Image or Icon/Text proxy)
const CanvasItem = ({
    item,
    isSelected,
    onSelect,
    onChange,
    onDragStart,
    onDragEnd
}: {
    item: CardItem,
    isSelected: boolean,
    onSelect: () => void,
    onChange: (newAttrs: any) => void,
    onDragStart?: () => void,
    onDragEnd?: () => void
}) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    const commonProps = {
        onClick: onSelect,
        onTap: onSelect,
        ref: shapeRef,
        draggable: true,
        x: item.x,
        y: item.y,
        rotation: item.rotation,
        scaleX: item.scaleX,
        scaleY: item.scaleY,
        onDragStart: onDragStart,
        onDragEnd: (e: any) => {
            onDragEnd?.();
            onChange({
                x: e.target.x(),
                y: e.target.y(),
            });
        },
        onTransformEnd: () => {
            const node = shapeRef.current;
            if (!node) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            onChange({
                x: node.x(),
                y: node.y(),
                rotation: node.rotation(),
                scaleX: scaleX,
                scaleY: scaleY,
            });
        },
    };

    {/* RENDER LOGIC */ }
    return (
        <>
            {(item.type === 'image' || (item.type === 'sticker' && (item.content.startsWith('http') || item.content.startsWith('data:')))) ? (
                <URLImage
                    src={item.content}
                    removeBackground={false}
                    {...commonProps}
                />
            ) : (
                // Text or Emoji Sticker
                (item.type === 'text' || item.type === 'sticker') ? (
                    <Text
                        text={item.content}
                        wrap="char"
                        width={item.type === 'sticker' ? undefined : 200}
                        fontSize={item.type === 'sticker' ? 100 : 24} // Large size for Emojis
                        fontFamily={item.fontFamily || "Inter"}
                        fill={item.type === 'sticker' ? undefined : (item.color || "#ffffff")} // Let emojis have natural color? Or undefined might default to black. 
                        // Actually for Konva Text, standard emojis usually render.
                        shadowColor="black"
                        shadowBlur={2}
                        shadowOpacity={0.5}
                        align="center"
                        {...commonProps}
                    />
                ) : (
                    <Rect
                        width={50} height={50} fill="red"
                        {...commonProps}
                    />
                )
            )}

            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // Limit minimum size
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

export interface CardCanvasProps {
    items: CardItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<CardItem>) => void;
    domRef?: React.RefObject<Konva.Stage>;
    background: string;
    onItemDragStart?: () => void;
    onItemDragEnd?: () => void;
}

export const CardCanvas = ({ items, selectedId, onSelect, onUpdate, domRef, background = "#fffcf5", onItemDragStart, onItemDragEnd }: CardCanvasProps) => {

    // Canvas dimensions (A5 ratio or similar)
    const WIDTH = 400;
    const HEIGHT = 560; // ~1.4 ratio

    const checkDeselect = (e: any) => {
        // deselect when clicked on empty area (Stage) OR the Background layer
        const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-layer';
        if (clickedOnEmpty) {
            onSelect('');
        } else {
            // We clicked on a sticker/item
            // Prevent the event from bubbling up to the swipeable container
            // This ensures Framer Motion doesn't interpret sticker drag as a page swipe
            if (e.evt) {
                e.evt.stopPropagation();
                e.evt.preventDefault(); // Optional: might help with browser scrolling too
            }
        }
    };

    const isBackgroundImage = background && (background.startsWith('http') || background.startsWith('data:'));

    return (
        <div className="relative shadow-2xl rounded-xl overflow-hidden border-4 border-[#fffcf5]">
            <Stage
                width={WIDTH}
                height={HEIGHT}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                ref={domRef}
                className="bg-[#fffcf5]"
            >
                <Layer>
                    {/* Background Texture or Color */}
                    {isBackgroundImage ? (
                        <URLImage
                            src={background}
                            width={WIDTH}
                            height={HEIGHT}
                            name="background-layer"
                        />
                    ) : (
                        <Rect
                            width={WIDTH}
                            height={HEIGHT}
                            fill={background || "#fffcf5"}
                            name="background-layer"
                        />
                    )}

                    {items.map((item) => (
                        <CanvasItem
                            key={item.id}
                            item={item}
                            isSelected={item.id === selectedId}
                            onSelect={() => onSelect(item.id)}
                            onChange={(newAttrs) => onUpdate(item.id, newAttrs)}
                            onDragStart={onItemDragStart}
                            onDragEnd={onItemDragEnd}
                        />
                    ))}
                </Layer>
            </Stage>

            {/* Overlay UI for Empty State REMOVED */}
        </div>
    );
};
