
import { supabase } from './supabase';

export interface StorageProvider {
    uploadImageFromUrl(url: string, path: string): Promise<string | null>;
}

class SupabaseStorageProvider implements StorageProvider {
    async uploadImageFromUrl(imageUrl: string, path: string): Promise<string | null> {
        try {
            // 1. Download image from Replicate (or other URL)
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // 2. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('story-assets')
                .upload(path, blob, {
                    contentType: blob.type,
                    upsert: true
                });

            if (uploadError) {
                console.error('Supabase Upload Error:', uploadError);
                return null;
            }

            // 3. Get Public URL
            const { data } = supabase.storage
                .from('story-assets')
                .getPublicUrl(path);

            return data.publicUrl;

        } catch (error) {
            console.error('Storage Operation Failed:', error);
            return null;
        }
    }
}

// Global Singleton Instance
export const storageService: StorageProvider = new SupabaseStorageProvider();
