export interface CardItem {
    id: string;
    type: 'icon' | 'text' | 'image' | 'sticker';
    content: any; // For icons: Component, for images: string URL
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    // Text Styling
    color?: string;
    fontFamily?: string;
    fontSize?: number;
}

export interface CardPage {
    id: string;
    name: string;
    items: CardItem[];
    background: string;
}

export interface CardTemplate {
    id: string;
    name: string;
    thumbnail: string;
    pages: CardPage[];
}
