import { createClient } from '@supabase/supabase-js';


// These environment variables must be set in .env
// These environment variables must be set in .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate if URL is real (starts with http) and not the default placeholder text
const isValidUrl = (url: string | undefined) => url && url.startsWith('http') && url !== 'your_project_url_here';

export const isSupabaseConfigured = isValidUrl(supabaseUrl) && !!supabaseAnonKey && supabaseAnonKey !== 'your_anon_key_here';

if (!isSupabaseConfigured) {
    console.warn('Missing or invalid Supabase Environment Variables. Platform features will be disabled.');
}

// Fallback to a valid dummy URL to prevent createClient from throwing "Invalid supabaseUrl"
const clientUrl = isSupabaseConfigured ? supabaseUrl! : 'https://placeholder.supabase.co';
const clientKey = isSupabaseConfigured ? supabaseAnonKey! : 'placeholder';

export const supabase = createClient(clientUrl, clientKey);

// Helper to get image URL
export const getStorageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('story-assets').getPublicUrl(path);
    return data.publicUrl;
};
