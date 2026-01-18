import { CardTemplate } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const TEMPLATES: CardTemplate[] = [
    {
        id: 'birthday-dino',
        name: 'Dino Birthday',
        thumbnail: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=300&q=80', // Placeholder
        pages: [
            {
                id: generateId(),
                name: 'Cover',
                background: '#e6f4f1',
                items: [
                   {
                       id: generateId(),
                       type: 'text',
                       content: 'HAPPY BIRTHDAY!',
                       x: 50,
                       y: 100,
                       scaleX: 1,
                       scaleY: 1,
                       rotation: -5,
                       color: '#2e7d32',
                       fontFamily: 'Comic Sans MS',
                       fontSize: 32
                   },
                   {
                        id: generateId(),
                        type: 'image',
                        content: 'https://joshuajames001.github.io/interactivebook/assets/stickers/trex.png', // Assuming asset exists or use a sticker URL
                        x: 100,
                        y: 200,
                        scaleX: 0.3,
                        scaleY: 0.3,
                        rotation: 0
                   }
                ]
            },
            {
                id: generateId(),
                name: 'Inside Left',
                background: '#ffffff',
                items: []
            },
            {
                id: generateId(),
                name: 'Inside Right',
                background: '#ffffff',
                items: [
                    {
                        id: generateId(),
                        type: 'text',
                        content: 'Have a ROAR-some day!',
                        x: 60,
                        y: 150,
                        scaleX: 1,
                        scaleY: 1,
                        rotation: 0,
                        color: '#333333',
                        fontFamily: 'Inter',
                        fontSize: 24
                    }
                ]
            }
        ]
    },
    {
        id: 'anniversary-cosmic',
        name: 'Cosmic Love',
        thumbnail: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=300&q=80',
        pages: [
             {
                id: generateId(),
                name: 'Cover',
                background: '#0f172a',
                items: [
                    {
                        id: generateId(),
                        type: 'text',
                        content: 'YOU ARE MY\nUNIVERSE',
                        x: 80,
                        y: 150,
                        scaleX: 1,
                        scaleY: 1,
                        rotation: 0,
                        color: '#e2e8f0',
                        fontFamily: 'Orbitron',
                        fontSize: 36
                    }
                ]
             },
             {
                 id: generateId(),
                 name: 'Inside Left',
                 background: '#1e293b',
                 items: []
             },
             {
                 id: generateId(),
                 name: 'Inside Right',
                 background: '#1e293b',
                 items: [
                      {
                        id: generateId(),
                        type: 'text',
                        content: 'To the moon and back...',
                        x: 80,
                        y: 200,
                        scaleX: 1,
                        scaleY: 1,
                        rotation: 0,
                        color: '#94a3b8',
                        fontFamily: 'Inter',
                        fontSize: 20
                      }
                 ]
             }
        ]
    },
    {
        id: 'user-balonky1',
        name: 'Balonky 1',
        thumbnail: 'https://gtixrzbgnstqulqvphtx.supabase.co/storage/v1/object/public/pranicka-sablony/Balonky1.png',
        pages: [
            {
                id: generateId(),
                name: 'Cover',
                background: 'https://gtixrzbgnstqulqvphtx.supabase.co/storage/v1/object/public/pranicka-sablony/Balonky1.png',
                items: []
            },
            { id: generateId(), name: 'Inside Left', background: '#fffcf5', items: [] },
            { id: generateId(), name: 'Inside Right', background: '#fffcf5', items: [] }
        ]
    },
    {
        id: 'user-dort1',
        name: 'Dort 1',
        thumbnail: 'https://gtixrzbgnstqulqvphtx.supabase.co/storage/v1/object/public/pranicka-sablony/Dort1.png',
        pages: [
            {
                id: generateId(),
                name: 'Cover',
                background: 'https://gtixrzbgnstqulqvphtx.supabase.co/storage/v1/object/public/pranicka-sablony/Dort1.png',
                items: []
            },
            { id: generateId(), name: 'Inside Left', background: '#fffcf5', items: [] },
            { id: generateId(), name: 'Inside Right', background: '#fffcf5', items: [] }
        ]
    },
    {
        id: 'user-narozeniny1',
        name: 'Narozeniny 1',
        thumbnail: 'https://gtixrzbgnstqulqvphtx.supabase.co/storage/v1/object/public/pranicka-sablony/Narozeniny1.png',
        pages: [
            {
                id: generateId(),
                name: 'Cover',
                background: 'https://gtixrzbgnstqulqvphtx.supabase.co/storage/v1/object/public/pranicka-sablony/Narozeniny1.png',
                items: []
            },
            { id: generateId(), name: 'Inside Left', background: '#fffcf5', items: [] },
            { id: generateId(), name: 'Inside Right', background: '#fffcf5', items: [] }
        ]
    }
];
