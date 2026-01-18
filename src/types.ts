// ANELA Digital Shared Data Contract

export interface StoryPage {
    page_number: number;
    text: string;
    art_prompt: string; // Detailed Contextual Art Director prompt
    image_url: string | null;
    is_generated: boolean;
    layout_type?: 'standard' | 'full' | 'text-only';
}

export interface StoryBook {
    book_id: string; // UUID
    title: string;
    theme_style: string;
    cover_image: string | null;
    cover_prompt?: string;
    identity_prompt?: string; // Flux 2.0: The technical prompt for the Character Sheet
    author?: string; // Legacy string name
    author_id?: string; // Links to profiles.id
    author_profile?: {
        id: string;
        nickname: string;
        avatar_emoji: string;
    };
    audio_url?: string; // URL for TTS audio
    voice_id?: string; // ID of the voice used
    is_public?: boolean;
    tier?: 'basic' | 'premium';

    // Creator Mode Metadata
    main_character?: string;
    visual_dna?: string; // The invariant visual rules (Source of Truth)
    setting?: string;
    target_audience?: string;
    visual_style?: string;
    style_manifest?: string;

    // Library Metadata
    status?: 'draft' | 'ready' | 'error' | 'generating';
    description?: string;
    created_at?: string;
    character_seed?: number; // Mathematical Lock for Character Consistency
    identity_image_slot?: string; // Flux 2.0: Golden Reference Image URL for Entity Isolation
    character_sheet_url?: string; // Flux 2.0: The Master Visual Reference (Character Sheet)
    magic_mirror_url?: string;   // Flux 2.0: User Face Reference
    length?: number; // Number of pages

    pages: StoryPage[];
}