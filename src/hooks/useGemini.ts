import { useState } from 'react';
import { invokeEdgeFunction } from '../lib/edge-functions';

export const useGemini = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSuggestion = async (storySoFar: string, currentText: string, pageIndex: number, totalPages: number) => {
        setLoading(true);
        setError(null);

        try {
            console.log("🤖 Gemini Hook: Calling Edge Function (generate-suggestion)...");
            
            const { data, error } = await invokeEdgeFunction('generate-story-content', {
                action: 'generate-suggestion',
                payload: { storySoFar, currentText, pageIndex, totalPages }
            });

            if (error) throw error;
            if (!data) throw new Error("No data received from AI.");

            // Edge function returns the full OpenAI response object structure
            // We need to check if the edge function returns the *parsed content* or the *openai response*
            // Looking at the edge function code: return new Response(JSON.stringify(data)) where data is await response.json() from OpenAI.
            // So data matches the OpenAI schema: { choices: [...] }
            return data.choices[0].message.content.trim();

        } catch (err: any) {
            console.error("Gemini Hook Error:", err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Generates a Visual Prompt from the story text.
     * Used by the "Magic Wand" to tell Flux what to paint.
     */
    const generateImagePrompt = async (storyText: string) => {
        setLoading(true);
        try {
            console.log("🎨 Gemini Hook: Calling Edge Function (generate-image-prompt)...");

            const { data, error } = await invokeEdgeFunction('generate-story-content', {
                action: 'generate-image-prompt',
                payload: { storyText }
            });

            if (error) throw error;
            if (!data) throw new Error("Prompt generation failed.");
            
            return data.choices[0].message.content.trim();

        } catch (err) {
            console.error("Prompt Gen Error:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Generates a list of initial story ideas to help a user start their book.
     */
    const generateInitialIdeas = async () => {
        setLoading(true);
        try {
            console.log("💡 Gemini Hook: Calling Edge Function (generate-initial-ideas)...");

            const { data, error } = await invokeEdgeFunction('generate-story-content', {
                action: 'generate-initial-ideas',
                payload: {}
            });

            if (error) throw error;
            if (!data) throw new Error("Idea generation failed.");
            
            const text = data.choices[0].message.content.trim();
            return text.split(';').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));

        } catch (err) {
            console.error("Initial Ideas Error:", err);
            return ["Dobrodružství v hlubokém lese", "Cesta na Měsíc v papírové krabici", "Tajemství mluvícího kocoura"];
        } finally {
            setLoading(false);
        }
    };

    /**
     * MAGICKÝ SLOVNÍK (MAGIC DICTIONARY)
     * Translates Czech terms to English creative synonyms for prompt crafting.
     */
    const searchDictionary = async (term: string) => {
        setLoading(true);
        try {
            console.log("📖 Gemini Hook: Calling Edge Function (dictionary-lookup)...");

            const { data, error } = await invokeEdgeFunction('generate-story-content', {
                action: 'dictionary-lookup',
                payload: { term }
            });

            if (error) throw error;
            if (!data) throw new Error("Dictionary lookup failed.");
            
            const result = JSON.parse(data.choices[0].message.content);
            return result;

        } catch (err) {
            console.error("Dictionary Error:", err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        generateSuggestion,
        generateImagePrompt,
        generateInitialIdeas,
        searchDictionary,
        loading,
        error
    };
};
