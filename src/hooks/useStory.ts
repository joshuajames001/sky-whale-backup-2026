import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { StoryBook } from '../types';
import { checkAndUnlockAchievement } from '../lib/achievements';

export const useStory = () => {
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    // 1. Uložení celé struktury příběhu (KNIHA + STRÁNKY)
    const saveStory = async (story: StoryBook): Promise<{ bookId: string; achievements: any[] } | null> => {
        setSaving(true);
        setNotification(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) console.warn("No authenticated user. Save might fail due to RLS.");

            const PLACEHOLDER_ID = "123e4567-e89b-12d3-a456-426614174000";
            const realBookId = story.book_id === PLACEHOLDER_ID ? crypto.randomUUID() : story.book_id;
            
            console.log(`📘 saveStory: Input ID=${story.book_id} -> Real ID=${realBookId}`);

            // ... (rest of book upsert) ...
            
            // PŘÍPRAVA DAT PRO TABULKU BOOKS
            const bookData = {
                id: realBookId,
                owner_id: user?.id,
                title: story.title,
                author: story.author,
                cover_image_url: story.cover_image,
                cover_prompt: story.cover_prompt,
                visual_dna: story.visual_dna,
                main_character: story.main_character,
                setting: story.setting,
                target_audience: story.target_audience,
                visual_style: story.visual_style || story.theme_style,
                character_seed: story.character_seed,
                character_sheet_url: story.character_sheet_url, // Flux 2.0: Master Visual Reference 
                magic_mirror_url: story.magic_mirror_url, // Flux 2.0: User Face Reference
                is_public: story.is_public,
                tier: story.tier, // Persist model assignment
                updated_at: new Date().toISOString()
            };

            const { error: bookError } = await supabase
                .from('books')
                .upsert(bookData);

            if (bookError) {
                console.error("❌ DB Error (Books Upsert):", bookError);
                throw bookError;
            }

            // SYNCHRONIZACE STRÁNEK
            const pageRows = story.pages.map((p) => ({
                book_id: realBookId,
                page_number: p.page_number, 
                content: p.text,
                image_url: p.image_url,
            }));
            
            console.log(`📄 saveStory: Preparing ${pageRows.length} pages for ID ${realBookId}. Sample Page 1:`, pageRows[0]);

            // Smažeme staré a vložíme nové (jednoduchý sync)
            // Smažeme staré a vložíme nové (jednoduchý sync)
            await supabase.from('pages').delete().eq('book_id', realBookId);
            
            const { data: insertedPages, error: pageError } = await supabase
                .from('pages')
                .insert(pageRows)
                .select();

            if (pageError) {
                console.error("❌ DB Error (Pages Insert):", pageError);
                throw pageError;
            }

            console.log(`✅ INSTANT CHECK: Inserted ${insertedPages?.length ?? 0} rows into 'pages' table.`);

            // DVOJITÁ KONTROLA: Přečteme z DB, co tam skutečně je
            const { count: dbCount, error: countError } = await supabase
                .from('pages')
                .select('*', { count: 'exact', head: true })
                .eq('book_id', realBookId);
            
            if (countError) console.error("❌ Verification Read Failed:", countError);
            else console.log(`🔎 DB VERIFICATION: Found ${dbCount} rows in 'pages' for Book ${realBookId}`);

            if (dbCount === 0 && pageRows.length > 0) {
                 console.error("🚨 CRITICAL: Insert reported success, but DB is empty! Checking RLS policies...");
            }

            console.log(`✅ Story Structure Created (Book ${realBookId} + ${pageRows.length} Pages)`); 
            setLastSaved(new Date());
            setNotification("Story saved successfully!");
            setTimeout(() => setNotification(null), 3000);

            // 5. Trigger Achievements check (Client Side Notification helper)
            let unlockedAchievements: any[] = [];
            if (user) {
                const { checkBookCountAchievements, checkCustomBookAchievements } = await import('../lib/achievements');
                const bookAchievements = await checkBookCountAchievements(user.id);
                const customAchievements = await checkCustomBookAchievements(user.id);
                unlockedAchievements = [...bookAchievements, ...customAchievements];
            }
            
            return { bookId: realBookId, achievements: unlockedAchievements };

        } catch (error) {
            console.error("Failed to save story:", error);
            setNotification("Failed to save story.");
            return null;
        } finally {
            setSaving(false);
        }
    };

            // 2. Uložení vygenerovaného obrázku
             const uploadImage = async (bookId: string, pageNumber: number, permanentSupabaseUrl: string, seed?: number): Promise<string | null> => {
        console.log(`💾 Persisting [Page ${pageNumber}] for Book [${bookId}]`);
        console.log(`🔍 Types: bookId=${typeof bookId}, pageNumber=${typeof pageNumber}`);

        try {
            // SPECIAL CASE: Page -1 = Character Sheet (Identity Slot)
            if (pageNumber === -1) {
                console.log("🧬 Persisting Character Sheet (Identity Slot) for Book:", bookId);
                const { error } = await supabase
                    .from('books')
                    .update({ character_sheet_url: permanentSupabaseUrl })
                    .eq('id', bookId);
                
                if (error) {
                    console.error("❌ Failed to save character sheet:", error);
                    throw error;
                }
                return permanentSupabaseUrl;
            }

            if (pageNumber === 0) {
                // A. Update BOOK metadata (Cover URL + Seed)
                // NOTE: We do NOT update 'identity_image_slot' here anymore.
                // The Character Sheet is the upstream source of truth.
                const updateData: any = { 
                    cover_image_url: permanentSupabaseUrl,
                };
                
                if (seed !== undefined && seed !== null) updateData.character_seed = seed;

                console.log("🔒 IDENTITY: Cover updated (Identity Reference is Upstream):", permanentSupabaseUrl);

                const { error: bookError } = await supabase
                    .from('books')
                    .update(updateData)
                    .eq('id', bookId);
                
                if (bookError) {
                    console.error('❌ DB Error (Book Cover Update):', bookError);
                    throw bookError;
                }

                // B. Also upsert as PAGE 0 (for consistency)
                const { error: pageError } = await supabase
                    .from('pages')
                    .upsert({
                        book_id: bookId,
                        page_number: 0,
                        image_url: permanentSupabaseUrl,
                        content: "" // Cover has no text content usually
                    }, { onConflict: 'book_id, page_number' });

                if (pageError) {
                    console.error('❌ DB Error (Page 0 Upsert):', pageError);
                    // We don't throw here strictly, as long as the book update succeeded
                }

                console.log('✅ DB updated (Cover + Page 0 saved)');
            } else {
                
                 console.log(`📝 UPDATING Page ${pageNumber} for Book ${bookId}`);

                // UPSERT ensures robustness even if the row was missing or deleted
                const { data, error } = await supabase
                    .from('pages')
                    .upsert({
                        book_id: bookId,
                        page_number: pageNumber,
                        image_url: permanentSupabaseUrl
                    }, { onConflict: 'book_id, page_number' })
                    .select(); 
                
                // ZPŘÍSNĚNÉ LOGOVÁNÍ
                if (error) {
                    console.error('❌ DB Error:', error);
                } else {
                    console.log('✅ DB sync (Page Image Linked)', data);
                }
            }

            return permanentSupabaseUrl; 

        } catch (err) {
            console.error("Failed during image persistence:", err);
            return permanentSupabaseUrl;
        }
    };

    // 3. Update Identity (Visual DNA + Sheet)
    const updateIdentity = async (bookId: string, sheetUrl: string, visualDna: string) => {
        console.log(`🧬 Persisting Identity for Book ${bookId}`);
        const { error } = await supabase
            .from('books')
            .update({ 
                character_sheet_url: sheetUrl,
                visual_dna: visualDna,
                main_character: visualDna // Also update the main character description to be the English DNA!
            })
            .eq('id', bookId);

        if (error) console.error("❌ Failed to update identity:", error);
        else console.log("✅ Identity Persisted to DB.");
    };

    // 4. Uložení projektu přáníčka (Greeting Card)
    const saveCardProject = async (project: {
        id: string; // UUID
        title: string;
        pages: any[]; // CardPage[] JSON
        thumbnailBlob?: Blob;
    }): Promise<boolean> => {
        setSaving(true);
        setNotification(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            let coverUrl = null;

            // Upload Thumbnail if exists
            if (project.thumbnailBlob) {
                const fileName = `covers/${project.id}_${Date.now()}.png`;
                const { error: uploadError } = await supabase.storage
                    .from('story-covers') // Ensure this bucket exists or use story-assets if preferred. Using books bucket usually.
                    .upload(fileName, project.thumbnailBlob);
                
                if (uploadError) {
                    console.error("Failed to upload card thumbnail:", uploadError);
                     // Fallback: don't fail entire save, just missing cover
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('story-covers')
                        .getPublicUrl(fileName);
                    coverUrl = publicUrl;
                }
            }

            // Upsert Book Record
            // We use 'visual_style' to identify it as a card project
            const bookData = {
                id: project.id,
                owner_id: user.id,
                title: project.title,
                author: "Card Designer", // Placeholder
                visual_style: 'card_project_v1', // MARKER
                style_manifest: JSON.stringify(project.pages), // STORE JSON HERE
                cover_image_url: coverUrl,
                updated_at: new Date().toISOString(),
                status: 'draft',
                is_public: false
            };

            const { error: bookError } = await supabase
                .from('books')
                .upsert(bookData);

            if (bookError) throw bookError;

            console.log("✅ Card Project Saved:", project.id);
            setLastSaved(new Date());
            setNotification("Přáníčko uloženo!");
            setTimeout(() => setNotification(null), 3000);
            return true;

        } catch (err) {
            console.error("Failed to save card project:", err);
            setNotification("Chyba při ukládání.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    return {
        saveStory,
        saveCardProject, // Export
        uploadImage,
        updateIdentity,
        saving,
        lastSaved,
        notification
    };
};