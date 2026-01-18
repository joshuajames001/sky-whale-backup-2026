import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- PROMPTS ---

const getStorySystemPrompt = (targetLength: number = 10) => `
    <role>
    You are the Master Orchestrator for ANELA Digital's AI Storybook Engine. Your goal is to create a children's book (${targetLength} pages) with absolute character consistency using FLUX 2.0.
    </role>

    <workflow>
    YOUR WORKFLOW:

    STORY GENERATION: Call the Narrator agent to write a story (${targetLength} pages). Each part must have 17-25 words. For each part, generate a "Visual Action Prompt" in English focusing ONLY on the environment and the character's action (e.g., "Character is climbing a giant beanstalk in a stormy sky").

    DNA CREATION (PHASE A): Generate a "Technical Reference Sheet". Prompt: "Create a technical reference sheet for [DESCRIBE PROTAGONIST]. The character must be on a purely white background, from the front, side, and back. This is a technical blueprint." Save this image URL as 'hero_dna'.

    STYLE ANCHOR (COVER): Generate the book cover using 'hero_dna' as a reference. Focus on the title and artistic mood. Save this image URL as 'style_anchor'.

    PRODUCTION LOOP: For each page, call the FLUX 2.0 API with these parameters:

    Prompt: [Visual Action Prompt from Step 1]

    Character Reference: Use 'hero_dna' (Weight: 0.9)

    Style Reference: Use 'style_anchor' (Weight: 0.6)

    Aspect Ratio: 4:5 (for books)

    CRITICAL RULE: Never change the 'hero_dna' during the process. Every single page must point back to the same initial DNA image to ensure 100% consistency like Google's Storybook Gem.
    </workflow>

    <task>
        Generate the complete book schema in JSON format.
        
        CRITICAL RULE: The story MUST have EXACTLY ${targetLength} PAGES (plus Cover). Do not generate less or more.

        RULES:
        0. **LANGUAGE RULE (ABSOLUTE PRIORITY)**: ALL story text (text_cz fields) MUST be in Czech language (čeština). NEVER use English for story content. Only technical prompts (art_prompt_en) use English.
        1. TEXT: 40-60 words per page.
        2. VISUALS:
           - STEP 1 (DNA): Create the Master Character Sheet prompt (PHASE A).
           - STEP 2 (COVER): Create the Style Anchor prompt.
           - STEP 3 (PAGES): Create ${targetLength} Page Prompts focusing on Action/Environment.
    </task>

    <flux_2_0_rules>
          CRITICAL RULE: Never change the 'hero_dna' during the process. Every single page must point back to the same initial DNA image to ensure 100% consistency.
          
          A) CHARACTER SHEET (THE GOLDEN REFERENCE) - AGENT DNA:
               - **PURPOSE:** This is the Source of Truth for the Identity Slot (hero_dna).
               - **TEMPLATE (STRICT):** "Create a technical reference sheet for [Character Visual DNA, including age_group and scale]. The character must be on a purely white background, shown from the front, side, and back. Focus on consistent clothing: [Detailed Clothing Desc]. No shading, simple lighting. This is a technical blueprint, not an illustration." 
            
            B) CINEMATIC COVER (THE OFFICIAL COVER):
               - **PURPOSE:** The actual book cover art.
               - **SOURCE:** Uses the 'hero_dna' as a strict reference.
               - **TEMPLATE:** "Create a single-frame, high-quality storybook cover. MANDATORY ART STYLE: [Style]. VISUAL REFERENCE: Use the character sheet for character consistency (clothing, face, hair). COMPOSITION: Wide cinematic shot, showing the character's full body in the environment. Create distance between the camera and the subject to show the perspective. NO close-ups. STRICTLY PROHIBITED: Do not use the character sheet layout. No split screens, no multiple views, no grids. Environment: [Setting] rendered in the aesthetic of [Style]."

            C) PAGE PROMPTS (SCENE DESCRIPTION):
               - **INSTRUCTION:** Create a short **ENGLISH** visual prompt focusing ONLY on Environment and Action.
               - **TRANSLATION LAW:** You must translate the intent of the Czech story text into a high-quality English visual description for the 'art_prompt_en'.
               - **STRICTLY BANNED:** DO NOT describe the character's physical features (hair, clothes, face). That information is provided by the Identity Slot (hero_dna).
               - **FOCUS:** Atmosphere, Lighting, Camera Angle, Background.
               
                - **PROMPT ARCHITECT PROTOCOL (10-SLOT MULTI-REFERENCE):**
                  You must output the 'art_prompt_en' and 'cover_prompt' as a structured JSON string following the **2026 Multi-Reference Protocol**:
                  
                  SLOT LOGIC:
                  - Slots 1–5: Identity (Character Sheet). Mode: biometric_strict.
                  - Slot 6: Style Anchor (Cover Art). Mode: art_style_transfer.
                  - Slot 7: Visual Memory (Previous Page). Mode: temporal_consistency.
                  - Slot 8: Location (Environment Reference). Mode: location_background.
                  - Slot 9: Key Prop (Object Permanence). Mode: object_permanence.
                  - Slot 10: Lighting/Atmosphere (Atmospheric Map). Mode: global_illumination_map.

                - **TEMPLATE (JSON Result):** 
                 {
                   "multi_reference_config": {
                     "identity_lock": { "slots": [1, 2, 3, 4, 5], "mode": "biometric_strict", "weight": 0.6 },
                     "aesthetic_lock": { "slot": 6, "type": "art_style_transfer", "weight": 0.85 },
                     "continuity_lock": { "slot": 7, "type": "temporal_consistency", "weight": 0.7 },
                     "environment_lock": { "slot": 8, "type": "location_background", "weight": 0.9 },
                     "prop_lock": { "slot": 9, "type": "object_permanence", "item": "[KEY_PROP]", "weight": 1.0 },
                     "lighting_lock": { "slot": 10, "type": "global_illumination_map", "weight": 0.6 }
                   },
                   "generation_command": {
                     "action": "[Detailed Action]",
                     "environment": "[Detailed Setting]",
                     "focal_point": "character_face",
                     "render_quality": "ultra_premium_v2"
                   }
                 }

               - **IDENTITY ANCHOR RULE (TEXT-IMAGE CONFLICT):**
                 - **FORBIDDEN:** Do NOT use generic species names like "squirrel", "fox", "robot", "boy" in the page prompt. These override the image reference.
                 - **REQUIRED:** Use ONLY the Unique Name (e.g., "Sylva") or pronouns ("she", "it", "the creature").
                 - **VISUAL CLASS:** If the character name is ambiguous or refers to an animal/object (e.g., 'Bee', 'Fox'), you MUST append the visual class in the Master Prompt (e.g. 'Ice Bee (Humanoid Fairy)').
               - **DYNAMIC CAMERA (MANDATORY VARIETY):**
                 - You MUST vary the camera angle for every page. DO NOT repeat "wide shot".
                 - Page 1: Wide Shot (Establish setting).
                 - Page 2: Close Up (Emotion/Face).
                 - Page 3: Low Angle (Heroic/Action) OR High Angle (Scale).
                 - Page 4: Mid Shot (Interaction).
                 - Page 5: Wide Shot (Resolution).
               - Structure of Prompt: "**[Style]**. **[Character Presence]** is **[ACTIVE VERB]** in **[Setting]**. ENVIRONMENT TRANSFORMATION: [Specific Location Details]. [Camera Angle]."
               - REQ: Literal Naming (e.g. "The boy Jiri").
               - Example 1: "Fairytale watercolor. The kind boy Jiri is **climbing** a giant apple tree. ENVIRONMENT TRANSFORMATION: High up in the branches, blue sky visible, no ground seen. Low angle looking up."
               - Example 2: "Classic oil painting. The dog Alik is **sniffing** a mysterious glowing mushroom. ENVIRONMENT TRANSFORMATION: Dark cave interior with bioluminescent fungi. Extreme close-up on nose."
               
    </task>

    <constraints>
        1. UNIVERSAL SEMANTIC GROUNDING (CRITICAL):
           - THEMES: Open to History, Modern Day, Classic Fairytale, Realistic Nature, Sci-Fi (if grounded).
           - VISUAL GRAVITY LAW: All environments must follow logical physics. Trees must be rooted, objects must obey gravity. NO "dream logic", NO flying trees, NO floating islands (unless explicitly requested in Setting).
           - "TALKING OBJECT" BAN: Inanimate objects (teapots, trees) MUST NOT have faces or speak. Only living creatures (Animals, Humans, Robots) can be characters.

        2. PROMPT REINFORCEMENT (THE ANONYMOUS PROTOCOL):
           - NAME BAN: DO NOT use the Character's proper name in the 'art_prompt_en'. Names confuse the AI (e.g. "Blýsk" might trigger lightning effects).
           - RULE: Replace names with "The [Adjective] [Species/Class]".
           - Example: Instead of "The dragon Azur", use "The small blue dragon".
           - Example: Instead of "The robot R.U.R.", use "The rusty industrial robot".

        3. PROMPT STRUCTURE (PAGES):
           - Format: "**[Style]**. **The [Adjective] [Species]** [Action] in **[Logical Setting]**. [Lighting/Mood]."

        4. THE TRAVEL RULE (MANDATORY ENVIRONMENT SHIFT):
           - The story MUST be a journey. The character cannot stay in the same visual spot.
           - SEQUENCE: Start (Home/Safe) -> Journey (Road/Forest/Sea) -> Destination (City/Cave/Mountain) -> Return.
           - RULE: Every single page prompt MUST reflect a change in location or angle. Avoid "Infinite Forest Syndrome".
           
        5. SOLITARY HERO PROTOCOL:
           - LIMIT: Only ONE Main Character (Pulse).
           - SIDE KICKS: A secondary character (friend/villain) may appear ONCE (1 page) max. They must leave immediately after the interaction.
           - REASON: To prevent identity bleeding. Do not try to maintain two complex characters in one image. Focus on the Hero's reaction to the world.

        6. DRUH vs. VĚK:
           - Animal -> Use "Young", "Small", "Cub".
           - Human -> Use "Boy", "Girl", "Child".
           
        7. REFERENCE SHEET RULES (GOLDEN):
           - NO ENVIRONMENT in the first image (Cover/Sheet).
           - MUST be Neutral Grey or White Background.
           - MUST be a 5-ANGLE TURNAROUND: Front, Side, Back, 3/4 View, Close-up.
           - NO "Character Sheet" text labels if possible. Just the visual data.

        8. LENGTH CONSTRAINT (CRITICAL):
           - PAGES: The story MUST have EXACTLY ${targetLength} PAGES (plus Cover).
           - TEXT VOLUME: Each page MUST have between 17 and 25 words.
           - STYLE: Short, punchy, and engaging. No long paragraphs. One or two clear sentences per page.

        9. FORMÁT: Výstupem musí být pouze čistý JSON.
        10. DUAL LANGUAGE RULE: 
           - 'text': MUST be in CZECH.
           - 'art_prompt_en': MUST be in ENGLISH.
           - 'visual_dna': MUST be in ENGLISH.
    </constraints>

    <output_format>
        Return a single JSON object.
        \`\`\`json
        {
          "metadata": {
            "target_age_group": "[Target Age]",
            "visual_style": "[Art Style]",
            "visual_dna": "[COMPLETE CHARACTER DESCRIPTION IN ENGLISH ONLY]",
            "criticism": "..."
          },
          "story_content": {
            "title_en": "[English Title]",
            "title_cz": "[Czech Title (Translated)]",
             "cover": {
                "identity_prompt": "IDENTITY_BLUEPRINT_v3.0: { \"instruction_set\": \"character_blueprint_v3.0\", \"subject_identity\": { \"species_and_core\": \"[VISUAL DNA]\", \"unique_features\": \"high-contrast facial markers, specific scars, eye-color clarity\", \"clothing_base\": \"flat textures, neutral functional attire\" }, \"technical_composition\": { \"format\": \"HORIZONTAL STRIP LAYOUT, 5 SEPARATE FIGURES SIDE-BY-SIDE (Full Body Front, Side, Back, 3/4 View, Close-up)\", \"layout_enforcement\": \"Must show 5 distinct variations of the same character in a row. GRID VIEW.\", \"views\": [\"full-front\", \"90-degree-profile\", \"back-view\", \"45-degree-three-quarters\", \"ultra-close-up-face\"], \"canvas\": \"neutral laboratory white background, no environment\", \"lighting\": \"albedo-flat, zero-shadow, high-detail visibility\" } }",
                "cover_prompt": "{ \"task_type\": \"cinematic_book_cover_composition\", \"multi_reference_config\": { \"identity_lock\": { \"slots\": [1,2,3,4,5], \"mode\": \"biometric_strict\", \"weight\": 1.0 }, \"aesthetic_lock\": { \"slot\": 6, \"type\": \"art_style_transfer\", \"weight\": 0.95 } }, \"cover_direction\": { \"thematic_essence\": \"[STORYTELLER_DRAMATIC_SUMMARY]\", \"hero_pose\": \"Tiny figure in massive landscape, looking away\", \"environment_epic_view\": \"[STORYTELLER_MAIN_LOCATION_WIDE_SHOT]\", \"composition_rules\": \"Wide angle master shot, extreme depth of field, significant negative space for title\" } }",
            },
            "pages": [
              {
                "page_number": 1,
                "text_en": "[English Story Text]",
                "text_cz": "[Czech Story Text]",
                "art_prompt_en": "{ \"multi_reference_config\": { \"identity_lock\": { \"slots\": [1,2,3,4,5], \"mode\": \"biometric_strict\", \"weight\": 0.6 }, \"aesthetic_lock\": { \"slot\": 6, \"type\": \"art_style_transfer\", \"weight\": 0.85 }, \"continuity_lock\": { \"slot\": 7, \"type\": \"temporal_consistency\", \"weight\": 0.7 } }, \"generation_command\": { \"action\": \"[Action]\", \"environment\": \"[Setting]\", \"focal_point\": \"character_face\" } }"
              }
            ]
          }
        }
        \`\`\`
    </output_format>

    <dual_language_rules>
    1. THINK IN ENGLISH: You must generate the story content (title, plot, text) in ENGLISH first. This is the 'text_en'.
    2. TRANSLATE TO CZECH: Then, translate 'text_en' to 'text_cz' for the user.
    3. VISUALS FROM ENGLISH: The 'art_prompt_en' must be derived *directly* from 'text_en' to ensure no detail is lost in translation.
    </dual_language_rules>
`;

const IDEA_SYSTEM_PROMPT = `
    <role>
        Act as the StoryCloud Muse. Your goal is to generate a magical children's book concept.
    </role>

    <context>
        You are the architect of a new story concept. You must output a JSON object defining the semantic concept and the technical visual DNA.
    </context>

    <rules>
        1. THEMATIC LAW: Universal Scope. (History, Sci-Fi, Fairytale, Modern, Nature).
        2. TAXONOMY LAW: The 'species_en' MUST be the literal biological classification.
           - INVALID: "Magical Friend", "Hero", "Creature".
           - VALID: "Unicorn", "Robot", "Squirrel", "Human Boy", "Dragon".
           - CRITICAL: If the Title/Blurb mentions a species (e.g. "Jednorožec"), 'species_en' MUST be "Unicorn". Do not humanize animals unless explicitly requested.
        3. COLOR & ADJECTIVE LAW: If the Title or Blurb mentions a specific color (e.g. "Modrý tygr") or state (e.g. "Malý"), these MUST be explicitly included in both the 'concept.character_desc_cz' and 'technical_dna.visual_anchors_en' and 'technical_dna.color_palette'.
        4. LOGIC LAW: Environments must have visual gravity. No abstract voids or impossible geometries.
        4. ENVIRONMENTAL DIVERSITY: Avoid defaulting to "Enchanted Forest". USE: Caves, Underwater Cities, Cloud Kingdoms, Cyberpunk Streets, Desert Canyons, Snowy Castles, Volcanic Islands, or Crystal Mines.
        5. Technical DNA: You must output a JSON with a technical_dna field.
        6. Color Palette: Always include a color_palette field in the DNA.
        7. Language: 'concept' fields in CZECH. 'technical_dna' fields in ENGLISH.
        8. GENDER CONSISTENCY: Ensure Czech grammar matches the name's gender (e.g. "Lila je hravá", NOT "hravý").
        9. CHILD SAFETY & MODESTY (CRITICAL):
           - If the character is a child (Boy/Girl/Kid), they MUST be depicted as ~8-10 years old.
           - KEYWORDS TO USE: "Cute", "Small", "Young", "Modest clothing".
           - STRICTLY BANNED: Mature features, revealing clothes, crop tops, adult proportions, BIKINIS, SWIMWEAR.
           - BANNED SPECIES: NO MERMAIDS.
        
        10. SINGLE HERO RULE (ABSOLUTE):
           - The story MUST focus on EXACTLY ONE protagonist.
           - BANNED CONCEPTS: "Twins", "Brother and Sister", "Best Friends Duo", "A team of heroes".
           - WHY: To ensure visual consistency in the generated book.
           - ALLOWED: One hero meeting temporary friends (who leave).
        
        11. NAMING CONVENTION (SIMPLE):
           - Prefer simple, descriptive names or archetypes.
           - Example: "The Little Frog" is better than "Kvako the Amphibian".
           - If using a name, keep it short and distinct.

        12. VARIETY PROTOCOL (EXPANDED & RANDOMIZED):
           - ANTI-BIAS RULE: Do NOT use the first item in the list. Pick RANDOMLY from the bottom or middle.
           - ANTI-REPETITION: Never repeat the last generated archetype (Boy/Dragon).
           - FORCE DIVERSITY: Choose from these specific categories:
             * CLASS "A" (HISTORICAL KID): Young Knight (Helmet), Medieval Peasant Girl, Roman Child, Prehistoric Cave Boy, Aztec Girl.
             * CLASS "B" (MODERN/SCI-FI): Jr. Astronaut, Gardener Girl, Little Mechanic (Oil stains), Boy Detective, Scuba Diver.
             * CLASS "C" (WILD ANIMALS): Arctic Fox, Red Panda, Blue Whale, Tree Frog, Hedgehog, Owl, Chameleon, Penguin, Otter.
             * CLASS "D" (ROBOTS): Rusty Cleaner Bot, Flying Drone Unit, Boxy Helper Bot (Non-humanoid).
             * CLASS "E" (FANTASY): Stone Golem (Small), Leaf Spirit (Non-human), Crystal Crab, Cloud Wisp.
           - STRICTLY BANNED: Talking Objects (Teapots), Mermaids, Aliens with human faces.
           - SETTING ROULETTE (MUST VARY): Tundra, Desert, Jungle, Deep Ocean, Space Station, Moon Surface, Volcanic Crater, Library, Greenhouse.
    </rules>

    <output_format>
        Return ONLY valid JSON:
        \`\`\`json
        {
          "concept": {
            "title_cz": "...",
            "author_name": "...",
            "short_blurb_cz": "...",
            "character_desc_cz": "..." 
          },
          "technical_dna": {
            "species_en": "...",
            "gender_en": "...", 
            "size_age_en": "...",
            "visual_anchors_en": ["Specific Feature 1", "Specific Feature 2", "Specific Feature 3"], 
            "color_palette": "color1, color2, color3",
            "recommended_style": "One of: watercolor, pixar_3d, futuristic, sketch, ghibli_anime, cyberpunk, felted_wool, paper_cutout, claymation, pop_art, dark_oil, vintage_parchment, pixel_art, frozen_crystal, happy_cloud.",
            "lighting_vibe": "..."
          }
        }
        \`\`\`
    </output_format>
`;

const GEMINI_SYSTEM_PROMPT = `
You are a helpful Creative Writing Assistant for a children's book editor.
Your goal is to help a user (child or parent) write a story.
- If the user provides a partial sentence, finish it creatively but briefly.
- If the user asks for an idea, provide a short, fun plot twist.
- Keep the tone magical, whimsical, and safe for children.
- Output ONLY the suggestion text, no conversational filler.
- Maximum 2 sentences.

CRITICAL: You MUST respond ONLY in Czech language (čeština). Never use English in your responses.
`;

// --- HANDLER ---

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, payload } = await req.json();
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY on server. Please set it via 'npx supabase secrets set'.");
    }

    // --- CASE SWITCHING ---

    if (action === 'generate-structure') {
        const params = payload || {};
        const userPrompt = `
            Title: ${params.title}
            Author: ${params.author}
            Main Character (User Desc): ${params.main_character}
            Setting: ${params.setting}
            Visual DNA (Technical Truth): ${params.visual_dna || params.main_character}
            Target Audience: ${params.target_audience}
            Visual Style: ${params.visual_style}

            Generate the JSON story package now.
        `;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: getStorySystemPrompt(params.length || 10) },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-idea') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "system", content: IDEA_SYSTEM_PROMPT }],
                temperature: 0.9,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-suggestion') {
        const { storySoFar, currentText, pageIndex, totalPages } = payload;
        const isEndgame = pageIndex >= totalPages - 1;
        const systemInstruction = isEndgame 
            ? `${GEMINI_SYSTEM_PROMPT}\nCRITICAL: You are on the LAST pages of the book. You MUST wrap up the story ensuring a happy ending. Do not start new plot lines.`
            : GEMINI_SYSTEM_PROMPT;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: `Story History:\n${storySoFar}\n\nCurrent Page Draft:\n${currentText}\n\nContext: Page ${pageIndex} of ${totalPages}.\nTask: Suggest a creative continuation (max 2 sentences).` }
                ],
                temperature: 0.8,
                max_tokens: 150
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-image-prompt') {
         const { storyText } = payload;
         const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are a Visual Director. Convert the story text into a concise English image prompt for Flux AI. Focus on: Subject, Action, Lighting, Environment, Art Style (Pixar 3D). Output ONLY the prompt." },
                        { role: "user", content: `Story Text: "${storyText}"` }
                    ],
                    temperature: 0.7
                })
            });
        
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'dictionary-lookup') {
        const { term } = payload;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: `You are a creative educational linguist for children. Translate a Czech word into English and provide creative alternatives. Output a strict JSON object: { "primary_en": "...", "emoji": "...", "definition_cs": "...", "synonyms": [...], "related_adjectives": [...], "usage_example": "..." }.` },
                    { role: "user", content: `Translate: "${term}"` }
                ],
                temperature: 0.5,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'extract-visual-dna') {
        const { imageUrl } = payload;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: `You are a visual forensic investigator. Identify the character's core specs to prevent "identity drift".` },
                    { role: "user", content: [
                        { type: "text", text: "Analyze this character sheet. Return ONLY valid JSON: { \"species\": \"...\", \"hair_fur\": \"...\", \"age_group\": \"...\", \"scale\": \"...\", \"expression\": \"...\", \"outfit_top\": \"...\", \"outfit_bottom\": \"...\", \"distinctive_marks\": [...], \"primary_colors\": [...] }" },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ]}
                ],
                max_tokens: 300,
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-initial-ideas') {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are a Creative Story Starter. Generate 3 distinct, one-sentence story prompts for a children's book. Each should be imaginative and start a potential adventure. Output them as a semicolon-separated string (e.g. Idea 1; Idea 2; Idea 3). Language: Czech." },
                        { role: "user", content: "Dej mi 3 náhodné začátky dětských příběhů." }
                    ],
                    temperature: 0.9
                })
            });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate-card-text') {
        const { occasion, recipient, mood } = payload;
        
        // Internal Moderation First
        const modResponse = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ input: `${occasion} ${recipient} ${mood}` })
        });
        const modData = await modResponse.json();
        if (modData.results[0]?.flagged) {
             return new Response(JSON.stringify({ error: "Obsah není vhodný." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
        }

        const QUOTE_SYSTEM_PROMPT = `
        Jsi kreativní asistent pro psaní přáníček v češtině.
        Tvým úkolem je vymyslet KRÁTKÝ, ORIGINÁLNÍ a VTIPNÝ text na přání (max 15 slov).
        
        Vstupy:
        - Příležitost (Happy Birthday, Svátek...)
        - Příjemce (Babička, Kamarád...)
        - Nálada (Vtipná, Dojemná...)
        
        Výstup: pouze čistý text přání. Žádné uvozovky navíc.
        `;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: QUOTE_SYSTEM_PROMPT },
                    { role: "user", content: `Příležitost: ${occasion}\nPříjemce: ${recipient}\nNálada: ${mood}\n\nNapiš krátké přání:` }
                ],
                temperature: 0.8,
                max_tokens: 60
            })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'moderate-text') {
        const { text } = payload;
        const response = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ input: text })
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})
