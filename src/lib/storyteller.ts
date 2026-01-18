import { StoryPage } from '../types';
import { invokeEdgeFunction } from './edge-functions';

export interface StoryParams {
    title: string;
    author: string;
    main_character: string;
    setting: string;
    target_audience: string;
    visual_style: string;
    visual_dna?: string; 
    user_identity_image?: string; 
    length?: number;
}

export const generateStoryStructure = async (params: StoryParams): Promise<{ pages: StoryPage[], coverPrompt: string, identityPrompt: string, visualDna: string }> => {
    console.log("📖 Storyteller: Calling Edge Function (generate-structure)...");

    try {
        const { data, error } = await invokeEdgeFunction('generate-story-content', {
            action: 'generate-structure',
            payload: params
        });

        if (error) throw error;
        if (!data) throw new Error("No data received from Edge Function.");
        
        if (!data) throw new Error("No data received from Edge Function.");
        
        // FIX: Parse OpenAI Response Wrapper
        let parsed;
        if (data.choices && data.choices[0]?.message?.content) {
            try {
                parsed = JSON.parse(data.choices[0].message.content);
            } catch (e) {
                console.error("Failed to parse JSON content from AI:", e);
                throw new Error("Invalid JSON in AI response");
            }
        } else {
            // Fallback: assume it might be the data itself (unlikely but safe)
            parsed = data;
        } 
        const storyContent = parsed.story_content || parsed;
        const rawPages = storyContent.pages || parsed.pages;

        if (!rawPages || !Array.isArray(rawPages)) {
            console.error("Invalid AI Response:", parsed);
            throw new Error("Invalid format: 'pages' array missing in AI response.");
        }

        const metadata = parsed.metadata || {};
        console.log("🧠 RCI Criticism Log:", metadata.criticism || "No internal critique provided.");

        const titleCz = storyContent.title_cz || parsed.title_cz || storyContent.title || parsed.title;
        console.log(`🇨🇿 Czech Title: "${titleCz}"`);

        const pages: StoryPage[] = rawPages.map((p: any) => ({
            page_number: p.page_number,
            text: p.text_cz || p.text, 
            art_prompt: p.art_prompt_en || p.art_prompt || p.image_prompt,
            image_url: null,
            is_generated: false
        }));

        return {
            pages,
            coverPrompt: `[STRICT VISUAL DNA: ${metadata.visual_dna || params.visual_dna}] ` + (storyContent.cover?.cover_prompt || storyContent.cover?.image_prompt || `Create a single-frame, high-quality storybook cover. MANDATORY ART STYLE: ${params.visual_style}. VISUAL REFERENCE: Use the character sheet. Environment: ${params.setting} rendered in ${params.visual_style}.`),
            identityPrompt: params.user_identity_image || storyContent.cover?.identity_prompt || `Create a character reference sheet for ${params.visual_dna || params.main_character}. Plain white background.`,
            visualDna: metadata.visual_dna || params.visual_dna || params.main_character
        };

    } catch (error) {
        console.error("Storyteller Error:", error);
        console.warn("⚠️ Story generation failed. Engaging Emergency Protocol.");
        
        // Return STATIC Fallback to prevent crash
        return {
            coverPrompt: "Fallback Cover Prompt",
            identityPrompt: "Fallback Identity Prompt",
            visualDna: params.main_character,
            pages: [
                {
                    page_number: 1,
                    text: "Omlouváme se, Múza je unavená. Zkuste to prosím za chvíli znovu.",
                    art_prompt: "A sleeping muse robot.",
                    image_url: null,
                    is_generated: false
                }
            ]
        };
    }
};

export const generateStoryIdea = async (): Promise<StoryParams> => {
    console.log("💡 Muse Agent: Calling Edge Function (generate-idea)...");

    let attempts = 0;
    while (attempts < 2) { 
        try {
            const { data: ideaWrapper, error } = await invokeEdgeFunction('generate-story-content', {
                action: 'generate-idea',
                payload: {}
            });

            if (error || !ideaWrapper) throw error || new Error("No data");

            // FIX: Parse OpenAI Response Wrapper
            let idea;
            try {
                // Type assertion since we know the shape but TS doesn't
                const content = (ideaWrapper as any).choices[0].message.content;
                idea = JSON.parse(content);
            } catch (e) {
                console.warn("Failed to parse Idea JSON", e);
                attempts++;
                continue;
            }

            if (!idea.concept || !idea.technical_dna) {
                console.warn("Invalid structure received, retrying...");
                attempts++;
                continue;
            }

            console.log("✅ Valid Concept Generated:", idea.concept.title_cz);

            const anchors = idea.technical_dna.visual_anchors_en.join(", ");
            const palette = idea.technical_dna.color_palette;
            const speciesLower = idea.technical_dna.species_en.toLowerCase();
            const isAnimal = ["unicorn", "dragon", "fox", "cat", "dog", "wolf", "bear", "rabbit", "horse", "lion", "tiger"].some(a => speciesLower.includes(a));
            const isRobot = speciesLower.includes("robot") || speciesLower.includes("android");

            let formFactor = "Humanoid Body"; 
            if (isAnimal) formFactor = "STRICTLY ANIMAL BODY, NON-HUMANOID, QUADRUPED, NO HUMAN FACE";
            if (isRobot) formFactor = "STRICTLY MECHANICAL ROBOT, METAL BODY, NON-HUMANOID, NO SKIN, NO CLOTHES";

            const technicalDnaString = `VISUAL SPECIES: ${idea.technical_dna.species_en.toUpperCase()} [${formFactor}]. Gender: ${idea.technical_dna.gender_en || 'Neutral'}. Scale: ${idea.technical_dna.size_age_en}. IDENTITY LOCK: ${anchors}. Colors: ${palette}.`;

            return {
                title: idea.concept.title_cz,
                author: idea.concept.author_name,
                main_character: idea.concept.character_desc_cz || idea.concept.short_blurb_cz, 
                visual_dna: technicalDnaString,
                setting: idea.concept.short_blurb_cz, 
                target_audience: "Children", 
                visual_style: idea.technical_dna.recommended_style
            };

        } catch (e) {
            console.error("Muse Error:", e);
            attempts++;
        }
    }

    // Fallback
    return {
        title: "Tajemství",
        author: "Múza",
        main_character: "Robot",
        setting: "Les",
        target_audience: "Children",
        visual_style: "Watercolor"
    };
};

export const extractVisualIdentity = async (sheetUrl: string, characterName: string, fallbackDna?: string): Promise<string> => {
    console.log("👁️ Visual DNA: Calling Edge Function (extract-visual-dna)...");

    try {
        const { data, error } = await invokeEdgeFunction('generate-story-content', {
            action: 'extract-visual-dna',
            payload: { imageUrl: sheetUrl }
        });

        if (error) throw error;
        
        // If Edge returns stringified JSON, parse it? invokeEdgeFunction parses JSON response already.
        // The Edge function returns { species: ... } object directly.
        // We need stringified for DNA though? 
        // The original code returned a stringified JSON.
        // Let's ensure consistency.
        
        if (error) throw error;
        
        // FIX: Parse OpenAI Response Wrapper
        if (data.choices && data.choices[0]?.message?.content) {
             // The content is ALREADY a JSON string from OpenAI (e.g. "{\"species\":...}")
             // We want to return that string as-is because extractVisualIdentity returns a Promise<string> (DNA string)
             // Actually, the original code returned JSON.stringify(data). 
             // If the AI returns a JSON string, we can just return that string directly as the DNA.
             const content = data.choices[0].message.content;
             // Ensure it's valid JSON
             try {
                 JSON.parse(content); // check validity
                 return content;
             } catch {
                 return JSON.stringify({ species: characterName });
             }
        }
        
        return JSON.stringify(data);

    } catch (error) {
        console.error("Visual Extraction Failed:", error);
        if (fallbackDna) return fallbackDna;
        return JSON.stringify({ species: characterName });
    }
};
