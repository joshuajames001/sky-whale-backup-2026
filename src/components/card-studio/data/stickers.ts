// Simplified stickers using Emojis for instant rendering without asset dependencies
export interface StickerItem {
    id: string;
    type: 'image' | 'text'; 
    content: string; 
    label: string;
    category?: string;
}

export const SKYWHALE_STICKERS: StickerItem[] = [
    // Magic & Celestial
    { id: 's_star', type: 'text', content: '⭐', label: 'Hvězda' },
    { id: 's_moon', type: 'text', content: '🌙', label: 'Měsíc' },
    { id: 's_sparkle', type: 'text', content: '✨', label: 'Třpyt' },
    { id: 's_comet', type: 'text', content: '☄️', label: 'Kometa' },
    { id: 's_planet', type: 'text', content: '🪐', label: 'Planeta' },
    { id: 's_wizard', type: 'text', content: '🧙‍♂️', label: 'Čaroděj' },
    { id: 's_fairy', type: 'text', content: '🧚‍♀️', label: 'Víla' },
    { id: 's_unicorn', type: 'text', content: '🦄', label: 'Jednorožec' },
    { id: 's_dragon', type: 'text', content: '🐲', label: 'Drak' },
    { id: 's_ghost', type: 'text', content: '👻', label: 'Duch' },
    { id: 's_crystal', type: 'text', content: '🔮', label: 'Křišťál' },

    // Nature & Animals
    { id: 's_tree', type: 'text', content: '🌳', label: 'Strom' },
    { id: 's_flower', type: 'text', content: '🌸', label: 'Květina' },
    { id: 's_rose', type: 'text', content: '🌹', label: 'Růže' },
    { id: 's_sunflower', type: 'text', content: '🌻', label: 'Slunečnice' },
    { id: 's_leaf', type: 'text', content: '🍁', label: 'List' },
    { id: 's_cat', type: 'text', content: '🐱', label: 'Kočka' },
    { id: 's_dog', type: 'text', content: '🐶', label: 'Pes' },
    { id: 's_fox', type: 'text', content: '🦊', label: 'Liška' },
    { id: 's_butterfly', type: 'text', content: '🦋', label: 'Motýl' },
    { id: 's_bee', type: 'text', content: '🐝', label: 'Včela' },
    { id: 's_owl', type: 'text', content: '🦉', label: 'Sova' },

    // Party & Celebration
    { id: 's_balloon', type: 'text', content: '🎈', label: 'Balónek' },
    { id: 's_party', type: 'text', content: '🎉', label: 'Konfety' },
    { id: 's_cake', type: 'text', content: '🎂', label: 'Dort' },
    { id: 's_gift', type: 'text', content: '🎁', label: 'Dárek' },
    { id: 's_candle', type: 'text', content: '🕯️', label: 'Svíčka' },
    { id: 's_crown', type: 'text', content: '👑', label: 'Koruna' },
    { id: 's_trophy', type: 'text', content: '🏆', label: 'Pohár' },
    { id: 's_medal', type: 'text', content: '🥇', label: 'Medaile' },

    // Objects & Others
    { id: 's_heart', type: 'text', content: '💖', label: 'Srdce' },
    { id: 's_heart_blue', type: 'text', content: '💙', label: 'Modré srdce' },
    { id: 's_music', type: 'text', content: '🎵', label: 'Hudba' },
    { id: 's_book', type: 'text', content: '📚', label: 'Kniha' },
    { id: 's_bulb', type: 'text', content: '💡', label: 'Nápad' },
    { id: 's_rocket', type: 'text', content: '🚀', label: 'Raketa' },
    { id: 's_map', type: 'text', content: '🗺️', label: 'Mapa' },
    { id: 's_compass', type: 'text', content: '🧭', label: 'Kompas' },
];


export const BACKGROUND_TEXTURES = [
    // --- BAREVNÉ (Colors) ---
    { id: 'bg_paper', name: 'Vintage Paper', type: 'color', value: '#fffcf5', category: 'Barevné' },
    { id: 'bg_white', name: 'Pure White', type: 'color', value: '#ffffff', category: 'Barevné' },
    { id: 'bg_mist', name: 'Mist', type: 'color', value: '#f3f4f6', category: 'Barevné' },
    { id: 'bg_cream', name: 'Cream', type: 'color', value: '#fef3c7', category: 'Barevné' },
    { id: 'bg_pink', name: 'Soft Pink', type: 'color', value: '#fee2e2', category: 'Barevné' },
    { id: 'bg_rose', name: 'Dusty Rose', type: 'color', value: '#fbcfe8', category: 'Barevné' },
    { id: 'bg_lavender', name: 'Lavender', type: 'color', value: '#e9d5ff', category: 'Barevné' },
    { id: 'bg_cyan', name: 'Sky Blue', type: 'color', value: '#cffafe', category: 'Barevné' },
    { id: 'bg_mint', name: 'Mint', type: 'color', value: '#ccfbf1', category: 'Barevné' },
    { id: 'bg_lime', name: 'Lime', type: 'color', value: '#ecfccb', category: 'Barevné' },
    { id: 'bg_peach', name: 'Peach', type: 'color', value: '#ffedd5', category: 'Barevné' },
    { id: 'bg_night', name: 'Deep Night', type: 'color', value: '#1e1b4b', category: 'Barevné' },
    { id: 'bg_navy', name: 'Royal Navy', type: 'color', value: '#172554', category: 'Barevné' },
    { id: 'bg_plum', name: 'Deep Plum', type: 'color', value: '#4c1d95', category: 'Barevné' },
    { id: 'bg_maroon', name: 'Maroon', type: 'color', value: '#881337', category: 'Barevné' },
    { id: 'bg_chocolate', name: 'Chocolate', type: 'color', value: '#451a03', category: 'Barevné' },

    // --- BLAHOPŘÁNÍ (Greetings) ---
    { id: 'bg_balloons', name: 'Balónky', type: 'image', value: 'https://images.unsplash.com/photo-1558280417-ea782f829e93?auto=format&fit=crop&w=800&q=80', category: 'Blahopřání' },
    { id: 'bg_confetti', name: 'Konfety', type: 'image', value: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=800&q=80', category: 'Blahopřání' },
    { id: 'bg_gold', name: 'Zlatá', type: 'image', value: 'https://images.unsplash.com/photo-1568283669146-5ec9bd56c4d5?auto=format&fit=crop&w=800&q=80', category: 'Blahopřání' },
    { id: 'bg_sparkles', name: 'Ohňostroj', type: 'image', value: 'https://images.unsplash.com/photo-1533230154799-73f20d52090d?auto=format&fit=crop&w=800&q=80', category: 'Blahopřání' },

    // --- ZÁBAVNÉ (Fun) ---
    { id: 'bg_party', name: 'Párty', type: 'image', value: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=800&q=80', category: 'Zábavné' },
    { id: 'bg_neon', name: 'Neon', type: 'image', value: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80', category: 'Zábavné' },
    { id: 'bg_paint', name: 'Barvy', type: 'image', value: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80', category: 'Zábavné' },
    { id: 'bg_candy', name: 'Sladké', type: 'image', value: 'https://images.unsplash.com/photo-1582298538104-fe2e74c23f25?auto=format&fit=crop&w=800&q=80', category: 'Zábavné' },

    // --- OZDOBNÉ (Decorative) ---
    { id: 'bg_clouds', name: 'Oblaka', type: 'image', value: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=800&q=80', category: 'Ozdobné' },
    { id: 'bg_stars', name: 'Vesmír', type: 'image', value: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&q=80', category: 'Ozdobné' },
    { id: 'bg_flowers', name: 'Květiny', type: 'image', value: 'https://images.unsplash.com/photo-1507290439931-a861b5a38200?auto=format&fit=crop&w=800&q=80', category: 'Ozdobné' },
    { id: 'bg_wood', name: 'Dřevo', type: 'image', value: 'https://images.unsplash.com/photo-1517523171168-3e4b7add4249?auto=format&fit=crop&w=800&q=80', category: 'Ozdobné' },
    { id: 'bg_bokeh', name: 'Bokeh', type: 'image', value: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80', category: 'Ozdobné' },
];
